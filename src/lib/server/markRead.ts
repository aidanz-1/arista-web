import type PocketBase from "pocketbase";

type SessionLike = {
	id: string;
	tutor: string;
	tutee: string;
	isComplete?: boolean;
	tutorLastReadAt?: string | Date;
	tuteeLastReadAt?: string | Date;
};
type MessageLike = {
	session: string;
	sender: string;
	sentAt?: string | Date;
	created?: string | Date;
};

/**
 * Records that the signed-in person has seen each session's chat, so the
 * unread-message email skips them. Only writes when there's something new
 * from the other person since they last read.
 */
export async function markSessionsRead(
	pb: PocketBase,
	userId: string,
	sessions: SessionLike[],
	messages: MessageLike[]
) {
	const now = new Date().toISOString();
	await Promise.all(
		sessions.map(async (session) => {
			if (session.isComplete) return;
			const role = session.tutor === userId ? "tutor" : session.tutee === userId ? "tutee" : null;
			if (!role) return;
			const lastRead = new Date(session[`${role}LastReadAt`] || 0).getTime() || 0;
			const hasNew = messages.some(
				(message) =>
					message.session === session.id &&
					message.sender !== userId &&
					(new Date(message.sentAt || message.created || 0).getTime() || 0) > lastRead
			);
			if (!hasNew) return;
			await pb
				.collection("tutoringSessions")
				.update(session.id, { [`${role}LastReadAt`]: now }, { requestKey: null })
				.catch((error) => console.error("Couldn't mark messages read", error));
		})
	);
}
