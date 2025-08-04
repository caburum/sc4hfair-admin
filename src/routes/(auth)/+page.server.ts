import {
	VERCEL_DEPLOYMENT_ID,
	VERCEL_GIT_COMMIT_REF,
	VERCEL_GIT_COMMIT_SHA
} from '$env/static/private';
import { db } from '$lib/server/db';
import { ObjectId } from 'mongodb';

export const load = async ({ locals }) => {
	const query = await db()
		.collection('users')
		.findOne<{
			_id: ObjectId;
			name: string;
		}>({ _id: new ObjectId(locals.user?.sub) });

	return {
		profile: query ? { ...query, _id: query._id.toString() } : null,

		branch: VERCEL_GIT_COMMIT_REF,
		commit: VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
		deployment: VERCEL_DEPLOYMENT_ID
	};
};
