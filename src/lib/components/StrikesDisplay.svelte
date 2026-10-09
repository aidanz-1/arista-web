<script lang="ts">
	import calculateTotalStrikeWeight from "$lib/calculateTotalStrikeWeight";
	import type { RecievedStrike } from "$lib/db_types";
	interface Props {
		strikes: RecievedStrike[];
	}
	let { strikes }: Props = $props();
	let total = $derived(
		Math.round((calculateTotalStrikeWeight(strikes) + Number.EPSILON) * 100) / 100
	);
</script>

{#if strikes.length > 0}
	<section class="strikes panel" aria-labelledby="strikes-title">
		<header class="strikes__head">
			<div>
				<h2 id="strikes-title" class="section-title">Strikes on your record</h2>
				<p>If something here looks wrong, talk to an officer.</p>
			</div>
			<span class="badge badge--warning">{total} total</span>
		</header>
		<ul>
			{#each strikes as strike (strike.id)}
				<li>
					<span class="strikes__weight">{strike.weight}</span>
					<p>{strike.reason}</p>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<section class="strikes strikes--clear panel" aria-labelledby="strikes-title">
		<h2 id="strikes-title" class="section-title">Strikes</h2>
		<p>No strikes on your record.</p>
	</section>
{/if}

<style>
	.strikes {
		border-color: color-mix(in srgb, var(--flame) 45%, var(--line));
	}
	.strikes--clear {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		border-color: var(--line);
	}
	.strikes--clear p {
		margin: 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.strikes__head {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		justify-content: space-between;
		gap: 0.75rem 1rem;
	}
	.strikes__head p {
		margin: 0.35rem 0 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	ul {
		display: grid;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		grid-template-columns: 2.5rem minmax(0, 1fr);
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.65rem 0;
		border-top: 1px solid var(--line);
	}
	.strikes__weight {
		color: var(--flame-text);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	li p {
		margin: 0;
		line-height: 1.5;
	}
</style>
