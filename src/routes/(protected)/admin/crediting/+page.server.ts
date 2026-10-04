import { error, fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import type { RecievedUser } from "$lib/db_types";
import { canAccess } from "$lib/adminAccess";
import { getActiveCreditSemester } from "$lib/creditSemesters";
import { actions as adminActions } from "../+page.server";

const MassCreditorSchema = z.object({ csv_string: z.string() });

const SingleCreditSchema = z.object({
	user: z.string().min(1),
	credits: z.coerce
		.number()
		.positive("Enter a number of credits above 0.")
		.max(100)
		.multipleOf(0.01, "Use at most two decimal places, like 1.25."),
	type: z.enum(["event", "tutoring", "other"]),
	manualExplanation: z.string().trim().min(2, "Add a short reason.").max(256)
});

function escapeFilter(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export const load = (async ({ locals, url }) => {
	const mass_credit_form = await superValidate(zod(MassCreditorSchema));
	const query = url.searchParams.get("q")?.trim() ?? "";

	let results: RecievedUser[] = [];
	if (query.length >= 2) {
		const fields = "id,name,preferredName,osis,graduationYear,homeroom,member";
		let ids: string[] | undefined;
		let filter: string;
		if (/^\d+$/.test(query)) {
			// A number searches OSIS.
			filter = query.length === 9 ? `osis=${Number(query)}` : `osis~"${query}"`;
		} else {
			// Emails are hidden on users, so match names and emails in the public view.
			const term = escapeFilter(query);
			const matches = (
				await locals.pb.collection("publicUsers").getList(1, 12, {
					filter: `name~"${term}" || preferredName~"${term}" || email~"${term}"`,
					fields: "id",
					requestKey: null
				})
			).items;
			ids = matches.map((match) => match.id);
			filter = ids.length ? ids.map((id) => `id="${id}"`).join(" || ") : 'id="__none__"';
		}
		const users = (
			await locals.pb.collection("users").getList(1, 12, {
				filter,
				sort: "name",
				fields,
				requestKey: null
			})
		).items as unknown as RecievedUser[];
		const emails = users.length
			? ((await locals.pb.collection("publicUsers").getFullList({
					filter: users.map((user) => `id="${user.id}"`).join(" || "),
					fields: "id,email",
					requestKey: null
				})) as unknown as { id: string; email: string }[])
			: [];
		results = users.map((user) => ({
			...user,
			email: emails.find((entry) => entry.id === user.id)?.email ?? ""
		}));
	}

	return { mass_credit_form, query, results };
}) satisfies PageServerLoad;

export const actions: Actions = {
	// Same bulk crediting logic as the People page used before this tab existed.
	mass_credit: (event) =>
		adminActions.mass_credit(event as unknown as Parameters<typeof adminActions.mass_credit>[0]),
	credit_member: async ({ request, locals }) => {
		if (!canAccess(locals.user as RecievedUser, "crediting")) {
			error(403, "You don't have access to crediting.");
		}
		const parsed = SingleCreditSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, {
				creditError: parsed.error.issues[0]?.message ?? "Check the credit details."
			});
		}
		try {
			const semester = await getActiveCreditSemester(locals.pb);
			await locals.pb.collection("credits").create(
				{
					user: parsed.data.user,
					credits: parsed.data.credits,
					type: parsed.data.type,
					manualExplanation: parsed.data.manualExplanation,
					semester: semester.id
				},
				{ requestKey: null }
			);
		} catch (createError) {
			console.error(createError);
			return fail(400, { creditError: "Couldn't add the credit. Try again." });
		}
		return {
			credited: parsed.data.user,
			creditedAmount: parsed.data.credits,
			creditedType: parsed.data.type
		};
	}
};
