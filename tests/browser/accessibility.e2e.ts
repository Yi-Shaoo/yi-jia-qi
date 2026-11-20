import { test, expect } from "./fixture";

test("键盘可跳过导航；五次站内换页均播报标题", async ({ page, app }) => {
	await app.docs("meta");
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/");
	await expect(page.locator("main h1")).toBeVisible();
	await page.keyboard.press("Tab");
	await expect(page.getByRole("link", { name: "跳到主要内容" })).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.getByRole("main")).toBeFocused();
	await page.keyboard.press("Tab");
	expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
	for (const [group, label] of [["出去玩", "约会去哪"], ["出去玩", "今天吃什么"], ["互动", "一起玩"], ["我们的", "我们的回忆"], ["我们的", "关于我们"]]) {
		const trigger = page.locator("header").getByRole("button", { name: group, exact: true });
		await trigger.focus();
		await page.keyboard.press("Enter");
		const link = page.locator("header").getByRole("link", { name: new RegExp(label) });
		await link.focus();
		await page.keyboard.press("Enter");
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(label);
		await expect(page.locator('span[aria-live="polite"][aria-atomic="true"]')).toHaveText(label);
	}
});

test("手机首页首屏可直接写日记；减少动画偏好不会留下无限动效", async ({ page, app }) => {
	await app.docs("meta");
	await page.goto("/");
	const write = page.locator("main section").first().getByRole("link", { name: "写下今天" });
	await expect(write).toBeInViewport({ ratio: 1 });
	expect((await write.boundingBox())!.height).toBeGreaterThanOrEqual(44);
	await write.click();
	await expect(page.getByRole("dialog")).toBeVisible();
	await page.goto("/play");
	await expect(page.getByRole("heading", { name: "每日一问" })).toBeVisible();
	expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations === Infinity).length)).toBe(0);
});
