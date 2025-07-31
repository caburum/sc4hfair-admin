import { JWT_SECRET } from '$env/static/private';
import { isPermitted, type Role, type User } from '$lib/auth';
import { error } from '@sveltejs/kit';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(JWT_SECRET);

/** only returns a user if the session is cryptographically valid */
export async function validateSession(session_token: string | null): Promise<User | null> {
	if (!session_token) return null;

	// const hmacCryptoKey = await crypto.subtle.importKey(
	// 	'raw',
	// 	new TextEncoder().encode(JWT_SECRET),
	// 	{
	// 		name: 'HMAC',
	// 		hash: 'SHA-256'
	// 	},
	// 	false,
	// 	['verify']
	// );

	const { payload } = await jwtVerify(session_token, secret, {
		algorithms: ['HS256'],
		clockTolerance: 5
	});

	const { sub, email, roles, exp } = payload as Partial<User>;

	if (!sub || !email || !roles || !exp) {
		return null;
	}

	return { sub, email, roles, exp };
}

/** requires a logged in user, optionally with specific roles */
export async function authenticate(user: User | null, requiredRoles: Role[] = []): Promise<void> {
	if (!user || !isPermitted(user!.roles, requiredRoles)) {
		throw error(401, 'Unauthorized');
	}
}
