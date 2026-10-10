<script lang="ts">
	import { flagSource } from "$lib/flagSource";
	import FraudReview from "$lib/components/FraudReview.svelte";
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import AdminSubnav from "$lib/components/AdminSubnav.svelte";
	import { roundCredits } from "$lib/calculateCredits";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	const flagResult = $derived((page.form ?? {}) as { flagError?: string });
	const session = $derived(data.session);
	const req = $derived(data.session.expand?.tutoringRequest);

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
</script>

<svelte:head><title>{data.tutor.name} with {data.tutee.name} | ARISTA admin</title></svelte:head>

<main class="page page--tool session-detail">
	<header class="page-header"><div><h1>Admin</h1></div></header>
	<AdminSubnav />

	<a class="back" href="/admin/tutoring">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
		Tutoring review
	</a>

	<section class="panel detail" class:is-flagged={session.durationWarning}>
		<div class="detail__top">
			<div>
				<h2>
					{#snippet who(person: { id: string; name: string })}
						{#if data.canViewPeople}
							<a class="text-link" href="/admin/view_user/{person.id}">{person.name}</a>
						{:else}
							{person.name}
						{/if}
					{/snippet}
					{@render who(data.tutor)} <span>with</span>
					{@render who(data.tutee)}
				</h2>
				<p class="muted">
					{[req?.class ?? "Tutoring session", req?.subject, req?.topic].filter(Boolean).join(", ")}
				</p>
			</div>
			<div class="detail__badges">
				{#if session.fraud}<span class="badge badge--danger">Fraudulent</span>
				{:else if session.durationWarning}<span class="badge badge--danger">Flagged</span>{/if}
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
				<span class="flag-source">{flagSource(session, data.flaggedByName)}</span>
				{session.durationWarningReason}
			</p>
		{/if}

		<dl class="facts">
			<div>
				<dt>Tutor email</dt>
				<dd>{data.tutor.email || "Not shared"}</dd>
			</div>
			<div>
				<dt>Tutee email</dt>
				<dd>{data.tutee.email || "Not shared"}</dd>
			</div>
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
				<dt>Credited</dt>
				<dd>{data.creditedAmount ? roundCredits(data.creditedAmount) : "Not yet"}</dd>
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

		{#if req?.teacher || req?.general_time}
			<dl class="facts facts--wide">
				{#if req?.teacher}<div>
						<dt>Teacher</dt>
						<dd>{req.teacher}</dd>
					</div>{/if}
				{#if req?.general_time}<div>
						<dt>When they're free</dt>
						<dd>{req.general_time}</dd>
					</div>{/if}
			</dl>
		{/if}

		{#if session.verificationImage}
			<a class="proof" href={`/tutoring/proof/${session.id}`} target="_blank" rel="noreferrer">
				<img
					src={`/tutoring/proof/${session.id}`}
					alt="Proof uploaded for this session"
					loading="lazy"
				/>
			</a>
		{/if}

		{#if !session.fraud}
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
				{#if flagResult.flagError}<span class="field-error">{flagResult.flagError}</span>{/if}
			</form>
		{/if}
		<FraudReview
			canMark={data.isAdmin}
			{session}
			fraudByName={data.fraudByName}
			tutorName={data.tutor.name}
		/>
	</section>

	<section class="panel chat" aria-labelledby="chat-title">
		<h2 id="chat-title" class="section-title">Chat history</h2>
		{#if data.messages.length === 0}
			<p class="muted">No messages in this session.</p>
		{:else}
			<ol class="chat__list">
				{#each data.messages as message (message.id)}
					{@const fromTutor = message.sender === data.tutor.id}
					<li class:from-tutor={fromTutor}>
						<p class="chat__meta">
							<strong
								>{fromTutor
									? data.tutor.name
									: message.sender === data.tutee.id
										? data.tutee.name
										: "Someone else"}</strong
							>
							<span class="muted">{when(message.sentAt)}</span>
						</p>
						<p class="chat__body">{message.body}</p>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
</main>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-height: 2.75rem;
		margin: 0.5rem 0 0.75rem -0.4rem;
		padding: 0 0.6rem 0 0.4rem;
		border-radius: var(--radius-pill);
		color: var(--muted);
		font-size: var(--text-sm);
		font-weight: 600;
		text-decoration: none;
	}
	.back:hover {
		background: var(--wash);
		color: var(--ink);
	}
	.back svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentcolor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	.detail {
		display: grid;
		gap: 1rem;
	}
	.detail.is-flagged {
		border-color: color-mix(in srgb, var(--danger) 40%, var(--line));
	}
	.detail__top {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		justify-content: space-between;
		gap: 0.75rem;
	}
	.detail h2 {
		font-size: var(--text-xl);
	}
	.detail h2 span {
		color: var(--muted);
		font-family: var(--font-text);
		font-size: var(--text-base);
		font-weight: 400;
	}
	.detail__top p {
		margin: 0.25rem 0 0;
	}
	.detail__badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.detail .notice {
		margin: 0;
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.85rem;
		margin: 0;
		padding-top: 0.85rem;
		border-top: 1px solid var(--line);
	}
	.facts dt {
		color: var(--muted);
		font-size: var(--text-xs);
		font-weight: 600;
	}
	.facts dd {
		margin: 0.15rem 0 0;
		font-weight: 500;
		overflow-wrap: anywhere;
	}
	.facts--wide {
		grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
	}
	.proof img {
		display: block;
		max-width: min(100%, 28rem);
		max-height: 24rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		object-fit: contain;
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
	.chat {
		margin-top: 1rem;
	}
	.chat__list {
		display: grid;
		gap: 0.6rem;
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
	}
	.chat__list li {
		max-width: min(36rem, 90%);
		padding: 0.6rem 0.85rem;
		border-radius: 14px;
		background: var(--wash);
	}
	.chat__list li.from-tutor {
		justify-self: end;
		background: color-mix(in srgb, var(--flame) 14%, var(--surface));
	}
	.chat__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 0.2rem;
		font-size: var(--text-xs);
	}
	.chat__body {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	@media (max-width: 720px) {
		.facts {
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
