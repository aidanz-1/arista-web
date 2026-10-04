<script lang="ts">
	import type { RecievedEvent } from "$lib/db_types";
	import { format, startOfDay } from "date-fns";
	interface Props {
		signed_up_events: RecievedEvent[];
	}
	let { signed_up_events }: Props = $props();
	let filtered_events = $derived(
		signed_up_events.filter(
			(event) => startOfDay(new Date(event.start_time)) >= startOfDay(new Date())
		)
	);
</script>

<section class="upcoming panel" aria-labelledby="upcoming-events-title">
	<header class="upcoming__head">
		<h2 id="upcoming-events-title" class="section-title">Your upcoming events</h2>
		{#if filtered_events.length > 0}
			<a href="/events" class="btn btn-sm">All events</a>
		{/if}
	</header>
	{#if filtered_events.length === 0}
		<div class="upcoming__empty">
			<p>You're not signed up for any events yet.</p>
			<a href="/events" class="btn btn-primary">Volunteer now</a>
		</div>
	{:else}
		<ul class="upcoming__list">
			{#each filtered_events as event (event.id)}
				<li>
					<a href={"/events/view/" + event.id}>
						<time datetime={new Date(event.start_time).toISOString()}>
							<span>{format(event.start_time, "MMM")}</span>
							<b>{format(event.start_time, "d")}</b>
						</time>
						<div>
							<strong>{event.name}</strong>
							<span
								>{format(event.start_time, "EEEE, h:mm a")}{event.location
									? `, ${event.location}`
									: ""}</span
							>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.upcoming__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.upcoming__empty {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1rem;
		padding: 1.15rem;
		border-radius: var(--radius-field);
		background: var(--surface-sunken);
	}
	.upcoming__empty p {
		max-width: 34rem;
		margin: 0;
		color: var(--muted);
	}
	.upcoming__list {
		display: grid;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}
	.upcoming__list li + li {
		border-top: 1px solid var(--line);
	}
	.upcoming__list a {
		display: grid;
		grid-template-columns: 3.25rem minmax(0, 1fr);
		gap: 1rem;
		align-items: center;
		margin: 0 -0.75rem;
		padding: 0.75rem;
		border-radius: var(--radius-field);
		color: var(--ink);
		text-decoration: none;
		transition: background-color var(--dur-2) var(--ease-out);
	}
	.upcoming__list a:hover {
		background: var(--wash);
	}
	time {
		display: grid;
		place-items: center;
		height: 3.25rem;
		border-radius: var(--radius-field);
		background: var(--flame-soft);
		color: var(--flame-text);
		line-height: 1;
	}
	time span {
		font-size: 0.6875rem;
		font-weight: 650;
	}
	time b {
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 600;
	}
	.upcoming__list div {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}
	.upcoming__list strong {
		overflow: hidden;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.upcoming__list div span {
		overflow: hidden;
		color: var(--muted);
		font-size: var(--text-sm);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
