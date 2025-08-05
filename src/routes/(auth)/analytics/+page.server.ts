import { authenticate } from '$lib/server/auth';
import { analytics } from '$lib/server/db.js';

export const load = async ({ locals, url }) => {
	authenticate(locals.user, ['admin']);

	const since = new Date(url.searchParams.get('since') || Date.now() - 24 * 3600_000);
	const versionShare = await analytics()
		.collection('requests')
		.aggregate([
			// 1. Filter documents by time range
			{
				$match: {
					t: { $gte: since }
				}
			},
			// 2. Process data in two parallel branches
			{
				$facet: {
					// Branch A: Get a master list of all unique versions
					allVersions: [
						{
							$group: {
								_id: {
									$ifNull: ['$meta.version', 'unknown']
								}
							}
						},
						{
							$group: {
								_id: null,
								versions: { $push: '$_id' }
							}
						}
					],
					// Branch B: Group requests by 15-minute intervals and version
					byInterval: [
						{
							$group: {
								_id: {
									interval: {
										$subtract: [{ $toLong: '$t' }, { $mod: [{ $toLong: '$t' }, 15 * 60 * 1000] }]
									},
									version: {
										$ifNull: ['$meta.version', 'unknown']
									}
								},
								count: { $sum: 1 }
							}
						},
						{
							$group: {
								_id: '$_id.interval',
								versionCounts: { $push: { k: '$_id.version', v: '$count' } },
								totalCount: { $sum: '$count' }
							}
						}
					]
				}
			},
			// 3. Deconstruct the interval data for individual processing
			{
				$unwind: '$byInterval'
			},
			// 4. Transform each interval's data into the final "wide" format with counts
			{
				$replaceRoot: {
					newRoot: {
						$mergeObjects: [
							{ startTime: '$byInterval._id' },
							{
								$arrayToObject: {
									$map: {
										input: { $arrayElemAt: ['$allVersions.versions', 0] },
										as: 'versionName',
										in: {
											k: '$$versionName',
											v: {
												$let: {
													vars: {
														// Find the count for the current version within the interval
														matchedVersion: {
															$arrayElemAt: [
																{
																	$filter: {
																		input: '$byInterval.versionCounts',
																		cond: { $eq: ['$$this.k', '$$versionName'] }
																	}
																},
																0
															]
														}
													},
													// Return the count, defaulting to 0 if version not present
													in: { $ifNull: ['$$matchedVersion.v', 0] }
												}
											}
										}
									}
								}
							}
						]
					}
				}
			},
			// 5. Sort final results by time
			{
				$sort: {
					startTime: 1
				}
			}
		])
		.toArray();

	return { versionShare };
};
