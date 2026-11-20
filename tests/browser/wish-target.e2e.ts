import { expect, test } from "./fixture";

for (const width of [320, 390, 1280]) {
	test(`${width}px 地区筛选完整显示，鼠标直达的心愿不被成功通知遮挡`, async ({ page, app }) => {
		await page.setViewportSize({ width, height: 800 });
		for (const route of ["/food", "/dates"]) {
			await page.goto(route);
			const choices = page.getByRole("group", { name: "按位置筛选" }).locator("label");
			await expect(choices.first()).toBeVisible();
			for (const choice of await choices.all()) {
				const box = (await choice.boundingBox())!;
				expect(box.x).toBeGreaterThanOrEqual(0);
				expect(box.x + box.width).toBeLessThanOrEqual(width);
			}
		}
		const card = page.getByRole("article").first();
		await card.getByRole("button", { name: /^加入心愿/ }).click();
		await card.getByRole("link", { name: /^已在心愿/ }).click();
		const item = page.locator('li[aria-current="location"]');
		await expect(item).toBeFocused();
		await expect(item).toBeInViewport({ ratio: 1 });
		await expect(item).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
		await expect(page.locator('[data-sonner-toast]').filter({ hasText: "已加入旅行地点" })).toHaveCount(0);
		await page.getByRole("radio", { name: "全部", exact: true }).locator("..").click();
		await expect(item).toHaveCount(0);
		await expect(page.getByRole("checkbox")).toHaveCount(1);
	});
}
