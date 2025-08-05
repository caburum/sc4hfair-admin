import { authenticate } from '$lib/server/auth';

export const load = async ({ locals }) => {
	authenticate(locals.user, ['admin']);
	return {};
};
