import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		fileParallelism: false,
	},
	resolve: {
		alias: {
			"#": resolve(__dirname, "./src"),
		},
	},
});
