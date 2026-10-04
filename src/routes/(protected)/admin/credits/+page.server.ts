import { error, fail } from "@sveltejs/kit";
import { z } from "zod";
import { canAccess } from "$lib/adminAccess";
import type {
	RecievedCreditRequirement,
	RecievedCreditSemester,
	RecievedUser
} from "$lib/db_types";

const ActiveCreditSemesterSchema = z.object({ semester: z.string().min(1) });
const CreateCreditSemesterSchema = z.object({
	name: z.string().trim().min(3).max(64),
	rolloverFrom: z.string().optional(),
	rolloverPercent: z.coerce.number().min(0).max(100).default(100)
});
const CreditRequirementSchema = z.object({
	semester: z.string().min(1),
	graduationYear: z.coerce.number().int().min(2023).max(2999),
	committee: z.enum(["general", "events", "operations", "web"]),
	eventCredits: z.coerce.number().min(0),
	tutoringCredits: z.coerce.number().min(0),
	otherCredits: z.coerce.number().min(0)
});

function assertCreditAdmin(user: RecievedUser | undefined) {
	if (!user || !canAccess(user, "credits")) {
		error(403, "You don't have access to do that.");
	}
}

function semesterKeyFromName(name: string): string | undefined {
	const normalized = name.trim().toLowerCase().replace(/['’]/g, "");
	const match = normalized.match(/^(fall|spring)\s+(\d{2}|\d{4})$/);
	if (!match) return undefined;
	return `${match[1]}${match[2].length === 2 ? `20${match[2]}` : match[2]}`;
}

export const actions = {
	set_active_credit_semester: async ({ request, locals }) => {
		assertCreditAdmin(locals.user as RecievedUser | undefined);
		const parsed = ActiveCreditSemesterSchema.safeParse(
			Object.fromEntries(await request.formData())
		);
		if (!parsed.success) return fail(400, { semesterError: "Choose a valid credit semester." });

		const semesters = (await locals.pb
			.collection("creditSemesters")
			.getFullList({ requestKey: null })) as unknown as RecievedCreditSemester[];
		if (!semesters.some((semester) => semester.id === parsed.data.semester)) {
			return fail(404, { semesterError: "That credit semester no longer exists." });
		}
		await Promise.all(
			semesters.map((semester) =>
				locals.pb
					.collection("creditSemesters")
					.update(semester.id, { active: semester.id === parsed.data.semester })
			)
		);
		return { semesterUpdated: true };
	},
	create_credit_semester: async ({ request, locals }) => {
		assertCreditAdmin(locals.user as RecievedUser | undefined);
		const parsed = CreateCreditSemesterSchema.safeParse(
			Object.fromEntries(await request.formData())
		);
		if (!parsed.success)
			return fail(400, {
				semesterError: parsed.error.issues[0]?.message ?? "Invalid semester details."
			});
		const key = semesterKeyFromName(parsed.data.name);
		if (!key) return fail(400, { semesterError: "Use a name such as Fall 2027 or Spring '27." });

		const semesters = (await locals.pb
			.collection("creditSemesters")
			.getFullList({ requestKey: null })) as unknown as RecievedCreditSemester[];
		if (semesters.some((semester) => semester.key === key))
			return fail(400, { semesterError: `${parsed.data.name} already exists.` });

		const semester = await locals.pb.collection("creditSemesters").create({
			name: parsed.data.name,
			key,
			...(parsed.data.rolloverFrom ? { rolloverFrom: parsed.data.rolloverFrom } : {}),
			rolloverPercent: parsed.data.rolloverPercent / 100,
			active: false
		});
		if (parsed.data.rolloverFrom) {
			const sourceRequirements = await locals.pb.collection("creditRequirements").getFullList({
				filter: `semester="${parsed.data.rolloverFrom}"`,
				requestKey: null
			});
			await Promise.all(
				sourceRequirements.map((requirement) =>
					locals.pb.collection("creditRequirements").create({
						semester: semester.id,
						graduationYear: requirement.graduationYear,
						committee: requirement.committee,
						eventCredits: requirement.eventCredits,
						tutoringCredits: requirement.tutoringCredits,
						otherCredits: requirement.otherCredits
					})
				)
			);
		}
		return { createdSemester: semester };
	},
	save_credit_requirement: async ({ request, locals }) => {
		assertCreditAdmin(locals.user as RecievedUser | undefined);
		const parsed = CreditRequirementSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, {
				requirementError: parsed.error.issues[0]?.message ?? "Enter valid requirement values."
			});

		const semesters = (await locals.pb
			.collection("creditSemesters")
			.getFullList({ requestKey: null })) as unknown as RecievedCreditSemester[];
		if (!semesters.some((semester) => semester.id === parsed.data.semester))
			return fail(404, { requirementError: "Choose an existing semester." });
		const existing = (await locals.pb.collection("creditRequirements").getFullList({
			filter: `semester="${parsed.data.semester}" && graduationYear=${parsed.data.graduationYear} && committee="${parsed.data.committee}"`,
			requestKey: null
		})) as unknown as RecievedCreditRequirement[];
		const payload = parsed.data;
		if (existing[0])
			await locals.pb.collection("creditRequirements").update(existing[0].id, payload);
		else await locals.pb.collection("creditRequirements").create(payload);
		return { requirementSaved: true };
	}
};
