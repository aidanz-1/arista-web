import type {
	ExpandedCredit,
	RecievedCredit,
	RecievedCreditRequirement,
	RecievedCreditSemester,
	RecievedUser
} from "$lib/db_types";
import { calculateCredits, calculateRequiredCredits, roundCredits } from "$lib/calculateCredits";

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
			? roundCredits(Math.max(0, previousEarned - previousRequired) * semester.rolloverPercent)
			: 0;

		return {
			type,
			earned: calculateCredits(currentCredits, type),
			rollover,
			required
		};
	});
}

export type SemesterCreditTotals = Record<CreditCategory, { have: number; required: number }>;

// The active semester's totals, rollover included: the same numbers a member
// sees on their dashboard. Admin views and exports use this so they agree.
export function activeSemesterCreditTotals(
	credits: Array<RecievedCredit | ExpandedCredit>,
	user: RecievedUser,
	semesters: RecievedCreditSemester[],
	requirements?: RecievedCreditRequirement[]
): SemesterCreditTotals {
	const active = semesters.find((semester) => semester.active);
	const previous = active?.rolloverFrom
		? semesters.find((semester) => semester.id === active.rolloverFrom)
		: undefined;
	const summary =
		active && user.member
			? creditSummaryForSemester(credits, user, active, previous, requirements)
			: creditCategories.map((type) => ({ type, earned: 0, rollover: 0, required: 0 }));
	return Object.fromEntries(
		summary.map((category) => [
			category.type,
			{ have: roundCredits(category.earned + category.rollover), required: category.required }
		])
	) as SemesterCreditTotals;
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
