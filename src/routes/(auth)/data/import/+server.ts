import { authenticate } from '$lib/server/auth.js';
import { validateSchema } from '$lib/server/schemas';
import { uploaders, type SchemaUploaderId, type UploaderResult } from '$lib/server/uploaders';
import { produce } from 'sveltekit-sse';

export type Dataset = 'complete' | 'partial';

export interface Result extends UploaderResult {
	ts: string;
	nextStage: 'validate' | 'import';
	valid: boolean;
}

export interface Log {
	ts?: string;
	message: string;
	data?: any[];
}

export const POST = ({ request, locals }) => {
	authenticate(locals.user, ['data']);

	// todo: move this into a generic async job runner with logging and resolving
	return produce(
		async function start({ emit, lock }) {
			const start = performance.now();

			const ts = () => ((performance.now() - start) / 1000).toFixed(3);
			const resolve = (result: Omit<Result, 'ts'>) => {
				emit('result', JSON.stringify({ ts: ts(), ...result }));
				lock.set(false);
			};
			const fail = (message: string) =>
				resolve({
					nextStage: 'validate',
					valid: false,
					errors: [{ message }]
				});
			const log: Logger = (message, ...data) =>
				emit(
					'log',
					JSON.stringify({ ts: ts(), message, data: data.length ? data : undefined } satisfies Log)
				);

			const data = await request.formData();
			const schemaId = data.get('schema')! as SchemaUploaderId;
			const stage = data.get('stage')! as Result['nextStage'];
			const completeDataset = (data.get('dataset') as Dataset) === 'complete';
			let json;
			try {
				json = JSON.parse(data.get('json')! as string);
			} catch (error) {
				emit('result', JSON.stringify(fail('Invalid JSON format')));
			}

			const { valid, errors } = await validateSchema(schemaId, json);
			if (!valid)
				return resolve({
					nextStage: 'validate',
					valid,
					errors
				});

			if (Array.isArray(json) && json.length === 0) fail('Empty JSON array');

			const dry = stage === 'validate';
			const res = await uploaders[schemaId](json, dry, completeDataset, log);

			return resolve({
				nextStage: stage === 'validate' ? 'import' : 'validate',
				valid,
				...res
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
