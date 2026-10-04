<script lang="ts">
	import { format } from "date-fns";
	import type { ExpandedCredit } from "$lib/db_types";

	interface Props {
		credits: ExpandedCredit[];
	}

	let { credits }: Props = $props();

	function creditTitle(credit: ExpandedCredit): string {
		if (credit.manualExplanation) return credit.manualExplanation;
		if (credit.type === "event") return credit.expand?.event?.name ?? "Event credit";
		if (credit.type === "tutoring") {
			const request = credit.expand?.session?.expand?.tutoringRequest;
			return request ? `${request.topic} for ${request.class}` : "Tutoring session";
		}
		return "Manual credit";
	}

	function creditDetail(credit: ExpandedCredit): string | undefined {
		if (credit.manualExplanation) return undefined;
		if (credit.type === "event" && credit.expand?.event?.start_time) {
			return format(credit.expand.event.start_time, "MMM d, yyyy");
		}
		if (credit.type === "tutoring" && credit.expand?.session?.dateCompleted) {
			return `Completed ${format(credit.expand.session.dateCompleted, "MMM d, yyyy")}`;
		}
		return undefined;
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
					{#if creditDetail(credit)}
						<p class="activity__meta">{creditDetail(credit)}</p>
					{/if}
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
