import { z } from "zod";

export const CUSTOM_OPERATION_COMMANDS = ["tag", "last-segment", "method"] as const;
export const CUSTOM_OPERATION_FORMATTERS = ["camelcase", "snakecase", "pascalcase"] as const;

export const sharedOptionsSchema = z.object({
	uri: z.string(),
	out: z.string(),
	mode: z.union([z.literal("functional"), z.literal("oop")]),
	/**
	 * if api endpoints start with `removeEndpointPrefix` it will replace the path with an empty string
	 * @example
	 * /api/something/something-else -> /something/something-else
	 */
	removeEndpointPrefix: z.string().optional(),
	replaceEndpointRegex: z
		.array(z.string())
		.optional()
		.refine((value) => value === undefined || value.every((pair) => pair.split(",").length == 2), {
			message: "this prop should have two values separated by comma"
		})
		.transform((value) => {
			return value?.map((pair) =>
				pair?.split(",").map((v, i) => {
					if (i == 0) {
						return RegExp(v.trim(), "g");
					}
					return v.trim();
				})
			) as [RegExp, string][];
		}),
	skipSpecValidations: z.boolean({ coerce: true }).optional(),
	customizeOperationId: z
		.string()
		.optional()
		.refine(
			(v) =>
				v === undefined ||
				v.split("_").every((cmd) => {
					const sp = cmd.split(":");
					if (!CUSTOM_OPERATION_COMMANDS.some((cmd) => cmd == sp[0])) {
						return false;
					}
					if (sp[1] && !CUSTOM_OPERATION_FORMATTERS.some((cmd) => cmd == sp[1])) {
						return false;
					}

					return true;
				}),
			{
				message: `invalid format, correct format is any combinations of commands=${CUSTOM_OPERATION_COMMANDS} joined with '_' and formatters=${JSON.stringify(
					CUSTOM_OPERATION_FORMATTERS
				)} appended with ':'`
			}
		)
		.transform((v) => {
			type Commands = (typeof CUSTOM_OPERATION_COMMANDS)[number];
			type Formatters = (typeof CUSTOM_OPERATION_FORMATTERS)[number];

			return v?.split("_").map((v) => v.split(":")) as (
				| [`${Commands}`, `${Formatters}`]
				| [`${Commands}`]
			)[];
		}),
	overwriteExistingOperationIds: z.boolean({ coerce: true }).optional(),
	additionalOpenapitoolsOptions: z.string().optional()
});

export const optionsSchema = z.discriminatedUnion("client", [
	sharedOptionsSchema.merge(
		z.object({
			client: z.literal("axios"),
			axiosVersion: z.string()
		})
	),
	sharedOptionsSchema.merge(
		z.object({
			client: z.literal("fetch")
		})
	)
]);
