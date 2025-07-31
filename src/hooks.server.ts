import { connect } from '$lib/db';
import { validateSession } from '$lib/server/auth';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

export const handleError: HandleServerError = async ({ error, message }) => {
	const e = error as Error | undefined;

	return {
		message: e?.message ?? message,
		stack: e?.stack?.replace(/ {4}/g, '\t')
	};
};

const sessionHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session_token') ?? null;

	event.locals.user = await validateSession(token);

	return resolve(event);
};

export const handle = sequence(sessionHandle);

connect()
	.then(() => {
		console.log('connected to database');
	})
	.catch((e) => {
		console.error(e);
	});
