import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { mapOpenApiEndpoints, generateFile } from "typed-openapi";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import type { ConfigWithModifiedSpec } from "$/client-generator/generators/types";

async function runTypedOpenApi(config: ConfigWithModifiedSpec) {
	const now = new Date();

	const openApiDoc = (await SwaggerParser.bundle(config.modifiedSpecPath)) as OpenAPIObject;

	const ctx = mapOpenApiEndpoints(openApiDoc);
	console.log(`Found ${ctx.endpointList.length} endpoints`);

	const content = generateFile({ ...ctx, runtime: "zod" });

	console.log(`Done in ${new Date().getTime() - now.getTime()}ms!`);
	return content;
}

export async function generateZodSchemas(config: ConfigWithModifiedSpec) {
	const contents = await runTypedOpenApi(config);

	const matches = Array.from(
		contents.matchAll(
			/^([\s\S]*)(\n\n\/\/ <EndpointByMethod>\n[\s\S]*\n\/\/ <\/EndpointByMethod\.Shorthands>\n\n)(\/\/ <ApiClientTypes>\n[\s\S]*\n\n\/\/ <\/ApiClientTypes>)/g
		)
	);

	if (matches.length !== 1) {
		throw new Error("couldn't extract zod schemas: matched more than one schemas regex");
	}

	if (matches[0].length !== 4) {
		throw new Error("ts-to-zod output didn't match the expected regex");
	}

	const [_all, schemas, endpointToSchema, _client] = matches[0];
	const output = config.includeZodEndpointToSchemaOutput ? schemas + endpointToSchema : schemas;

	const OUTPUT_SCHEMA_FILE_NAME = "schemas.ts";
	const SCHEMA_FOLDER_PATH = `${config.out}/zod`;
	const SCHEMA_FILE_PATH = join(SCHEMA_FOLDER_PATH, OUTPUT_SCHEMA_FILE_NAME);

	await mkdir(SCHEMA_FOLDER_PATH, {
		recursive: true
	});

	console.log("writing zod schemas...", OUTPUT_SCHEMA_FILE_NAME);

	const header = `// @ts-nocheck`;
	await writeFile(SCHEMA_FILE_PATH, `${header}\n${output}`, {
		encoding: "utf-8"
	});
}
