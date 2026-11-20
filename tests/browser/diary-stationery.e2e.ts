import { test, expect } from "./fixture";

test("日记的两张明信片在窄屏叠放、桌面并排，保留作者、照片与编辑入口", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date(2026, 10, 19, 12));
	await app.put("diary", "postcards", {
		date: "2026-11-18", c: 1, kind: "together", title: "书店的明信片", place: "书店",
		yi: { t: "PostcardWithoutSpaces".repeat(23), pl: "窗边", fav: "一起挑的那张卡", photo: await app.photo() },
		jq: { t: "", photo: "", fav: "" },
	});
	await page.goto("/diary");
	const entry = page.getByRole("article", { name: "书店的明信片" });
	const yi = entry.getByRole("region", { name: "From Yi" }), jq = entry.getByRole("region", { name: "From Jia Qi" });
	await expect(jq.getByText("还没写")).toBeVisible();
	for (const width of [320, 390, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		const [a, b] = await Promise.all([yi.boundingBox(), jq.boundingBox()]);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		if (width < 701) expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
		else { expect(Math.abs(a!.y - b!.y)).toBeLessThan(2); expect(b!.x).toBeGreaterThan(a!.x + a!.width); }
	}
	await page.getByRole("button", { name: "戳一下布丁" }).click();
	await expect(page.getByText("戳戳我", { exact: true })).not.toBeVisible();
	await yi.getByRole("button", { name: "Yi 这天的照片" }).click();
	await expect(page.getByRole("dialog", { name: "Yi · 2026.11.18" })).toBeVisible();
	await page.keyboard.press("Escape");
	await yi.getByRole("button", { name: "改我的这一边" }).click();
	await expect(page.getByRole("dialog").getByLabel("正文", { exact: true })).toBeFocused();
});
