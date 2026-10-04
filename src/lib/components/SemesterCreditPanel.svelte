<script lang="ts">
	import type {
		ExpandedCredit,
		RecievedCreditRequirement,
		RecievedCreditSemester,
		RecievedUser
	} from "$lib/db_types";
	import { creditSummaryForSemester } from "$lib/creditSemesters";
	import CreditActivity from "$lib/components/CreditActivity.svelte";
	interface Props {
		credits: ExpandedCredit[];
		user: RecievedUser;
		semesters: RecievedCreditSemester[];
		activeSemesterId?: string;
		requirements?: RecievedCreditRequirement[];
	}
	let { credits, user, semesters, activeSemesterId, requirements = [] }: Props = $props();
	let selectedSemesterId = $state("");
	$effect(() => {
		if (!selectedSemesterId)
			selectedSemesterId =
				activeSemesterId ?? semesters.find((semester) => semester.active)?.id ?? "";
	});
	let selectedSemester = $derived(semesters.find((semester) => semester.id === selectedSemesterId));
	let selectedRolloverSemester = $derived(
		selectedSemester?.rolloverFrom
			? semesters.find((semester) => semester.id === selectedSemester?.rolloverFrom)
			: undefined
	);
	let selectedCredits = $derived(
		selectedSemester ? credits.filter((credit) => credit.semester === selectedSemester.id) : []
	);
	let selectedSummary = $derived(
		selectedSemester
			? creditSummaryForSemester(
					credits,
					user,
					selectedSemester,
					selectedRolloverSemester,
					requirements
				)
			: []
	);

	const labels: Record<string, string> = {
		event: "Events",
		tutoring: "Tutoring",
		other: "Other"
	};
</script>

{#if selectedSemester}
	<section class="credits panel" aria-labelledby="semester-credit-heading">
		<header class="credits__head">
			<h2 id="semester-credit-heading" class="section-title">{selectedSemester.name} credits</h2>
			{#if semesters.length > 1}
				<label class="credits__semester">
					<span class="sr-only">Show credits for</span>
					<select bind:value={selectedSemesterId}>
						{#each semesters as semester (semester.id)}
							<option value={semester.id}>{semester.name}</option>
						{/each}
					</select>
				</label>
			{/if}
		</header>

		<div class="credits__grid">
			{#each selectedSummary as category (category.type)}
				{@const total = category.earned + category.rollover}
				{@const remaining = Math.max(0, category.required - total)}
				{@const percent =
					category.required === 0 ? 100 : Math.min(100, (total / category.required) * 100)}
				{@const activity = selectedCredits.filter((credit) => credit.type === category.type)}
				<article class="category" class:is-done={remaining === 0}>
					<div class="category__top">
						<h3>{labels[category.type] ?? category.type}</h3>
						{#if remaining === 0}
							<span class="badge badge--success">Done</span>
						{/if}
					</div>
					<p class="category__count">
						<strong>{total}</strong><span>of {category.required}</span>
					</p>
					<div
						class="meter"
						role="progressbar"
						aria-label="{labels[category.type] ?? category.type} credits"
						aria-valuemin="0"
						aria-valuemax={category.required}
						aria-valuenow={Math.min(total, category.required)}
					>
						<span style:width="{percent}%"></span>
					</div>
					<p class="category__note">
						{#if remaining === 0}
							Requirement met{category.rollover > 0
								? `, including ${category.rollover} rolled over`
								: ""}.
						{:else}
							{remaining} to go{category.rollover > 0 ? ` (${category.rollover} rolled over)` : ""}.
						{/if}
					</p>
					<details class="category__activity">
						<summary>
							{activity.length === 0
								? "No activity yet"
								: `See ${activity.length} credit${activity.length === 1 ? "" : "s"}`}
						</summary>
						<CreditActivity credits={activity} />
					</details>
				</article>
			{/each}
		</div>

		{#if selectedRolloverSemester}
			<p class="credits__rollover">
				Credits earned beyond the requirement in {selectedRolloverSemester.name} roll over at {Math.round(
					selectedSemester.rolloverPercent * 100
				)}%.
			</p>
		{/if}
	</section>
{:else}
	<section class="empty-state">
		<h2>Credit tracking isn't open yet.</h2>
		<p>An officer still needs to start this semester. Check back soon.</p>
	</section>
{/if}

<style>
	.credits__head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1rem;
	}
	.credits__semester select {
		width: auto !important;
		min-height: 2.5rem !important;
		border-radius: var(--radius-pill) !important;
		font-size: var(--text-sm) !important;
		font-weight: 600 !important;
	}
	.credits__grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 1.25rem;
	}
	.category {
		display: grid;
		align-content: start;
		gap: 0.6rem;
		min-width: 0;
		padding: 1.15rem;
		border-radius: var(--radius-field);
		background: var(--surface-sunken);
	}
	.category__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-height: 1.6rem;
	}
	.category h3 {
		font-family: var(--font-text);
		font-size: var(--text-base);
		font-weight: 650;
		letter-spacing: 0;
	}
	.category__count {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
	.category__count strong {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-variation-settings: "SOFT" 100;
		font-weight: 600;
		line-height: 1;
	}
	.category__count span {
		color: var(--muted);
	}
	.category .meter {
		background: var(--line);
	}
	.category.is-done .meter > span {
		background: var(--success);
	}
	.category__note {
		margin: 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.category__activity {
		margin-top: 0.25rem;
	}
	.category__activity summary {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		color: var(--link);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}
	.category__activity summary::-webkit-details-marker {
		display: none;
	}
	.category__activity summary::after {
		width: 0.4rem;
		height: 0.4rem;
		margin-left: 0.5rem;
		border-right: 1.5px solid currentcolor;
		border-bottom: 1.5px solid currentcolor;
		content: "";
		transform: rotate(45deg) translateY(-2px);
		transition: transform var(--dur-2) var(--ease-out);
	}
	.category__activity[open] summary::after {
		transform: rotate(-135deg) translateY(-1px);
	}
	.credits__rollover {
		margin: 1rem 0 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	@media (max-width: 760px) {
		.credits__grid {
			grid-template-columns: 1fr;
		}
	}
</style>
