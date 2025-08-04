import { error, redirect } from '@sveltejs/kit';
import { decodeJwt } from 'jose';

export const GET = async ({ cookies, url }) => {
	const final_redirect = url.searchParams.get('redirect');
	const session_token = url.searchParams.get('token');

	if (!session_token || !final_redirect || url.origin !== new URL(final_redirect).origin) {
		return error(400, 'invalid parameters');
	}

	const exp = decodeJwt(session_token).exp;

	cookies.set('session_token', session_token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		expires: exp ? new Date(exp * 1000) : undefined
	});

	return redirect(307, final_redirect);
};
