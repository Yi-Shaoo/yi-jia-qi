import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/browser",
	testMatch: "**/*.e2e.ts",
	fullyParallel: true,
	workers: 2,
	use: {
		browserName: "chromium",
		launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
		viewport: { width: 360, height: 800 },
		reducedMotion: "reduce",
		locale: "zh-CN",
		trace: "retain-on-failure",
	},
});
