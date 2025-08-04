import { MONGODB_URI } from '$env/static/private';
import { MongoClient } from 'mongodb';

const client = new MongoClient(MONGODB_URI);

client.addListener('connectionPoolReady', () => console.log('db connectionPoolReady'));
client.addListener('connectionPoolClosed', () => console.log('db connectionPoolClosed'));
client.addListener('connectionReady', () => console.log('db connectionReady'));
client.addListener('connectionClosed', () => console.log('db connectionClosed'));

export async function connect(): Promise<void> {
	await client.connect();
}

export async function disconnect(): Promise<void> {
	await client.close();
}

export const db = () => client.db('users');
