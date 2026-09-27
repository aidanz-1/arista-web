import { env } from "$env/dynamic/private";
import type { RecievedTutoringRequest } from "$lib/db_types";

type TutoringRequestAlert = Pick<
	RecievedTutoringRequest,
	"subject" | "class" | "teacher" | "topic" | "general_time"
>;

const TUTORING_PAGE_URL = "https://www.stuyarista.org/tutoring";

function escapeSlackText(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function sendNewTutoringRequestAlert(
	tutoringRequest: TutoringRequestAlert
): Promise<void> {
	const webhookUrl = env.SLACK_TUTORING_WEBHOOK_URL;
	if (!webhookUrl) return;

	const subject = escapeSlackText(tutoringRequest.subject);
	const className = escapeSlackText(tutoringRequest.class);
	const teacher = escapeSlackText(tutoringRequest.teacher);
	const topic = escapeSlackText(tutoringRequest.topic);
	const availability = escapeSlackText(tutoringRequest.general_time);

	const response = await fetch(webhookUrl, {
		method: "POST",
		headers: { "content-type": "application/json" },
		signal: AbortSignal.timeout(4000),
		body: JSON.stringify({
			text: `New tutoring request: ${subject} — ${className}`,
			blocks: [
				{
					type: "header",
					text: { type: "plain_text", text: "New tutoring request", emoji: true }
				},
				{
					type: "section",
					fields: [
						{ type: "mrkdwn", text: `*Subject:*\n${subject}` },
						{ type: "mrkdwn", text: `*Class:*\n${className}` },
						{ type: "mrkdwn", text: `*Topic:*\n${topic}` },
						{ type: "mrkdwn", text: `*Teacher:*\n${teacher}` }
					]
				},
				{
					type: "section",
					text: { type: "mrkdwn", text: `*Availability:*\n${availability}` }
				},
				{
					type: "actions",
					elements: [
						{
							type: "button",
							text: { type: "plain_text", text: "View tutoring requests", emoji: true },
							url: TUTORING_PAGE_URL,
							style: "primary"
						}
					]
				}
			]
		})
	});

	if (!response.ok) {
		throw new Error(`Slack webhook returned ${response.status}.`);
	}
}
