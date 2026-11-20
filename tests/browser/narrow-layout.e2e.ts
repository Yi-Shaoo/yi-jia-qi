import { test, expect } from "./fixture";

test("320px：日期不折行，回忆编辑不掉到标题底部", async ({ page, app }) => {
	await page.setViewportSize({ width: 320, height: 720 });
	const asset = await app.photo();
	await app.put("photos", "upload", { cap: "夜宵", asset, c: Date.UTC(2026, 10, 18, 14), tag: "daily" });
	await page.goto("/album");
	const stamp = page.locator(".polaroid .film-stamp");
	await expect(stamp).toContainText("上传");
	expect(await stamp.evaluate(el => el.getBoundingClientRect().height < parseFloat(getComputedStyle(el).lineHeight) * 2)).toBe(true);
	const holder = (await stamp.locator("..").boundingBox())!, badge = (await stamp.boundingBox())!;
	expect(badge.x).toBeGreaterThanOrEqual(holder.x);
	await app.put("memories", "late", { c: 1, date: "2026-11-18", title: "Diamond Jamboree 夜宵", text: "吃拉面", photos: [] });
	await page.goto("/memories");
	const heading = (await page.getByRole("heading", { name: "Diamond Jamboree 夜宵" }).boundingBox())!;
	const pencil = (await page.getByRole("button", { name: /编辑回忆：Diamond/ }).boundingBox())!;
	expect(pencil.x).toBeGreaterThanOrEqual(heading.x + heading.width);
	expect(pencil.y).toBeLessThan(heading.y + heading.height);
});

test("390px 两个地区目录的添加动作都在说明下方", async ({ page, app }) => {
	await app.docs("custom");
	await page.setViewportSize({ width: 390, height: 800 });
	for (const [route, label] of [["/dates", "添加地点"], ["/food", "添加餐厅"]]) {
		await page.goto(route);
		const heading = page.getByRole("heading", { level: 1 });
		const text = (await heading.locator("../p").boundingBox())!, add = (await page.getByRole("button", { name: label }).boundingBox())!;
		expect(add.x).toBe(text.x);
		expect(add.y).toBeGreaterThanOrEqual(text.y + text.height);
	}
});
