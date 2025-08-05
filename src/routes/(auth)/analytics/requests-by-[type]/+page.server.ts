import { error } from '@sveltejs/kit';
import { requestsByKey } from './queries';
import { requestsByTypeToKey, type RequestsByType } from './types';

const isValidType = (type: string | null): type is RequestsByType => {
	return type !== null && type in requestsByTypeToKey;
};

export const load = async ({ params, url }) => {
	const type = params.type;

	if (!isValidType(type)) return error(404, { message: 'Invalid type' });

	const since = new Date(url.searchParams.get('since') || Date.now() - 24 * 3600_000);
	const requests = await requestsByKey(since, requestsByTypeToKey[type]);

	console.log('requests', requests);

	return { requests };
};
