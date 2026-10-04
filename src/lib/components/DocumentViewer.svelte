<script lang="ts">
	// Shows a PDF on its own page, like the events directory: embedded on desktop,
	// with buttons to open or download it anywhere.
	interface Props {
		title: string;
		src: string;
		backHref?: string;
		backLabel?: string;
	}
	let { title, src, backHref, backLabel }: Props = $props();
</script>

<main class="page page--tool">
	<header class="page-header doc-header">
		<div><h1>{title}</h1></div>
		<div class="page-header__actions">
			{#if backHref}<a class="btn" href={backHref}>{backLabel}</a>{/if}
			<a class="btn" href={src} target="_blank" rel="noreferrer">Open in a new tab</a>
			<a class="btn btn-primary" href={src} download>Download PDF</a>
		</div>
	</header>
	<div class="viewer">
		<iframe src="{src}#view=FitH" {title}></iframe>
	</div>
	<p class="viewer__phone muted">
		On a phone? Use “Open in a new tab” to read it in your PDF viewer.
	</p>
</main>

<style>
	.doc-header {
		width: min(100%, 52rem);
		margin-right: auto;
		margin-left: auto;
	}
	/* Both documents are letter-size, so frame them as a page, not a wide strip. */
	.viewer {
		width: min(100%, 52rem);
		margin: 0 auto;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}
	iframe {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 8.5 / 11;
		border: 0;
	}
	.viewer__phone {
		display: none;
		margin: 0.75rem 0 0;
		font-size: var(--text-sm);
	}
	@media (max-width: 760px) {
		.viewer {
			display: none;
		}
		.viewer__phone {
			display: block;
		}
	}
</style>
