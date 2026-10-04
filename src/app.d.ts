// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Error {
		message: string;
	}
	interface Locals {
		pb: import("pocketbase").default;
		user: import("$lib/db_types").RecievedUser | null;
	}
	// interface PageData {}
	// interface Platform {}
}
declare module "@event-calendar/core";
