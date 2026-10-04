import { writable } from "svelte/store";

export type PublicThemePreference = "light" | "dark";

// The currently applied palette. This keeps the server-rendered account, client store,
// and navbar control synchronized while a preference update is in flight.
export const activeThemeOverride = writable<PublicThemePreference | null>(null);

export function accountThemeStorageKey(userId: string) {
	return `arista-account-theme-${userId}`;
}

// Visitors do not have an account preference, so keep their optional choice local.
export const publicThemePreference = writable<PublicThemePreference>("light");
