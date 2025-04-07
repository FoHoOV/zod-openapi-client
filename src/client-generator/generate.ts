import { mkdir, rm } from "fs/promises";

import type { z } from "zod";

import { writeOpenApiSpec } from "$/client-generator/get-openapi-spec.js";
import { join } from "path";
import { generateClients } from "$/client-generator/generators/generate-openapitools-config";
import { generateZodSchemas } from "$/client-generator/generators/generate-zod-schemas";
import type { optionsSchema } from "$/client-generator/schema";

export async function generate(config: z.infer<typeof optionsSchema>) {
	console.log("Generating clients! @FoHoOV");

	await rm(config.out, {
		force: true,
		recursive: true
	});

	await mkdir(config.out, {
		recursive: true
	});

	await using specPath = await writeOpenApiSpec({
		output: "spec.json",
		tempDir: join(config.out, ".tmp"),
		...config
	});

	if (!specPath.outputFilePath) {
		throw new Error("failed to write spec file (or transform it)");
	}

	await generateClients({ ...config, modifiedSpecPath: specPath.outputFilePath });
	await generateZodSchemas({ ...config, modifiedSpecPath: specPath.outputFilePath });
}
