import { redirect } from '@sveltejs/kit';

export const POST = async ({ cookies, url }) => {
	cookies.set('session_token', '', {
		path: '/',
		expires: new Date(0)
	});

	return redirect(303, '/');
};
