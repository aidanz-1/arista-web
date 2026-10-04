import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { z } from "zod";

const ResetPasswordSchema = z
	.object({
		token: z.string().min(1),
		password: z.string().min(8, "Use at least 8 characters.").max(64),
		passwordConfirm: z.string()
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: "Passwords don't match.",
		path: ["passwordConfirm"]
	});

export const load = (async ({ url }) => {
	const token = url.searchParams.get("token") ?? "";
	const form = await superValidate({ token }, zod(ResetPasswordSchema), { errors: false });
	return { form, hasToken: Boolean(token) };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await superValidate(request, zod(ResetPasswordSchema));
		if (!form.valid) return fail(400, { form });
		try {
			await locals.pb
				.collection("users")
				.confirmPasswordReset(form.data.token, form.data.password, form.data.passwordConfirm);
		} catch {
			form.errors._errors = [
				"This reset link has expired or was already used. Request a new one below."
			];
			return fail(400, { form, expired: true });
		}
		redirect(
			303,
			`/login?message=${encodeURIComponent("Your password is updated. Sign in with your new password.")}`
		);
	}
};
