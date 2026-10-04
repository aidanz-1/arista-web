<script lang="ts">
	import FAQ from "$lib/components/FAQ.svelte";
	import TutorFAQ from "$lib/components/TutorFAQ.svelte";
	import { currentUser } from "$lib/pocketbase";

	let query = $state("");
	let matchCount = $state<number | null>(null);
	let questionList: HTMLElement;

	function filterQuestions(value = query) {
		const term = value.trim().toLocaleLowerCase();
		const questions = questionList?.querySelectorAll("details") ?? [];
		let matches = 0;

		questions.forEach((question) => {
			const matchesQuestion = !term || question.textContent?.toLocaleLowerCase().includes(term);
			question.hidden = !matchesQuestion;
			if (matchesQuestion) matches += 1;
		});

		matchCount = term ? matches : null;
	}

	function clearSearch() {
		query = "";
		filterQuestions("");
	}
</script>

<svelte:head>
	<title>FAQ | Stuyvesant ARISTA</title>
</svelte:head>

<main class="page page--narrow faq">
	<header class="page-header">
		<div>
			<h1>Questions, answered.</h1>
		</div>
	</header>

	<form class="faq-search" role="search" onsubmit={(event) => event.preventDefault()}>
		<label for="faq-search-input" class="sr-only">Search questions</label>
		<svg viewBox="0 0 24 24" aria-hidden="true"
			><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.25 4.25" /></svg
		>
		<input
			id="faq-search-input"
			type="search"
			bind:value={query}
			oninput={() => filterQuestions()}
			placeholder="Search, like “credits” or “tutoring”"
			autocomplete="off"
		/>
		{#if query}
			<button type="button" class="btn btn-ghost btn-sm" onclick={clearSearch}>Clear</button>
		{/if}
	</form>
	<p class="search-status" aria-live="polite">
		{#if matchCount !== null && matchCount > 0}
			{matchCount === 1 ? "1 question matches." : `${matchCount} questions match.`}
		{/if}
	</p>

	<section class="questions" aria-label="Frequently asked questions" bind:this={questionList}>
		{#if $currentUser?.member}
			<TutorFAQ />
		{:else}
			<FAQ />
		{/if}
	</section>

	{#if matchCount === 0}
		<div class="empty-state">
			<h2>No questions match “{query.trim()}”.</h2>
			<p>Try a shorter word, or ask the ARISTA team directly.</p>
			<button type="button" class="btn" onclick={clearSearch}>Show all questions</button>
		</div>
	{/if}

	<aside class="faq-contact">
		<div>
			<h2>Still have a question?</h2>
			<p>Send it to the ARISTA team and someone will get back to you.</p>
		</div>
		<a class="btn btn-primary" href="mailto:stuyaristanyc@gmail.com">Email ARISTA</a>
	</aside>
</main>

<style>
	.faq-search {
		position: relative;
		display: flex;
		align-items: center;
	}
	.faq-search svg {
		position: absolute;
		left: 1rem;
		width: 1.15rem;
		height: 1.15rem;
		fill: none;
		stroke: var(--muted);
		stroke-linecap: round;
		stroke-width: 2;
		pointer-events: none;
	}
	.faq-search input {
		min-height: 3.25rem !important;
		padding-left: 2.85rem !important;
		padding-right: 5rem !important;
		border-radius: var(--radius-pill) !important;
	}
	.faq-search input::-webkit-search-cancel-button {
		display: none;
	}
	.faq-search .btn {
		position: absolute;
		right: 0.4rem;
	}
	.search-status {
		min-height: 1.5rem;
		margin: 0.5rem 0 0 1rem;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.questions {
		margin-top: 1rem;
		border-top: 1px solid var(--line);
	}
	.questions :global(details[hidden]) {
		display: none;
	}
	.empty-state {
		margin-top: 1.5rem;
	}
	.faq-contact {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem 2rem;
		margin-top: clamp(2.5rem, 6vw, 4rem);
		padding: clamp(1.25rem, 3vw, 1.75rem);
		border-radius: var(--radius-panel);
		background: var(--wash);
	}
	.faq-contact h2 {
		font-size: var(--text-lg);
	}
	.faq-contact p {
		margin: 0.3rem 0 0;
		color: var(--muted);
	}
</style>
