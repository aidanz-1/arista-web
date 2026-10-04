<script lang="ts">
	interface Props {
		title: string;
		description?: string;
		children?: import("svelte").Snippet;
	}

	let { title, description, children }: Props = $props();
</script>

<main class="auth">
	<section class="auth__form" aria-labelledby="auth-title">
		<h1 id="auth-title">{title}</h1>
		{#if description}<p class="auth__description">{description}</p>{/if}
		{@render children?.()}
	</section>

	<aside class="auth__aside" aria-label="What an ARISTA account is for">
		<img src="/images/arista-seal.jpg" alt="" width="96" height="96" />
		<p class="auth__aside-title">One account for tutoring, service, and everything in between.</p>
		<ul>
			<li>Ask for help in any class and meet a tutor.</li>
			<li>Apply to join ARISTA when you're eligible.</li>
			<li>Members: sign up for events and track your credits.</li>
		</ul>
		<a href="/faq">Read the FAQ</a>
	</aside>
</main>

<style>
	.auth {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 25rem);
		gap: clamp(2rem, 6vw, 5rem);
		align-items: start;
		width: min(64rem, 100% - 2 * var(--gutter));
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 4.5rem) 0 clamp(3rem, 7vw, 5rem);
	}
	.auth__form {
		max-width: 30rem;
	}
	.auth__form :global(form) {
		display: grid;
		gap: 1.1rem;
	}
	h1 {
		font-size: clamp(2.25rem, 4.5vw, 3.25rem);
		line-height: 1.04;
	}
	.auth__description {
		margin: 0.85rem 0 0;
		color: var(--muted);
		font-size: var(--text-md);
		line-height: 1.55;
	}
	.auth__form > :global(*:not(h1):not(.auth__description):first-of-type) {
		margin-top: 2rem;
	}
	.auth__form :global(form) {
		margin-top: 2rem;
	}
	.auth__form :global(.auth-alt) {
		margin: 0.25rem 0 0;
		color: var(--muted);
	}

	.auth__aside {
		position: sticky;
		top: 6rem;
		display: grid;
		gap: 1.25rem;
		padding: clamp(1.5rem, 3vw, 2.25rem);
		border-radius: var(--radius-panel);
		background: var(--seal);
		color: #fff;
	}
	:global(.dark) .auth__aside {
		background: var(--seal-soft);
	}
	.auth__aside img {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		box-shadow: 0 0 0 3px rgb(255 255 255 / 22%);
	}
	.auth__aside-title {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-variation-settings: "SOFT" 100;
		font-weight: 550;
		line-height: 1.15;
		text-wrap: balance;
	}
	.auth__aside ul {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.auth__aside li {
		position: relative;
		padding-left: 1.25rem;
		color: rgb(255 255 255 / 84%);
		line-height: 1.5;
	}
	.auth__aside li::before {
		position: absolute;
		top: 0.6em;
		left: 0;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--flame);
		content: "";
	}
	.auth__aside a {
		width: fit-content;
		color: #fff;
		font-weight: 600;
		text-decoration: underline;
		text-decoration-color: rgb(255 255 255 / 45%);
		text-underline-offset: 0.2em;
	}
	.auth__aside a:hover {
		text-decoration-color: #fff;
	}

	@media (max-width: 820px) {
		.auth {
			grid-template-columns: 1fr;
		}
		.auth__form {
			max-width: none;
		}
		.auth__aside {
			position: static;
		}
		.auth__aside ul {
			display: none;
		}
	}
</style>
