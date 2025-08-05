import type { SchemaUploaderId } from '$lib/server/uploaders';

let anArray = 'outputed array (text surrounded by square brackets)';

const instructions = {
	// generic: ['list of required files', 'prompt', 'first output'],
	schedule: [
		'schedule pdf, <a href="/api/schema/schedule">schema</a>, and <a href="/api/schema/tentSlugs">tent slugs</a>',
		`We need to turn the human readable schedule document I provided into a machine readable version for a CMS system. Your job is to read the PDF, and convert each event on the schedule across all days into a machine readable entry. Process each event yourself manually, do not use data analysis tools. Use the two reference documents to assist in ensuring the output is correct. The output should be formatted as a JSON array with the following entries:
title: human readable name of the event, properly capitalized
time: start time of the event as listed, in ISO format (for time zone, assume we are on east coast in August)
end_time: end time of the event formatted as above, if applicable (many events don't have this)
tent: the slug of the tent that this event is in. you are provided with the list of possible slugs, if the event is clearly not in any of those tents, you can leave it null for unknown
near: boolean that is true if the event is "near" the tent, false if the event is "in" the tent (this decides how the location will be shown in the app)`,
		anArray
	],
	foodVendors: [
		'food vendor list and <a href="/api/schema/foodVendors">schema</a>',
		`We need to turn the human readable food vendor spreadsheet I provided into a machine readable version for a CMS system. Your job is to read the spreadsheet, and create groups of food vendors and their items. In the case of duplicate item names for the same vendor (for example, different sizes), ask me what to do. Process each event yourself manually, do not use data analysis tools. Use the reference document to assist in ensuring the output is correct.`,
		anArray
	]
} satisfies Record<SchemaUploaderId, [string, string, string]>;
export default instructions;
