export const requestsByTypeToKey = {
	version: 'meta.version',
	platform: 'platform',
	standalone: 'meta.standalone'
} as const;
export type RequestsByType = keyof typeof requestsByTypeToKey;
