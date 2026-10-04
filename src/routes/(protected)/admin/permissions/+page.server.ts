import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { RecievedUser } from "$lib/db_types";
import { ADMIN_SECTIONS, isAdmin, type AdminSection } from "$lib/adminAccess";

const FIELDS = "id,name,preferredName,osis,graduationYear,committees,adminSections,member";

function escapeFilter(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

async function withEmails(locals: App.Locals, users: RecievedUser[]) {
	if (!users.length) return users;
	const emails = (await locals.pb.collection("publicUsers").getFullList({
		filter: users.map((user) => `id="${user.id}"`).join(" || "),
		fields: "id,email",
		requestKey: null
	})) as unknown as { id: string; email: string }[];
	return users.map((user) => ({
		...user,
		email: emails.find((entry) => entry.id === user.id)?.email ?? ""
	}));
}

export const load = (async ({ locals, url }) => {
	if (!isAdmin(locals.user as RecievedUser)) error(403, "Only admins can manage permissions.");

	const granted = (await locals.pb.collection("users").getFullList({
		filter: 'adminSections:length > 0 || committees ~ "admin"',
		sort: "name",
		fields: FIELDS,
		requestKey: null
	})) as unknown as RecievedUser[];

	const query = url.searchParams.get("q")?.trim() ?? "";
	let results: RecievedUser[] = [];
	if (query.length >= 2) {
		let filter: string;
		if (/^\d+$/.test(query)) {
			filter = query.length === 9 ? `osis=${Number(query)}` : `osis~"${query}"`;
		} else {
			const term = escapeFilter(query);
			const matches = (
				await locals.pb.collection("publicUsers").getList(1, 10, {
					filter: `name~"${term}" || preferredName~"${term}" || email~"${term}"`,
					fields: "id",
					requestKey: null
				})
			).items;
			filter = matches.length
				? matches.map((match) => `id="${match.id}"`).join(" || ")
				: 'id="__none__"';
		}
		results = (
			await locals.pb.collection("users").getList(1, 10, {
				filter,
				sort: "name",
				fields: FIELDS,
				requestKey: null
			})
		).items as unknown as RecievedUser[];
	}

	return {
		granted: await withEmails(locals, granted),
		query,
		results: await withEmails(locals, results)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	set_sections: async ({ locals, request }) => {
		if (!isAdmin(locals.user as RecievedUser)) error(403, "Only admins can manage permissions.");
		const form = await request.formData();
		const userId = String(form.get("user") ?? "");
		const sections = form
			.getAll("sections")
			.map(String)
			.filter((section): section is AdminSection =>
				(ADMIN_SECTIONS as readonly string[]).includes(section)
			);
		if (!userId) return fail(400, { permissionError: "Missing person." });
		try {
			await locals.pb.collection("users").update(userId, { adminSections: sections });
		} catch (updateError) {
			console.error(updateError);
			return fail(400, {
				permissionError: "Couldn't save those permissions. Try again.",
				permissionUser: userId
			});
		}
		return { permissionSaved: userId };
	}
};
