/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

/**
 * This file was copied from:
 *   https://github.com/kbkk/abitia/blob/master/packages/zod-dto/src/OpenApi/patchNestjsSwagger.ts
 */
import { OpenApiZodAny, generateVocabulary, generateSchema } from '@woodle/zod-openapi';
import type { SchemaObject as SchemaObject30 } from 'openapi3-ts/oas30';
// import type { SchemaObject as SchemaObject31 } from 'openapi3-ts/oas31';

interface Type<T = any> extends Function {
    new(...args: any[]): T;
}

type SchemaObjectFactoryModule =
    typeof import('@nestjs/swagger/dist/services/schema-object-factory');

export const patchNestjsSwagger = (
    schemaObjectFactoryModule: SchemaObjectFactoryModule | undefined = undefined,
): void => {
    const { SchemaObjectFactory } = (schemaObjectFactoryModule ??
        require('@nestjs/swagger/dist/services/schema-object-factory')) as SchemaObjectFactoryModule;

    const orgExploreModelSchema =
        SchemaObjectFactory.prototype.exploreModelSchema;

    const cachedZodSchemas: Record<string, OpenApiZodAny> = {};

    SchemaObjectFactory.prototype.exploreModelSchema = function (
        type: Type<unknown> | Function | any,
        schemas: any | Record<string, SchemaObject30>,
        schemaRefsStack: string[] = []
        // type: Type<unknown> | Function | any,
        // schemas: Record<string, SchemaObject>,
        // schemaRefsStack: string[] = []
    ) {
        if (this['isLazyTypeFunc'](type)) {
            type = (type as Function)();
        }

        if (!type.zodSchema) {
            return orgExploreModelSchema.call(this, type, schemas, schemaRefsStack);
        }

        // console.log('exploreModelSchema');
        // console.log(type.name);
        // console.log({cachedZodSchemas});
        const cachedSchemas = Object.entries(cachedZodSchemas).filter(([name, schema]) => name != type.name).map(cached => cached[1]);
        const vocabulary = generateVocabulary(cachedSchemas as OpenApiZodAny[])[1];
        if (!cachedZodSchemas[type.name]) {
            cachedZodSchemas[type.name] = type.zodSchema;
        }
        // console.log({vocabulary});
        schemas[type.name] = generateSchema(type.zodSchema, { vocabulary });
        // console.log(`schemas[${type.name}]`, JSON.stringify(schemas[type.name], null, 2));
        return type.name;
    };
};
