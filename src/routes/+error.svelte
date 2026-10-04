<script lang="ts">
	import { page } from "$app/state";

	const title = $derived(
		page.status === 404
			? "We couldn't find that page."
			: page.status === 403
				? "That page isn't open to your account."
				: "Something went wrong on our end."
	);
	const detail = $derived(
		page.status === 404
			? "The link may be old, or the page may have moved. Try the homepage or the FAQ."
			: (page.error?.message ?? "Try again in a moment. If it keeps happening, email the web team.")
	);
</script>

<svelte:head><title>{title} | ARISTA</title></svelte:head>

<main class="page page--narrow error">
	<p class="error__code">Error {page.status}</p>
	<h1>{title}</h1>
	<p class="lead">{detail}</p>
	<div class="error__actions">
		<a class="btn btn-primary" href="/">Go to the homepage</a>
		<a class="btn" href="mailto:stuyaristanycweb@gmail.com">Email the web team</a>
	</div>
</main>

<style>
	.error {
		padding-top: clamp(3rem, 10vw, 7rem);
	}
	.error__code {
		margin: 0 0 0.75rem;
		color: var(--muted);
		font-size: var(--text-sm);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	h1 {
		font-size: clamp(2.25rem, 5vw, var(--text-3xl));
		font-variation-settings:
			"SOFT" 100,
			"WONK" 1;
		font-weight: 560;
	}
	.lead {
		margin: 1rem 0 0;
	}
	.error__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 2rem;
	}
</style>
