import { error } from "@sveltejs/kit";
import { type RecievedUser } from "$lib/db_types.js";
import type { PageServerLoad } from "./$types";
import { canAccess } from "$lib/adminAccess";
import { fail, superValidate } from "sveltekit-superforms";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { handleGenericError } from "$lib/handleError";
import { z } from "zod";
import type { RecievedCreditRequirement, RecievedCreditSemester } from "$lib/db_types";

const MassCreditorSchema = z.object({
	csv_string: z.string()
});
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

function semesterKeyFromName(name: string): string | undefined {
	const normalized = name.trim().toLowerCase().replace(/['’]/g, "");
	const match = normalized.match(/^(fall|spring)\s+(\d{2}|\d{4})$/);
	if (!match) return undefined;

	const year = match[2].length === 2 ? `20${match[2]}` : match[2];
	return `${match[1]}${year}`;
}

// The People directory data comes from +layout.server.ts; this route only
// hosts actions shared with the Crediting and Credits tabs.
export const load = (async () => ({})) satisfies PageServerLoad;

function parseCsvRows(input: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let inQuotes = false;

	for (let index = 0; index < input.length; index += 1) {
		const character = input[index];
		if (character === '"') {
			if (inQuotes && input[index + 1] === '"') {
				field += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}
		if (character === "," && !inQuotes) {
			row.push(field.trim());
			field = "";
			continue;
		}
		if ((character === "\n" || character === "\r") && !inQuotes) {
			if (character === "\r" && input[index + 1] === "\n") index += 1;
			row.push(field.trim());
			if (row.some(Boolean)) rows.push(row);
			row = [];
			field = "";
			continue;
		}
		field += character;
	}

	row.push(field.trim());
	if (row.some(Boolean)) rows.push(row);
	return rows;
}

function toCsvRow(fields: string[]) {
	return fields.map((field) => `"${field.replaceAll('"', '""')}"`).join(",");
}

function isLineValid(fields: string[]): boolean {
	// email, credit_num, credit_type, manual_explanation
	if (fields.length !== 4) return false;
	const [email, credit_num, credit_type, manual_explanation] = fields;

	if (!email) return false;
	// Same limits as crediting one person: 0.01 to 100, at most two decimals.
	if (!/^\d+(\.\d{1,2})?$/.test(credit_num)) return false;
	const amount = Number(credit_num);
	if (!(amount > 0 && amount <= 100)) return false;
	if (!["event", "tutoring", "other"].includes(credit_type)) {
		return false;
	}
	// manual explanation can be anything but min 3 chars
	if (manual_explanation.length <= 3) {
		return false;
	}
	return true;
}

export const actions = {
	mass_credit: async ({ request, locals, params }) => {
		if (!locals.user) {
			error(401, "User not logged in.");
		}

		if (!canAccess(locals.user as RecievedUser, "crediting")) {
			error(401, "You don't have access to crediting.");
		}

		const form = await superValidate(request, zod(MassCreditorSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const rows = parseCsvRows(form.data.csv_string.trim());

		// Look up only the people named in the pasted lines. Emails live on the
		// public view; membership lives on users.
		const emails = [
			...new Set(rows.filter(isLineValid).map(([email]) => email.trim().toLowerCase()))
		];
		const quote = (value: string) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
		const idByEmail = new Map<string, string>();
		const memberIds = new Set<string>();
		for (let index = 0; index < emails.length; index += 50) {
			const batch = emails.slice(index, index + 50);
			const people = (await locals.pb.collection("publicUsers").getFullList({
				filter: batch.map((email) => `email="${quote(email)}"`).join(" || "),
				fields: "id,email",
				requestKey: null
			})) as unknown as { id: string; email: string }[];
			for (const person of people) idByEmail.set(person.email.toLowerCase(), person.id);
			if (people.length) {
				const members = await locals.pb.collection("users").getFullList({
					filter: `member=true && (${people.map((person) => `id="${person.id}"`).join(" || ")})`,
					fields: "id",
					requestKey: null
				});
				for (const member of members) memberIds.add(member.id);
			}
		}
		const activeSemester = (await locals.pb
			.collection("creditSemesters")
			.getFirstListItem("active=true", { requestKey: null })) as unknown as RecievedCreditSemester;

		const invalid_lines: string[] = [];
		const pending: { fields: string[]; request: Promise<unknown> }[] = [];

		for (const fields of rows) {
			const [email, credit_num, credit_type, manual_explanation] = fields;
			const userId = isLineValid(fields) ? idByEmail.get(email.trim().toLowerCase()) : undefined;
			// Bad format, unknown email, or not a member: hand the line back to fix.
			if (!userId || !memberIds.has(userId)) {
				invalid_lines.push(toCsvRow(fields));
				continue;
			}
			pending.push({
				fields,
				request: locals.pb.collection("credits").create(
					{
						credits: Number(credit_num),
						manualExplanation: manual_explanation,
						type: credit_type,
						user: userId,
						semester: activeSemester.id
					},
					{ requestKey: null }
				)
			});
		}

		// Lines that fail to save also go back into the box instead of vanishing.
		const results = await Promise.allSettled(pending.map((entry) => entry.request));
		results.forEach((result, index) => {
			if (result.status === "rejected") {
				console.error(result.reason);
				invalid_lines.push(toCsvRow(pending[index].fields));
			}
		});

		form.data.csv_string = invalid_lines.join("\n");

		return { mass_credit_form: form };
	},
	set_active_credit_semester: async ({ request, locals }) => {
		if (!locals.user || !canAccess(locals.user, "credits")) {
			error(403, "You don't have access to do that.");
		}
		const parsed = ActiveCreditSemesterSchema.safeParse(
			Object.fromEntries(await request.formData())
		);
		if (!parsed.success) {
			return fail(400, { semesterError: "Choose a valid credit semester." });
		}

		const semesters = (await locals.pb.collection("creditSemesters").getFullList({
			requestKey: null
		})) as unknown as RecievedCreditSemester[];
		if (!semesters.some((semester) => semester.id === parsed.data.semester)) {
			return fail(404, { semesterError: "That credit semester no longer exists." });
		}

		await Promise.all(
			semesters.map((semester) =>
				locals.pb.collection("creditSemesters").update(semester.id, {
					active: semester.id === parsed.data.semester
				})
			)
		);
		return { semesterUpdated: true };
	},
	create_credit_semester: async ({ request, locals }) => {
		if (!locals.user || !canAccess(locals.user, "credits")) {
			error(403, "You don't have access to do that.");
		}
		const parsed = CreateCreditSemesterSchema.safeParse(
			Object.fromEntries(await request.formData())
		);
		if (!parsed.success) {
			return fail(400, {
				semesterError: parsed.error.issues[0]?.message ?? "Invalid semester details."
			});
		}
		const key = semesterKeyFromName(parsed.data.name);
		if (!key) {
			return fail(400, { semesterError: "Use a name such as Fall 2027 or Spring '27." });
		}

		const existing = await locals.pb
			.collection("creditSemesters")
			.getFullList({ requestKey: null });
		if (existing.some((item) => item.key === key)) {
			return fail(400, { semesterError: `${parsed.data.name} already exists.` });
		}

		try {
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
		} catch (createError) {
			return fail(400, { semesterError: handleGenericError(createError) });
		}
	},
	save_credit_requirement: async ({ request, locals }) => {
		if (!locals.user || !canAccess(locals.user, "credits")) {
			error(403, "You don't have access to do that.");
		}
		const parsed = CreditRequirementSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, {
				requirementError: parsed.error.issues[0]?.message ?? "Invalid requirement details."
			});
		}
		const semesters = (await locals.pb
			.collection("creditSemesters")
			.getFullList({ requestKey: null })) as unknown as RecievedCreditSemester[];
		if (!semesters.some((semester) => semester.id === parsed.data.semester)) {
			return fail(404, { requirementError: "Choose an existing semester." });
		}
		const existing = (await locals.pb.collection("creditRequirements").getFullList({
			filter: `semester="${parsed.data.semester}" && graduationYear=${parsed.data.graduationYear} && committee="${parsed.data.committee}"`,
			requestKey: null
		})) as unknown as RecievedCreditRequirement[];
		const payload = {
			semester: parsed.data.semester,
			graduationYear: parsed.data.graduationYear,
			committee: parsed.data.committee,
			eventCredits: parsed.data.eventCredits,
			tutoringCredits: parsed.data.tutoringCredits,
			otherCredits: parsed.data.otherCredits
		};
		if (existing[0]) {
			await locals.pb.collection("creditRequirements").update(existing[0].id, payload);
		} else {
			await locals.pb.collection("creditRequirements").create(payload);
		}
		return { requirementSaved: true };
	}
};
