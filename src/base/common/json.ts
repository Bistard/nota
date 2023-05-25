
/**
 * {@link IJsonNodeSchema} is a type used to represent a schema of JSON data. It 
 * allows for describing the structure of JSON data in a type-safe way in 
 * TypeScript. Depending on the 'type' property, which can be 'string', 'number', 
 * 'boolean', 'null', 'array', or 'object'.
 * 
 * For example, when 'type' is 'number', it can have 'minimum' and 'maximum' 
 * properties.
 * 
 * When 'type' is 'string', it can have 'minLength', 'maxLength', and 'format' 
 * properties. 
 * 
 * Similarly for 'array' and 'object', there are properties to describe the 
 * items in the array and the properties of the object respectively.
 * 
 * ## The Schema Example
 * ```ts
 * let userSchema: IJSONSchema = {
 *   type: 'object',
 *   properties: {
 *       name: { type: 'string' },
 *       age: { type: 'integer', minimum: 0 },
 *       email: { type: 'string', format: 'email' },
 *       address: {
 *           type: 'object',
 *           properties: {
 *               street: { type: 'string' },
 *               city: { type: 'string' },
 *               country: { type: 'string' }
 *           },
 *           required: ['street', 'city', 'country']
 *       },
 *       hobbies: {
 *           type: 'array',
 *           items: { type: 'string' }
 *       }
 *   },
 *   required: ['name', 'age', 'email', 'address', 'hobbies']
 * };
 * ```
 * ## The valid JSON Data
 * ```ts
 * {
 *     "name": "John Doe",
 *     "age": 30,
 *     "email": "john@example.com",
 *     "address": {
 *         "street": "123 Main St",
 *         "city": "Springfield",
 *         "country": "USA"
 *     },
 *     "hobbies": ["Reading", "Traveling", "Swimming"]
 * }
 * ```
 */
export type IJsonNodeSchema = (
    IJsonNodeSchemaForBoolean |
    IJsonNodeSchemaForNull |
    IJsonNodeSchemaForNumber |
    IJsonNodeSchemaForString |
    IJsonNodeSchemaForArray |
    IJsonNodeSchemaForObject
);

type DataType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';

interface IJsonNodeSchemaBase<TDataType extends DataType>  {
    
    /** The data type of the current schema node. */
    type: TDataType;

    /** The identifier of the schema node. */
    id?: string;

    /** The description of the schema node. */
    description?: string;

    /** The default value of the current schema node. */
    default?: any;
}

interface IJsonNodeSchemaForBoolean extends IJsonNodeSchemaBase<'boolean'> {}

interface IJsonNodeSchemaForNull extends IJsonNodeSchemaBase<'null'> {}

interface IJsonNodeSchemaForNumber extends IJsonNodeSchemaBase<'number'> {

    /** If only supports integer. */
    integer?: boolean;

    /** The minimum value requirement. */
    minimum?: number;
    
    /** The maximum value requirement. */
    maximum?: number;
}

interface IJsonNodeSchemaForString extends IJsonNodeSchemaBase<'string'> {

    /** The minimum length of the string. */
    minLength?: number;

    /** The maximum length of the string. */
    maxLength?: number;

    /** The predefined format of the string. Example: 'email', 'phone number', 'post adress' etc. */
    format?: string;
}

interface IJsonNodeSchemaForArray extends IJsonNodeSchemaBase<'array'> {

    /** The items of the array. */
    items?: IJsonNodeSchema | IJsonNodeSchema[];

    /** The minimum number of items required. */
    minItems?: number;

    /** The maximum number of items required. */
	maxItems?: number;

    /** If the items in the array should be unique. */
	uniqueItems?: boolean;
}

interface IJsonNodeSchemaForObject extends IJsonNodeSchemaBase<'object'> {
    
    /** The properties of the schema node. */
    properties?: Record<string, IJsonNodeSchema>;

    /** The minimum number of properties required. */
    minProperties?: number;

    /** The maximum number of properties required. */
    maxProperties?: number;

    /** The required properties. */
    required?: string[];

    /** The optional properties. */
    optionals?: string[];
}
