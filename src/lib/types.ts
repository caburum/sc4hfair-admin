export interface Referrer {
	id: string;
	name?: string;
	location?: Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy'>;
	type?: string; // todo: log type of poster (8.5x11, 11x17, large, sh, link, etc)- through bulk import?
	// year: number; // only used by db, not client
}
