import { getSchema } from '$lib/server/schemas';
import { error, text } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const { id } = params;

	try {
		return text(await getSchema(id), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${id}.json"`
			}
		});
	} catch (e) {
		return error(404, `Schema ${id} not found`);
	}
};
