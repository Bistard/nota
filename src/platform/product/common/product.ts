import { IJsonSchema } from "src/base/common/json";

/**
 * @note When updating {@link IProductProfile}, remember to update 
 * the {@link productProfileSchema} as well.
 */
export interface IProductProfile {
    readonly projectName: string;
    readonly applicationName: string;
    readonly description: string;

    readonly version: string;
    readonly license: string;
}

export const productProfileSchema: IJsonSchema = {
    type: 'object',
    properties: {
        projectName: { type: 'string' },
        applicationName: { type: 'string' },
        description: { type: 'string' },
        version: { type: 'string' },
        license: { type: 'string' },
    },
    required: ['projectName', 'applicationName', 'description', 'version', 'license'],
};
