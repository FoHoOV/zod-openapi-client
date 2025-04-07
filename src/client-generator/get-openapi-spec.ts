import type { CUSTOM_OPERATION_FORMATTERS, optionsSchema } from "$/client-generator/schema";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import type { z } from "zod";
import SwaggerParser from "@apidevtools/swagger-parser";
import type {
	OpenAPIObject,
	OperationObject,
	PathItemObject,
	PathsObject
} from "openapi3-ts/oas31";

type Config = {
	output: string;
	tempDir: string;
} & z.infer<typeof optionsSchema>;

function loopOverPaths(
	spec: OpenAPIObject,
	callback: (paths: PathsObject, kvp: { path: string; value: PathItemObject }) => void
) {
	const paths = spec["paths"];

	if (!paths) {
		return;
	}

	Object.entries(paths).forEach(([path, value]) => {
		callback(paths, { path, value });
	});
}

function removePrefixes(spec: OpenAPIObject, prefixToReplace: string) {
	console.log("removing prefix from api endpoints", prefixToReplace);
	loopOverPaths(spec, (paths, { path, value }) => {
		if (!path.startsWith(prefixToReplace)) {
			return;
		}
		delete paths[path];
		paths[path.replace(prefixToReplace, "")] = value;
	});
	return spec;
}

function replacePrefixes(spec: OpenAPIObject, regex: RegExp, replacer: string) {
	console.log("replacing prefix from api endpoints", `from ${regex} to ${replacer}`);
	loopOverPaths(spec, (paths, { path, value }) => {
		if (!regex.test(path)) {
			return;
		}
		delete paths[path];
		paths[path.replace(regex, replacer)] = value;
	});
	return spec;
}

function modifySpec(spec: OpenAPIObject, config: Config) {
	const replaced = config.replaceEndpointRegex
		? config.replaceEndpointRegex.reduce(
				(prevSpec, pair) => replacePrefixes(prevSpec, pair[0], pair[1]),
				spec
		  )
		: spec;

	return config.removeEndpointPrefix
		? removePrefixes(replaced, config.removeEndpointPrefix)
		: replaced;
}

function writeCustomOperationIds(spec: OpenAPIObject, config: Config) {
	if (!config.customizeOperationId) {
		return;
	}

	console.log("adding operation ids");

	const format = (
		str: string,
		format: (typeof CUSTOM_OPERATION_FORMATTERS)[number] | undefined
	) => {
		if (!format) {
			return str;
		}

		return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
			if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces

			if (format === "camelcase") {
				return index === 0 ? match.toLowerCase() : match.toUpperCase();
			}

			if (format === "snakecase") {
				return index === 0 ? match.toLowerCase() : "-" + match.toLowerCase();
			}

			if (format === "pascalcase") {
				return match.toUpperCase();
			}

			throw new Error(`unhandled format: ${format}`);
		});
	};

	const httpMethods = ["put", "post", "get", "patch", "options", "delete"];
	loopOverPaths(spec, (_, { path, value }) => {
		Object.entries(value).forEach(([method, item]) => {
			if (!httpMethods.includes(method)) {
				return;
			}
			const casted = item as OperationObject;

			if (casted.operationId && !config.overwriteExistingOperationIds) {
				return;
			}

			const tag = casted.tags?.at(0) ?? "";
			const lastNoneParamSegment = path
				.split("/")
				.findLast((segment) => !segment.includes("{") && !segment.includes("}"));

			const newOperationId = config.customizeOperationId.reduce((prev, [command, formatter]) => {
				if (command === "tag") {
					prev += format(tag, formatter);
				}

				if (command == "last-segment") {
					prev += format(lastNoneParamSegment ?? "ERROR_NO_KNOWN_LAST_SEGMENT", formatter);
				}

				if (command === "method") {
					prev += format(method, formatter);
				}

				return prev;
			}, "");

			casted.operationId = newOperationId;
		});
	});
}

/**
 * @param config
 * @returns path to the file created
 */
export async function writeOpenApiSpec(config: Config) {
	let path: string | undefined = undefined;
	try {
		const spec = (await SwaggerParser.bundle(config.uri)) as OpenAPIObject;
		const modified = modifySpec(spec, config);
		writeCustomOperationIds(modified, config);

		await mkdir(config.tempDir, {
			recursive: true
		});

		const outFilePath = join(config.tempDir, config.output);

		console.log("writing openapi spec", outFilePath);

		await writeFile(outFilePath, JSON.stringify(modified), {
			encoding: "utf8"
		});

		path = outFilePath;

		console.log("successfully wrote openapi spec to", outFilePath);
	} catch (e) {
		console.error(e);
		throw e;
	} finally {
		return {
			outputFilePath: path,
			[Symbol.asyncDispose]: async () => {
				await rm(config.tempDir, { recursive: true, force: true });
			}
		};
	}
}
