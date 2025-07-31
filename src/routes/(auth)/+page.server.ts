import { db } from '$lib/db';
import { ObjectId } from 'mongodb';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const query = await db.collection('users').findOne({ _id: new ObjectId(locals.user?.sub) });

	return {
		profile: query ? { ...query, _id: query._id.toString() } : null
	};
};
