import { MONGODB_URI } from '$env/static/private';
import { MongoClient } from 'mongodb';

const client = new MongoClient(MONGODB_URI);

export async function connect(): Promise<void> {
	await client.connect();
}

export async function disconnect(): Promise<void> {
	await client.close();
}

export const db = client.db('users');
