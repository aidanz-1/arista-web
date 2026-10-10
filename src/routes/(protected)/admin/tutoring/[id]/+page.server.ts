import { error } from "@sveltejs/kit";
import { canAccess } from "$lib/adminAccess";
import type {
	ExpandedTutoringSession,
	RecievedCredit,
	RecievedPublicUserData,
	RecievedTutoringMessage,
	RecievedUser
} from "$lib/db_types";
import { actions as reviewActions } from "../+page.server";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals, params }) => {
	const user = locals.user as RecievedUser | undefined;
	if (!user || !canAccess(user, "tutoring")) {
		error(403, "You don't have access to tutoring review.");
	}

	let session: ExpandedTutoringSession;
	try {
		session = structuredClone(
			await locals.pb.collection("tutoringSessions").getOne(params.id, {
				expand: "tutoringRequest",
				requestKey: null
			})
		) as unknown as ExpandedTutoringSession;
	} catch {
		error(404, "This tutoring session could not be found.");
	}

	const [people, messages, credits] = await Promise.all([
		locals.pb.collection("publicUsers").getFullList({
			filter: [session.tutor, session.tutee, session.flaggedBy]
				.filter(Boolean)
				.map((id) => `id="${id}"`)
				.join(" || "),
			fields: "id,name,email",
			requestKey: null
		}) as unknown as Promise<RecievedPublicUserData[]>,
		locals.pb
			.collection("tutoringMessages")
			.getFullList({ filter: `session="${session.id}"`, sort: "sentAt,created", requestKey: null })
			.catch(() => []) as unknown as Promise<RecievedTutoringMessage[]>,
		locals.pb
			.collection("credits")
			.getFullList({ filter: `session="${session.id}"`, requestKey: null })
			.catch(() => []) as unknown as Promise<RecievedCredit[]>
	]);
	const person = (id: string) => people.find((entry) => entry.id === id);

	return {
		session,
		tutor: {
			id: session.tutor,
			name: person(session.tutor)?.name ?? "Unknown tutor",
			email: person(session.tutor)?.email ?? ""
		},
		tutee: {
			id: session.tutee,
			name: person(session.tutee)?.name ?? "Unknown tutee",
			email: person(session.tutee)?.email ?? ""
		},
		messages: messages.map((message) => ({
			id: message.id,
			sender: message.sender,
			body: message.body,
			sentAt: message.sentAt || message.created
		})),
		flaggedByName: session.flaggedBy ? (person(session.flaggedBy)?.name ?? "") : "",
		creditedAmount: credits.reduce((sum, credit) => sum + credit.credits, 0),
		canViewPeople: canAccess(user, "people")
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	set_flag: (event) =>
		reviewActions.set_flag(event as unknown as Parameters<typeof reviewActions.set_flag>[0])
};
