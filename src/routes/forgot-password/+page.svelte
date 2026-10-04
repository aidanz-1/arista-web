<script lang="ts">
	import { untrack } from "svelte";
	import { applyAction, enhance } from "$app/forms";
	import { superForm } from "sveltekit-superforms";
	import type { PageData } from "./$types";
	import ErrorComponent from "$lib/components/ErrorComponent.svelte";
	import InputField from "$lib/components/InputField.svelte";
	import AuthLayout from "$lib/components/AuthLayout.svelte";
	import { page } from "$app/state";

	let message: string = $derived(page.url.searchParams.get("message") ?? "");

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const formObj = superForm(untrack(() => data.form));
	const { errors } = formObj;
	let submitting = $state(false);
</script>

<svelte:head><title>Reset password | ARISTA</title></svelte:head>

<AuthLayout
	title="Reset your password."
	description="Enter the email on your ARISTA account and we'll send you a link to choose a new password."
>
	{#if message}
		<p class="notice notice--success">{message}</p>
	{/if}
	<ErrorComponent errors={$errors} />

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ result }) => {
				await applyAction(result);
				submitting = false;
			};
		}}
	>
		<InputField
			form={formObj}
			field="email"
			label="Email"
			placeholder="you@stuy.edu"
			type="email"
			autocomplete="email"
		/>

		<button type="submit" class="btn btn-primary btn-lg" disabled={submitting}>
			{submitting ? "Sending…" : "Send reset link"}
		</button>
		<p class="auth-alt"><a href="/login" class="text-link">Back to sign in</a></p>
	</form>
</AuthLayout>

<style>
	form .btn-lg {
		margin-top: 0.4rem;
	}
	.notice {
		margin: 2rem 0 0;
	}
</style>
