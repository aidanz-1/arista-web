import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { RecievedTutoringSession, RecievedUser } from "$lib/db_types";
import { canAccess } from "$lib/adminAccess";

function canViewProof(session: RecievedTutoringSession, user: RecievedUser): boolean {
	return (
		String(session.tutor) === String(user.id) ||
		String(session.tutee) === String(user.id) ||
		canAccess(user, "tutoring")
	);
}

export const GET: RequestHandler = async ({ locals, params, fetch }) => {
	if (!locals.user?.id) {
		error(401, "User not logged in.");
	}

	const session = (await locals.pb.collection("tutoringSessions").getOne(params.sessionId, {
		requestKey: null
	})) as unknown as RecievedTutoringSession;

	if (!canViewProof(session, locals.user as RecievedUser)) {
		error(403, "You cannot view this verification image.");
	}
	if (!session.verificationImage) {
		error(404, "This session does not have a verification image.");
	}

	const fileToken = await locals.pb.files.getToken({ requestKey: null });
	const source = new URL(locals.pb.files.getURL(session, session.verificationImage));
	source.searchParams.set("token", fileToken);
	const proof = await fetch(source);
	if (!proof.ok || !proof.body) {
		error(502, "The verification image could not be loaded.");
	}

	return new Response(proof.body, {
		headers: {
			"Content-Type": proof.headers.get("Content-Type") ?? "application/octet-stream",
			"Cache-Control": "private, max-age=300"
		}
	});
};
