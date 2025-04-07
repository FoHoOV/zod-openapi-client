import nodePlugin from "eslint-plugin-n";
import tseslint from "typescript-eslint";

export default tseslint.config(
	...tseslint.configs.recommended,
	nodePlugin.configs["flat/recommended"],
	nodePlugin.configs["flat/recommended-module"],
	{
		settings: {
			node: {
				convertPath: {
					"src/**/*.ts": ["^src/(.+?)\\.ts$", "dist/$1.js"]
				},
				tryExtensions: [".js", ".ts"]
			}
		},
		rules: {
			"n/no-missing-import": [
				"warn",
				{
					ignoreTypeImport: true,
					tsconfigPath: "./tsconfig.json"
				}
			],
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true
				}
			]
		}
	},
	{ ignores: [".tmp/", "dist/"] }
);
