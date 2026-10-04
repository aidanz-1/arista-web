<script lang="ts">
	import { page } from "$app/state";

	import { currentUser } from "$lib/pocketbase";
	import { ADMIN_SECTION_INFO, accessibleSections, isAdmin } from "$lib/adminAccess";

	// Only show the sections this person can open; Permissions is admins-only.
	const sections = $derived([
		...accessibleSections($currentUser).map((section) => ADMIN_SECTION_INFO[section]),
		...(isAdmin($currentUser) ? [{ href: "/admin/permissions", label: "Permissions" }] : [])
	]);

	function isActive(href: string) {
		return href === "/admin" ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}
</script>

<nav class="admin-subnav" aria-label="Admin sections">
	{#each sections as section}
		<a
			class:active={isActive(section.href)}
			aria-current={isActive(section.href) ? "page" : undefined}
			href={section.href}>{section.label}</a
		>
	{/each}
</nav>

<style>
	.admin-subnav {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1.75rem;
		overflow-x: auto;
		border-bottom: 1px solid var(--line);
	}
	.admin-subnav a {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0.5rem 0.9rem;
		color: var(--muted);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition: color var(--dur-2) var(--ease-out);
	}
	.admin-subnav a:hover,
	.admin-subnav a.active {
		color: var(--ink);
	}
	.admin-subnav a.active::after {
		position: absolute;
		right: 0.9rem;
		bottom: -1px;
		left: 0.9rem;
		height: 2px;
		border-radius: 2px;
		background: var(--flame);
		content: "";
	}
</style>
