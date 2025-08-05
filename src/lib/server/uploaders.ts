import { yearTagId } from '../commonData';
import {
	archiveEntry,
	conditionalBulkAction,
	fetchContentful,
	getEntries,
	newId,
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

type UploaderFunc<T = Record<string, any>> = (
	data: T[],
	dry: boolean,
	completeDataset: boolean,
	log: Logger
) => Promise<UploaderResult>;

/** each uploader must be matched with a schema in $lib/schemas */
export const uploaders = {
	schedule: async (data, dry, completeDataset, log = console.log) => {
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
		log(`provided ${Object.keys(tempEvents).length} events to process`);

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
		log(`found ${entries.length} existing events to compare against`);

		log(`please wait, processing events...`);
		let unaffected = 0,
			completed = 0;
		for (const entry of entries) {
			const { id, version } = entry.sys;

			if (id in tempEvents) {
				// if we have an event with the same ID, update it
				tempEvents[id].version = version;
				await doEvent(id);
				result.updated.push(id);
				delete tempEvents[id]; // remove it from the tempEvents to avoid creating it later
			} else if (completeDataset) {
				// otherwise, archive it
				if (!dry) await archiveEntry(id, version);
				result.archived.push(id);
			} else {
				unaffected++;
			}

			if (!dry && ++completed % 20 === 0) log(`... ${completed} / ${entries.length} ...`);
		}
		log(`archiving ${result.archived.length} unmatched events`);
		log(`not affecting ${unaffected} unmatched events`);
		log(`updating ${result.updated.length} matched events`);

		for (const id of Object.keys(tempEvents)) {
			// create the rest that we aren't modifying
			await doEvent(id);
			result.created.push(id);
		}
		log(`creating ${result.created.length} new events`);

		await conditionalBulkAction(publishPayload, 'publish', dry, log);

		return result;
	},

	foodVendors: (async (data, dry, completeDataset, log = console.log) => {
		const CONTENT_TYPE_ID = 'foodVendor';
		const tempVendors = new Map<
			string,
			{
				id?: string;
				version?: number;
				entry: PartialEntry;
			}
		>();
		const result: Required<UploaderResult> = {
			created: [],
			updated: [],
			archived: [],
			errors: []
		};

		log(`provided ${data.length} food vendors to process`);

		for (const { name, items } of data) {
			if (!name) continue;

			if (tempVendors.has(name)) {
				result.errors.push({ message: `duplicate vendor name: ${name}` });
				continue;
			}

			tempVendors.set(name, {
				entry: {
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
						name: { 'en-US': name },
						items: {
							'en-US': items.map((item) => ({
								id: newId(),
								key: item.name?.trim() ?? '',
								value: item.price?.trim() ?? ''
							}))
						}
					}
				}
			});
		}

		const entries = await getEntries({
			'content_type': CONTENT_TYPE_ID,
			'select': 'sys.id,sys.version,fields.name',
			'sys.archivedAt[exists]': false,
			'limit': 1000
		});
		log(`found ${entries.length} existing food vendors to compare against`);

		log(`please wait, processing food vendors...`);
		let unaffected = 0;
		for (const entry of entries) {
			const name = entry.fields.name?.['en-US'];
			if (!name) continue;
			const { id, version } = entry.sys;

			if (tempVendors.has(name)) {
				const vendor = tempVendors.get(name)!;
				vendor.id = id;
				vendor.version = version;
				result.updated.push(id);
			} else if (completeDataset) {
				if (!dry) await archiveEntry(id, version);
				result.archived.push(id);
			} else {
				unaffected++;
			}
		}
		log(`archiving ${result.archived.length} unmatched food vendors`);
		log(`not affecting ${unaffected} unmatched food vendors`);
		log(`updating ${result.updated.length} matched food vendors`);

		const publishPayload: BulkActionPayload[] = [];

		for (const [vendorName, vendor] of tempVendors) {
			let id = vendor.id;
			if (!id) {
				id = newIdFromString(vendorName);
				result.created.push(id);
			}

			if (!dry) {
				const res = await fetchContentful<FullEntry>(`entries/${id}`, {
					method: 'PUT',
					contentType: CONTENT_TYPE_ID,
					version: vendor.version,
					body: vendor.entry
				});

				if (![200, 201].includes(res.status)) {
					result.errors.push({ vendorName, status: res.status, data: res.data });
					continue;
				}

				publishPayload.push({
					sys: {
						id: id,
						type: 'Link',
						linkType: 'Entry',
						version: res.data.sys.version
					}
				});
			}
		}
		log(`creating ${result.created.length} new food vendors`);

		await conditionalBulkAction(publishPayload, 'publish', dry, log);

		return result;
	}) satisfies UploaderFunc<{ name: string; items: { name: string; price: string }[] }>
} as const satisfies Record<string, UploaderFunc<any>>;

export type SchemaUploaderId = keyof typeof uploaders;
