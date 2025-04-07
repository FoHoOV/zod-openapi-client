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

	const groups = Array.from(
		contents.matchAll(
			/^([\s\S]*)\/\/ <\/ApiClientTypes>\n\n\/\/ <ApiClient>\nexport class ApiClient \{[\s\S]*\/\/ <\/ApiClient/g
		)
	);

	if (groups.length > 1) {
		throw new Error("couldn't extract zod schemas: matched more than one schemas regex");
	}

	const output = groups[0][1];

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
