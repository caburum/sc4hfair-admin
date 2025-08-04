import { authenticate } from '$lib/server/auth.js';
import { validateSchema } from '$lib/server/schemas';
import { type SchemaUploaderId, type UploaderResult } from '$lib/server/uploaders';
import { produce } from 'sveltekit-sse';

export interface Result extends UploaderResult {
	nextStage: 'validate' | 'import';
	valid: boolean;
	externalTime?: number; // todo: client side
}

export interface Log {
	time: number;
	message: string;
}

// export const _actions = {
// 	default: async ({ locals, request }) => {
// 		authenticate(locals.user, ['data']);

// 		const data = await request.formData();
// 		const schema = data.get('schema')! as SchemaUploaderId;
// 		const stage = data.get('stage')! as ActionResult['nextStage'];
// 		let json;
// 		try {
// 			json = JSON.parse(data.get('json')! as string);
// 		} catch (error) {
// 			return fail('Invalid JSON format');
// 		}

// 		const { valid, errors } = await validateSchema(schema, json);
// 		if (!valid) {
// 			return {
// 				nextStage: 'validate',
// 				valid,
// 				errors
// 			} satisfies ActionResult;
// 		}

// 		if (Array.isArray(json) && json.length === 0) return fail('Empty JSON array');

// 		const start = Date.now();

// 		const dry = stage === 'validate';
// 		const res = await uploaders[schema](json, dry);

// 		return {
// 			nextStage: stage === 'validate' ? 'import' : 'validate',
// 			valid,
// 			externalTime: Date.now() - start,
// 			...res
// 		} satisfies ActionResult;
// 	}
// };

function delay(milliseconds: number) {
	return new Promise(function run(resolve) {
		setTimeout(resolve, milliseconds);
	});
}

export const POST = ({ request, locals }) => {
	authenticate(locals.user, ['data']);

	return produce(
		async function start({ emit, lock }) {
			const resolve = (result: Result) => {
				emit('result', JSON.stringify(result));
				lock.set(false);
			};
			const fail = (message: string) =>
				resolve({
					nextStage: 'validate',
					valid: false,
					errors: [{ message }]
				} satisfies Result);
			const log = (message: string) =>
				emit('log', JSON.stringify({ time: Date.now(), message } satisfies Log));

			const data = await request.formData();
			const schema = data.get('schema')! as SchemaUploaderId;
			const stage = data.get('stage')! as Result['nextStage'];
			let json;
			try {
				json = JSON.parse(data.get('json')! as string);
			} catch (error) {
				emit('result', JSON.stringify(fail('Invalid JSON format')));
			}

			log(`schema: ${schema}`);
			log(`stage: ${stage}`);

			const { valid, errors } = await validateSchema(schema, json);
			if (!valid)
				return resolve({
					nextStage: 'validate',
					valid,
					errors
				});

			if (Array.isArray(json) && json.length === 0) fail('Empty JSON array');

			let count = 0;
			while (true) {
				log(`the state is ${count++}`);

				if (count === 10) break;

				await delay(1000);
			}

			// fixme: finish implementing real uploader
			return resolve({
				nextStage: 'validate',
				valid: false,
				externalTime: 1000 * count,
				errors: [{ message: 'This is a test error' }]
			});
		},
		{
			ping: 60_000,
			stop() {
				console.log('sse connection closed');
			}
		}
	);
};
