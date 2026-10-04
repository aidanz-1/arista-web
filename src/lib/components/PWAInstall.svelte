<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";

	let showInstallPrompt = $state(false);
	let deferredPrompt: any = $state(null);
	let isIOS = $state(false);
	let isAndroid = $state(false);
	let isStandalone = false;
	let isMobile = false;

	onMount(() => {
		if (!browser) return;

		// Detect device type
		const userAgent = navigator.userAgent.toLowerCase();
		isIOS = /iphone|ipad|ipod/.test(userAgent);
		isAndroid = /android/.test(userAgent);
		isMobile = isIOS || isAndroid || /mobile/.test(userAgent);

		// Check if already installed (standalone mode)
		isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as any)?.standalone === true;

		// Only show prompt if mobile and not already installed
		if (isMobile && !isStandalone) {
			showInstallPrompt = true;
		}

		// Handle Android install prompt
		if (isAndroid) {
			window.addEventListener("beforeinstallprompt", (e) => {
				e.preventDefault();
				deferredPrompt = e;
			});
		}
	});

	function handleInstall() {
		if (isAndroid && deferredPrompt) {
			// Android: Use native prompt
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then((choiceResult: any) => {
				if (choiceResult.outcome === "accepted") {
					showInstallPrompt = false;
				}
				deferredPrompt = null;
			});
		} else {
			// iOS or fallback: Navigate to install page
			window.location.href = "/install";
		}
	}

	function dismissPrompt() {
		showInstallPrompt = false;
		// Remember dismissal for this session
		sessionStorage.setItem("pwa-dismissed", "true");
	}

	// Check if already dismissed this session
	onMount(() => {
		if (browser && sessionStorage.getItem("pwa-dismissed")) {
			showInstallPrompt = false;
		}
	});
</script>

{#if showInstallPrompt}
	<aside class="install-prompt" aria-label="Add ARISTA to your home screen">
		<img src="/images/arista-seal.jpg" alt="" width="40" height="40" />
		<div class="install-prompt__copy">
			<p>Add ARISTA to your home screen</p>
			<span>
				{#if isIOS}
					In Safari, tap Share, then Add to Home Screen.
				{:else}
					It opens like an app, one tap from your home screen.
				{/if}
			</span>
		</div>
		<div class="install-prompt__actions">
			<button type="button" onclick={handleInstall} class="btn btn-primary btn-sm">
				{isAndroid && deferredPrompt ? "Install" : "Show me how"}
			</button>
			<button type="button" onclick={dismissPrompt} class="btn btn-ghost btn-sm">Not now</button>
		</div>
	</aside>
{/if}

<style>
	.install-prompt {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.85rem;
		width: min(48rem, 100% - 2 * var(--gutter));
		margin: 0 auto 2rem;
		padding: 0.85rem 1rem;
		border-radius: var(--radius-panel);
		background: var(--wash);
		color: var(--ink);
	}
	.install-prompt img {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
	}
	.install-prompt__copy p {
		margin: 0;
		font-weight: 650;
	}
	.install-prompt__copy span {
		display: block;
		margin-top: 0.1rem;
		color: var(--muted);
		font-size: var(--text-sm);
		line-height: 1.4;
	}
	.install-prompt__actions {
		display: flex;
		gap: 0.35rem;
	}
	@media (max-width: 520px) {
		.install-prompt {
			grid-template-columns: auto minmax(0, 1fr);
		}
		.install-prompt__actions {
			grid-column: 1 / -1;
		}
		.install-prompt__actions .btn {
			flex: 1;
		}
	}
</style>
