import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const schemaFiles = import.meta.glob<Schema>('./schemas/*.json', {
	import: 'default',
	eager: false
});

export interface Schema {
	[key: string]: any;
}

export const getSchema = async (schema: string) => {
	const filePath = `./schemas/${schema}.json`;
	if (schemaFiles[filePath]) {
		return await schemaFiles[filePath]();
	}
	throw Error('schema does not exist');
};

const ajv = new Ajv({ allErrors: true, validateFormats: true });
addFormats(ajv);

export const validateSchema = async (schema: string, data: any) => {
	const schemaData = await getSchema(schema);

	const validate = ajv.compile(schemaData);
	const valid = validate(data);

	return {
		valid,
		errors: validate.errors || []
	};
};
