import { authenticate } from '$lib/server/auth';
import type { LayoutServerLoad } from '../$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	authenticate(locals.user, ['data']);
	return {};
};
