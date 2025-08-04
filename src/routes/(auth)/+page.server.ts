import { db } from '$lib/db';
import { ObjectId } from 'mongodb';

export const load = async ({ locals }) => {
	const query = await db.collection('users').findOne<{
		_id: ObjectId;
		name: string;
	}>({ _id: new ObjectId(locals.user?.sub) });

	return {
		profile: query ? { ...query, _id: query._id.toString() } : null
	};
};
