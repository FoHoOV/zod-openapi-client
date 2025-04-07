import type { optionsSchema } from "$/client-generator/schema";
import type { z } from "zod";

export type ConfigWithModifiedSpec<
	T extends z.infer<typeof optionsSchema> = z.infer<typeof optionsSchema>
> = T & {
	modifiedSpecPath: string;
};
