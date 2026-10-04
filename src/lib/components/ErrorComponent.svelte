<script lang="ts">
	import type { ValidationErrors } from "sveltekit-superforms";

	interface Props {
		errors: Record<any, any[]> | undefined | ValidationErrors<any> | [any];
	}

	let { errors }: Props = $props();
	let errorEntries = $derived(
		Object.entries(errors ?? {}).filter(([, messages]) =>
			Array.isArray(messages) ? messages.length > 0 : Boolean(messages)
		)
	);
	// Field errors already show under each field; this summary leads with
	// anything that isn't tied to a single field (like a wrong password).
	let formErrors = $derived(
		errorEntries.filter(([key]) => key === "_errors").flatMap(([, m]) => m)
	);
	let fieldErrorCount = $derived(errorEntries.filter(([key]) => key !== "_errors").length);
</script>

{#if errorEntries.length > 0}
	<div class="notice notice--danger form-errors" role="alert" aria-live="assertive">
		{#each formErrors as error}
			<p>{error}</p>
		{/each}
		{#if fieldErrorCount > 0}
			<p>
				{fieldErrorCount === 1
					? "One field needs a fix. It's marked below."
					: `${fieldErrorCount} fields need a fix. They're marked below.`}
			</p>
		{/if}
	</div>
{/if}

<style>
	.form-errors {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 1rem;
		font-weight: 500;
	}
	.form-errors p {
		margin: 0;
	}
</style>
