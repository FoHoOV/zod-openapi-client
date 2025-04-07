import { generate } from "$/client-generator/generate";
import { CUSTOM_OPERATION_COMMANDS, optionsSchema } from "$/client-generator/schema";
import { program, Option, Command } from "commander";

/**
 * @returns the created command
 */
export function setupCommand() {
	const command = new Command("generate-clients");
	command
		.addOption(
			new Option("--uri <uri>", "openapi json spec address")
				.env("OPENAPI_URL")
				.makeOptionMandatory(true)
		)
		.addOption(
			new Option("--mode <string>", "generated output should be functional or oop").default("oop")
		)
		.addOption(new Option("--client <string>", "axios or fetch").default("fetch"))
		.addOption(
			new Option(
				"--axios-version <string>",
				"axios version (only acceptable when client is set to axios)"
			).default("1.7.0")
		)
		.addOption(new Option("--out <string>", "output directory").default("src/generated-clients"))
		.addOption(
			new Option(
				"--remove-endpoint-prefix <string>",
				"removes a prefix from endpoints, ie turns /x/path to /path"
			)
		)
		.addOption(
			new Option(
				"--replace-endpoint-regex <pair...>",
				"replaces regex with replace value, runs before remove-endpoint-prefix command, ie --replace-endpoint-regex /api/,/account-report-service/"
			)
		)
		.addOption(
			new Option(
				"--skip-spec-validations <boolean>",
				"see https://openapi-generator.tech/docs/configuration/ and search for skip-validate-spec"
			)
		)
		.addOption(
			new Option(
				"--customize-operation-id <boolean>",
				`modify operationId of spec, with any combinations of ${JSON.stringify(
					CUSTOM_OPERATION_COMMANDS
				)}. For POST /api/Account/inquiry-account-balance/{account} we can do m_ls_m:camelcase which will generate postInquiryAccountBalancePost. Current available formatters are ${JSON.stringify(
					CUSTOM_OPERATION_COMMANDS
				)}.
				note that, methods with existing operationIds are ignored, if you want to modify them use it in combination with '--overwrite-existing-operation-ids'
				`
			)
		)
		.addOption(
			new Option(
				"--overwrite-existing-operation-ids",
				"if needed, used in combination with '--customize-operation-id'."
			)
		)
		.addHelpText(
			"afterAll",
			"\n* in order to ignore generating some apis or models, consider using the `.openapi-generator-ignore` file"
		)
		.action((options) => {
			call(options);
		});
	program.addCommand(command);
	return command;
}

export function call(obj: object) {
	generate(optionsSchema.parse(obj));
}
