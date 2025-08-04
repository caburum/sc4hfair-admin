import { validateSchema } from '$lib/schemas.server';
import { authenticate } from '$lib/server/auth';
import { uploaders, type SchemaUploaderId, type UploaderResult } from '$lib/server/uploaders';

export const load = async ({ locals }) => {
	return {};
};

export interface ActionResult extends UploaderResult {
	nextStage: 'validate' | 'import';
	valid: boolean;
	externalTime?: number;
}

const fail = (message: string) =>
	({
		nextStage: 'validate',
		valid: false,
		errors: [{ message }]
	}) satisfies ActionResult;

export const actions = {
	default: async ({ locals, request }) => {
		authenticate(locals.user, ['data']);

		const data = await request.formData();
		const schema = data.get('schema')! as SchemaUploaderId;
		const stage = data.get('stage')! as ActionResult['nextStage'];
		let json;
		try {
			json = JSON.parse(data.get('json')! as string);
		} catch (error) {
			return fail('Invalid JSON format');
		}

		const { valid, errors } = await validateSchema(schema, json);
		if (!valid) {
			return {
				nextStage: 'validate',
				valid,
				errors
			} satisfies ActionResult;
		}

		if (Array.isArray(json) && json.length === 0) return fail('Empty JSON array');

		const start = Date.now();

		const dry = stage === 'validate';
		const res = await uploaders[schema](json, dry);

		return {
			nextStage: 'import',
			valid,
			externalTime: Date.now() - start,
			...res
		} satisfies ActionResult;
	}
};
