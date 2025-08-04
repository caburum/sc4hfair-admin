import { yearTagId } from './commonData';
import {
	archiveEntry,
	conditionalBulkAction,
	fetchContentful,
	getEntries,
	newIdFromString,
	type BulkActionPayload,
	type FullEntry,
	type PartialEntry
} from './contentful';

/** shared type all uploaders must implement */
export type UploaderResult = {
	created?: string[];
	updated?: string[];
	archived?: string[];
	errors: Record<string, any>[];
};

type UploaderFunc<T = Record<string, any>> = (data: T[], dry: boolean) => Promise<UploaderResult>;

/** each uploader must be matched with a schema in $lib/schemas */
export const uploaders = {
	schedule: async (data, dry) => {
		const CONTENT_TYPE_ID = 'scheduledEvent';
		const tempEvents: Record<
			string,
			{
				version?: number;
				entry: PartialEntry;
			}
		> = {};
		const result: Required<UploaderResult> = {
			created: [],
			updated: [],
			archived: [],
			errors: []
		};

		for (const event of data) {
			if (!event['title'] || event['title'] === '-' || !event['time']) continue;

			const entry: PartialEntry = {
				metadata: {
					tags: [
						{
							sys: {
								type: 'Link',
								linkType: 'Tag',
								id: yearTagId
							}
						}
					]
				},
				fields: {
					near: {
						'en-US': event['near'] == true
					}
				}
			};

			for (const key of ['title', 'time', 'endTime', 'tent']) {
				if (event[key]) entry.fields[key] = { 'en-US': event[key] };
			}

			const id = newIdFromString(`${event['title']}${event['time']}`);
			if (id in tempEvents)
				result.errors.push({
					message: `duplicate event id: ${id}`,
					id,
					event
				});
			tempEvents[id] = { entry };
		}

		const publishPayload: BulkActionPayload[] = [];

		/** helper to create or update an event */
		async function doEvent(id: string) {
			const event = tempEvents[id];

			if (!dry) {
				const res = await fetchContentful<FullEntry>(`entries/${id}`, {
					method: 'PUT',
					contentType: CONTENT_TYPE_ID,
					version: event.version,
					body: event.entry
				});

				if (![200, 201].includes(res.status)) {
					result.errors.push({ id, status: res.status, data: res.data });
					return;
				}

				publishPayload.push({
					sys: {
						id,
						type: 'Link',
						linkType: 'Entry',
						version: res.data.sys.version
					}
				});
			}
		}

		const entries = await getEntries({
			'content_type': CONTENT_TYPE_ID,
			'select': 'sys.id,sys.version',
			'sys.archivedAt[exists]': false,
			'limit': 1000
		});

		for (const entry of entries) {
			const { id, version } = entry.sys;

			if (id in tempEvents) {
				// if we have an event with the same ID, update it
				tempEvents[id].version = version;
				await doEvent(id);
				result.updated.push(id);
				delete tempEvents[id]; // remove it from the tempEvents to avoid creating it later
			} else {
				// otherwise, archive it
				if (!dry) await archiveEntry(id, version);
				result.archived.push(id);
			}
		}

		for (const id of Object.keys(tempEvents)) {
			// create the rest that we aren't modifying
			await doEvent(id);
			result.created.push(id);
		}

		await conditionalBulkAction(publishPayload, 'publish', dry);

		return result;
	}
} as const satisfies Record<string, UploaderFunc>;

export type SchemaUploaderId = keyof typeof uploaders;
