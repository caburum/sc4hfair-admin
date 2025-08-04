/** this runs for all routes */
export const load = async ({ locals }) => {
	return {
		user: locals.user
	};
};
