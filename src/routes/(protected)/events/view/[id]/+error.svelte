<script>
	import { page } from "$app/state";
</script>

<svelte:head><title>Event unavailable | ARISTA</title></svelte:head>

<main class="page page--narrow event-error">
	<h1>We couldn't open this event.</h1>
	<p class="lead">
		{page?.error?.message ?? "It may have been removed, or the link may be wrong."}
	</p>
	<a class="btn btn-primary" href="/events">Back to events</a>
</main>

<style>
	.event-error {
		padding-top: clamp(3rem, 10vw, 7rem);
	}
	h1 {
		font-size: clamp(2rem, 4.5vw, var(--text-3xl));
	}
	.lead {
		margin: 1rem 0 2rem;
	}
</style>
