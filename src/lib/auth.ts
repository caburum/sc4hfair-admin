export const ROLES = {
	dev: 10,
	admin: 5,
	live: 2,
	data: 2,
	analytics: 1
} as const;

export type Role = keyof typeof ROLES;

export interface User {
	sub: string;
	email: string;
	roles: Role[];
	exp: number;
}

/** checks if a user has access to some roles */
export function isPermitted(userRoles: User['roles'], targetRoles: User['roles']): boolean {
	// ROLES is an object with role names as keys and their hierarchy as values
	// users who have a role with a higher hierarchy can automatically access lower roles
	// e.g. if a user has 'admin' role, they can access 'live' and 'data' roles

	if (userRoles.length === 0) return false; // no roles means no access
	if (targetRoles.length === 0) return true; // no target roles means access is granted

	// if two roles have the same value, the user must have the exact role to access it
	// e.g. if a user has 'live' role, they cannot access 'data' role, even though both have the same value of 1
	// if a user has 'admin' role, they can access 'live' and 'data' roles, but not the other way around

	const highestValue = userRoles.reduce((highestValue, role) => {
		const roleValue = ROLES[role] ?? -Infinity;
		return roleValue > highestValue ? roleValue : highestValue;
	}, -Infinity);

	return targetRoles.every((role) => {
		const requiredRoleValue = ROLES[role] || 0;
		return highestValue > requiredRoleValue || userRoles.includes(role);
	});
}

export const AUTH_BASE = 'https://sc4hfair.app/';
