// export const transport: Transport = {
// 	BSONValue: {
// 		encode: (value: { _bsontype?: string; toJSON?: () => any }) =>
// 			value?._bsontype === 'ObjectId' && value.toJSON?.(),
// 		decode: (value: any) => value
// 	}
// };
// https://github.com/sveltejs/kit/issues/13428
