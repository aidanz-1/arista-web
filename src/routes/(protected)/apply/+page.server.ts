import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { ApplicationSchema, type RecievedApplication } from "$lib/db_types";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import type Client from "pocketbase";
import { z } from "zod";

// Drafts can be blank or partial. Only the limits apply until submission.
const draftAnswer = (max: number) => z.preprocess((a) => String(a ?? ""), z.string().max(max));
const InProgressApplicationSchema = z.object({
	q1: draftAnswer(1000),
	q2: draftAnswer(2000),
	q3: draftAnswer(2000)
});
const WORD_LIMITS = { q2: 250, q3: 100 } as const;

async function getUserApplication(pb: Client, applicantId: string) {
	// The collection rule only lets applicants see their own application.
	const applications = (await pb.collection("applications").getFullList({
		filter: pb.filter("applicant = {:id}", { id: applicantId })
	})) as unknown as RecievedApplication[];
	return applications[0];
}

async function saveApplication(
	pb: Client,
	applicantId: string,
	existing: RecievedApplication | undefined,
	answers: Partial<Record<"q1" | "q2" | "q3", string>>,
	submit = false
) {
	const body = {
		...answers,
		applicant: applicantId,
		submitted: submit,
		...(submit ? { submitted_time: new Date().toISOString() } : {})
	};
	return existing
		? pb.collection("applications").update(existing.id, body)
		: pb.collection("applications").create(body);
}

export const load = (async ({ locals }) => {
	if (!locals.user) error(401, "User not logged in.");
	const userApplication = await getUserApplication(locals.pb, locals.user.id);
	const form = await superValidate(userApplication, zod(InProgressApplicationSchema));
	return { form, userApplication };
}) satisfies PageServerLoad;

export const actions: Actions = {
	save_application: async ({ locals, request }) => {
		if (!locals.user) error(401, "User not logged in.");
		const form = await superValidate(request, zod(InProgressApplicationSchema));
		if (!form.valid) return fail(400, { form });

		const existing = await getUserApplication(locals.pb, locals.user.id);
		if (existing?.submitted) return fail(409, { form });
		const { q1, q2, q3 } = form.data;
		await saveApplication(locals.pb, locals.user.id, existing, { q1, q2, q3 });
		return { form };
	},
	submit_application: async ({ locals, request }) => {
		if (!locals.user) error(401, "User not logged in.");
		const parsed = ApplicationSchema.omit({ extracurriculars: true }).safeParse(
			Object.fromEntries(await request.formData())
		);
		if (!parsed.success)
			return fail(400, { message: "Answer all three questions before you submit." });

		for (const [field, limit] of Object.entries(WORD_LIMITS)) {
			const words = parsed.data[field as keyof typeof WORD_LIMITS].split(/\s+/).filter(Boolean);
			if (words.length > limit)
				return fail(400, {
					message: `Question ${field.slice(1)} is over its ${limit}-word limit.`
				});
		}

		const existing = await getUserApplication(locals.pb, locals.user.id);
		if (existing?.submitted)
			return fail(409, { message: "You've already submitted your application." });
		await saveApplication(locals.pb, locals.user.id, existing, parsed.data, true);
		return { success: true };
	}
};
