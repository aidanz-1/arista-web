<script lang="ts">
	import type {
		RecievedCredit,
		RecievedCreditSemester,
		RecievedPublicUserData
	} from "$lib/db_types";
	import { displayName, initials } from "$lib/displayName";
	import { roundCredits } from "$lib/calculateCredits";

	interface Props {
		data: {
			users: Pick<RecievedPublicUserData, "id" | "name" | "preferredName">[];
			allCredits: RecievedCredit[];
			creditSemesters: RecievedCreditSemester[];
			membersOnly: boolean;
		};
	}

	let { data }: Props = $props();
	let creditType: "event" | "tutoring" = $state("tutoring");

	type PeriodOption = { id: string; label: string; semesterIds: string[] };
	const periods = $derived.by(() => {
		const semesters = [...data.creditSemesters].sort((a, b) => a.key.localeCompare(b.key));
		const individual = semesters.map((semester) => ({
			id: semester.id,
			label: semester.name,
			semesterIds: [semester.id]
		}));
		const schoolYears = new Map<string, PeriodOption>();
		for (const semester of semesters) {
			const match = semester.key.match(/^(fall|spring)(\d{4})$/);
			if (!match) continue;
			const year = Number(match[2]) - (match[1] === "spring" ? 1 : 0);
			const id = `school-year-${year}`;
			const existing = schoolYears.get(id);
			if (existing) existing.semesterIds.push(semester.id);
			else
				schoolYears.set(id, {
					id,
					label: `${year}-${year + 1} school year`,
					semesterIds: [semester.id]
				});
		}
		// Newest semester first, then whole school years. A year with only one
		// semester so far would just repeat that semester, so it's left out.
		const years = [...schoolYears.values()].filter((year) => year.semesterIds.length > 1).reverse();
		return [...individual.reverse(), ...years];
	});

	let selectedPeriodId = $state("");
	$effect(() => {
		if (!periods.some((period) => period.id === selectedPeriodId)) {
			selectedPeriodId =
				data.creditSemesters.find((semester) => semester.active)?.id ?? periods[0]?.id ?? "";
		}
	});
	const selectedPeriod = $derived(periods.find((period) => period.id === selectedPeriodId));

	const creditTotalsByUser = $derived.by(() => {
		const semesterIds = selectedPeriod?.semesterIds ?? [];
		const totals = new Map<string, number>();
		for (const credit of data.allCredits) {
			if (credit.type !== creditType || !semesterIds.includes(credit.semester ?? "")) continue;
			totals.set(credit.user, roundCredits((totals.get(credit.user) ?? 0) + credit.credits));
		}
		return totals;
	});
	// Ties share a rank (1, 1, 3) and are listed by name. Everyone tied with
	// the last spot is kept, so the list can run past 20.
	const leaderboard = $derived.by(() => {
		const sorted = data.users
			.map((user) => ({
				id: user.id,
				name: displayName(user),
				value: creditTotalsByUser.get(user.id) ?? 0
			}))
			.filter((entry) => entry.value > 0)
			.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
		const ranked = sorted.map((entry, index) => ({
			...entry,
			rank: sorted.findIndex((other) => other.value === entry.value) + 1,
			tied: sorted.filter((other) => other.value === entry.value).length > 1
		}));
		const cutoff = ranked[19]?.value;
		return cutoff === undefined ? ranked : ranked.filter((entry) => entry.value >= cutoff);
	});

	const units = $derived(creditType === "tutoring" ? "tutoring credits" : "event credits");
	// The podium has one step per rank in the top three, and everyone tied at
	// that rank stands on it together. First place stays in the middle.
	const podium = $derived.by(() => {
		const steps: { rank: number; value: number; people: typeof leaderboard }[] = [];
		for (const entry of leaderboard) {
			if (entry.rank > 3) break;
			const step = steps.find((existing) => existing.rank === entry.rank);
			if (step) step.people.push(entry);
			else steps.push({ rank: entry.rank, value: entry.value, people: [entry] });
		}
		return steps;
	});
	const podiumCount = $derived(podium.reduce((sum, step) => sum + step.people.length, 0));
	const remainingEntries = $derived(leaderboard.slice(podiumCount));
</script>

<svelte:head><title>Leaderboard | ARISTA</title></svelte:head>

<main class="page leaderboard">
	<header class="page-header">
		<div>
			<h1>Leaderboard</h1>
		</div>
		<div class="leaderboard__controls">
			<div class="segmented" role="group" aria-label="Credit type">
				<button
					type="button"
					class:active={creditType === "tutoring"}
					aria-pressed={creditType === "tutoring"}
					onclick={() => (creditType = "tutoring")}>Tutoring</button
				>
				<button
					type="button"
					class:active={creditType === "event"}
					aria-pressed={creditType === "event"}
					onclick={() => (creditType = "event")}>Events</button
				>
			</div>
			<label>
				<span class="sr-only">Period</span>
				<select bind:value={selectedPeriodId}>
					{#each periods as period (period.id)}
						<option value={period.id}>{period.label}</option>
					{/each}
				</select>
			</label>
		</div>
	</header>

	{#key `${creditType}:${selectedPeriodId}`}
		{#if data.membersOnly}
			<div class="empty-state">
				<h2>The leaderboard is for ARISTA members.</h2>
				<p>Members can see who has earned the most tutoring and event credits each semester.</p>
			</div>
		{:else if leaderboard.length === 0}
			<div class="empty-state">
				<h2>
					No {creditType === "tutoring" ? "tutoring" : "event"} credits yet for {selectedPeriod?.label ??
						"this period"}.
				</h2>
				<p>Rankings show up as soon as the first credits are recorded.</p>
			</div>
		{:else}
			<ol class="podium" aria-label="Top three">
				{#each podium as step, position (step.rank)}
					<li class="podium__place podium__place--{position + 1}" style:--order={position}>
						<div class="podium__person">
							<span class="podium__avatars" aria-hidden="true">
								{#each step.people.slice(0, 3) as person (person.id)}
									<span class="podium__avatar">{initials({ name: person.name })}</span>
								{/each}
							</span>
							<span class="podium__names" class:podium__names--many={step.people.length > 3}>
								{#each step.people as person (person.id)}
									<strong>{person.name}</strong>
								{/each}
							</span>
							<span class="podium__value"
								><b>{step.value}</b> <span class="unit-long">{units}</span><span class="unit-short"
									>credits</span
								>{step.people.length > 1 ? " each" : ""}</span
							>
						</div>
						<div class="podium__block" aria-hidden="true">
							<span>{step.rank}</span>
						</div>
						<span class="sr-only"
							>{step.people.length > 1 ? "Tied for rank" : "Rank"} {step.rank}</span
						>
					</li>
				{/each}
			</ol>
			{#if remainingEntries.length}
				<ol class="rankings">
					{#each remainingEntries as entry (entry.id)}
						<li>
							<span class="rankings__rank"
								><span class="sr-only"
									>{entry.tied ? "Tied for rank" : "Rank"}
								</span>{entry.rank}</span
							>
							<span class="rankings__name">{entry.name}</span>
							<span class="rankings__value"
								><b>{entry.value}</b>
								<small
									><span class="unit-long">{units}</span><span class="unit-short">credits</span
									></small
								></span
							>
						</li>
					{/each}
				</ol>
			{/if}
		{/if}
	{/key}
</main>

<style>
	.leaderboard__controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}
	.segmented {
		display: inline-flex;
		padding: 0.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
	}
	.segmented button {
		min-height: 2.25rem;
		padding: 0.3rem 1rem;
		border: 0;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color var(--dur-2) var(--ease-out),
			color var(--dur-2) var(--ease-out);
	}
	.segmented button.active {
		background: var(--surface);
		color: var(--ink);
		box-shadow:
			0 1px 2px rgb(22 39 90 / 12%),
			0 0 0 1px var(--line);
	}
	.leaderboard__controls select {
		width: auto !important;
		min-height: 2.75rem !important;
		border-radius: var(--radius-pill) !important;
		font-size: var(--text-sm) !important;
		font-weight: 600 !important;
	}

	/* A real podium: first place stands on the tallest block in the middle. */
	.podium {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: end;
		gap: 0;
		max-width: 46rem;
		margin: 1rem auto 0;
		padding: 0;
		list-style: none;
	}
	.podium__place {
		display: grid;
		min-width: 0;
		animation: podium-in 520ms var(--ease-out) both;
		animation-delay: calc(var(--order) * 90ms);
	}
	.podium__place--1 {
		grid-column: 2;
		grid-row: 1;
	}
	.podium__place--2 {
		grid-column: 1;
		grid-row: 1;
	}
	.podium__place--3 {
		grid-column: 3;
		grid-row: 1;
	}
	.podium__person {
		display: grid;
		justify-items: center;
		gap: 0.3rem;
		padding: 0 0.5rem 0.9rem;
		text-align: center;
	}
	.podium__avatars {
		display: flex;
		justify-content: center;
		margin-bottom: 0.25rem;
	}
	/* Tied people: smaller, overlapping circles so each set of initials shows. */
	.podium__avatar:not(:only-child) {
		width: 2.6rem;
		height: 2.6rem;
		font-size: 0.9rem;
	}
	.podium__avatar + .podium__avatar {
		margin-left: -0.45rem;
	}
	.podium__avatar {
		display: grid;
		place-items: center;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: var(--wash);
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 600;
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--line-strong);
	}
	.podium__place--1 .podium__avatar {
		background: var(--flame);
		color: #2a1a00;
		box-shadow:
			0 0 0 3px var(--paper),
			0 0 0 5px var(--flame);
	}
	.podium__place--1 .podium__avatar:only-child {
		width: 4rem;
		height: 4rem;
		font-size: 1.35rem;
	}
	.podium__names {
		display: grid;
		justify-items: center;
		gap: 0.3rem;
		max-width: 100%;
		margin: 0.15rem 0 0.2rem;
	}
	/* Several tied names: smaller and lighter so the stack reads as a list. */
	.podium__names:has(strong + strong) strong {
		font-family: var(--font-text);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	/* Big ties: names run together in smaller type instead of a tall stack. */
	.podium__names--many {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0 0.5rem;
	}
	.podium__names--many strong {
		font-size: var(--text-sm);
	}
	.podium__person strong {
		max-width: 100%;
		overflow: hidden;
		font-family: var(--font-display);
		font-size: clamp(1rem, 2vw, var(--text-lg));
		font-variation-settings: "SOFT" 100;
		font-weight: 600;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.podium__value {
		color: var(--muted);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}
	.podium__value b {
		color: var(--ink);
		font-weight: 650;
	}
	.podium__block {
		display: grid;
		place-items: start center;
		padding-top: 0.9rem;
		border-radius: 14px 14px 0 0;
		background: var(--wash);
		color: var(--muted);
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 600;
		line-height: 1;
		box-shadow: inset 0 -6px 0 color-mix(in srgb, var(--ink) 6%, transparent);
	}
	.podium__place--1 .podium__block {
		height: 11rem;
		background: var(--seal);
		color: #fff;
	}
	.podium__place--2 .podium__block {
		height: 8rem;
		margin-right: 0.35rem;
	}
	.podium__place--3 .podium__block {
		height: 6rem;
		margin-left: 0.35rem;
	}
	:global(.dark) .podium__place--1 .podium__block {
		background: var(--seal-soft);
	}
	@keyframes podium-in {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
	}

	.rankings {
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
	}
	.rankings li {
		display: grid;
		grid-template-columns: 2.25rem minmax(0, 1fr) auto;
		gap: 0.85rem;
		align-items: center;
		min-height: 3.5rem;
		border-bottom: 1px solid var(--line);
	}
	.rankings__rank {
		color: var(--muted);
		font-weight: 600;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.rankings__name {
		overflow: hidden;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.rankings__value {
		color: var(--muted);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.rankings__value b {
		color: var(--ink);
		font-weight: 650;
	}
	.rankings__value small {
		font-size: var(--text-xs);
	}

	.unit-short {
		display: none;
	}

	@media (max-width: 520px) {
		.podium__person strong {
			white-space: normal;
		}
		.podium__value {
			font-size: var(--text-xs);
		}
		.podium__place--1 .podium__block {
			height: 8rem;
		}
		.podium__place--2 .podium__block {
			height: 6rem;
		}
		.podium__place--3 .podium__block {
			height: 4.5rem;
		}
		/* Ties share a narrow column: smaller names, smaller circles. */
		.podium__names:has(strong + strong) strong {
			font-size: 0.78rem;
			line-height: 1.25;
			white-space: normal;
		}
		.podium__avatar:not(:only-child) {
			width: 2rem;
			height: 2rem;
			font-size: 0.7rem;
		}
		.podium__avatar + .podium__avatar {
			margin-left: -0.2rem;
		}
		.unit-long {
			display: none;
		}
		.unit-short {
			display: inline;
		}
	}
</style>
