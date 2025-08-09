import { analytics } from '$lib/server/db.js';

export const load = async ({ url }) => {
	const now = new Date();
	const since = new Date(
		url.searchParams.get('since') || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
	);
	const year = since.getFullYear();
	const until = new Date(since.getFullYear(), 11, 31, 23, 59, 59, 999);

	const referrals = await analytics()
		.collection('referrers')
		.aggregate<{
			id: string;
			count: number;
			name?: string;
			location?: { longitude: number; latitude: number; accuracy: number };
		}>([
			// STAGE 1: Create a master list of all unique referrer IDs from BOTH collections.
			{
				// Start with all referrers for the given year.
				$match: { year }
			},
			{
				// Project to a common field name.
				$project: {
					_id: 0,
					referrerId: '$id'
				}
			},
			{
				// Union this list with all unique referrers from the requests collection.
				$unionWith: {
					coll: 'requests',
					pipeline: [
						{
							$match: {
								't': { $gte: since, $lte: until },
								'meta.referrer': { $exists: true, $ne: '' }
							}
						},
						{ $group: { _id: '$meta.referrer' } },
						{ $project: { _id: 0, referrerId: '$_id' } }
					]
				}
			},
			{
				// De-duplicate the combined list to get a unique set of all possible IDs.
				$group: {
					_id: '$referrerId'
				}
			},

			// STAGE 2: For each unique ID, look up its details and count.
			{
				// Look up the details (name, location) from the 'referrers' collection.
				// This is a LEFT JOIN, so if a referrer exists in `requests` but not `referrers`,
				// this will produce an empty array.
				$lookup: {
					from: 'referrers',
					localField: '_id',
					foreignField: 'id',
					as: 'referrerDetails',
					pipeline: [{ $match: { year } }, { $project: { _id: 0, name: 1, location: 1 } }]
				}
			},
			{
				// Look up the request count for the given time period.
				// This is also a LEFT JOIN.
				$lookup: {
					from: 'requests',
					let: { referrerId: '$_id' },
					pipeline: [
						{
							$match: {
								t: { $gte: since, $lte: until },
								$expr: { $eq: ['$meta.referrer', '$$referrerId'] }
							}
						},
						{ $count: 'total' }
					],
					as: 'requestCountInfo'
				}
			},

			// STAGE 3: Reshape the data into the final desired format.
			{
				$project: {
					_id: 0,
					id: '$_id',
					// Safely get the name and location, which will be null if not found.
					name: { $arrayElemAt: ['$referrerDetails.name', 0] },
					location: { $arrayElemAt: ['$referrerDetails.location', 0] },
					// If requestCountInfo is empty, the count is 0. Otherwise, get the total.
					count: { $ifNull: [{ $arrayElemAt: ['$requestCountInfo.total', 0] }, 0] }
				}
			},

			// STAGE 4: Sort the final results.
			{
				$sort: { id: 1 }
			}
		])
		.toArray();

	return { referrals };
};
