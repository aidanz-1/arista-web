import { env } from "$env/dynamic/public";
import PocketBase from "pocketbase";
import { writable } from "svelte/store";
import type { RecievedUser } from "./db_types";

export const pb = new PocketBase(env.PUBLIC_POCKETBASE_URL || "https://db.stuyarista.org");

export const currentUser = writable<RecievedUser | undefined>(pb.authStore.model as RecievedUser);

pb.authStore.onChange(() => {
	currentUser.set(pb.authStore.model as RecievedUser);
});
