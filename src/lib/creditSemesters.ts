import type {
	ExpandedCredit,
	RecievedCredit,
	RecievedCreditRequirement,
	RecievedCreditSemester,
	RecievedUser
} from "$lib/db_types";
import { calculateCredits, calculateRequiredCredits } from "$lib/calculateCredits";

export const creditCategories = ["event", "tutoring", "other"] as const;
export type CreditCategory = (typeof creditCategories)[number];

export type SemesterCreditCategorySummary = {
	type: CreditCategory;
	earned: number;
	rollover: number;
	required: number;
};

export function creditSummaryForSemester(
	credits: Array<RecievedCredit | ExpandedCredit>,
	user: RecievedUser,
	semester: RecievedCreditSemester,
	previousSemester?: RecievedCreditSemester,
	requirements?: RecievedCreditRequirement[]
): SemesterCreditCategorySummary[] {
	const currentCredits = credits.filter((credit) => credit.semester === semester.id);
	const previousCredits = previousSemester
		? credits.filter((credit) => credit.semester === previousSemester.id)
		: [];

	return creditCategories.map((type) => {
		const required = calculateRequiredCredits(user, type, requirements, semester.id);
		const previousRequired = previousSemester
			? calculateRequiredCredits(user, type, requirements, previousSemester.id)
			: 0;
		const previousEarned = calculateCredits(previousCredits, type);
		const rollover = previousSemester
			? Math.max(0, previousEarned - previousRequired) * semester.rolloverPercent
			: 0;

		return {
			type,
			earned: calculateCredits(currentCredits, type),
			rollover,
			required
		};
	});
}

export async function getActiveCreditSemester(pb: {
	collection: (name: string) => {
		getFirstListItem: (filter: string, options?: object) => Promise<unknown>;
	};
}): Promise<RecievedCreditSemester> {
	return (await pb.collection("creditSemesters").getFirstListItem("active=true", {
		sort: "key",
		requestKey: null
	})) as RecievedCreditSemester;
}
