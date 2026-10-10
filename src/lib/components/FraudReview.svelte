<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import { format } from "date-fns";
	import { roundCredits } from "$lib/calculateCredits";

	interface Props {
		session: {
			id: string;
			fraud?: boolean;
			fraudReason?: string;
			fraudAt?: string;
			fraudCreditsRemoved?: number;
			durationWarning?: boolean;
		};
		fraudByName: string;
		tutorName: string;
		/** Only admins get the Mark fraudulent control. */
		canMark: boolean;
	}
	let { session, fraudByName, tutorName, canMark }: Props = $props();
	const result = $derived((page.form ?? {}) as { fraudError?: string; fraudId?: string });
	const removed = $derived(roundCredits(session.fraudCreditsRemoved ?? 0));
</script>

{#if session.fraud}
	<div class="fraud fraud--marked" role="note">
		<strong>
			Marked fraudulent{fraudByName ? ` by ${fraudByName}` : ""}{session.fraudAt
				? ` on ${format(new Date(session.fraudAt), "MMM d, yyyy")}`
				: ""}
		</strong>
		<p>{session.fraudReason}</p>
		<p class="fraud__credits">
			{removed > 0
				? `${removed} tutoring credit${removed === 1 ? "" : "s"} removed from ${tutorName}.`
				: `${tutorName} hadn't been credited for this session, so no credits were removed.`}
			This session can't earn credit again.
		</p>
		{#if canMark}
			<form
				method="POST"
				action="?/undo_fraud"
				class="fraud__undo"
				use:enhance={({ cancel }) => {
					if (
						!confirm(
							removed > 0
								? `Undo the fraud mark? ${tutorName} gets ${removed} tutoring credit${removed === 1 ? "" : "s"} back.`
								: "Undo the fraud mark?"
						)
					)
						cancel();
				}}
			>
				<input type="hidden" name="id" value={session.id} />
				<button type="submit" class="btn btn-sm">Undo fraud mark</button>
				{#if result.fraudId === session.id && result.fraudError}
					<span class="field-error">{result.fraudError}</span>
				{/if}
			</form>
		{/if}
	</div>
{:else if canMark && session.durationWarning}
	<details class="fraud">
		<summary>Mark fraudulent</summary>
		<form
			method="POST"
			action="?/mark_fraud"
			use:enhance={({ cancel }) => {
				if (
					!confirm(
						`Mark this session fraudulent? ${tutorName} loses any tutoring credits from it, and this can't be undone here.`
					)
				)
					cancel();
				return async ({ update }) => update({ reset: false });
			}}
		>
			<input type="hidden" name="id" value={session.id} />
			<label>
				<span class="field-label">What makes it fraudulent?</span>
				<textarea name="reason" rows="2" maxlength="500" required></textarea>
			</label>
			<p class="muted">
				Removes {tutorName}'s tutoring credits for this session, blocks it from being credited
				again, and records your name and reason.
			</p>
			<button type="submit" class="btn btn-sm btn-danger">Mark fraudulent</button>
			{#if result.fraudId === session.id && result.fraudError}
				<span class="field-error">{result.fraudError}</span>
			{/if}
		</form>
	</details>
{/if}

<style>
	.fraud {
		margin-top: 0.75rem;
	}
	.fraud--marked {
		padding: 0.85rem 1rem;
		border-left: 4px solid var(--danger);
		border-radius: 10px;
		background: color-mix(in srgb, var(--danger) 10%, var(--surface));
	}
	.fraud--marked strong {
		color: var(--danger);
		font-size: var(--text-sm);
	}
	.fraud--marked p {
		margin: 0.3rem 0 0;
	}
	.fraud__undo {
		margin-top: 0.6rem;
	}
	.fraud__credits {
		color: var(--muted);
		font-size: var(--text-sm);
	}
	summary {
		width: fit-content;
		color: var(--danger);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
	}
	form {
		display: grid;
		gap: 0.5rem;
		max-width: 36rem;
		margin-top: 0.6rem;
	}
	form p {
		margin: 0;
		font-size: var(--text-sm);
	}
	form button {
		justify-self: start;
	}
	textarea {
		width: 100%;
	}
</style>
