import { analytics } from '$lib/server/db';

export const load = async ({ url }) => {
	const since = new Date(url.searchParams.get('since') || Date.now() - 24 * 3600_000);

	const urls = await analytics()
		.collection('requests')
		.aggregate<{
			_id: string;
			count: number;
		}>([
			{
				$match: {
					t: { $gte: since },
					url: { $exists: true, $ne: null }
				}
			},
			{
				$group: {
					_id: '$url',
					count: { $sum: 1 }
				}
			},
			{
				$sort: {
					count: -1
				}
			}
		])
		.toArray();

	return { urls };
};
