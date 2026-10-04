<script lang="ts">
	const canvaUrl =
		"https://www.canva.com/design/DAG9Fz8WyO4/Wj8azYS_ufU2iJyHW_LALQ/view?utm_content=DAG9Fz8WyO4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h8ec6258fd7";
	const embedUrl = "https://www.canva.com/design/DAG9Fz8WyO4/Wj8azYS_ufU2iJyHW_LALQ/view?embed";
</script>

<svelte:head><title>Events directory | ARISTA</title></svelte:head>

<main class="page page--tool">
	<header class="page-header">
		<div>
			<h1>Events directory</h1>
		</div>
		<div class="page-header__actions">
			<a class="btn" href="/events">Back to events</a>
			<a class="btn" href={canvaUrl} target="_blank" rel="noreferrer">Open in Canva</a>
		</div>
	</header>
	<div class="directory">
		<iframe
			src={embedUrl}
			title="ARISTA events directory"
			allow="fullscreen"
			allowfullscreen
			loading="lazy"
		></iframe>
	</div>
</main>

<style>
	.directory {
		overflow: hidden;
		aspect-ratio: 16 / 10;
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}
	iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
