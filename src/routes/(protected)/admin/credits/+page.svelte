<script lang="ts">
	import type { PageData } from "./$types";
	import AdminSubnav from "$lib/components/AdminSubnav.svelte";

	interface Props {
		data: PageData;
	}
	let { data }: Props = $props();
	let activeSemesterId = $derived(
		data.creditSemesters.find((semester) => semester.active)?.id ?? ""
	);
	const committees = ["general", "events", "operations", "web"] as const;
	const graduationYears = $derived(
		[...new Set(data.creditRequirements.map((requirement) => requirement.graduationYear))].sort(
			(first, second) => first - second
		)
	);
	let selectedRequirementSemesterId = $state("");
	let selectedGraduationYear = $state<number | undefined>(undefined);
	$effect(() => {
		if (!selectedRequirementSemesterId) selectedRequirementSemesterId = activeSemesterId;
		if (!selectedGraduationYear) selectedGraduationYear = graduationYears[0];
	});
	const visibleRequirements = $derived(
		data.creditRequirements.filter(
			(requirement) =>
				requirement.semester === selectedRequirementSemesterId &&
				requirement.graduationYear === selectedGraduationYear
		)
	);
	function visibleRequirement(committee: string) {
		return visibleRequirements.find((requirement) => requirement.committee === committee);
	}
</script>

<svelte:head><title>Credits & semesters | ARISTA admin</title></svelte:head>

<main class="page page--tool admin-credits">
	<header class="page-header">
		<div>
			<h1>Admin</h1>
		</div>
	</header>
	<AdminSubnav />

	<section class="block" aria-labelledby="requirements-heading">
		<div class="block__head">
			<div>
				<h2 id="requirements-heading" class="section-title">Credit requirements</h2>
			</div>
		</div>

		<div class="controls">
			<label>
				<span>Semester</span>
				<select bind:value={selectedRequirementSemesterId}>
					{#each data.creditSemesters as semester (semester.id)}
						<option value={semester.id}>{semester.name}</option>
					{/each}
				</select>
			</label>
			<label>
				<span>Graduation year</span>
				<select bind:value={selectedGraduationYear}>
					{#each graduationYears as year}<option value={year}>{year}</option>{/each}
				</select>
			</label>
		</div>

		<div class="matrix" aria-label="Credit requirements by committee">
			<div class="matrix__head" aria-hidden="true">
				<span>Committee</span>
				<span>Events</span>
				<span>Tutoring</span>
				<span>Other</span>
				<span><span class="sr-only">Save</span></span>
			</div>
			{#each committees as committee}
				{@const requirement = visibleRequirement(committee)}
				{@const label =
					committee === "general"
						? "No committee"
						: committee[0].toUpperCase() + committee.slice(1)}
				<form method="POST" action="?/save_credit_requirement" class="matrix__row">
					<input type="hidden" name="semester" value={selectedRequirementSemesterId} />
					<input type="hidden" name="graduationYear" value={selectedGraduationYear ?? ""} />
					<input type="hidden" name="committee" value={committee} />
					<strong>{label}</strong>
					<label>
						<span class="sr-only">{label} event credits</span>
						<input
							name="eventCredits"
							type="number"
							min="0"
							step="0.5"
							value={requirement?.eventCredits ?? 0}
							required
						/>
					</label>
					<label>
						<span class="sr-only">{label} tutoring credits</span>
						<input
							name="tutoringCredits"
							type="number"
							min="0"
							step="0.5"
							value={requirement?.tutoringCredits ?? 0}
							required
						/>
					</label>
					<label>
						<span class="sr-only">{label} other credits</span>
						<input
							name="otherCredits"
							type="number"
							min="0"
							step="0.5"
							value={requirement?.otherCredits ?? 0}
							required
						/>
					</label>
					<span><button type="submit" class="btn btn-sm">Save</button></span>
				</form>
			{/each}
		</div>
	</section>

	<section class="block" aria-labelledby="semesters-heading">
		<div class="block__head">
			<div>
				<h2 id="semesters-heading" class="section-title">Semesters</h2>
			</div>
		</div>
		<div class="semesters panel">
			<form method="POST" action="?/set_active_credit_semester" class="semesters__row">
				<label>
					<span>Current semester</span>
					<select name="semester" required>
						{#each data.creditSemesters as semester (semester.id)}
							<option value={semester.id} selected={semester.active}>{semester.name}</option>
						{/each}
					</select>
				</label>
				<button type="submit" class="btn btn-primary">Make current</button>
			</form>
			<form
				method="POST"
				action="?/create_credit_semester"
				class="semesters__row semesters__row--new"
			>
				<label>
					<span>New semester</span>
					<input name="name" placeholder="Spring 2027" required />
				</label>
				<label>
					<span>Roll credits over from</span>
					<select name="rolloverFrom">
						<option value="">No rollover</option>
						{#each data.creditSemesters as semester (semester.id)}
							<option value={semester.id}>{semester.name}</option>
						{/each}
					</select>
				</label>
				<label>
					<span>Rollover %</span>
					<input name="rolloverPercent" type="number" min="0" max="100" value="100" required />
				</label>
				<button type="submit" class="btn">Add semester</button>
			</form>
		</div>
	</section>
</main>

<style>
	.block + .block {
		margin-top: clamp(2.5rem, 6vw, 4rem);
	}
	.block__head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		margin-bottom: 1.25rem;
	}
	label {
		display: grid;
		gap: 0.4rem;
	}
	label > span:not(.sr-only) {
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.controls {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 16rem));
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.matrix {
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}
	.matrix__head,
	.matrix__row {
		display: grid;
		grid-template-columns: minmax(8rem, 1.2fr) repeat(3, minmax(5rem, 1fr)) auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 1rem;
	}
	.matrix__head {
		background: var(--surface-sunken);
		color: var(--muted);
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.matrix__row {
		border-top: 1px solid var(--line);
	}
	.matrix__row strong {
		font-weight: 600;
	}
	.matrix__row input {
		min-height: 2.5rem !important;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.semesters {
		display: grid;
		gap: 1.25rem;
	}
	.semesters__row {
		display: grid;
		grid-template-columns: minmax(0, 16rem) auto;
		align-items: end;
		gap: 0.75rem;
	}
	.semesters__row--new {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 7rem auto;
		padding-top: 1.25rem;
		border-top: 1px solid var(--line);
	}
	@media (max-width: 860px) {
		.semesters__row,
		.semesters__row--new,
		.controls {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 600px) {
		.matrix__head {
			display: none;
		}
		.matrix__row {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.matrix__row strong {
			grid-column: 1 / -1;
		}
		.matrix__row label > .sr-only {
			position: static;
			width: auto;
			height: auto;
			margin: 0;
			clip: auto;
			color: var(--muted);
			font-size: var(--text-xs);
			white-space: normal;
		}
		.matrix__row > span:last-child {
			grid-column: 1 / -1;
		}
	}
</style>
