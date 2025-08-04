import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// this can't be dynamically generated, but this MUST be kept in sync with the schema files
const PREFIX = '/src/lib/schemas';
const schemaFiles = import.meta.glob<string>('/src/lib/schemas/*.json', {
	query: '?raw', // so they can be served without reformatting
	import: 'default',
	eager: false
});

export interface Schema {
	$id?: string;
	[key: string]: any;
}

export const getSchema = async (schema: string) => {
	const filePath = `${PREFIX}/${schema}.json`;
	if (schemaFiles[filePath]) {
		return await schemaFiles[filePath]();
	}
	throw Error('schema does not exist');
};

const ajv = new Ajv({ allErrors: true, validateFormats: true });
addFormats(ajv);

export const validateSchema = async (schema: string, data: any) => {
	const schemaData = JSON.parse(await getSchema(schema)) as Schema;

	const validate = (schemaData?.$id && ajv.getSchema(schemaData?.$id)) || ajv.compile(schemaData);
	const valid = Boolean(await validate(data));

	return {
		valid,
		errors: validate.errors || []
	};
};
