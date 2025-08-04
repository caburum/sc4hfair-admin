import { authenticate } from '$lib/server/auth';
import { currentYear, lastYearTagId } from '$lib/server/commonData';
import { bulkAction, fetchContentful, getEntries } from '$lib/server/contentful';

export const actions = {
	// todo: add automatically if doesn't already exist
	newYear: async ({ locals }) => {
		authenticate(locals.user, ['data']);

		const { status, data } = await fetchContentful(`tags/${currentYear}`, {
			method: 'PUT',
			body: {
				name: `year: ${currentYear}`,
				sys: {
					visibility: 'private',
					id: currentYear,
					type: 'Tag'
				}
			}
		});

		console.log('newYear', status, data);

		return {
			message:
				status === 201 ? 'created'
				: status === 409 ? 'already exists'
				: 'unknown error',

			status,
			data

			// action: request.url.replace(/.*\?\//, '')
		};
	},

	archiveLastYear: async ({ locals }) => {
		authenticate(locals.user, ['data']);

		let entries = (
			await Promise.all(
				['scheduledEvent', 'post'].map((type) =>
					getEntries({
						'content_type': type,
						'select': 'sys.id,sys.version',
						'metadata.tags.sys.id[in]': lastYearTagId,
						'sys.archivedAt[exists]': false,
						'limit': 1000
					})
				)
			)
		).flat();

		let unPublishPayload = entries.map((entry) => ({
			sys: {
				id: entry.sys!.id,
				type: 'Link',
				linkType: 'Entry'
			}
		}));

		const bulkRes = await bulkAction(unPublishPayload, 'unpublish');

		let archived = [];
		for (const { sys } of entries) {
			const { status } = await fetchContentful(`entries/${sys!.id}/archived`, {
				method: 'PUT',
				version: sys!.version
			});
			archived.push(`${sys!.id}: ${status}`);
		}

		// todo: webhook?

		return {
			matched: entries.length,
			bulkRes,
			archived
		};
	}
};
