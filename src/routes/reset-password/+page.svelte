<script lang="ts">
	import { untrack } from "svelte";
	import { superForm } from "sveltekit-superforms";
	import type { PageData } from "./$types";
	import ErrorComponent from "$lib/components/ErrorComponent.svelte";
	import InputField from "$lib/components/InputField.svelte";
	import AuthLayout from "$lib/components/AuthLayout.svelte";

	let { data }: { data: PageData } = $props();
	const formObj = superForm(untrack(() => data.form));
	const { form, errors, submitting, enhance } = formObj;
</script>

<svelte:head><title>Choose a new password | ARISTA</title></svelte:head>

<AuthLayout
	title="Choose a new password."
	description="Pick something you haven't used for ARISTA before. You'll sign in with it next."
>
	{#if !data.hasToken}
		<p class="notice notice--warning">
			This link is missing its reset code. Open the link from your email again, or request a new
			one.
		</p>
		<p class="auth-alt">
			<a href="/forgot-password" class="btn btn-primary">Request a new link</a>
		</p>
	{:else}
		<ErrorComponent errors={$errors} />
		<form method="POST" use:enhance>
			<input type="hidden" name="token" value={$form.token} />
			<InputField
				form={formObj}
				field="password"
				label="New password"
				type="password"
				autocomplete="new-password"
			/>
			<InputField
				form={formObj}
				field="passwordConfirm"
				label="Confirm new password"
				type="password"
				autocomplete="new-password"
			/>
			<button type="submit" class="btn btn-primary btn-lg" disabled={$submitting}>
				{$submitting ? "Saving…" : "Save new password"}
			</button>
			<p class="auth-alt">
				Link expired? <a href="/forgot-password" class="text-link">Request a new one</a>
			</p>
		</form>
	{/if}
</AuthLayout>

<style>
	form .btn-lg {
		margin-top: 0.4rem;
	}
	.notice {
		margin: 2rem 0 0;
	}
</style>
