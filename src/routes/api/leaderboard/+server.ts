import type { RequestHandler } from "./$types";
import type { RecievedPublicUserData } from "$lib/db_types";
import { roundCredits } from "$lib/calculateCredits";

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals?.user?.id) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401
		});
	}

	try {
		const credits = await locals.pb.collection("credits").getFullList({
			filter: 'type = "tutoring"',
			sort: "-created",
			requestKey: null
		});

		const userTotals = new Map<string, number>();

		for (const credit of credits) {
			const userId = credit.user;
			const hours = credit.credits || 0;
			userTotals.set(userId, roundCredits((userTotals.get(userId) || 0) + hours));
		}

		// convert to array and sort by hours and take top 10
		const sorted = Array.from(userTotals.entries())
			.map(([userId, totalHours]) => ({ userId, totalHours }))
			.sort((a, b) => b.totalHours - a.totalHours);
		// Keep everyone tied with 10th place.
		const cutoff = sorted[9]?.totalHours;
		const leaderboardData =
			cutoff === undefined ? sorted : sorted.filter((entry) => entry.totalHours >= cutoff);

		const userIds = leaderboardData.map((entry) => entry.userId);

		if (userIds.length === 0) {
			return new Response(JSON.stringify([]), {
				headers: { "Content-Type": "application/json" }
			});
		}

		const users = (await locals.pb.collection("publicUsers").getFullList({
			filter: userIds.map((id) => `id="${id}"`).join(" || "),
			requestKey: null
		})) as unknown as RecievedPublicUserData[];

		// Ties share a rank (1, 1, 3).
		const leaderboard = leaderboardData.map((entry) => {
			const user = users.find((u) => u.id === entry.userId);
			return {
				rank: leaderboardData.findIndex((other) => other.totalHours === entry.totalHours) + 1,
				name: user?.name || "Unknown",
				hours: entry.totalHours
			};
		});

		return new Response(JSON.stringify(leaderboard), {
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Leaderboard error:", error);
		return new Response(JSON.stringify({ error: "Failed to fetch leaderboard" }), {
			status: 500
		});
	}
};
