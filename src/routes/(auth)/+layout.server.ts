import { authenticate } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(307, '/login');
	authenticate(locals.user, ['admin']);
};
