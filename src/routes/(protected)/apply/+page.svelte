<script lang="ts">
	import { untrack } from "svelte";
	import { applyAction, deserialize } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { superForm } from "sveltekit-superforms";
	import type { ActionResult } from "@sveltejs/kit";
	import type { PageData } from "./$types";
	import ErrorComponent from "$lib/components/ErrorComponent.svelte";
	import { getModalStore, type ModalSettings } from "$lib/skeleton-compat";

	const modalStore = getModalStore();

	let { data }: { data: PageData } = $props();

	let lastSaved = $state<Date | undefined>(
		untrack(() =>
			data.userApplication?.updated ? new Date(data.userApplication.updated) : undefined
		)
	);
	let submitError = $state("");
	let submitting = $state(false);

	const {
		form,
		errors,
		enhance,
		tainted,
		isTainted,
		submitting: saving
	} = superForm(
		untrack(() => data.form),
		{
			resetForm: false,
			invalidateAll: false,
			onUpdated({ form }) {
				if (form.valid) lastSaved = new Date();
			}
		}
	);

	type Field = "q1" | "q2" | "q3";
	const questions: { field: Field; prompt: string; hint: string; chars: number; words?: number }[] =
		[
			{
				field: "q1",
				prompt:
					"Identify your three most impactful extracurriculars and your weekly commitment to each.",
				hint: "A short list is fine. Include roughly how many hours a week each one takes.",
				chars: 1000
			},
			{
				field: "q2",
				prompt:
					"What is a social issue you care deeply about? How have you been impacted by it, and how have you engaged with it?",
				hint: "Be specific about what you've actually done, not only what you believe.",
				chars: 2000,
				words: 250
			},
			{
				field: "q3",
				prompt:
					"The four pillars of ARISTA are scholarship, leadership, service, and character. In 25 words or less each, identify a moment in your life where you have shown each pillar.",
				hint: "One moment per pillar. Labeling each one makes it easier to read.",
				chars: 2000,
				words: 100
			}
		];

	const wordCount = (text: unknown) =>
		String(text ?? "")
			.trim()
			.split(/\s+/)
			.filter(Boolean).length;
	const answered = $derived(
		questions.filter((q) => String($form[q.field] ?? "").trim().length >= 2)
	);
	const overLimit = $derived(
		questions.filter((q) => q.words && wordCount($form[q.field]) > q.words)
	);
	const ready = $derived(answered.length === questions.length && overLimit.length === 0);
	const unsaved = $derived(isTainted($tainted));

	const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
	const dateFormat = new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric"
	});
	function savedLabel(date: Date) {
		const today = new Date().toDateString() === date.toDateString();
		return today ? `Saved at ${timeFormat.format(date)}` : `Saved ${dateFormat.format(date)}`;
	}

	async function submitApplication() {
		submitting = true;
		submitError = "";
		const body = new FormData();
		for (const q of questions) body.append(q.field, String($form[q.field] ?? ""));
		try {
			const response = await fetch("?/submit_application", { method: "POST", body });
			const result: ActionResult = deserialize(await response.text());
			if (result.type === "success") await invalidateAll();
			else if (result.type === "failure")
				submitError = String(result.data?.message ?? "We couldn't submit your application.");
			else await applyAction(result);
		} catch {
			submitError = "We couldn't reach the server. Your answers are still here, so try again.";
		} finally {
			submitting = false;
		}
	}

	function confirmSubmit() {
		if (!ready) return;
		const modal: ModalSettings = {
			type: "confirm",
			title: "Submit your application?",
			body: "Once it's in, you can't edit it. Give each answer one last read first.",
			confirmLabel: "Submit application",
			response: (yes: boolean) => {
				if (yes) submitApplication();
			}
		};
		modalStore.trigger(modal);
	}

	function warnBeforeLeaving(event: BeforeUnloadEvent) {
		if (unsaved && !data.userApplication?.submitted) event.preventDefault();
	}
</script>

<svelte:window onbeforeunload={warnBeforeLeaving} />
<svelte:head><title>Apply to ARISTA</title></svelte:head>

<main class="page apply">
	<header class="page-header">
		<div>
			<h1>Apply to ARISTA</h1>
			<p>Three short responses. Save as you go, and submit when you're happy with them.</p>
		</div>
	</header>

	{#if data.userApplication?.submitted}
		<section class="apply__done panel panel--wash">
			<h2 class="section-title">Your application is in. Thank you.</h2>
			<p>
				{#if data.userApplication.submitted_time}
					We received it on {dateFormat.format(new Date(data.userApplication.submitted_time))}.
				{/if}
				The executive council reads every application. If you're selected to move forward, they'll email
				you to schedule an interview.
			</p>
			<details class="apply__review">
				<summary>Read what you submitted</summary>
				{#each questions as q, i (q.field)}
					<h3>{i + 1}. {q.prompt}</h3>
					<p>{data.userApplication[q.field]}</p>
				{/each}
			</details>
		</section>
	{:else}
		<div class="apply__layout">
			<aside class="apply__aside">
				<section class="apply__card">
					<h2>Who can apply</h2>
					<p>
						Current freshmen, sophomores, and juniors with an overall average of 92 or higher. The
						cutoff is firm, even by a tenth of a point.
					</p>
				</section>
				<section class="apply__card">
					<h2>What happens next</h2>
					<ol class="apply__steps">
						<li>Answer all three questions. Drafts save to your account.</li>
						<li>Submit once. You can't edit after that.</li>
						<li>If you move forward, the executive council emails you about an interview.</li>
					</ol>
				</section>
				<p class="apply__advice">
					Write what you actually think, not what you guess we want to hear. The limits are
					maximums, not targets.
				</p>
			</aside>

			<div class="apply__main">
				<ErrorComponent errors={$errors} />

				<form method="POST" action="?/save_application" class="apply__form" use:enhance>
					{#each questions as q, i (q.field)}
						{@const words = wordCount($form[q.field])}
						{@const chars = String($form[q.field] ?? "").length}
						<div class="question" class:is-over={q.words && words > q.words}>
							<label for={q.field} class="question__prompt">
								<span class="question__num" aria-hidden="true">{i + 1}</span>
								<span>{q.prompt}</span>
							</label>
							<p class="question__hint" id="{q.field}-hint">{q.hint}</p>
							<textarea
								id={q.field}
								name={q.field}
								bind:value={$form[q.field]}
								maxlength={q.chars}
								aria-describedby="{q.field}-hint {q.field}-count"
								aria-invalid={$errors[q.field] ? "true" : undefined}></textarea>
							<p class="question__count" id="{q.field}-count">
								{#if q.words}
									<span class:over={words > q.words}>{words} / {q.words} words</span>
								{:else}
									<span>{words} words</span>
								{/if}
								<span>{chars} / {q.chars} characters</span>
							</p>
							{#if $errors[q.field]}<p class="invalid">{$errors[q.field]}</p>{/if}
						</div>
					{/each}

					<div class="apply__bar">
						<p class="apply__status" aria-live="polite">
							{#if $saving}
								Saving…
							{:else if unsaved}
								You have unsaved changes.
							{:else if lastSaved}
								{savedLabel(lastSaved)}.
							{:else}
								Nothing saved yet.
							{/if}
						</p>
						<button type="submit" class="btn" disabled={$saving || !unsaved}>Save draft</button>
					</div>
				</form>

				<section class="apply__submit" aria-labelledby="submit-heading">
					<div>
						<h2 id="submit-heading">Ready to send it?</h2>
						<p>
							{#if overLimit.length}
								Question {overLimit.map((q) => questions.indexOf(q) + 1).join(" and ")} is over the word
								limit.
							{:else if !ready}
								{answered.length} of 3 answered. Finish all three to submit.
							{:else}
								All three are answered. You can't make changes after you submit.
							{/if}
						</p>
						{#if submitError}<p class="invalid" role="alert">{submitError}</p>{/if}
					</div>
					<button
						type="button"
						class="btn btn-primary btn-lg"
						disabled={!ready || submitting}
						onclick={confirmSubmit}
					>
						{submitting ? "Submitting…" : "Submit application"}
					</button>
				</section>
			</div>
		</div>
	{/if}
</main>

<style>
	.apply__layout {
		display: grid;
		grid-template-columns: minmax(15rem, 19rem) minmax(0, 1fr);
		gap: clamp(1.5rem, 4vw, 3.5rem);
		align-items: start;
	}
	.apply__aside {
		position: sticky;
		top: 1.5rem;
		display: grid;
		gap: 1rem;
	}
	.apply__card {
		padding: 1.15rem 1.25rem;
		border-radius: var(--radius-field);
		background: var(--wash);
	}
	.apply__card h2 {
		font-family: var(--font-text);
		font-size: var(--text-base);
		font-weight: 650;
		letter-spacing: 0;
	}
	.apply__card p {
		margin: 0.4rem 0 0;
		font-size: var(--text-sm);
	}
	.apply__steps {
		display: grid;
		gap: 0.5rem;
		margin: 0.6rem 0 0;
		padding-left: 1.2rem;
		font-size: var(--text-sm);
	}
	.apply__steps li::marker {
		color: var(--flame);
		font-weight: 700;
	}
	.apply__advice {
		margin: 0;
		padding: 0 0.25rem;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.apply__form {
		display: grid;
		gap: 1.25rem;
	}
	.question {
		display: grid;
		gap: 0.5rem;
		padding: clamp(1.1rem, 2.5vw, 1.5rem);
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}
	.question__prompt {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		align-items: start;
		font-weight: 600;
		line-height: 1.45;
	}
	.question__num {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--seal);
		color: #fff;
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 600;
	}
	.question__hint {
		margin: 0 0 0.25rem 2.85rem;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.question textarea {
		min-height: 12rem;
		resize: vertical;
	}
	.question__count {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		margin: 0;
		color: var(--muted);
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
	}
	.question__count .over {
		color: var(--danger);
		font-weight: 650;
	}
	.question.is-over {
		border-color: var(--danger);
	}
	.apply__bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.apply__status {
		margin: 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.apply__submit {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1.25rem 1.4rem;
		border-radius: var(--radius-panel);
		background: var(--wash);
	}
	.apply__submit h2 {
		font-size: var(--text-lg);
	}
	.apply__submit p {
		margin: 0.2rem 0 0;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.apply__done {
		max-width: 46rem;
	}
	.apply__done > p {
		margin: 0.5rem 0 0;
		color: var(--muted);
	}
	.apply__review {
		margin-top: 1.25rem;
	}
	.apply__review summary {
		color: var(--link);
		font-weight: 600;
		cursor: pointer;
	}
	.apply__review h3 {
		margin-top: 1.25rem;
		font-family: var(--font-text);
		font-size: var(--text-sm);
		font-weight: 650;
		letter-spacing: 0;
	}
	.apply__review h3 + p {
		margin: 0.35rem 0 0;
		white-space: pre-wrap;
	}
	@media (max-width: 820px) {
		.apply__layout {
			grid-template-columns: 1fr;
		}
		.apply__aside {
			position: static;
		}
		.question__hint {
			margin-left: 0;
		}
	}
</style>
