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
	// Carry the destination into registration so new students land where they meant to go.
	let registerHref = $derived.by(() => {
		const redirectTo = page.url.searchParams.get("redirectTo");
		return redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register";
	});

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const formObj = superForm(untrack(() => data.form));
	const { errors } = formObj;
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in | ARISTA</title></svelte:head>

<AuthLayout title="Welcome back.">
	{#if message}
		<p class="notice">{message}</p>
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

		<div class="password-field">
			<InputField
				form={formObj}
				field="password"
				label="Password"
				type="password"
				autocomplete="current-password"
			/>
			<a href="/forgot-password" class="text-link forgot">Forgot password?</a>
		</div>

		<button type="submit" class="btn btn-primary btn-lg" disabled={submitting}>
			{submitting ? "Signing in…" : "Sign in"}
		</button>
		<p class="auth-alt">
			New to ARISTA? <a href={registerHref} class="text-link">Create an account</a>
		</p>
	</form>
</AuthLayout>

<style>
	.password-field {
		position: relative;
	}
	.forgot {
		position: absolute;
		top: 0;
		right: 0;
		font-size: var(--text-sm);
	}
	form .btn-lg {
		margin-top: 0.4rem;
	}
	.notice {
		margin: 2rem 0 0;
	}
</style>
