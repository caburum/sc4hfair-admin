import { CONTENTFUL_CMA_TOKEN } from '$env/static/private';

export const SPACE_ID = 'e34g9w63217k';
export const ENVIRONMENT_ID = 'master';

// todo: control a local webhook proxy instead
export const VERCEL_WEBHOOK_ID = '2pNxUMPQKUMQz2aIHSO65Y';

export const headers = ({
	version,
	contentType
}: { version?: number; contentType?: string } = {}) =>
	({
		'Authorization': `Bearer ${CONTENTFUL_CMA_TOKEN}`,
		'Content-Type': 'application/vnd.contentful.management.v1+json',
		...(version && { 'X-Contentful-Version': String(version) }),
		...(contentType && { 'X-Contentful-Content-Type': contentType })
	}) as const;

export interface Entry {
	sys?: {
		id: string;
		type: 'Entry';
		version: number;
		// abbriviated for brevity
		[key: string]: any;
	};
	metadata?: {
		tags: {
			sys: {
				type: 'Link';
				linkType: 'Tag';
				id: string;
			};
		}[];
	};
	fields?: {
		[key: string]: {
			'en-US': any;
		};
	};
}

export type PartialEntry = Require<Entry, 'metadata' | 'fields'>;
export type FullEntry = Require<Entry, 'sys' | 'metadata' | 'fields'>;

export interface EntriesResponse<T extends Entry = Entry> {
	sys: {
		type: 'Array';
	};
	total: number;
	skip: number;
	limit: number;
	items: T[];
}

export const fetchContentful = async <T extends Record<string, any>>(
	url: string,
	options: Omit<RequestInit, 'body'> & {
		version?: number;
		contentType?: string;
		body?: Object;
	} = {}
) => {
	const { body, version, contentType, headers: restHeaders, ...restOptions } = options;

	const response = await fetch(
		new URL(url, `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/`),
		{
			...restOptions,
			headers: {
				...headers({ version, contentType }),
				...restHeaders
			},
			body: options.body ? JSON.stringify(options.body) : undefined
		}
	);

	return {
		data: (await response.json()) as T,
		status: response.status,
		statusText: response.statusText
	};
};

export async function getEntries<T extends FullEntry>(query: {
	limit?: number;
	skip?: number;
	content_type?: string;
	[key: string]: string | number | boolean | undefined;
}) {
	let items: T[] = [];

	while (true) {
		const { data, status } = await fetchContentful<EntriesResponse<T>>(
			`entries?${new URLSearchParams(
				Object.entries(query)
					.filter(([_, v]) => v !== undefined)
					.map(([k, v]) => [k, String(v)])
			).toString()}`,
			{ method: 'GET' }
		);

		if (status !== 200) {
			throw new Error(`Failed to fetch entries: ${status} ${JSON.stringify(data)}`);
		}

		items.push(...(data?.items ?? []));

		if (data?.total > data?.limit) {
			query.skip = (query.skip || 0) + data.limit;
			query.limit = data.limit;
			continue;
		}

		break;
	}

	return items;
}

export async function archiveEntry(id: string, version: number) {
	await fetchContentful(`entries/${id}/published`, { method: 'DELETE', version });
	await fetchContentful(`entries/${id}/archived`, { method: 'PUT', version });
}

export async function setWebhookActive(active: boolean, webhookId: string = VERCEL_WEBHOOK_ID) {
	const url = `https://api.contentful.com/spaces/${SPACE_ID}/webhook_definitions/${webhookId}`;

	const getRes = await fetch(url, {
		method: 'GET',
		headers: headers()
	});

	if (!getRes.ok) {
		const error = await getRes.json();
		throw new Error(`failed to get webhook ${webhookId}: ${JSON.stringify(error)}`);
	}

	const data: {
		active: boolean;
		url: string;
		sys: {
			version: number;
		};
	} = await getRes.json();

	const previousActive = data.active;
	const webhookUrl = data.url;

	const version = data.sys.version;
	const { sys, ...updateData } = data;
	updateData.active = active;

	const putResponse = await fetch(url, {
		method: 'PUT',
		headers: headers({ version }),
		body: JSON.stringify(updateData)
	});

	if (!putResponse.ok) {
		const error = await putResponse.json();
		throw new Error(`failed to put webhook ${webhookId}: ${JSON.stringify(error)}`);
	}

	return { previousActive, webhookUrl };
}

export interface BulkActionPayload {
	sys: {
		id: string;
		linkType: string;
		type: string;
		version?: number; // optional for create, required for update
	};
}

interface BulkActionResponse {
	sys: {
		id: string;
		status: string;
	};
	error?: any;
}

type BulkAction = 'publish' | 'unpublish';

export async function bulkAction(bulkPayload: BulkActionPayload[], action: BulkAction) {
	if (bulkPayload.length === 0) return false;

	// chunk into batches of 200
	const chunkSize = 200;
	const chunks = bulkPayload.reduce((acc, _, i) => {
		if (i % chunkSize === 0) acc.push(bulkPayload.slice(i, i + chunkSize));
		return acc;
	}, [] as BulkActionPayload[][]);

	if (chunks.length > 1) {
		console.warn(`bulkAction: chunking payload into ${chunks.length} batches of ${chunkSize}`);
	}

	return Promise.all(
		chunks.map(async (chunk) => {
			const bulkResponse = await fetch(
				`https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/bulk_actions/${action}`,
				{
					method: 'POST',
					headers: headers(),
					body: JSON.stringify({
						entities: {
							items: chunk
						}
					})
				}
			);

			if (!bulkResponse.ok) {
				const error = await bulkResponse.json();
				throw new Error(`bulk ${action} failed: ${JSON.stringify(error)}`);
			}

			const bulkResult: BulkActionResponse = await bulkResponse.json();
			console.log(
				`waiting on bulk ${action}... status`,
				bulkResponse.status,
				bulkResult.sys.status,
				bulkResult
			);

			// todo: return a promise for our api to have the client check
			while (true) {
				await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

				const statusResponse = await fetch(
					`https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}/bulk_actions/actions/${bulkResult.sys.id}`,
					{
						method: 'GET',
						headers: headers()
					}
				);

				if (!statusResponse.ok) {
					throw new Error(`Failed to check bulk action status: ${statusResponse.statusText}`);
				}

				const statusResult: BulkActionResponse = await statusResponse.json();
				const status = statusResult.sys.status;
				console.log(`Waiting on bulk ${action}... status`, status);

				if (status === 'succeeded') {
					return statusResult;
				} else if (status === 'failed') {
					console.error(statusResult.error);
					throw new Error(`Bulk ${action} failed: ${JSON.stringify(statusResult.error)}`);
				}
			}
		})
	);
}

/** common pattern: publish entries in bulk if there are any, including noPublish & webhook safety */
export async function conditionalBulkAction(
	bulkPayload: BulkActionPayload[],
	action: BulkAction,
	noPublish: boolean = false
) {
	if (noPublish || bulkPayload.length === 0) return;

	const { previousActive, webhookUrl } = await setWebhookActive(false);

	try {
		await bulkAction(bulkPayload, action);
	} finally {
		if (previousActive) {
			await setWebhookActive(true); // re-enable

			// manually trigger webhook
			try {
				await fetch(webhookUrl);
			} catch (error) {
				console.error('Failed to manually trigger webhook:', error);
			}
		}
	}
}

const base62alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const base = BigInt(base62alphabet.length);

export function toBase62(input: bigint) {
	if (input === 0n) return '0';

	let output = '';
	while (input !== 0n) {
		output = base62alphabet[Number(input % base)] + output;
		input = input / base;
	}
	return output;
}

export const newId = () => toBase62(BigInt('0x' + crypto.randomUUID().replace(/-/g, '')));

function fnv1a(input: string) {
	let hash = 0xcbf29ce484222325n; // 64-bit FNV offset basis
	const fnvPrime = 0x100000001b3n; // 64-bit FNV prime
	for (let i = 0; i < input.length; i++) {
		hash ^= BigInt(input.charCodeAt(i));
		hash = (hash * fnvPrime) & 0xffffffffffffffffn; // keep to 64 bits
	}
	return hash;
}

/** generates a unique id that is deterministic based on the input string */
export const newIdFromString = (input: string) => toBase62(fnv1a(input));
