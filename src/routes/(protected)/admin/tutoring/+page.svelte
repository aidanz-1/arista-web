<script lang="ts">
	import { flagSource } from "$lib/flagSource";
	import type { PageData } from "./$types";
	import AdminSubnav from "$lib/components/AdminSubnav.svelte";

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	const flagResult = $derived((page.form ?? {}) as { flagError?: string; flagId?: string });

	function when(value: string | Date | undefined | null) {
		if (!value) return "Not yet";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "Not yet";
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit"
		});
	}

	function pageHref(page: number) {
		const params = new URLSearchParams();
		if (data.filters.search) params.set("search", data.filters.search);
		if (data.filters.date) params.set("date", data.filters.date);
		if (data.filters.review !== "all") params.set("review", data.filters.review);
		params.set("page", String(page));
		return `/admin/tutoring?${params}`;
	}
</script>

<svelte:head><title>Tutoring review | ARISTA admin</title></svelte:head>

<main class="page page--tool admin-tutoring">
	<header class="page-header">
		<div>
			<h1>Admin</h1>
		</div>
	</header>
	<AdminSubnav />

	<form method="GET" class="filters">
		<label class="filters__search">
			<span>Search</span>
			<input
				name="search"
				type="search"
				value={data.filters.search}
				placeholder="Tutor, tutee, or class"
			/>
		</label>
		<label>
			<span>Date</span>
			<input name="date" type="date" value={data.filters.date} />
		</label>
		<label>
			<span>Show</span>
			<select name="review" value={data.filters.review}>
				<option value="all">All sessions</option>
				<option value="warnings">Flagged</option>
				<option value="awaiting-proof">Waiting for proof</option>
				<option value="proofs">Proof uploaded</option>
			</select>
		</label>
		<button type="submit" class="btn btn-primary">Apply filters</button>
	</form>

	<section aria-label="Tutoring sessions" class="results">
		<div class="results__bar">
			<p>
				<strong>{data.pagination.totalItems.toLocaleString()}</strong>
				session{data.pagination.totalItems === 1
					? ""
					: "s"}{#if data.pagination.totalPages > 1}<span class="muted"
						>, page {data.pagination.page} of {data.pagination.totalPages}</span
					>{/if}
			</p>
			{#if data.filters.review !== "warnings"}
				<a class="text-link" href="/admin/tutoring?review=warnings">Show flagged only</a>
			{/if}
		</div>

		{#if data.sessions.length === 0}
			<div class="empty-state">
				<h2>No sessions match these filters.</h2>
				<p>Try a different date or search.</p>
			</div>
		{:else}
			<ul class="sessions">
				{#each data.sessions as session (session.id)}
					{@const req = session.expand?.tutoringRequest}
					<li class="panel" class:is-flagged={session.durationWarning}>
						<div class="sessions__top">
							<div>
								<h2>
									{#if data.canViewPeople}
										<a class="text-link" href="/admin/view_user/{session.tutor}"
											>{session.tutor_name}</a
										>
										<span>with</span>
										<a class="text-link" href="/admin/view_user/{session.tutee}"
											>{session.tutee_name}</a
										>
									{:else}
										{session.tutor_name} <span>with</span> {session.tutee_name}
									{/if}
								</h2>
								<p class="muted">
									{[req?.class ?? "Tutoring session", req?.subject, req?.topic]
										.filter(Boolean)
										.join(", ")}
								</p>
							</div>
							<div class="sessions__badges">
								<a class="btn btn-sm" href="/admin/tutoring/{session.id}">Details and chat</a>
								{#if session.durationWarning}<span class="badge badge--danger">Flagged</span>{/if}
								{#if session.isComplete}
									<span class="badge badge--success">Complete</span>
								{:else if session.tuteeMarkedComplete}
									<span class="badge badge--warning">Waiting for proof</span>
								{:else}
									<span class="badge">Active</span>
								{/if}
							</div>
						</div>
						{#if session.durationWarning}
							<p class="notice notice--danger">
								<span class="flag-source">{flagSource(session, session.flagged_by_name)}</span>
								{session.durationWarningReason}
							</p>
						{/if}
						<dl class="sessions__facts">
							<div>
								<dt>Request sent</dt>
								<dd>{when(req?.created)}</dd>
							</div>
							<div>
								<dt>Request accepted</dt>
								<dd>{when(session.created)}</dd>
							</div>
							<div>
								<dt>Tutee finished</dt>
								<dd>{when(session.dateCompleted)}</dd>
							</div>
							<div>
								<dt>Hours logged</dt>
								<dd>{session.durationInHours ? `${session.durationInHours}` : "Not yet"}</dd>
							</div>
							<div>
								<dt>Proof</dt>
								<dd>
									{#if session.verificationImage}
										<a
											class="text-link"
											href={`/tutoring/proof/${session.id}`}
											target="_blank"
											rel="noreferrer">View proof</a
										>
									{:else}
										None yet
									{/if}
								</dd>
							</div>
						</dl>
						<form method="POST" action="?/set_flag" use:enhance class="flag">
							<input type="hidden" name="id" value={session.id} />
							{#if session.durationWarning}
								<input type="hidden" name="flagged" value="false" />
								<button type="submit" class="btn btn-sm">Clear flag</button>
							{:else}
								<input type="hidden" name="flagged" value="true" />
								<label class="flag__reason">
									<span class="sr-only">Reason for flagging</span>
									<input name="reason" placeholder="Reason to flag this session" maxlength="256" />
								</label>
								<button type="submit" class="btn btn-sm">Flag for review</button>
							{/if}
							{#if flagResult.flagId === session.id && flagResult.flagError}
								<span class="field-error">{flagResult.flagError}</span>
							{/if}
						</form>
					</li>
				{/each}
			</ul>
		{/if}

		{#if data.pagination.totalPages > 1}
			<nav class="pager" aria-label="Session pages">
				<a
					class="btn btn-sm"
					href={pageHref(Math.max(1, data.pagination.page - 1))}
					aria-disabled={data.pagination.page <= 1}
					class:is-disabled={data.pagination.page <= 1}>Previous</a
				>
				<span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
				<a
					class="btn btn-sm"
					href={pageHref(Math.min(data.pagination.totalPages, data.pagination.page + 1))}
					aria-disabled={data.pagination.page >= data.pagination.totalPages}
					class:is-disabled={data.pagination.page >= data.pagination.totalPages}>Next</a
				>
			</nav>
		{/if}
	</section>
</main>

<style>
	.filters {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 11rem 12rem auto;
		align-items: end;
		gap: 0.75rem;
	}
	.filters label {
		display: grid;
		gap: 0.4rem;
	}
	.filters label span {
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.results {
		margin-top: 1.5rem;
	}
	.results__bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.85rem;
	}
	.results__bar p {
		margin: 0;
	}
	.sessions {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sessions li {
		display: grid;
		gap: 1rem;
	}
	.sessions li.is-flagged {
		border-color: color-mix(in srgb, var(--danger) 40%, var(--line));
	}
	.sessions__top {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.sessions h2 {
		font-size: var(--text-lg);
	}
	.sessions h2 span {
		color: var(--muted);
		font-family: var(--font-text);
		font-size: var(--text-base);
		font-weight: 400;
	}
	.sessions__top p {
		margin: 0.25rem 0 0;
		font-size: var(--text-sm);
	}
	.sessions__badges {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.sessions .notice {
		margin: 0;
	}
	.sessions__facts {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 0;
		padding-top: 0.85rem;
		border-top: 1px solid var(--line);
	}
	.sessions__facts dt {
		color: var(--muted);
		font-size: var(--text-xs);
		font-weight: 600;
	}
	.sessions__facts dd {
		margin: 0.15rem 0 0;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	.flag {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.flag__reason {
		flex: 1 1 16rem;
	}
	.flag__reason input {
		min-height: 2.25rem !important;
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1rem;
		color: var(--muted);
		font-size: var(--text-sm);
	}
	.pager .is-disabled {
		opacity: 0.4;
		pointer-events: none;
	}
	@media (max-width: 860px) {
		.filters {
			grid-template-columns: 1fr 1fr;
		}
		.filters__search {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 560px) {
		.sessions__facts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.flag-source {
		display: block;
		margin-bottom: 0.2rem;
		font-size: var(--text-xs);
		font-weight: 700;
	}
</style>
