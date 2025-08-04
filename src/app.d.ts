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

	type Logger = (message: string, ...data: any[]) => void;
}

declare module '$env/static/private' {
	export const VERCEL_GIT_COMMIT_REF: string | undefined;
	export const VERCEL_GIT_COMMIT_SHA: string | undefined;
	export const VERCEL_DEPLOYMENT_ID: string | undefined;
}

export {};
