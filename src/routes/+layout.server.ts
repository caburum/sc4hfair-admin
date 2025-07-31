import type { LayoutServerLoad } from './$types';

/** this runs for all routes */
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
	};
};
