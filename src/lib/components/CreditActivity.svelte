<script lang="ts">
	import { format } from "date-fns";
	import type { ExpandedCredit } from "$lib/db_types";

	interface Props {
		credits: ExpandedCredit[];
	}

	let { credits }: Props = $props();

	// What the credit was for: the event or tutoring session when there is one,
	// otherwise the explanation the officer typed.
	function creditTitle(credit: ExpandedCredit): string {
		const event = credit.expand?.event;
		if (event) return event.name;
		const request = credit.expand?.session?.expand?.tutoringRequest;
		if (request) return `Tutoring ${request.class}${request.topic ? `: ${request.topic}` : ""}`;
		if (credit.manualExplanation) return credit.manualExplanation;
		if (credit.type === "event") return "Event (no longer listed)";
		if (credit.type === "tutoring") return "Tutoring session";
		return "Other credit";
	}

	// An officer's note, shown under the title when the title is the event or session.
	function creditNote(credit: ExpandedCredit): string | undefined {
		const hasSource = credit.expand?.event || credit.expand?.session?.expand?.tutoringRequest;
		return hasSource && credit.manualExplanation ? credit.manualExplanation : undefined;
	}

	function creditDate(credit: ExpandedCredit): string {
		const event = credit.expand?.event;
		if (event?.start_time) return format(event.start_time, "MMM d, yyyy");
		const completed = credit.expand?.session?.dateCompleted;
		if (completed) return `Completed ${format(completed, "MMM d, yyyy")}`;
		return `Credited ${format(credit.created, "MMM d, yyyy")}`;
	}
</script>

{#if credits.length === 0}
	<p class="activity__empty">Nothing recorded for this semester yet.</p>
{:else}
	<ul class="activity">
		{#each credits as credit (credit.id)}
			<li>
				<div>
					<p class="activity__title">{creditTitle(credit)}</p>
					{#if creditNote(credit)}
						<p class="activity__meta">{creditNote(credit)}</p>
					{/if}
					<p class="activity__meta">{creditDate(credit)}</p>
				</div>
				<p class="activity__amount">+{credit.credits}</p>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.activity__empty {
		margin: 0.25rem 0 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.activity {
		display: grid;
		margin: 0.25rem 0 0;
		padding: 0;
		list-style: none;
	}
	.activity li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		padding: 0.6rem 0;
		border-top: 1px solid var(--line);
	}
	.activity p {
		margin: 0;
	}
	.activity__title {
		font-size: var(--text-sm);
		font-weight: 600;
		line-height: 1.4;
	}
	.activity__meta {
		margin-top: 0.1rem !important;
		color: var(--muted);
		font-size: var(--text-xs);
	}
	.activity__amount {
		color: var(--success);
		font-size: var(--text-sm);
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
</style>
