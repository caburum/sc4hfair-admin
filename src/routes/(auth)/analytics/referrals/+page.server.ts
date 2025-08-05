import { analytics } from '$lib/server/db.js';

export const load = async ({ locals, url }) => {
	const now = new Date();
	const since = new Date(
		url.searchParams.get('since') || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
	);

	const referrals = await analytics()
		.collection('requests')
		.aggregate<{
			_id: string;
			count: number;
		}>([
			{
				$match: {
					't': { $gte: since },
					'meta.referrer': { $exists: true, $ne: '' }
				}
			},
			{
				$group: {
					_id: '$meta.referrer',
					count: { $sum: 1 }
				}
			},
			{
				$sort: { _id: 1 }
			}
		])
		.toArray();

	// todo: label={real location name lookup}

	return { referrals };
};
