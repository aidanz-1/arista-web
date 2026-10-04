import { error } from "@sveltejs/kit";
import { calculateCredits, calculateRequiredCredits } from "$lib/calculateCredits";
import { canAccess } from "$lib/adminAccess";
import type {
	ExpandedCredit,
	OpenUser,
	RecievedCreditRequirement,
	RecievedCreditSemester,
	RecievedPublicUserData,
	RecievedStrike,
	RecievedUser
} from "$lib/db_types";
import calculateTotalStrikeWeight from "$lib/calculateTotalStrikeWeight";
import type { RequestHandler } from "./$types";

function quoteFilter(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function csvCell(value: unknown) {
	return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function chunks<T>(items: T[], size: number) {
	return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
		items.slice(index * size, index * size + size)
	);
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || !canAccess(locals.user, "people")) {
		error(403, "You don't have access to do that.");
	}

	const search = url.searchParams.get("search")?.trim() ?? "";
	const membersOnly = url.searchParams.get("members") === "true";
	const insufficientOnly = url.searchParams.get("insufficient") === "true";
	const graduationYears = url.searchParams
		.getAll("year")
		.map(Number)
		.filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100);
	const filters: string[] = [];
	if (membersOnly || insufficientOnly) filters.push("member=true");
	if (graduationYears.length)
		filters.push(`(${graduationYears.map((year) => `graduationYear=${year}`).join(" || ")})`);
	if (search) {
		const emailMatches = (await locals.pb.collection("publicUsers").getList(1, 100, {
			filter: `email~"${quoteFilter(search)}"`,
			fields: "id",
			requestKey: null
		})) as unknown as { items: Array<{ id: string }> };
		filters.push(
			`(${[`name~"${quoteFilter(search)}"`, ...emailMatches.items.map((user) => `id="${user.id}"`)].join(" || ")})`
		);
	}

	let users = (await locals.pb.collection("users").getFullList({
		sort: "-created",
		filter: filters.join(" && "),
		requestKey: null
	})) as unknown as RecievedUser[];
	const [semesters, requirements, publicUsers] = await Promise.all([
		locals.pb.collection("creditSemesters").getFullList({ requestKey: null }),
		locals.pb.collection("creditRequirements").getFullList({ requestKey: null }),
		locals.pb.collection("publicUsers").getFullList({ fields: "id,email", requestKey: null })
	]);
	const activeSemesterId = (semesters as unknown as RecievedCreditSemester[]).find(
		(semester) => semester.active
	)?.id;
	const serializedRequirements = requirements as unknown as RecievedCreditRequirement[];
	const userIds = users.map((user) => user.id);
	const [creditGroups, strikeGroups] = await Promise.all([
		Promise.all(
			chunks(userIds, 50).map((ids) =>
				locals.pb
					.collection("credits")
					.getFullList({
						filter: ids.map((id) => `user="${id}"`).join(" || "),
						fields: "user,type,credits,semester",
						requestKey: null
					})
			)
		),
		Promise.all(
			chunks(userIds, 50).map((ids) =>
				locals.pb
					.collection("strikes")
					.getFullList({
						filter: ids.map((id) => `strikedUser="${id}"`).join(" || "),
						fields: "strikedUser,weight",
						requestKey: null
					})
			)
		)
	]);
	const creditsByUser = new Map<string, ExpandedCredit[]>();
	for (const credit of creditGroups.flat() as ExpandedCredit[])
		creditsByUser.set(credit.user, [...(creditsByUser.get(credit.user) ?? []), credit]);
	const strikesByUser = new Map<string, RecievedStrike[]>();
	for (const strike of strikeGroups.flat() as RecievedStrike[])
		strikesByUser.set(strike.strikedUser, [
			...(strikesByUser.get(strike.strikedUser) ?? []),
			strike
		]);
	if (insufficientOnly) {
		users = users.filter((user) =>
			(["event", "tutoring", "other"] as const).some(
				(type) =>
					calculateCredits(creditsByUser.get(user.id) ?? [], type) <
					calculateRequiredCredits(
						{ ...user, credits: creditsByUser.get(user.id) ?? [] } as OpenUser,
						type,
						serializedRequirements,
						activeSemesterId
					)
			)
		);
	}
	const emailByUser = new Map(
		(publicUsers as unknown as RecievedPublicUserData[]).map((user) => [user.id, user.email])
	);
	const headers = [
		"Name",
		"Email",
		"Account type",
		"Event credits",
		"Required event credits",
		"Tutoring credits",
		"Required tutoring credits",
		"Other credits",
		"Required other credits",
		"Strike weight",
		"Committees",
		"Homeroom",
		"Graduation year",
		"OSIS"
	];
	const rows = users.map((user) => {
		const credits = creditsByUser.get(user.id) ?? [];
		const userWithCredits = { ...user, credits } as OpenUser;
		return [
			user.name,
			emailByUser.get(user.id) ?? "",
			user.member ? "Member" : "Tutee",
			calculateCredits(credits, "event"),
			user.member
				? calculateRequiredCredits(
						userWithCredits,
						"event",
						serializedRequirements,
						activeSemesterId
					)
				: "N/A",
			calculateCredits(credits, "tutoring"),
			user.member
				? calculateRequiredCredits(
						userWithCredits,
						"tutoring",
						serializedRequirements,
						activeSemesterId
					)
				: "N/A",
			calculateCredits(credits, "other"),
			user.member
				? calculateRequiredCredits(
						userWithCredits,
						"other",
						serializedRequirements,
						activeSemesterId
					)
				: "N/A",
			calculateTotalStrikeWeight(strikesByUser.get(user.id) ?? []),
			user.committees.join(", ") || "none",
			user.homeroom,
			user.graduationYear,
			user.osis
		];
	});
	const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
	return new Response(csv, {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": `attachment; filename="arista-member-directory-${new Date().toISOString().slice(0, 10)}.csv"`
		}
	});
};
