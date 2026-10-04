import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { z } from "zod";
import { zod4 as zod } from "sveltekit-superforms/adapters";
import handleError from "$lib/handleError";
import type { RecievedContactCard } from "$lib/db_types";

const SettingsPageSchema = z
	.object({
		password: z.string().min(6).max(64),
		newPassword: z.string().min(6).max(64),
		newPasswordConfirm: z.string().min(6).max(64)
	})
	.refine((data) => data.newPassword === data.newPasswordConfirm, {
		message: "Passwords don't match",
		path: ["newPasswordConfirm"]
	});

const ProfileSchema = z.object({
	preferredName: z.string().trim().max(32, "Keep your preferred name under 32 characters."),
	contactInfo: z.string().trim().max(600, "Keep your contact info under 600 characters.")
});

const ThemePreferenceSchema = z.object({
	themePreference: z.enum(["system", "light", "dark"])
});

function extractPbErrorMessage(error: unknown): string {
	if (typeof error === "object" && error !== null) {
		const maybeError = error as {
			response?: { message?: string; data?: unknown };
			message?: string;
		};
		if (maybeError.response?.message) {
			return maybeError.response.message;
		}
		if (typeof maybeError.message === "string" && maybeError.message.length > 0) {
			return maybeError.message;
		}
	}
	return "PocketBase update failed.";
}

export const load = async ({ locals }) => {
	// Server API:
	const form = await superValidate(zod(SettingsPageSchema));

	let contactInfo = "";
	if (locals.user?.id) {
		try {
			const cards = (await locals.pb.collection("contactCards").getList(1, 1, {
				filter: `user="${locals.user.id}"`,
				requestKey: null
			})) as unknown as { items: RecievedContactCard[] };
			contactInfo = cards.items[0]?.details ?? "";
		} catch (loadError) {
			console.error("Failed to load contact card", loadError);
		}
	}

	// Unless you throw, always return { form } in load and form actions.
	return { form, contactInfo };
};

export const actions: Actions = {
	change_password: async ({ locals, request }) => {
		const form = await superValidate(request, zod(SettingsPageSchema));

		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}
		// Convenient validation check:
		if (!form.valid) {
			// Again, return { form } and things will just work.
			return fail(400, { form });
		}

		try {
			await locals.pb.collection("users").update(locals.user.id, {
				oldPassword: form.data.password,
				password: form.data.newPassword,
				passwordConfirm: form.data.newPasswordConfirm
			});
		} catch (error: any) {
			return handleError(error, form);
		}
		return { form };
	},
	update_profile: async ({ locals, request }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		const parsed = ProfileSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, {
				profileError: parsed.error.issues[0]?.message ?? "Check your profile details."
			});
		}

		try {
			await locals.pb
				.collection("users")
				.update(locals.user.id, { preferredName: parsed.data.preferredName });

			const existing = (await locals.pb.collection("contactCards").getList(1, 1, {
				filter: `user="${locals.user.id}"`,
				requestKey: null
			})) as unknown as { items: RecievedContactCard[] };
			const card = existing.items[0];
			if (card) {
				await locals.pb
					.collection("contactCards")
					.update(card.id, { details: parsed.data.contactInfo });
			} else if (parsed.data.contactInfo) {
				await locals.pb
					.collection("contactCards")
					.create({ user: locals.user.id, details: parsed.data.contactInfo });
			}

			await locals.pb.collection("users").authRefresh({ requestKey: null });
		} catch (updateError) {
			return fail(400, {
				profileError: `Couldn't save your profile. ${extractPbErrorMessage(updateError)}`
			});
		}

		return { profileUpdated: true };
	},
	update_theme_preference: async ({ locals, request }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		const parsed = ThemePreferenceSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { themeError: "Choose light, dark, or system mode." });
		}

		try {
			await locals.pb.collection("users").update(locals.user.id, parsed.data);
			await locals.pb.collection("users").authRefresh({ requestKey: null });
		} catch (updateError) {
			return fail(400, {
				themeError: `Could not save appearance. ${extractPbErrorMessage(updateError)}`
			});
		}

		return { themeUpdated: true, themePreference: parsed.data.themePreference };
	},
	update_message_emails: async ({ locals, request }) => {
		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}
		const enabled = (await request.formData()).get("enabled") === "true";
		try {
			await locals.pb
				.collection("users")
				.update(locals.user.id, { muteMessageEmails: !enabled }, { requestKey: null });
			await locals.pb.collection("users").authRefresh({ requestKey: null });
		} catch (updateError) {
			return fail(400, {
				emailPrefError: `Could not save. ${extractPbErrorMessage(updateError)}`
			});
		}
		return { emailPrefUpdated: true };
	},
	delete_account: async ({ locals, request }) => {
		const form = await superValidate(request, zod(SettingsPageSchema));

		if (!locals?.user?.id) {
			error(401, "User not logged in.");
		}

		try {
			await locals.pb.collection("users").delete(locals.user.id);
			locals.pb.authStore.clear();
		} catch (error: any) {
			return handleError(error, form);
		}
		throw redirect(303, "/");
	}
};
