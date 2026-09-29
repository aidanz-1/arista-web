import { env } from "$env/dynamic/private";
import type { RecievedTutoringRequest } from "$lib/db_types";

type TutoringRequestAlert = Pick<
	RecievedTutoringRequest,
	"subject" | "class" | "teacher" | "topic" | "general_time"
>;

type TutoringAlertStatus = "available" | "claimed" | "cancelled";

type SlackApiResponse = {
	ok: boolean;
	error?: string;
	ts?: string;
};

const TUTORING_PAGE_URL = "https://www.stuyarista.org/tutoring";

function escapeSlackText(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function buildTutoringRequestBlocks(
	tutoringRequest: TutoringRequestAlert,
	status: TutoringAlertStatus
) {
	const subject = escapeSlackText(tutoringRequest.subject);
	const className = escapeSlackText(tutoringRequest.class);
	const teacher = escapeSlackText(tutoringRequest.teacher);
	const topic = escapeSlackText(tutoringRequest.topic);
	const availability = escapeSlackText(tutoringRequest.general_time);
	const statusText = {
		available: "*Status:* Available",
		claimed: "*Status:* Claimed ✅",
		cancelled: "*Status:* Cancelled"
	}[status];
	const headerText = {
		available: "New tutoring request",
		claimed: "Tutoring request claimed",
		cancelled: "Tutoring request cancelled"
	}[status];

	return [
		{
			type: "header",
			text: { type: "plain_text", text: headerText, emoji: true }
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
			type: "section",
			text: { type: "mrkdwn", text: statusText }
		},
		...(status === "available"
			? [
					{
						type: "actions",
						elements: [
							{
								type: "button",
								text: {
									type: "plain_text",
									text: "View tutoring requests",
									emoji: true
								},
								url: TUTORING_PAGE_URL,
								style: "primary"
							}
						]
					}
				]
			: [])
	];
}

async function callSlackApi(
	method: "chat.postMessage" | "chat.update" | "chat.delete",
	body: Record<string, unknown>
): Promise<SlackApiResponse | undefined> {
	const token = env.SLACK_TUTORING_BOT_TOKEN;
	if (!token) return undefined;

	const response = await fetch(`https://slack.com/api/${method}`, {
		method: "POST",
		headers: {
			authorization: `Bearer ${token}`,
			"content-type": "application/json; charset=utf-8"
		},
		signal: AbortSignal.timeout(4000),
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		throw new Error(`Slack API returned HTTP ${response.status}.`);
	}

	const result = (await response.json()) as SlackApiResponse;
	if (!result.ok) {
		throw new Error(`Slack API error: ${result.error ?? "unknown_error"}.`);
	}

	return result;
}

export async function sendNewTutoringRequestAlert(
	tutoringRequest: TutoringRequestAlert
): Promise<string | undefined> {
	const channel = env.SLACK_TUTORING_CHANNEL_ID;
	if (!channel) return undefined;

	const result = await callSlackApi("chat.postMessage", {
		channel,
		text: `New tutoring request: ${tutoringRequest.subject} — ${tutoringRequest.class}`,
		blocks: buildTutoringRequestBlocks(tutoringRequest, "available")
	});

	return result?.ts;
}

export async function updateTutoringRequestAlert(
	tutoringRequest: TutoringRequestAlert & { slack_message_ts?: string },
	status: TutoringAlertStatus
): Promise<void> {
	const channel = env.SLACK_TUTORING_CHANNEL_ID;
	if (!channel || !tutoringRequest.slack_message_ts) return;

	await callSlackApi("chat.update", {
		channel,
		ts: tutoringRequest.slack_message_ts,
		text: `Tutoring request ${status}: ${tutoringRequest.subject} — ${tutoringRequest.class}`,
		blocks: buildTutoringRequestBlocks(tutoringRequest, status)
	});
}

export async function deleteTutoringRequestAlert(slackMessageTs: string | undefined): Promise<void> {
	const channel = env.SLACK_TUTORING_CHANNEL_ID;
	if (!channel || !slackMessageTs) return;

	await callSlackApi("chat.delete", { channel, ts: slackMessageTs });
}
