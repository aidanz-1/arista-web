import type { PageServerLoad } from "./$types";
import type { ExpandedCredit, RecievedStrike, RecievedEvent } from "$lib/db_types";
import type { RecievedCreditRequirement, RecievedCreditSemester } from "$lib/db_types";

// Get the data, for page load
export const load = (async ({ params, locals }) => {
	if (!locals.user) return;
	if (!locals.user.member) {
		// Tutors reach tutees through their contact card, so nudge tutees who
		// haven't written one yet.
		const cards = await locals.pb
			.collection("contactCards")
			.getList(1, 1, { filter: `user="${locals.user.id}"`, fields: "details", requestKey: null });
		return { hasContactInfo: Boolean(String(cards.items[0]?.details ?? "").trim()) };
	}
	const [credits, strikes, signed_up_events, creditSemesters, creditRequirements] =
		await Promise.all([
			locals.pb.collection("credits").getFullList({
				filter: `user="${locals.user.id}"`,
				expand: "event,session,session.tutoringRequest",
				requestKey: null
			}),
			locals.pb.collection("strikes").getFullList({
				filter: `strikedUser="${locals.user.id}"`,
				requestKey: null
			}),
			locals.pb.collection("events").getFullList({
				filter: `signed_up~"${locals.user.id}" && isComplete=false`,
				sort: "start_time",
				requestKey: null
			}),
			locals.pb.collection("creditSemesters").getFullList({
				sort: "key",
				requestKey: null
			}),
			locals.pb.collection("creditRequirements").getFullList({ requestKey: null })
		]);
	const serializedCreditSemesters = structuredClone(
		creditSemesters as unknown
	) as RecievedCreditSemester[];
	const activeCreditSemester = serializedCreditSemesters.find((semester) => semester.active);
	return {
		credits: structuredClone(credits as unknown) as ExpandedCredit[],
		strikes: structuredClone(strikes as unknown) as RecievedStrike[],
		signed_up_events: structuredClone(signed_up_events as unknown) as RecievedEvent[],
		activeCreditSemester,
		creditSemesters: serializedCreditSemesters,
		creditRequirements: structuredClone(
			creditRequirements as unknown
		) as RecievedCreditRequirement[]
	};
}) satisfies PageServerLoad;
