import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	build: {
		ssr: true,
		emptyOutDir: true,
		sourcemap: false,
		lib: {
			entry: resolve(import.meta.dirname, "./src/cli.ts"),
			formats: ["es"],
			name: "cli",
			fileName: "cli"
		}
	},
	plugins: [
		tsconfigPaths(),
		dts({
			insertTypesEntry: true
		})
	]
});
