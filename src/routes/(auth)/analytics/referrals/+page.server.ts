import { analytics } from '$lib/server/db.js';

export const load = async ({ url }) => {
	const now = new Date();
	const since = new Date(
		url.searchParams.get('since') || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
	);
	const until = new Date(since.getFullYear(), 11, 31, 23, 59, 59, 999);

	const referrals = await analytics()
		.collection('requests')
		.aggregate<{
			_id: string;
			count: number;
			name?: string;
			location?: { longitude: number; latitude: number; accuracy: number };
		}>([
			{
				$match: {
					't': { $gte: since, $lte: until },
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
				$lookup: {
					from: 'referrers',
					localField: '_id',
					foreignField: 'id',
					as: 'referrer',
					pipeline: [
						{ $match: { year: since.getFullYear() } },
						{ $project: { _id: 0, id: 1, name: 1, location: 1 } }
					]
				}
			},
			{
				$replaceRoot: {
					newRoot: {
						$mergeObjects: ['$$ROOT', { $arrayElemAt: ['$referrer', 0] }]
					}
				}
			},
			{
				$unset: ['referrer', 'id']
			},
			{
				$sort: { _id: 1 }
			}
		])
		.toArray();

	return { referrals };
};
