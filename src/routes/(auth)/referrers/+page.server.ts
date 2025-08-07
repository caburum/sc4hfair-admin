import type { Role } from '$lib/auth';
import { currentYear } from '$lib/commonData.js';
import { authenticate } from '$lib/server/auth';
import { analytics } from '$lib/server/db.js';
import type { Referrer } from '$lib/types';
import { fail } from '@sveltejs/kit';

const PERMS: Role[] = ['analytics'];

export const load = async ({ locals, url }) => {
	authenticate(locals.user, PERMS);

	const referrers = await analytics()
		.collection('referrers')
		.find<Referrer>({ year: currentYear }, { projection: { _id: 0, year: 0 } })
		.toArray();

	return { referrers };
};

export const actions = {
	create: async ({ request, locals }) => {
		authenticate(locals.user, PERMS);

		const data = await request.formData();
		const id = data.get('id')?.toString().trim();
		const name = data.get('name')?.toString().trim();
		const latitude = Number(data.get('latitude')),
			longitude = Number(data.get('longitude')),
			accuracy = Number(data.get('accuracy'));

		if (!id) return fail(400, { message: 'missing required fields' });

		const entry = await analytics()
			.collection('referrers')
			.findOneAndReplace(
				{ id, year: currentYear },
				{
					id,
					name,
					location: {
						latitude,
						longitude,
						accuracy
					},
					year: currentYear
				},
				{ upsert: true, returnDocument: 'after', projection: { _id: 0 } }
			);

		if (!entry) return fail(500, { message: 'failed to create referrer' });

		return { message: `referrer ${id} created`, entry };
	}
};
