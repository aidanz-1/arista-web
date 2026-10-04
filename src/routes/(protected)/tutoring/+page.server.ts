import { error, fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { superValidate } from "sveltekit-superforms";
import {
	TutoringRequestSchema,
	type RecievedTutoringRequest,
	type RecievedTutoringMessage,
	type RecievedTutoringSession,
	type ExpandedTutoringSession,
	type ExpandedTutoringMessage,
	type RecievedPublicUserData,
	type RecievedUser,
	type RecievedContactCard
} from "$lib/db_types";
import handleError from "$lib/handleError";
import { isOnCommittee } from "$lib/isOnCommittee";
import { displayName } from "$lib/displayName";
import {
	deleteTutoringRequestAlert,
	sendNewTutoringRequestAlert,
	updateTutoringRequestAlert
} from "$lib/server/slack";
import { z } from "zod";
import { zod4 as zod } from "sveltekit-superforms/adapters";

let RequestTutoringSchema = TutoringRequestSchema.omit({
	tutee: true,
	slack_message_ts: true
}); // don't include server-managed fields in the form
let FinishTutoringSessionSchema = z.object({
	durationInHours: z.string().refine(
		(v) => {
			const n = Number(v);
			return /^\d+(?:\.\d+)?$/.test(v.trim()) && Number.isFinite(n) && n > 0 && n <= 10;
		},
		{ message: "Enter a duration from 0.1 to 10 hours, such as 1 or 1.5." }
	)
});
let SendTutoringMessageSchema = z.object({
	body: z.string().trim().min(1, "Write a message before sending.").max(1000)
});
const claimLocks = new Set<string>();
const MAX_VERIFICATION_IMAGE_SIZE = 10 * 1024 * 1024;

function canDeleteTutoringRequest(user: RecievedUser | undefined): boolean {
	return isOnCommittee(user, "operations") || isOnCommittee(user, "admin");
}

function canReviewTutoringWarnings(user: RecievedUser | undefined): boolean {
	return isOnCommittee(user, "operations") || isOnCommittee(user, "admin");
}

function canAccessTutoringSession(session: RecievedTutoringSession, user: RecievedUser): boolean {
	return (
		String(session.tutee) === String(user.id) ||
		String(session.tutor) === String(user.id) ||
		canReviewTutoringWarnings(user)
	);
}

function buildDurationWarning(session: RecievedTutoringSession, durationInHours: number) {
	const completedAt = new Date();
	const acceptedAt = new Date(session.created);
	const elapsedMs = completedAt.getTime() - acceptedAt.getTime();
	const claimedMs = durationInHours * 60 * 60 * 1000;
	const toleranceMs = 5 * 60 * 1000;
	const shouldWarn = claimedMs > elapsedMs + toleranceMs;

	if (!shouldWarn) {
		return { durationWarning: false, durationWarningReason: "" };
	}

	const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60000));
	return {
		durationWarning: true,
		durationWarningReason: `Tutee submitted ${durationInHours} hour${durationInHours === 1 ? "" : "s"}, but only ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} passed since the tutor claimed the request.`
	};
}

export const load = async ({ locals, request }) => {
	// Server API:
	const requestTutoringForm = await superValidate(zod(RequestTutoringSchema));
	const finishTutoringSessionForm = await superValidate(zod(FinishTutoringSessionSchema));

	if (!locals?.user?.id) {
		error(401, "User not logged in.");
	}

	const requestFilter = !locals.user.member ? `tutee="${locals.user.id}"` : "isClaimed=false";
	const requests = structuredClone(
		(await locals.pb
			.collection("tutoringRequests")
			.getFullList({ sort: "-created", filter: requestFilter, requestKey: null })) as unknown
	) as RecievedTutoringRequest[];

	const sessionFilter = locals.user.member
		? `(tutor="${locals.user.id}" && isComplete=false) || (tutee="${locals.user.id}" && tuteeMarkedComplete=false)`
		: `tutee="${locals.user.id}" && tuteeMarkedComplete=false`;
	const sessions = structuredClone(
		(await locals.pb.collection("tutoringSessions").getFullList({
			sort: "-created",
			expand: "tutoringRequest",
			filter: sessionFilter,
			requestKey: null
		})) as unknown
	) as ExpandedTutoringSession[];

	const participantIds = [
		...new Set(sessions.flatMap((session) => [session.tutor, session.tutee]))
	];
	const names = participantIds.length
		? ((await locals.pb.collection("publicUsers").getFullList({
				filter: participantIds.map((id) => `id="${id}"`).join(" || "),
				requestKey: null
			})) as unknown as RecievedPublicUserData[])
		: [];

	// Contact cards are readable only between people who share a session, so
	// this returns exactly the cards the signed-in student is allowed to see.
	const contactCards = participantIds.length
		? ((await locals.pb.collection("contactCards").getFullList({
				filter: participantIds.map((id) => `user="${id}"`).join(" || "),
				requestKey: null
			})) as unknown as RecievedContactCard[])
		: [];

	const messages = sessions.length
		? (structuredClone(
				(await locals.pb.collection("tutoringMessages").getFullList({
					sort: "sentAt,id",
					filter: sessions.map((session) => `session="${session.id}"`).join(" || "),
					requestKey: null
				})) as unknown
			) as RecievedTutoringMessage[])
		: [];

	const messageSenderIds = [...new Set(messages.map((message) => message.sender))];
	const messageSenders = messageSenderIds.length
		? ((await locals.pb.collection("publicUsers").getFullList({
				filter: messageSenderIds.map((id) => `id="${id}"`).join(" || "),
				requestKey: null
			})) as unknown as RecievedPublicUserData[])
		: [];

	const expandedMessages = messages.map((message) => {
		return {
			...message,
			sender_name: displayName(messageSenders.find((sender) => sender.id === message.sender))
		} satisfies ExpandedTutoringMessage;
	});

	const expandSession = (session: ExpandedTutoringSession): ExpandedTutoringSession => {
		const tutor = names.find((j) => j.id === session.tutor);
		const tutee = names.find((j) => j.id === session.tutee);

		return {
			...session,
			tutor_name: tutor ? displayName(tutor) : undefined,
			tutee_name: tutee ? displayName(tutee) : undefined,
			tutor_email: tutor?.email,
			tutee_email: tutee?.email,
			tutor_contact: contactCards.find((card) => card.user === session.tutor)?.details || undefined,
			tutee_contact: contactCards.find((card) => card.user === session.tutee)?.details || undefined,
			messages: expandedMessages.filter((message) => message.session === session.id)
		};
	};

	const expanded_sessions: ExpandedTutoringSession[] = sessions.map(expandSession);
	return {
		requestTutoringForm,
		finishTutoringSessionForm,
		tutoringRequests: requests,
		tutoringSessions: expanded_sessions
	}; // Unless you throw, always return { form } in load and form actions.
};

export const actions: Actions = {
	request_tutoring: async ({ locals, request }) => {
		const requestTutoringForm = await superValidate(request, zod(RequestTutoringSchema));

		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		if (!requestTutoringForm.valid) {
			return fail(400, { requestTutoringForm });
		}

		let slackMessageTs: string | undefined;
		try {
			slackMessageTs = await sendNewTutoringRequestAlert(requestTutoringForm.data);
		} catch (slackError: unknown) {
			console.error("Failed to send the new tutoring request to Slack.", slackError);
		}

		try {
			await locals.pb.collection("tutoringRequests").create({
				...requestTutoringForm.data,
				tutee: locals.user.id,
				...(slackMessageTs ? { slack_message_ts: slackMessageTs } : {})
			});
		} catch (caught: unknown) {
			try {
				await deleteTutoringRequestAlert(slackMessageTs);
			} catch (slackError: unknown) {
				console.error(
					"Failed to remove the Slack alert after request creation failed.",
					slackError
				);
			}
			console.error(caught);
			return handleError(caught, requestTutoringForm);
		}

		return { requestTutoringForm };
	},
	delete_tutoring_request: async ({ locals, url }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		const tutoring_request_id = url.searchParams.get("id");
		if (!tutoring_request_id) {
			error(400, "A tutoring request ID must be passed in as a parameter to delete it.");
		}

		try {
			const tutoringRequest = structuredClone(
				(await locals.pb.collection("tutoringRequests").getOne(tutoring_request_id)) as unknown
			) as RecievedTutoringRequest;

			const user = locals.user as RecievedUser;
			const isRequestOwner = String(tutoringRequest.tutee) === String(user.id);
			const canCommitteeDelete = canDeleteTutoringRequest(user);

			if (!isRequestOwner && !canCommitteeDelete) {
				error(
					401,
					"Only the request owner, operations, or admin members can delete tutoring requests."
				);
			}

			if (tutoringRequest.isClaimed) {
				error(400, "This tutoring request has already been claimed.");
			}
			await locals.pb.collection("tutoringRequests").delete(tutoring_request_id);

			try {
				await updateTutoringRequestAlert(tutoringRequest, "cancelled");
			} catch (slackError: unknown) {
				console.error(
					"Failed to mark the deleted tutoring request as cancelled in Slack.",
					slackError
				);
			}
		} catch (caught: unknown) {
			console.error(caught);
			throw caught;
		}
	},
	claim_tutoring_request: async ({ locals, request, params, url }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		if (!locals?.user?.member) {
			error(401, "A tutee cannot claim a request.");
		}

		const searchParams = url.searchParams;
		const tutoring_request_id = searchParams.get("id");
		if (!tutoring_request_id) {
			error(400, "A tutoring request ID must be passed in as a parameter to claim it.");
		}

		if (claimLocks.has(tutoring_request_id)) {
			error(429, "This tutoring request is currently being claimed. Please try again.");
		}

		claimLocks.add(tutoring_request_id);
		try {
			let tutoringRequest: RecievedTutoringRequest;
			try {
				tutoringRequest = structuredClone(
					(await locals.pb.collection("tutoringRequests").getOne(tutoring_request_id)) as unknown
				) as RecievedTutoringRequest;
			} catch (caught: unknown) {
				console.error(caught);
				throw caught;
			}

			if (tutoringRequest.isClaimed) {
				error(400, "This tutoring request has already been claimed.");
			}
			if (String(tutoringRequest.tutee) === String(locals.user.id)) {
				error(400, "You cannot claim your own tutoring request.");
			}

			let existingSession: RecievedTutoringSession | null = null;
			try {
				existingSession = structuredClone(
					(await locals.pb
						.collection("tutoringSessions")
						.getFirstListItem(`tutoringRequest="${tutoring_request_id}" && isComplete=false`, {
							requestKey: null
						})) as unknown
				) as RecievedTutoringSession;
			} catch (caught: unknown) {
				const status = (caught as { status?: number })?.status;
				if (status !== 404) {
					console.error(caught);
					throw caught;
				}
			}

			if (existingSession) {
				error(400, "This tutoring request has already been claimed.");
			}

			try {
				// create the tutoringSession
				await locals.pb.collection("tutoringSessions").create({
					tutee: tutoringRequest.tutee,
					tutor: locals.user.id,
					tutoringRequest: tutoring_request_id,
					isComplete: false,
					tuteeMarkedComplete: false,
					durationWarning: false,
					durationWarningReason: ""
				});

				// update the tutoring request
				await locals.pb
					.collection("tutoringRequests")
					.update(tutoring_request_id, { isClaimed: true });

				try {
					await updateTutoringRequestAlert(tutoringRequest, "claimed");
				} catch (slackError: unknown) {
					console.error("Failed to mark the tutoring request as claimed in Slack.", slackError);
				}
			} catch (caught: unknown) {
				console.error(caught);
				throw caught;
			}
		} finally {
			claimLocks.delete(tutoring_request_id);
		}
	},
	cancel_tutoring_session: async ({ locals, url }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		const tutoring_session_id = url.searchParams.get("id");
		if (!tutoring_session_id) {
			error(400, "A tutoring session ID must be passed in as a parameter to cancel it.");
		}

		try {
			const tutoringSession = structuredClone(
				(await locals.pb.collection("tutoringSessions").getOne(tutoring_session_id)) as unknown
			) as RecievedTutoringSession;

			const isTutee = String(tutoringSession.tutee) === String(locals.user.id);
			const isTutor = String(tutoringSession.tutor) === String(locals.user.id);

			if (!isTutee && !isTutor) {
				error(401, "Only the tutor or tutee can cancel this tutoring session.");
			}

			if (tutoringSession.isComplete) {
				error(400, "Completed sessions cannot be cancelled.");
			}
			if (tutoringSession.tuteeMarkedComplete) {
				error(
					400,
					"This session is waiting for tutor verification and can no longer be cancelled."
				);
			}

			let tutoringRequest: RecievedTutoringRequest | undefined;
			if (tutoringSession.tutoringRequest) {
				try {
					tutoringRequest = structuredClone(
						(await locals.pb
							.collection("tutoringRequests")
							.getOne(tutoringSession.tutoringRequest)) as unknown
					) as RecievedTutoringRequest;
				} catch (caught: unknown) {
					console.error(
						"Failed to load the tutoring request before cancelling its session.",
						caught
					);
				}
			}

			await locals.pb.collection("tutoringSessions").delete(tutoring_session_id);

			if (tutoringSession.tutoringRequest) {
				if (isTutor) {
					await locals.pb
						.collection("tutoringRequests")
						.update(tutoringSession.tutoringRequest, { isClaimed: false });
				} else {
					await locals.pb.collection("tutoringRequests").delete(tutoringSession.tutoringRequest);
				}

				// A tutor backing out reopens the request; a tutee cancelling ends it.
				if (tutoringRequest) {
					try {
						await updateTutoringRequestAlert(tutoringRequest, isTutor ? "available" : "cancelled");
					} catch (slackError: unknown) {
						console.error("Failed to update the cancelled tutoring session in Slack.", slackError);
					}
				}
			}
		} catch (caught: unknown) {
			console.error(caught);
			throw caught;
		}
	},
	finish_tutoring_session: async ({ locals, request, params, url }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		const finishTutoringForm = await superValidate(request, zod(FinishTutoringSessionSchema));

		if (!finishTutoringForm.valid) {
			return fail(400, { finishTutoringForm });
		}

		const searchParams = url.searchParams;
		const tutoring_session_id = searchParams.get("id");
		if (!tutoring_session_id) {
			error(400, "A tutoring session ID must be passed in as a parameter to finish it.");
		}

		let tutoringSession: RecievedTutoringSession;
		try {
			tutoringSession = structuredClone(
				(await locals.pb.collection("tutoringSessions").getOne(tutoring_session_id)) as unknown
			) as RecievedTutoringSession;
		} catch {
			error(404, "Tutoring session not found.");
		}

		if (String(tutoringSession.tutee) !== String(locals.user.id)) {
			error(403, "Only the tutee assigned to this session can finish it.");
		}
		if (tutoringSession.isComplete) {
			error(400, "This tutoring session is already complete.");
		}

		const durationInHours = Number(finishTutoringForm.data.durationInHours);
		if (Number.isNaN(durationInHours) || durationInHours > 10 || durationInHours <= 0) {
			error(400, "Duration in hours must be greater than 0 and no more than 10.");
		}

		const warning = buildDurationWarning(tutoringSession, durationInHours);
		await locals.pb.collection("tutoringSessions").update(tutoring_session_id, {
			isComplete: Boolean(tutoringSession.verificationImage),
			tuteeMarkedComplete: true,
			dateCompleted: new Date().toISOString(),
			durationInHours,
			durationWarning: warning.durationWarning,
			durationWarningReason: warning.durationWarningReason
		});
		return { finishTutoringForm };
	},
	send_tutoring_message: async ({ locals, request, url }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		const tutoring_session_id = url.searchParams.get("id");
		if (!tutoring_session_id) {
			error(400, "A tutoring session ID must be passed in as a parameter to message it.");
		}

		const formData = await request.formData();
		const parsed = SendTutoringMessageSchema.safeParse({ body: formData.get("body") });
		if (!parsed.success) {
			error(400, parsed.error.issues[0]?.message ?? "Invalid message.");
		}

		let tutoringSession: RecievedTutoringSession;
		try {
			tutoringSession = structuredClone(
				(await locals.pb.collection("tutoringSessions").getOne(tutoring_session_id)) as unknown
			) as RecievedTutoringSession;
		} catch {
			error(404, "Tutoring session not found.");
		}

		if (!canAccessTutoringSession(tutoringSession, locals.user as RecievedUser)) {
			error(403, "Only session participants can message here.");
		}
		if (tutoringSession.isComplete) {
			error(400, "Completed sessions cannot receive new messages.");
		}

		const createdMessage = structuredClone(
			(await locals.pb.collection("tutoringMessages").create({
				session: tutoring_session_id,
				sender: locals.user.id,
				body: parsed.data.body,
				sentAt: new Date().toISOString()
			})) as unknown
		) as RecievedTutoringMessage;

		return {
			createdMessage: {
				...createdMessage,
				sender_name: locals.user.name
			} satisfies ExpandedTutoringMessage
		};
	},
	upload_tutoring_verification: async ({ locals, request, url }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}
		if (!locals.user.member) {
			error(403, "Only the tutor can upload verification for a tutoring session.");
		}

		const tutoring_session_id = url.searchParams.get("id");
		if (!tutoring_session_id) {
			error(400, "A tutoring session ID must be passed in as a parameter to verify it.");
		}

		let tutoringSession: RecievedTutoringSession;
		try {
			tutoringSession = structuredClone(
				(await locals.pb.collection("tutoringSessions").getOne(tutoring_session_id)) as unknown
			) as RecievedTutoringSession;
		} catch {
			error(404, "Tutoring session not found.");
		}

		if (String(tutoringSession.tutor) !== String(locals.user.id)) {
			error(403, "Only the assigned tutor can upload verification for this session.");
		}
		if (tutoringSession.isComplete) {
			error(400, "This tutoring session is already complete.");
		}

		const formData = await request.formData();
		const verificationImage = formData.get("verificationImage");
		if (!(verificationImage instanceof File) || verificationImage.size === 0) {
			error(400, "Upload a tutoring verification image.");
		}
		// Some phones send HEIC with no MIME type, so fall back to the extension.
		const isPhoto =
			verificationImage.type.startsWith("image/") ||
			/\.(heic|heif|jpe?g|png|webp|gif|avif|bmp|tiff?)$/i.test(verificationImage.name);
		if (!isPhoto) {
			error(400, "Upload a photo or screenshot.");
		}
		if (verificationImage.size > MAX_VERIFICATION_IMAGE_SIZE) {
			error(400, "That photo is over 10 MB. Try a screenshot or a smaller photo.");
		}

		const updateData = new FormData();
		updateData.set("verificationImage", verificationImage);
		updateData.set("verificationSubmittedAt", new Date().toISOString());
		updateData.set("verificationStorageProvider", "pocketbase");
		if (tutoringSession.tuteeMarkedComplete) {
			updateData.set("isComplete", "true");
		}

		await locals.pb.collection("tutoringSessions").update(tutoring_session_id, updateData);
	}
};
