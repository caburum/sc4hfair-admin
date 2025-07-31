import { sequence } from '@sveltejs/kit/hooks';

import { connect } from '$lib/db';
import { validateSession } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

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
