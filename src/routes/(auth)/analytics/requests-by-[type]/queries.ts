import { analytics } from '$lib/server/db';
import type { RequestsByType, requestsByTypeToKey } from './types';

const platformSwitch = {
	$switch: {
		branches: [
			// Android
			{
				case: {
					$regexMatch: {
						input: '$$agent',
						regex: 'android',
						options: 'i'
					}
				},
				then: {
					$cond: {
						if: {
							$regexMatch: {
								input: '$$agent',
								regex: 'wv|FBAV'
							}
						},
						then: 'android-unsupported',
						else: 'android'
					}
				}
			},
			// iOS
			{
				case: {
					$regexMatch: {
						input: '$$agent',
						regex: 'iPad|iPhone|iPod|iOS'
					}
				},
				then: {
					$switch: {
						branches: [
							{
								case: {
									$regexMatch: {
										input: '$$agent',
										regex: 'FBIOS'
									}
								},
								then: 'ios-unsupported'
							},
							{
								case: {
									$regexMatch: {
										input: '$$agent',
										regex: 'CriOS|FxiOS|EdgiOS'
									}
								},
								then: 'ios-other'
							}
						],
						default: 'ios'
					}
				}
			},
			// crawler
			{
				case: {
					$regexMatch: {
						input: '$$agent',
						regex: 'bot|crawl|spider|vercel',
						options: 'i'
					}
				},
				then: 'crawler'
			},
			// desktop
			{
				case: {
					$regexMatch: {
						input: '$$agent',
						regex: 'macintosh|mac os x|windows nt|linux',
						options: 'i'
					}
				},
				then: 'desktop'
			}
		],
		default: 'unknown' // '$$agent'
	}
};

export const requestsByKey = (since: Date, key: (typeof requestsByTypeToKey)[RequestsByType]) =>
	analytics()
		.collection('requests')
		.aggregate(
			[
				// 1. Filter documents by time range
				{
					$match: {
						t: { $gte: since }
					}
				},
				key === 'platform' ?
					[
						// 1a. Lookup agent information from sessions collection
						{
							$lookup: {
								from: 'sessions',
								localField: 'track_id',
								foreignField: '_id',
								as: 'session'
							}
						}, // 1b. Transform the agent user agent string into a platform name
						{
							$addFields: {
								platform: {
									$let: {
										vars: {
											agent: { $arrayElemAt: ['$session.agent', 0] }
										},
										in: platformSwitch
									}
								}
							}
						}
					]
				:	[],

				// 2. Process data in two parallel branches
				{
					$facet: {
						// Branch A: Get a master list of all unique keys
						allValues: [
							{
								$group: {
									_id: {
										$toString: {
											$ifNull: [`$${key}`, 'unknown']
										}
									}
								}
							},
							{
								$sort: {
									_id: 1 // Sort values alphabetically for consistent order
								}
							},
							{
								$group: {
									_id: null,
									values: { $push: '$_id' }
								}
							}
						], // Branch B: Group requests by 15-minute intervals and value
						byInterval: [
							{
								$group: {
									_id: {
										interval: {
											$subtract: [{ $toLong: '$t' }, { $mod: [{ $toLong: '$t' }, 15 * 60 * 1000] }]
										},
										value: {
											$toString: {
												$ifNull: [`$${key}`, 'unknown']
											}
										}
									},
									count: { $sum: 1 }
								}
							},
							{
								$group: {
									_id: '$_id.interval',
									valueCounts: { $push: { k: '$_id.value', v: '$count' } },
									totalCount: { $sum: '$count' }
								}
							}
						]
					}
				},
				// 3. Deconstruct the interval data for individual processing
				{
					$unwind: '$byInterval'
				}, // 4. Transform each interval's data into the final "wide" format with counts
				{
					$replaceRoot: {
						newRoot: {
							$mergeObjects: [
								{ startTime: { $toDate: '$byInterval._id' } },
								{
									$arrayToObject: {
										$map: {
											input: { $arrayElemAt: ['$allValues.values', 0] },
											as: 'valueName',
											in: {
												k: '$$valueName',
												v: {
													$let: {
														vars: {
															// Find the count for the current value within the interval
															matchedValue: {
																$arrayElemAt: [
																	{
																		$filter: {
																			input: '$byInterval.valueCounts',
																			cond: { $eq: ['$$this.k', '$$valueName'] }
																		}
																	},
																	0
																]
															}
														},
														// Return the count, defaulting to 0 if value not present
														in: { $ifNull: ['$$matchedValue.v', 0] }
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
			].flat()
		)
		.toArray();
