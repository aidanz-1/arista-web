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
	let loginHref = $derived.by(() => {
		const redirectTo = page.url.searchParams.get("redirectTo");
		return redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
	});

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const formObj = superForm(untrack(() => data.form));
	const { errors, form } = formObj;

	// Homerooms are a digit and two letters (5JA). Format as the student types.
	$effect(() => {
		const raw = String($form.homeroom ?? "");
		const digit = raw.match(/[0-9]/)?.[0] ?? "";
		const letters = raw
			.slice(raw.indexOf(digit) + 1 || 0)
			.replace(/[^a-zA-Z]/g, "")
			.toUpperCase()
			.slice(0, 2);
		const formatted = digit ? digit + letters : "";
		if (formatted !== raw) $form.homeroom = formatted;
	});
	let submitting = $state(false);
</script>

<svelte:head><title>Create an account | ARISTA</title></svelte:head>

<AuthLayout title="Create your account.">
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
		<InputField form={formObj} field="name" label="Full name" autocomplete="name" />
		<InputField
			form={formObj}
			field="preferredName"
			label="Preferred first name (optional)"
			autocomplete="given-name"
		/>

		<div class="field-row">
			<InputField
				form={formObj}
				field="homeroom"
				label="Homeroom"
				placeholder="5JA"
				maxlength="3"
				autocapitalize="characters"
				autocomplete="off"
			/>
			<InputField
				form={formObj}
				field="graduationYear"
				label="Graduation year"
				inputmode="numeric"
				placeholder={String(new Date().getFullYear() + 3)}
			/>
		</div>
		<InputField
			form={formObj}
			field="osis"
			label="OSIS number"
			hint="The 9-digit number on your student ID."
			inputmode="numeric"
			maxlength="9"
			pattern="[0-9]{9}"
		/>

		<InputField
			form={formObj}
			field="email"
			label="Email"
			placeholder="you@stuy.edu"
			type="email"
			autocomplete="email"
		/>

		<InputField
			form={formObj}
			field="password"
			label="Password"
			hint="At least 6 characters."
			type="password"
			autocomplete="new-password"
		/>

		<InputField
			form={formObj}
			field="passwordConfirm"
			label="Confirm password"
			type="password"
			autocomplete="new-password"
		/>

		<button type="submit" class="btn btn-primary btn-lg" disabled={submitting}>
			{submitting ? "Creating account…" : "Create account"}
		</button>
		<p class="auth-alt">
			Already have an account? <a href={loginHref} class="text-link">Sign in</a>
		</p>
	</form>
</AuthLayout>

<style>
	.field-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	form .btn-lg {
		margin-top: 0.4rem;
	}
	.notice {
		margin: 2rem 0 0;
	}
	@media (max-width: 420px) {
		.field-row {
			grid-template-columns: 1fr;
		}
	}
</style>
