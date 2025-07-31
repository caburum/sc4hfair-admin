import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, url }) => {
	cookies.set('session_token', '', {
		path: '/',
		expires: new Date(0)
	});

	return redirect(303, '/');
};
