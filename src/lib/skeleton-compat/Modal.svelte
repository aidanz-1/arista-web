<script lang="ts">
	import { activeModal, type ModalSettings } from "./index";

	let dialog: HTMLDialogElement | undefined = $state();
	let current = $state<ModalSettings | null>(null);

	// Destructive confirmations are named by their verb ("Delete event") so the
	// button says exactly what will happen.
	const isDanger = $derived(
		Boolean(current?.danger ?? /^(delete|remove)/i.test(current?.title ?? ""))
	);
	const confirmLabel = $derived(
		current?.confirmLabel ??
			(isDanger ? (current?.title?.replace(/\?$/, "") ?? "Delete") : "Confirm")
	);

	$effect(() => {
		return activeModal.subscribe((settings) => {
			current = settings;
			if (settings && dialog && !dialog.open) dialog.showModal();
		});
	});

	function close(result: boolean) {
		const settings = current;
		dialog?.close();
		activeModal.set(null);
		settings?.response?.(result);
	}
</script>

<dialog
	bind:this={dialog}
	class="confirm"
	aria-labelledby="confirm-title"
	aria-describedby={current?.body ? "confirm-body" : undefined}
	oncancel={(event) => {
		event.preventDefault();
		close(false);
	}}
	onclick={(event) => {
		if (event.target === dialog) close(false);
	}}
>
	{#if current}
		<h2 id="confirm-title">{current.title ?? "Are you sure?"}</h2>
		{#if current.body}<p id="confirm-body">{current.body}</p>{/if}
		<div class="confirm__actions">
			<button type="button" class="btn btn-ghost" onclick={() => close(false)}>Cancel</button>
			<button
				type="button"
				class="btn"
				class:btn-danger={isDanger}
				class:btn-primary={!isDanger}
				onclick={() => close(true)}>{confirmLabel}</button
			>
		</div>
	{/if}
</dialog>

<style>
	.confirm {
		width: min(28rem, calc(100% - 2rem));
		margin: auto;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-float);
	}
	.confirm[open] {
		animation: confirm-in var(--dur-3) var(--ease-out);
	}
	.confirm::backdrop {
		background: rgb(15 22 41 / 40%);
		animation: backdrop-in var(--dur-3) var(--ease-out);
	}
	@keyframes confirm-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}
	@keyframes backdrop-in {
		from {
			opacity: 0;
		}
	}
	h2 {
		font-size: var(--text-lg);
	}
	p {
		margin: 0.6rem 0 0;
		color: var(--muted);
		line-height: 1.55;
		white-space: pre-line;
	}
	.confirm__actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
</style>
