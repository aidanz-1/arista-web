<script lang="ts">
	import { currentUser } from "$lib/pocketbase";
	import type { RecievedUser } from "$lib/db_types";
	import { page } from "$app/state";
	import { accountThemeStorageKey, activeThemeOverride, publicThemePreference } from "$lib/theme";
	import { invalidateAll } from "$app/navigation";
	import { fly, fade } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { displayName, firstName, initials } from "$lib/displayName";
	import { hasAnyAdminAccess } from "$lib/adminAccess";

	interface Props {
		user?: RecievedUser | null;
	}

	let { user: serverUser = null }: Props = $props();
	let activeUser = $derived($currentUser ?? serverUser);
	const isDarkTheme = $derived(
		$activeThemeOverride === "dark" ||
			($activeThemeOverride === null &&
				(activeUser?.themePreference === "dark" ||
					(!activeUser && $publicThemePreference === "dark")))
	);
	let mobileMenuOpen = $state(false);
	let themeSwitching = $state(false);
	let menuButton: HTMLButtonElement | undefined = $state();

	type NavLink = { href: string; label: string; match?: string[] };

	const links = $derived.by<NavLink[]>(() => {
		if (!activeUser) {
			return [
				{ href: "/about", label: "About" },
				{
					href: "/resources",
					label: "Resources",
					match: ["/resources", "/studyguides", "/freshman-resources", "/cramcentral"]
				},
				{ href: "/faq", label: "FAQ" }
			];
		}
		const list: NavLink[] = [{ href: "/", label: "Home" }];
		if (activeUser.member) list.push({ href: "/events", label: "Events" });
		list.push({ href: "/tutoring", label: "Tutoring" });
		list.push({
			href: "/resources",
			label: "Resources",
			match: ["/resources", "/studyguides", "/freshman-resources", "/cramcentral"]
		});
		if (activeUser.member) list.push({ href: "/leaderboard", label: "Leaderboard" });
		if (hasAnyAdminAccess(activeUser)) {
			list.push({ href: "/admin", label: "Admin" });
		}
		if (!activeUser.member) {
			// Student accounts keep the public pages close at hand.
			list.push({ href: "/faq", label: "FAQ" }, { href: "/about", label: "About" });
		}
		return list;
	});

	function isActive(link: NavLink) {
		const paths = link.match ?? [link.href];
		return paths.some((href) =>
			href === "/" ? page.url.pathname === href : page.url.pathname.startsWith(href)
		);
	}

	function closeMenus() {
		mobileMenuOpen = false;
	}

	function closeAndRestoreFocus() {
		mobileMenuOpen = false;
		menuButton?.focus();
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && mobileMenuOpen) closeAndRestoreFocus();
	}

	function beginThemeTransition() {
		document.documentElement.classList.add("theme-transitioning");
		window.setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 320);
	}

	function applyThemeImmediately(isDark: boolean) {
		document.documentElement.classList.toggle("dark", isDark);
		document.documentElement.style.colorScheme = isDark ? "dark" : "light";
	}

	function toggleVisitorTheme() {
		const nextPreference = document.documentElement.classList.contains("dark") ? "light" : "dark";
		activeThemeOverride.set(nextPreference);
		applyThemeImmediately(nextPreference === "dark");
		window.localStorage.setItem("arista-public-theme", nextPreference);
		publicThemePreference.set(nextPreference);
	}

	async function toggleTheme() {
		themeSwitching = true;
		window.setTimeout(() => (themeSwitching = false), 320);
		beginThemeTransition();
		if (!activeUser) {
			toggleVisitorTheme();
			return;
		}

		const wasDark = document.documentElement.classList.contains("dark");
		const nextPreference = wasDark ? "light" : "dark";
		activeThemeOverride.set(nextPreference);
		window.localStorage.setItem(accountThemeStorageKey(activeUser.id), nextPreference);
		applyThemeImmediately(!wasDark);
		// Server-rendered sessions do not always seed PocketBase's browser store.
		// Set it explicitly so the header and root theme use the same preference.
		currentUser.set({ ...activeUser, themePreference: nextPreference });
		try {
			const body = new FormData();
			body.set("themePreference", nextPreference);
			const response = await fetch("/settings?/update_theme_preference", {
				method: "POST",
				body,
				headers: { "x-sveltekit-action": "true" }
			});
			if (!response.ok) throw new Error("Could not save theme preference.");
			await invalidateAll();
		} catch {
			// Keep the local preference applied if the account update is temporarily unavailable.
			// A later toggle will retry the server update.
		}
	}

	const themeLabel = $derived(isDarkTheme ? "Switch to light mode" : "Switch to dark mode");
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#snippet themeIcon()}
	<svg viewBox="0 0 24 24" aria-hidden="true">
		{#if isDarkTheme}
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
			/>
		{:else}
			<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
		{/if}
	</svg>
{/snippet}

<header class="site-header">
	<div class="site-header__inner">
		<a class="brand" href="/" aria-label="ARISTA home" onclick={closeMenus}>
			<img class="brand__seal" src="/images/arista-seal.jpg" alt="" width="40" height="40" />
			<span class="brand__name">ARISTA</span>
		</a>

		<nav class="desktop-nav" aria-label="Primary" data-sveltekit-preload-data="hover">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class:active={isActive(link)}
					aria-current={isActive(link) ? "page" : undefined}>{link.label}</a
				>
			{/each}
		</nav>

		<div class="desktop-actions">
			<button
				type="button"
				class="icon-button"
				class:is-switching={themeSwitching}
				onclick={toggleTheme}
				aria-label={themeLabel}
				title={themeLabel}
			>
				{@render themeIcon()}
			</button>
			{#if activeUser}
				<a class="account-link" href="/settings" title="Account settings">
					<span class="avatar" aria-hidden="true">{initials(activeUser)}</span>
					<span class="account-link__name">{firstName(activeUser)}</span>
					<span class="sr-only">Account settings</span>
				</a>
			{:else}
				<a class="btn btn-ghost" href="/login">Sign in</a>
				<a class="btn btn-primary" href="/register">Create account</a>
			{/if}
		</div>

		<button
			bind:this={menuButton}
			type="button"
			class="icon-button menu-toggle"
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-navigation"
			aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true" class:is-open={mobileMenuOpen}>
				<path class="bar bar--top" d="M4 8h16" />
				<path class="bar bar--bottom" d="M4 16h16" />
			</svg>
		</button>
	</div>
</header>

{#if mobileMenuOpen}
	<button
		class="mobile-scrim"
		type="button"
		tabindex="-1"
		aria-label="Close menu"
		onclick={closeAndRestoreFocus}
		transition:fade={{ duration: 180 }}
	></button>
	<div
		class="mobile-menu"
		id="mobile-navigation"
		transition:fly={{ y: -10, duration: 220, easing: cubicOut, opacity: 0 }}
	>
		<nav aria-label="Mobile" data-sveltekit-preload-data="hover">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class:active={isActive(link)}
					aria-current={isActive(link) ? "page" : undefined}
					onclick={closeMenus}>{link.label}</a
				>
			{/each}
		</nav>
		<div class="mobile-menu__footer">
			{#if activeUser}
				<a class="mobile-account" href="/settings" onclick={closeMenus}>
					<span class="avatar" aria-hidden="true">{initials(activeUser)}</span>
					<span><strong>{displayName(activeUser)}</strong><small>Account settings</small></span>
				</a>
			{:else}
				<a class="btn btn-primary" href="/register" onclick={closeMenus}>Create account</a>
				<a class="btn" href="/login" onclick={closeMenus}>Sign in</a>
			{/if}
			<button
				type="button"
				class="icon-button"
				class:is-switching={themeSwitching}
				onclick={toggleTheme}
				aria-label={themeLabel}
				title={themeLabel}
			>
				{@render themeIcon()}
			</button>
		</div>
	</div>
{/if}

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 40;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: saturate(1.4) blur(14px);
		-webkit-backdrop-filter: saturate(1.4) blur(14px);
	}
	.site-header__inner {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 2rem;
		width: min(var(--tool-width), 100% - 2 * var(--gutter));
		min-height: 4.25rem;
		margin: 0 auto;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		min-height: 2.75rem;
		color: var(--ink);
		text-decoration: none;
	}
	.brand__seal {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		object-fit: cover;
	}
	.brand__name {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-variation-settings:
			"SOFT" 100,
			"WONK" 0;
		font-weight: 600;
		letter-spacing: 0.04em;
		line-height: 1;
	}

	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.desktop-nav a {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		padding: 0.4rem 0.85rem;
		border-radius: var(--radius-pill);
		color: var(--muted);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		transition:
			color var(--dur-2) var(--ease-out),
			background-color var(--dur-2) var(--ease-out);
	}
	.desktop-nav a:hover {
		background: var(--wash);
		color: var(--ink);
	}
	.desktop-nav a.active {
		color: var(--ink);
	}
	/* A small flame under the current page: the torch, used once. */
	.desktop-nav a.active::after {
		position: absolute;
		left: 50%;
		bottom: 0.2rem;
		width: 1rem;
		height: 3px;
		border-radius: 3px;
		background: var(--flame);
		content: "";
		transform: translateX(-50%);
	}

	.desktop-actions {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.icon-button {
		display: inline-grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 1px solid transparent;
		border-radius: 50%;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		transition:
			background-color var(--dur-2) var(--ease-out),
			transform var(--dur-1) var(--ease-out);
	}
	.icon-button:hover {
		background: var(--wash);
	}
	.icon-button:active {
		transform: scale(0.94);
	}
	.icon-button svg {
		width: 1.2rem;
		height: 1.2rem;
		fill: none;
		stroke: currentcolor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.75;
	}
	.icon-button.is-switching svg {
		animation: theme-turn var(--dur-4) var(--ease-out);
	}
	@keyframes theme-turn {
		from {
			opacity: 0.2;
			transform: rotate(-60deg) scale(0.8);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.account-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		padding: 0.25rem 0.85rem 0.25rem 0.3rem;
		border-radius: var(--radius-pill);
		color: var(--ink);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		transition: background-color var(--dur-2) var(--ease-out);
	}
	.account-link:hover {
		background: var(--wash);
	}
	.account-link__name {
		max-width: 9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.avatar {
		display: grid;
		flex: 0 0 auto;
		place-items: center;
		width: 2.125rem;
		height: 2.125rem;
		border-radius: 50%;
		background: var(--seal);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
	:global(.dark) .avatar {
		background: var(--action);
		color: var(--on-action);
	}

	.menu-toggle {
		display: none;
	}
	.menu-toggle .bar {
		transform-box: fill-box;
		transform-origin: center;
		transition: transform var(--dur-3) var(--ease-out);
	}
	.menu-toggle svg.is-open .bar--top {
		transform: translateY(4px) rotate(45deg);
	}
	.menu-toggle svg.is-open .bar--bottom {
		transform: translateY(-4px) rotate(-45deg);
	}

	.mobile-scrim,
	.mobile-menu {
		display: none;
	}

	@media (max-width: 860px) {
		.site-header__inner {
			grid-template-columns: 1fr auto;
			gap: 0.75rem;
			min-height: 4rem;
		}
		.desktop-nav,
		.desktop-actions {
			display: none;
		}
		.menu-toggle {
			display: inline-grid;
		}
		.mobile-scrim {
			position: fixed;
			inset: 0;
			z-index: 38;
			display: block;
			border: 0;
			background: rgb(15 22 41 / 28%);
		}
		.mobile-menu {
			position: fixed;
			top: 4.5rem;
			right: var(--gutter);
			left: var(--gutter);
			z-index: 39;
			display: grid;
			gap: 0.75rem;
			max-height: calc(100dvh - 5.5rem);
			padding: 0.75rem;
			overflow: auto;
			border: 1px solid var(--line);
			border-radius: var(--radius-panel);
			background: var(--surface);
			box-shadow: var(--shadow-float);
		}
		.mobile-menu nav {
			display: grid;
		}
		.mobile-menu nav a {
			display: flex;
			align-items: center;
			min-height: 3rem;
			padding: 0.5rem 0.85rem;
			border-radius: var(--radius-field);
			color: var(--ink);
			font-family: var(--font-display);
			font-size: 1.25rem;
			font-weight: 550;
			text-decoration: none;
		}
		.mobile-menu nav a:hover,
		.mobile-menu nav a.active {
			background: var(--wash);
		}
		.mobile-menu nav a.active::before {
			width: 0.45rem;
			height: 0.45rem;
			margin-right: 0.6rem;
			border-radius: 50%;
			background: var(--flame);
			content: "";
		}
		.mobile-menu__footer {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem;
			padding-top: 0.75rem;
			border-top: 1px solid var(--line);
		}
		.mobile-menu__footer .btn {
			flex: 1;
		}
		.mobile-menu__footer .icon-button {
			border-color: var(--line);
		}
		.mobile-account {
			display: flex;
			flex: 1;
			align-items: center;
			gap: 0.65rem;
			min-height: 3rem;
			padding: 0.25rem 0.5rem;
			border-radius: var(--radius-field);
			color: var(--ink);
			text-decoration: none;
		}
		.mobile-account strong,
		.mobile-account small {
			display: block;
		}
		.mobile-account small {
			color: var(--muted);
			font-size: var(--text-sm);
		}
	}
</style>
