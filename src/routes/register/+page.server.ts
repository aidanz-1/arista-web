import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { z } from "zod";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import { UserSchema, type RecievedUser } from "$lib/db_types";
import handleError from "$lib/handleError";
import { getSafeRedirectTarget } from "$lib/safeRedirect";

const RegisterPageSchema = UserSchema.merge(
	z.object({
		graduationYear: z
			.number()
			.min(2023)
			.max(2999)
			.default("" as unknown as number),
		osis: z
			.number({ message: "Enter your 9-digit OSIS number." })
			.int("Enter your 9-digit OSIS number.")
			.min(100000000, "OSIS numbers are 9 digits.")
			.max(999999999, "OSIS numbers are 9 digits.")
			.default("" as unknown as number),
		homeroom: z
			.string()
			.trim()
			.toUpperCase()
			.regex(/^[0-9][A-Z]{2}$/, "Enter your homeroom as a number and two letters, like 5JA."),
		preferredName: z
			.string()
			.trim()
			.max(32, "Keep your preferred name under 32 characters.")
			.optional(),
		password: z.string().min(6).max(64),
		passwordConfirm: z.string().min(6).max(64)
	})
)
	.omit({ committees: true })
	.refine((data) => data.password === data.passwordConfirm, {
		message: "Passwords don't match"
	});

export const load = async ({ locals, request, url }) => {
	// Server API:
	const form = await superValidate(zod(RegisterPageSchema));

	if (locals.user) {
		// if logged in, redirect to home
		throw redirect(303, "/");
	}

	// Unless you throw, always return { form } in load and form actions.
	return { form };
};

export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		const form = await superValidate(request, zod(RegisterPageSchema));
		// Convenient validation check:
		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		form.data.member = false; // New sign-ups begin as tutees.

		// check if exists
		try {
			await locals.pb.collection<RecievedUser>("users").create(form.data); // create user
			await locals.pb.collection("users").authWithPassword(form.data.email, form.data.password); // login
		} catch (error: unknown) {
			return handleError("User with that email already exists.", form); // usually this is cuz email taken (can't check here without having some serious security vulns)
		}
		const redirectTo = url.searchParams.get("redirectTo");
		throw redirect(303, getSafeRedirectTarget(redirectTo, url.origin));
		// return { form };
	}
};
