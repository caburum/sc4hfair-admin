import type { User } from '$lib/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			stack?: string;
		}
		interface Locals {
			/** only exists if cryptographically verified */
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] };
}

export {};
