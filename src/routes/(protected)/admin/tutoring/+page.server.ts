import { error, fail } from "@sveltejs/kit";
import { canAccess } from "$lib/adminAccess";
import type { ExpandedTutoringSession, RecievedPublicUserData, RecievedUser } from "$lib/db_types";
import type { Actions, PageServerLoad } from "./$types";

const REVIEW_PAGE_SIZE = 30;

function quoteFilter(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function positiveInteger(value: string | null, fallback: number) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const load = (async ({ locals, url }) => {
	const user = locals.user as RecievedUser | undefined;
	if (!user || !canAccess(user, "tutoring")) {
		error(403, "You don't have access to tutoring review.");
	}

	const search = url.searchParams.get("search")?.trim() ?? "";
	const date = url.searchParams.get("date") ?? "";
	const review = url.searchParams.get("review") ?? "all";
	const page = positiveInteger(url.searchParams.get("page"), 1);
	const filters: string[] = [];
	if (search) {
		const escapedSearch = quoteFilter(search);
		filters.push(
			`(tutor.name~"${escapedSearch}" || tutee.name~"${escapedSearch}" || tutoringRequest.class~"${escapedSearch}" || tutoringRequest.subject~"${escapedSearch}" || tutoringRequest.topic~"${escapedSearch}")`
		);
	}
	// Ignore a malformed date filter (like an edited link) instead of crashing.
	if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))) {
		const start = new Date(`${date}T00:00:00`).toISOString();
		const end = new Date(`${date}T23:59:59.999`).toISOString();
		filters.push(
			`((created>="${start}" && created<="${end}") || (dateCompleted>="${start}" && dateCompleted<="${end}"))`
		);
	}
	if (review === "warnings") filters.push("durationWarning=true");
	if (review === "proofs") filters.push("verificationImage!=''");
	if (review === "awaiting-proof")
		filters.push("tuteeMarkedComplete=true && verificationImage='' ");

	const sessionPage = await locals.pb
		.collection("tutoringSessions")
		.getList(page, REVIEW_PAGE_SIZE, {
			sort: "-dateCompleted,-created",
			expand: "tutoringRequest",
			filter: filters.join(" && "),
			requestKey: null
		});
	const sessions = structuredClone(sessionPage.items as unknown) as ExpandedTutoringSession[];
	const personIds = [
		...new Set(
			sessions.flatMap((session) => [session.tutor, session.tutee, session.flaggedBy ?? ""])
		)
	].filter(Boolean);
	const people = personIds.length
		? ((await locals.pb.collection("publicUsers").getFullList({
				filter: personIds.map((id) => `id="${id}"`).join(" || "),
				fields: "id,name,email",
				requestKey: null
			})) as unknown as RecievedPublicUserData[])
		: [];
	const peopleById = new Map(people.map((person) => [person.id, person]));

	return {
		sessions: sessions.map((session) => ({
			...session,
			tutor_name: peopleById.get(session.tutor)?.name ?? "Unknown tutor",
			tutor_email: peopleById.get(session.tutor)?.email ?? "",
			tutee_name: peopleById.get(session.tutee)?.name ?? "Unknown tutee",
			tutee_email: peopleById.get(session.tutee)?.email ?? "",
			flagged_by_name: session.flaggedBy ? (peopleById.get(session.flaggedBy)?.name ?? "") : ""
		})),
		filters: { search, date, review },
		canViewPeople: canAccess(user, "people"),
		pagination: {
			page: sessionPage.page,
			totalItems: sessionPage.totalItems,
			totalPages: sessionPage.totalPages
		}
	};
}) satisfies PageServerLoad;

// Admins can flag a session for review (or clear the flag) by hand, on top of
// the automatic duration warnings.
export const actions: Actions = {
	set_flag: async ({ locals, request }) => {
		const user = locals.user as RecievedUser | undefined;
		if (!user || !canAccess(user, "tutoring")) {
			error(403, "You don't have access to tutoring review.");
		}
		const form = await request.formData();
		const id = String(form.get("id") ?? "");
		const flagged = form.get("flagged") === "true";
		const reason = String(form.get("reason") ?? "")
			.trim()
			.slice(0, 256);
		if (!id) return fail(400, { flagError: "Missing session." });
		if (flagged && !reason)
			return fail(400, { flagError: "Add a reason for the flag.", flagId: id });
		try {
			await locals.pb.collection("tutoringSessions").update(id, {
				durationWarning: flagged,
				durationWarningReason: flagged ? reason : "",
				flaggedBy: flagged ? user.id : "",
				flaggedAt: flagged ? new Date().toISOString() : ""
			});
		} catch (updateError) {
			console.error(updateError);
			return fail(400, { flagError: "Couldn't update the flag. Try again.", flagId: id });
		}
		return { flagUpdated: id };
	}
};
