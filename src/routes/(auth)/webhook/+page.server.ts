import { env } from '$env/dynamic/private';
import { authenticate } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

const hooks = Object.fromEntries(Object.entries(env).filter(([key]) => key.endsWith('_HOOK')));

export const load = async ({ locals }) => {
	authenticate(locals.user, ['dev']);
	return {
		hooks: Object.keys(hooks)
	};
};

export const actions = {
	default: async ({ locals, request }) => {
		authenticate(locals.user, ['dev']);

		const data = await request.formData();
		const id = data.get('id') as string | null;

		if (id && id in hooks) {
			const res = await fetch(hooks[id as keyof typeof hooks]!, { method: 'POST' });
			const { job } = await res.json();

			if (res.ok) return { success: true, status: res.status, message: job };
			return fail(res.status, { success: false, status: res.status, message: job });
		}

		return fail(404, { success: false, message: 'Invalid webhook ID' });
	}
};
