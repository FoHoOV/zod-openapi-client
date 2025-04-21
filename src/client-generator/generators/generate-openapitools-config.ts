import { spawn } from "child_process";
import { resolve as resolvePath } from "path";
import type { ConfigWithModifiedSpec } from "$/client-generator/generators/types";

export async function generateClients(config: ConfigWithModifiedSpec) {
	return new Promise((resolve) => {
		const cmd = spawn(
			"pnpm",
			[
				"exec",
				"openapi-generator-cli",
				"generate",
				"--output",
				config.out,
				"--generator-name",
				`typescript-${config.client}`,
				config.mode === "functional"
					? `-t ${resolvePath(import.meta.dirname, `templates/${config.client}`)}`
					: "",
				...[config.skipSpecValidations ? "--skip-validate-spec" : ""],
				"--input-spec",
				config.modifiedSpecPath,
				"--additional-properties",
				`supportsES6=true,ensureUniqueParams=true,legacyDiscriminatorBehavior=false,modelPackage=models,apiPackage=apis,withSeparateModelsAndApi=true${
					config.additionalOpenapitoolsOptions ? `,${config.additionalOpenapitoolsOptions}` : ""
				}${config.client === "axios" ? `,axiosVersion=${config.axiosVersion}` : ""}`
			],
			{
				shell: true
			}
		);

		cmd.stdout.on("data", (data) => {
			console.log(data.toString());
		});

		cmd.on("error", (error) => {
			console.error(error.message);
		});

		cmd.on("close", (code) => {
			if (code !== 0) {
				console.error("An error happened while using openapitools generator");
				throw new Error("application with exit code: " + code);
			}
			resolve(undefined);
		});
	});
}
