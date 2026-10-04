import type {
	ExpandedCredit,
	OpenUser,
	RecievedCreditRequirement,
	RecievedCreditSemester,
	RecievedPublicUserData,
	RecievedStrike,
	RecievedUser
} from "$lib/db_types.js";
import { calculateCredits, calculateRequiredCredits } from "$lib/calculateCredits";
import type { LayoutServerLoad } from "./$types";

const DIRECTORY_PAGE_SIZES = [25, 50, 100, 150] as const;
const DEFAULT_DIRECTORY_PAGE_SIZE = DIRECTORY_PAGE_SIZES[0];

function quoteFilter(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function positiveInteger(value: string | null, fallback: number) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function directoryPageSize(value: string | null) {
	const parsed = positiveInteger(value, DEFAULT_DIRECTORY_PAGE_SIZE);
	return DIRECTORY_PAGE_SIZES.includes(parsed as (typeof DIRECTORY_PAGE_SIZES)[number])
		? parsed
		: DEFAULT_DIRECTORY_PAGE_SIZE;
}

function chunks<T>(items: T[], size: number) {
	return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
		items.slice(index * size, index * size + size)
	);
}

// Get the data needed by the admin route. The directory is deliberately paged:
// sending every account, credit, and strike to the browser becomes expensive quickly.
export const load: LayoutServerLoad = async ({ url, locals }) => {
	const [creditSemesters, creditRequirements] = await Promise.all([
		locals.pb.collection("creditSemesters").getFullList({ sort: "key", requestKey: null }),
		locals.pb.collection("creditRequirements").getFullList({ requestKey: null })
	]);
	const serializedSemesters = structuredClone(
		creditSemesters as unknown
	) as RecievedCreditSemester[];
	const serializedRequirements = structuredClone(
		creditRequirements as unknown
	) as RecievedCreditRequirement[];

	if (url.pathname !== "/admin") {
		return {
			creditSemesters: serializedSemesters,
			creditRequirements: serializedRequirements
		};
	}

	const search = url.searchParams.get("search")?.trim() ?? "";
	const membersOnly = url.searchParams.get("members") === "true";
	const insufficientOnly = url.searchParams.get("insufficient") === "true";
	const graduationYears = url.searchParams
		.getAll("year")
		.map(Number)
		.filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100);
	const page = positiveInteger(url.searchParams.get("page"), 1);
	const perPage = directoryPageSize(url.searchParams.get("limit"));
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
		const searchTerms = [
			`name~"${quoteFilter(search)}"`,
			...emailMatches.items.map((user) => `id="${user.id}"`)
		];
		filters.push(`(${searchTerms.join(" || ")})`);
	}

	const userQuery = { sort: "-created", filter: filters.join(" && "), requestKey: null };
	const userPage = insufficientOnly
		? undefined
		: await locals.pb.collection("users").getList(page, perPage, userQuery);
	const candidateUsers = insufficientOnly
		? (structuredClone(
				(await locals.pb.collection("users").getFullList(userQuery)) as unknown
			) as RecievedUser[])
		: (structuredClone(userPage?.items as unknown) as RecievedUser[]);
	const activeSemesterId = serializedSemesters.find((semester) => semester.active)?.id;

	const candidateIds = candidateUsers.map((user) => user.id);
	const candidateCreditGroups = candidateIds.length
		? await Promise.all(
				chunks(candidateIds, 50).map((ids) =>
					locals.pb.collection("credits").getFullList({
						filter: ids.map((id) => `user="${id}"`).join(" || "),
						fields: "user,type,credits,semester",
						requestKey: null
					})
				)
			)
		: [];
	const credits = candidateCreditGroups.flat();
	const creditsByUser = new Map<string, ExpandedCredit[]>();
	for (const credit of credits as unknown as ExpandedCredit[]) {
		creditsByUser.set(credit.user, [...(creditsByUser.get(credit.user) ?? []), credit]);
	}

	const matchingUsers = insufficientOnly
		? candidateUsers.filter((user) =>
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
			)
		: candidateUsers;
	const totalItems = insufficientOnly ? matchingUsers.length : (userPage?.totalItems ?? 0);
	const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
	const users = insufficientOnly
		? matchingUsers.slice((page - 1) * perPage, page * perPage)
		: matchingUsers;

	const userIds = users.map((user) => user.id);
	const strikeFilter = userIds.map((id) => `strikedUser="${id}"`).join(" || ");
	const publicUserFilter = userIds.map((id) => `id="${id}"`).join(" || ");
	const [strikes, publicUsers] = userIds.length
		? await Promise.all([
				locals.pb.collection("strikes").getFullList({
					filter: strikeFilter,
					fields: "strikedUser,weight",
					requestKey: null
				}),
				locals.pb.collection("publicUsers").getFullList({
					filter: publicUserFilter,
					fields: "id,name,email",
					requestKey: null
				})
			])
		: [[], []];
	const strikesByUser = new Map<string, RecievedStrike[]>();
	for (const strike of strikes as unknown as RecievedStrike[]) {
		strikesByUser.set(strike.strikedUser, [
			...(strikesByUser.get(strike.strikedUser) ?? []),
			strike
		]);
	}
	const emailByUser = new Map(
		(publicUsers as unknown as RecievedPublicUserData[]).map((user) => [user.id, user.email])
	);

	let directoryUsers = users.map(
		(user) =>
			({
				...user,
				email: emailByUser.get(user.id) ?? "",
				credits: creditsByUser.get(user.id) ?? [],
				strikes: strikesByUser.get(user.id) ?? []
			}) as OpenUser
	);

	return {
		users: directoryUsers,
		creditSemesters: serializedSemesters,
		creditRequirements: serializedRequirements,
		pagination: {
			page: Math.min(page, totalPages),
			perPage,
			totalItems,
			totalPages
		},
		filters: { search, membersOnly, insufficientOnly, graduationYears }
	};
};
