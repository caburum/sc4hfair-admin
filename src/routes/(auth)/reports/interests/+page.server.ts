import { currentYear } from '$lib/commonData';
import { getEntries } from '$lib/server/contentful';
import { db } from '$lib/server/db';

export const load = async ({ url }) => {
	const dev = url.searchParams.get('dev') !== null;

	const _interests = db()
		.collection('interests')
		.aggregate<{
			_id: string;
			users: {
				name: string;
				email: string;
				preferred_email?: string;
				graduation?: number;
				phone?: string;
			}[];
		}>([
			{
				// Stage 1: Filter interests by year.
				$match: {
					year: currentYear
				}
			},
			{
				// Stage 2: Perform a left outer join to the users collection.
				$lookup: {
					from: 'users',
					localField: 'user_id',
					foreignField: '_id',
					as: 'userDetails'
				}
			},
			{
				// Stage 3: Deconstruct the userDetails array to process each joined document.
				$unwind: '$userDetails'
			},
			{
				// Stage 4: Filter out documents where the user's roles array includes 'dev'.
				$match: dev ? {} : { 'userDetails.roles': { $not: { $elemMatch: { $eq: 'dev' } } } }
			},
			{
				// Stage 5: Group the remaining documents by interest slug.
				$group: {
					_id: '$slug',
					users: {
						// Push the relevant user details into a 'users' array.
						$push: {
							email: { $ifNull: ['$userDetails.preferred_email', '$userDetails.email'] },
							name: '$userDetails.name',
							graduation: '$userDetails.graduation',
							phone: '$userDetails.phone'
						}
					}
				}
			},
			{
				// Stage 6: Sort the results alphabetically by the interest slug (_id).
				$sort: { _id: 1 } // 1 for ascending order
			},
			{
				// Stage 7: Reshape the output documents for final presentation.
				$project: {
					_id: 1,
					users: 1
				}
			}
		])
		.toArray();

	const _clubs = getEntries({
		content_type: 'club',
		select: 'fields.name,fields.slug'
	}).then(
		(res) =>
			Object.fromEntries(
				res.map((item) => [item.fields?.slug?.['en-US'], item.fields?.name?.['en-US']])
			) as Record<string, string>
	);

	const [interests, clubs] = await Promise.all([_interests, _clubs]);

	return { interests, clubs };
};
