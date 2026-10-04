<!--
	ARISTA's four pillars drawn as an actual temple front. ARISTA comes from the
	Greek for "the best," so the pillars hold up a pediment with the name on it.
	Each column is a button; picking one shows what that pillar means.
-->
<script lang="ts">
	import { fly } from "svelte/transition";
	import { cubicOut } from "svelte/easing";

	const pillars = [
		{
			name: "Character",
			summary: "Our inner qualities, our principles, and the way we treat the people around us.",
			body: [
				"Character encompasses a person's inner qualities, principles, and the way they interact with others and the world around them.",
				"Because ARISTA members strive to be role models, the Stuyvesant and New York City communities trust them."
			]
		},
		{
			name: "Leadership",
			summary: "More than leading a group of people: to be a leader is to be a listener.",
			body: [
				"Everyone here is a leader in their community, whether that's at Stuy, in their neighborhood, or at home. Every member has shown the ability to plan and to execute.",
				"More than just the ability to lead a group of people, to be a leader is to be a listener. Leaders are empathetic and caring, and as you enter communities both within and outside ARISTA, we hope you treat everyone you meet with respect."
			]
		},
		{
			name: "Scholarship",
			summary: "Not just good grades, but a genuine love of learning.",
			body: [
				"Our members are committed to academic excellence, always striving to do their best. But scholarship isn't just about getting good grades. It's about a genuine love of learning: curiosity, asking questions, and challenging the way things are.",
				"We're incredibly fortunate to have the kind of education Stuyvesant offers, opportunities many around the world simply don't have. Our members don't take that for granted. They make the most of it, in the classroom and beyond it, and we hope they carry that passion for learning into everything they do.",
				"Knowledge, used with purpose, has the power to create real, lasting change. That's what scholarship means to us: not just a pillar, but a mindset that stays with our members long after Stuy."
			]
		},
		{
			name: "Service",
			summary: "Giving back to the communities that support us.",
			body: [
				"Service is about giving back to the communities that support us. It embodies selflessness and the drive to make a positive difference.",
				"We encourage every member to engage in meaningful ways, at Stuyvesant and across New York City. By committing to service, we lift up those around us and grow ourselves, building the kindness and collaboration that will guide us throughout our lives."
			]
		}
	];

	let selected = $state(0);
	const columnCenters = [100, 300, 500, 700];

	function onKeydown(event: KeyboardEvent, index: number) {
		const next =
			event.key === "ArrowRight"
				? (index + 1) % 4
				: event.key === "ArrowLeft"
					? (index + 3) % 4
					: -1;
		if (next < 0) return;
		event.preventDefault();
		selected = next;
		(document.getElementById(`pillar-tab-${next}`) as HTMLButtonElement | null)?.focus();
	}
</script>

<div class="temple">
	<div class="temple__art">
		<svg viewBox="0 0 800 400" aria-hidden="true">
			<!-- Pediment and name -->
			<polygon class="roof" points="24,124 400,28 776,124" />
			<polygon class="roof-inner" points="74,114 400,44 726,114" />
			<text class="roof-text" x="400" y="102" text-anchor="middle">ARISTA</text>
			<!-- Entablature -->
			<rect class="beam" x="40" y="124" width="720" height="26" />
			<rect class="beam-band" x="40" y="150" width="720" height="8" />
			{#each columnCenters as cx, index}
				<g class="column" class:is-active={selected === index}>
					<rect class="capital" x={cx - 50} y="158" width="100" height="14" rx="3" />
					<rect class="echinus" x={cx - 41} y="172" width="82" height="9" rx="2" />
					<rect class="shaft" x={cx - 34} y="181" width="68" height="171" />
					{#each [-22, -11, 0, 11, 22] as offset}
						<line class="flute" x1={cx + offset} y1="186" x2={cx + offset} y2="347" />
					{/each}
					<rect class="plinth" x={cx - 43} y="352" width="86" height="12" rx="2" />
				</g>
			{/each}
			<!-- Steps -->
			<rect class="step" x="20" y="364" width="760" height="16" rx="2" />
			<rect class="step step--low" x="0" y="380" width="800" height="18" rx="2" />
		</svg>

		<div class="temple__tabs" role="tablist" aria-label="The four pillars">
			{#each pillars as pillar, index}
				<button
					id="pillar-tab-{index}"
					type="button"
					role="tab"
					aria-selected={selected === index}
					aria-controls="pillar-panel"
					tabindex={selected === index ? 0 : -1}
					class:is-active={selected === index}
					onclick={() => (selected = index)}
					onkeydown={(event) => onKeydown(event, index)}
				>
					<span>{pillar.name}</span>
				</button>
			{/each}
		</div>
	</div>

	<div
		class="temple__panel"
		id="pillar-panel"
		role="tabpanel"
		aria-labelledby="pillar-tab-{selected}"
	>
		{#key selected}
			<div class="temple__copy" in:fly={{ y: 14, duration: 360, easing: cubicOut }}>
				<h3>{pillars[selected].name}</h3>
				<p class="temple__summary">{pillars[selected].summary}</p>
				{#each pillars[selected].body as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		{/key}
	</div>
</div>

<style>
	.temple {
		display: grid;
		gap: clamp(1.5rem, 4vw, 2.5rem);
		max-width: 52rem;
		margin: 0 auto;
	}
	/* Wide screens: the temple on the left, the pillar's meaning on the right. */
	@media (min-width: 1000px) {
		.temple {
			grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
			align-items: center;
			max-width: none;
		}
		.temple__panel {
			display: grid;
			align-items: center;
			min-height: 24rem;
		}
	}
	.temple__panel {
		position: relative;
		overflow: hidden;
	}
	/* The column that's lit rises a touch when chosen. */
	.column {
		transition: transform var(--dur-4) var(--ease-out);
	}
	.column.is-active {
		transform: translateY(-4px);
	}
	@media (prefers-reduced-motion: reduce) {
		.column.is-active {
			transform: none;
		}
	}
	.temple__art {
		position: relative;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.roof {
		fill: var(--seal);
	}
	.roof-inner {
		fill: none;
		stroke: rgb(255 255 255 / 28%);
		stroke-width: 2;
	}
	.roof-text {
		fill: #fff;
		font-family: var(--font-display);
		font-size: 34px;
		font-weight: 600;
		letter-spacing: 8px;
	}
	.beam {
		fill: var(--seal-deep);
	}
	.beam-band {
		fill: var(--flame);
	}
	.capital,
	.echinus,
	.plinth,
	.shaft,
	.step {
		fill: var(--surface);
		stroke: var(--line-strong);
		stroke-width: 2;
		transition:
			fill var(--dur-3) var(--ease-out),
			stroke var(--dur-3) var(--ease-out);
	}
	.step--low {
		fill: var(--surface-sunken);
	}
	.flute {
		stroke: var(--line);
		stroke-width: 2;
		transition: stroke var(--dur-3) var(--ease-out);
	}
	.column.is-active .shaft,
	.column.is-active .plinth,
	.column.is-active .echinus {
		fill: var(--flame-soft);
		stroke: var(--flame);
	}
	.column.is-active .capital {
		fill: var(--flame);
		stroke: var(--flame);
	}
	.column.is-active .flute {
		stroke: color-mix(in srgb, var(--flame) 45%, transparent);
	}

	/* Each tab sits over its column, so clicking a column picks that pillar. */
	.temple__tabs {
		position: absolute;
		top: 39.5%;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.temple__tabs button {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0 0 clamp(2.4rem, 6.5vw, 3.6rem);
		border: 0;
		border-radius: 12px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
	}
	.temple__tabs button span {
		padding: 0.2rem 0.55rem;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--paper) 88%, transparent);
		font-family: var(--font-display);
		font-size: clamp(0.7rem, 2vw, 1.05rem);
		font-variation-settings: "SOFT" 100;
		font-weight: 600;
		transition:
			background-color var(--dur-2) var(--ease-out),
			color var(--dur-2) var(--ease-out);
	}
	.temple__tabs button:hover span {
		background: var(--wash);
	}
	.temple__tabs button.is-active span {
		background: var(--ink);
		color: var(--paper);
	}

	.temple__panel {
		min-height: 12rem;
		padding: clamp(1.25rem, 3vw, 2rem);
		border-radius: var(--radius-panel);
		background: var(--wash);
	}
	.temple__panel h3 {
		font-size: clamp(1.5rem, 3vw, var(--text-2xl));
		font-variation-settings: "SOFT" 100;
	}
	.temple__summary {
		margin: 0.4rem 0 1rem !important;
		color: var(--ink) !important;
		font-size: var(--text-md);
		font-weight: 500;
	}
	.temple__panel p {
		max-width: 44rem;
		margin: 0.75rem 0 0;
		color: var(--muted);
		line-height: 1.7;
	}
	@media (max-width: 480px) {
		.temple__tabs button {
			padding-bottom: 1.9rem;
		}
	}
</style>
