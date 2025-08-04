import { isPermitted, type Role } from '$lib/auth';
import { authenticate } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { ObjectId, type UpdateFilter } from 'mongodb';

export type DbUser = { id: string; name?: string; email?: string; roles?: string[] };
export type Change = { user: DbUser; role: Role; action: 'add' | 'remove' };

const level: Role[] = ['admin']; // in future, could allow lower roles access to promote others

export const load = async ({ locals }) => {
	authenticate(locals.user, level);

	const users = await db()
		.collection('users')
		.aggregate<DbUser>([
			{
				$project: {
					_id: 0,
					id: { $toString: '$_id' },
					name: 1,
					email: 1,
					roles: 1
				}
			},
			{
				$sort: { name: 1 }
			}
		])
		.toArray();

	return { users };
};

export const actions = {
	apply: async ({ locals, request }) => {
		authenticate(locals.user, level);

		const data = await request.formData();
		const changes = JSON.parse(data.get('changes') as string) as Change[];

		let failed = false;

		const bulkOps = changes
			.map((change) => {
				if (!isPermitted(locals.user!.roles, [change.role])) failed = true;
				return {
					updateOne: {
						filter: { _id: new ObjectId(change.user.id) },
						update: (change.action === 'add' ?
							{ $addToSet: { roles: change.role } }
						:	{ $pull: { roles: change.role } }) as UpdateFilter<DbUser>
					}
				};
			})
			.filter(Boolean);

		if (failed) return fail(403);

		let status = true;
		if (bulkOps.length > 0) {
			const { ok } = await db()
				.collection('users')
				.bulkWrite(bulkOps as any);
			status = Boolean(ok);
		}

		return { status };
	}
};
