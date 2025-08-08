export interface Referrer {
	id: string;
	name?: string;
	location?: Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy'>;
	// year: number;
}
