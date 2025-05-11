import { writeFile, mkdir } from "fs/promises";
import { join, resolve as resolvePath } from "path";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { ConfigWithModifiedSpec } from "$/client-generator/generators/types";
import { generateZodClientFromOpenAPI } from "openapi-zod-client";
import type { OpenAPIObject } from "openapi3-ts/oas30";
import Handlebars, { type HelperOptions } from "handlebars";

async function runTypedOpenApi(config: ConfigWithModifiedSpec) {
	const now = new Date();
	registerGlobalHandlebarHelper();
	const openApiDoc = (await SwaggerParser.bundle(config.modifiedSpecPath)) as OpenAPIObject;
	const content = await generateZodClientFromOpenAPI({
		openApiDoc: openApiDoc,
		disableWriteToFile: true,
		templatePath: resolvePath(import.meta.dirname, `templates/openapi-zod/template.hbs`),
		options: {
			withAlias: true,
			exportSchemas: true,
			withDeprecatedEndpoints: true,
			withDocs: true,
			additionalPropertiesDefaultValue: false
		}
	});

	console.log(`Done in ${new Date().getTime() - now.getTime()}ms!`);
	return content;
}

export async function generateZodSchemas(config: ConfigWithModifiedSpec) {
	const contents = await runTypedOpenApi(config);

	const OUTPUT_SCHEMA_FILE_NAME = "schemas.ts";
	const SCHEMA_FOLDER_PATH = `${config.out}/zod`;
	const SCHEMA_FILE_PATH = join(SCHEMA_FOLDER_PATH, OUTPUT_SCHEMA_FILE_NAME);

	await mkdir(SCHEMA_FOLDER_PATH, {
		recursive: true
	});

	console.log("writing zod schemas...", OUTPUT_SCHEMA_FILE_NAME);

	await writeFile(SCHEMA_FILE_PATH, contents, {
		encoding: "utf-8"
	});
}

interface OpenApiParam {
	name: string;
	type: "Query" | "Path" | "Body" | string;
	schema: string;
}

function registerGlobalHandlebarHelper() {
	// 1) “Monkey‐patch” the factory so every new instance gets our helper
	const originalCreate = Handlebars.create;
	Handlebars.create = function (...args) {
		const instance = originalCreate.apply(this, args);

		instance.registerHelper(
			"fohoovEachByType",
			function (parameters: unknown, type: string, options: HelperOptions): string {
				// make sure we actually have an array of params
				if (!Array.isArray(parameters)) {
					return "";
				}
				// narrow to exactly the shape we expect
				const params = parameters as OpenApiParam[];
				const filtered: OpenApiParam[] = params.filter((p) => p.type === type);

				let out = "";
				filtered.forEach((item, idx) => {
					// carry over the “first”/“last” flags into the block context
					const data = Handlebars.createFrame(options.data || {});
					data.first = idx === 0;
					data.last = idx === filtered.length - 1;
					out += options.fn(item, { data });
				});
				return out;
			}
		);

		return instance;
	};
}
