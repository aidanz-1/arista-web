<script lang="ts">
	import { goto } from "$app/navigation";

	function scrollRouteToTop() {
		const scrollContainer = document.querySelector<HTMLElement>(".app-shell > main");
		scrollContainer?.scrollTo({ top: 0, left: 0, behavior: "auto" });
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}

	async function navigateFromFooter(event: MouseEvent) {
		const link = event.currentTarget as HTMLAnchorElement;
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey
		) {
			return;
		}

		event.preventDefault();
		await goto(link.href, { noScroll: true });
		requestAnimationFrame(() => {
			scrollRouteToTop();
			requestAnimationFrame(scrollRouteToTop);
		});
	}
</script>

<footer class="site-footer">
	<div class="site-footer__inner">
		<div class="site-footer__identity">
			<img src="/images/arista-seal.jpg" alt="" width="56" height="56" />
			<div>
				<strong>ARISTA</strong>
				<p>Stuyvesant High School's Honor Society</p>
			</div>
		</div>

		<nav aria-label="Explore" data-sveltekit-preload-data="hover">
			<h2>Explore</h2>
			<div class="site-footer__explore-links">
				<a href="/about" onclick={navigateFromFooter}>About ARISTA</a>
				<a href="/faq" onclick={navigateFromFooter}>FAQ</a>
				<a href="/resources" onclick={navigateFromFooter}>Resources</a>
				<a href="/annual-report" onclick={navigateFromFooter}>Annual report</a>
			</div>
		</nav>

		<nav aria-label="Contact">
			<h2>Get in touch</h2>
			<a href="mailto:stuyaristanyc@gmail.com">Email ARISTA</a>
			<a href="mailto:stuyaristanycweb@gmail.com">Website help</a>
		</nav>
	</div>
	<div class="site-footer__base">
		<p>© {new Date().getFullYear()} Stuyvesant ARISTA</p>
		<p>345 Chambers Street, New York, NY</p>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: auto;
		border-top: 1px solid var(--line);
		background: var(--surface-sunken);
		color: var(--muted);
		font-size: 0.9375rem;
	}
	.site-footer__inner,
	.site-footer__base {
		width: min(var(--tool-width), 100% - 2 * var(--gutter));
		margin: 0 auto;
	}
	.site-footer__inner {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.8fr);
		gap: 2rem 3rem;
		padding: clamp(1.5rem, 3vw, 2rem) 0 1.25rem;
	}
	.site-footer__identity {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}
	.site-footer__identity img {
		flex: 0 0 auto;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
	}
	.site-footer__identity strong {
		display: block;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 1.4rem;
		font-variation-settings: "SOFT" 100;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.site-footer__identity p {
		max-width: 22rem;
		margin: 0.3rem 0 0;
		line-height: 1.55;
	}
	.site-footer nav {
		display: grid;
		align-content: start;
		gap: 0.1rem;
	}
	.site-footer h2 {
		margin-bottom: 0.4rem;
		color: var(--ink);
		font-family: var(--font-text);
		font-size: var(--text-sm);
		font-weight: 700;
		letter-spacing: 0;
	}
	.site-footer__explore-links {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.1rem 1rem;
	}
	.site-footer nav a {
		display: inline-flex;
		align-items: center;
		width: fit-content;
		min-height: 2.25rem;
		color: var(--muted);
		text-decoration: none;
		transition: color var(--dur-2) var(--ease-out);
	}
	.site-footer nav a:hover {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.site-footer__base {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 2rem;
		padding: 1rem 0 calc(1rem + env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
		font-size: var(--text-sm);
	}
	.site-footer__base p {
		margin: 0;
	}
	@media (max-width: 760px) {
		.site-footer__inner {
			grid-template-columns: 1fr 1fr;
		}
		.site-footer__identity {
			grid-column: 1 / -1;
		}
	}
</style>
