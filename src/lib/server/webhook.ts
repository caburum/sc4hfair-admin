import {
	setWebhookActive as setContentfulWebhookActive,
	VERCEL_WEBHOOK_ID
} from '$lib/server/contentful';

// this is a placeholder for the future implementation of centralized webhook management
// currently, contentful.ts calls the api directly but will be replaced with this function when complete

export async function setWebhookActive(active: boolean, webhookType: 'vercel' = 'vercel') {
	return setContentfulWebhookActive(active, VERCEL_WEBHOOK_ID);
}
