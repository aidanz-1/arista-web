import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
	type ExpandedTutoringMessage,
	type RecievedPublicUserData,
	type RecievedTutoringMessage,
	type RecievedTutoringSession,
	type RecievedUser
} from "$lib/db_types";
import { canAccess } from "$lib/adminAccess";

function canAccessTutoringSession(session: RecievedTutoringSession, user: RecievedUser): boolean {
	return (
		String(session.tutee) === String(user.id) ||
		String(session.tutor) === String(user.id) ||
		canAccess(user, "tutoring")
	);
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user?.id) {
		error(401, "User not logged in.");
	}

	const sessionIds = [
		...new Set(
			url.searchParams
				.get("sessionIds")
				?.split(",")
				.map((sessionId) => sessionId.trim())
				.filter(Boolean) ?? []
		)
	];

	if (sessionIds.length === 0) {
		return json({ messages: [] });
	}
	const requestedAfter = url.searchParams.get("after");
	const after =
		requestedAfter && !Number.isNaN(Date.parse(requestedAfter))
			? new Date(requestedAfter).toISOString()
			: undefined;

	const sessions = (await locals.pb.collection("tutoringSessions").getFullList({
		filter: sessionIds.map((sessionId) => `id="${sessionId}"`).join(" || "),
		requestKey: null
	})) as unknown as RecievedTutoringSession[];

	const accessibleSessionIds = sessions
		.filter((session) => canAccessTutoringSession(session, locals.user as RecievedUser))
		.map((session) => session.id);

	if (accessibleSessionIds.length === 0) {
		return json({ messages: [] });
	}

	const messageFilter = [
		accessibleSessionIds.map((sessionId) => `session="${sessionId}"`).join(" || "),
		after ? `sentAt > "${after}"` : ""
	]
		.filter(Boolean)
		.map((filter) => `(${filter})`)
		.join(" && ");
	const messages = (await locals.pb.collection("tutoringMessages").getFullList({
		sort: "sentAt,id",
		filter: messageFilter,
		requestKey: null
	})) as unknown as RecievedTutoringMessage[];

	const senderIds = [...new Set(messages.map((message) => message.sender))];
	const senders = senderIds.length
		? ((await locals.pb.collection("publicUsers").getFullList({
				filter: senderIds.map((senderId) => `id="${senderId}"`).join(" || "),
				requestKey: null
			})) as unknown as RecievedPublicUserData[])
		: [];

	const expandedMessages = messages.map((message) => ({
		...message,
		sender_name: senders.find((sender) => sender.id === message.sender)?.name
	})) satisfies ExpandedTutoringMessage[];

	return json({ messages: expandedMessages });
};
