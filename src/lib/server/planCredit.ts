import type PocketBase from "pocketbase";
import { roundCredits } from "$lib/calculateCredits";
import { activeSemesterCreditTotals } from "$lib/creditSemesters";
import type {
	RecievedCredit,
	RecievedCreditRequirement,
	RecievedCreditSemester,
	RecievedUser
} from "$lib/db_types";

export const CREDIT_CHOICES = [
	"event",
	"tutoring",
	"other",
	"other_then_event",
	"other_then_tutoring"
] as const;
export type CreditChoice = (typeof CREDIT_CHOICES)[number];
export type CreditPart = { type: "event" | "tutoring" | "other"; credits: number };

/**
 * Turns a crediting choice into the credit records to create. The split
 * choices fill whatever "other" credits the person still needs this semester
 * and put the rest in events or tutoring.
 */
export async function planCredit(
	pb: PocketBase,
	userId: string,
	credits: number,
	choice: CreditChoice
): Promise<CreditPart[]> {
	if (choice !== "other_then_event" && choice !== "other_then_tutoring") {
		return [{ type: choice, credits }];
	}
	const [person, existing, semesters, requirements] = await Promise.all([
		pb.collection("users").getOne(userId, { requestKey: null }),
		pb.collection("credits").getFullList({ filter: `user="${userId}"`, requestKey: null }),
		pb.collection("creditSemesters").getFullList({ requestKey: null }),
		pb.collection("creditRequirements").getFullList({ requestKey: null })
	]);
	const totals = activeSemesterCreditTotals(
		existing as unknown as RecievedCredit[],
		person as unknown as RecievedUser,
		semesters as unknown as RecievedCreditSemester[],
		requirements as unknown as RecievedCreditRequirement[]
	);
	const stillNeeded = Math.max(0, roundCredits(totals.other.required - totals.other.have));
	const toOther = roundCredits(Math.min(credits, stillNeeded));
	const rest = roundCredits(credits - toOther);
	const parts: CreditPart[] = [];
	if (toOther > 0) parts.push({ type: "other", credits: toOther });
	if (rest > 0)
		parts.push({ type: choice === "other_then_event" ? "event" : "tutoring", credits: rest });
	return parts;
}

export async function createPlannedCredits(
	pb: PocketBase,
	userId: string,
	credits: number,
	choice: CreditChoice,
	manualExplanation: string,
	semesterId: string
): Promise<CreditPart[]> {
	const parts = await planCredit(pb, userId, credits, choice);
	for (const part of parts) {
		await pb.collection("credits").create(
			{
				user: userId,
				credits: part.credits,
				type: part.type,
				manualExplanation,
				semester: semesterId
			},
			{ requestKey: null }
		);
	}
	return parts;
}
