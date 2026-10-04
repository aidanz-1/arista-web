import type { PageServerLoad } from "./$types";
import type { RecievedCredit, RecievedCreditSemester, RecievedPublicUserData } from "$lib/db_types";

export const load = (async ({ locals }) => {
	if (!locals.user || !locals.user.member) {
		return {
			users: [],
			allCredits: [],
			creditSemesters: []
		};
	}

	// Names come from the public view: the users collection itself only exposes
	// each person's own record.
	const users = (await locals.pb.collection("publicUsers").getFullList({
		fields: "id,name,preferredName",
		requestKey: null
	})) as unknown as RecievedPublicUserData[];

	const allCredits = (await locals.pb.collection("credits").getFullList({
		fields: "user,type,credits,semester",
		requestKey: null
	})) as unknown as RecievedCredit[];
	const creditSemesters = (await locals.pb.collection("creditSemesters").getFullList({
		sort: "key",
		requestKey: null
	})) as unknown as RecievedCreditSemester[];

	return {
		users,
		allCredits,
		creditSemesters
	};
}) satisfies PageServerLoad;
