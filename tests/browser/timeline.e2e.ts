import { test, expect } from "./fixture";

for (const width of [360, 1280]) {
	test(`回忆正文按真实行数折叠，照片与展开操作易于到达 · ${width}px`, async ({ page, app }) => {
		await page.setViewportSize({ width, height: 800 });
		const text = "海边的落日渐渐沉下去。".repeat(40), photo = await app.photo();
		await app.put("memories", "long", { date: "2026-11-19", title: "散步", c: 2, text, photos: [photo] });
		await app.put("memories", "short", { date: "2026-11-18", title: "散步", c: 1, text: "天气很好。", photos: [] });
		await page.goto("/memories?item=long");
		const more = page.getByRole("button", { name: "展开全文" });
		await expect(more).toHaveCount(1);
		const id = await more.getAttribute("aria-controls"), p = page.locator(`[id="${id}"]`);
		const collapsed = (await p.boundingBox())!;
		expect(collapsed.height).toBeLessThan(155);
		const thumb = page.getByRole("button", { name: /^查看.*照片/ });
		if (width >= 1024) expect((await thumb.boundingBox())!.x).toBeGreaterThan(collapsed.x + collapsed.width);
		await more.press("Enter");
		const less = page.getByRole("button", { name: "收起正文" });
		await expect(less).toHaveAttribute("aria-expanded", "true");
		expect((await p.boundingBox())!.height).toBeGreaterThan(collapsed.height);
		await less.scrollIntoViewIfNeeded();
		await less.click();
		await expect(more).toBeFocused();
		await expect(page.locator("#memory-long")).toBeInViewport({ ratio: 1 });
		expect((await page.locator("#memory-long").boundingBox())!.y).toBeGreaterThanOrEqual(64);
		await thumb.click();
		await expect(page.getByRole("dialog")).toBeVisible();
	});
}

test("390px 在长文底部收起后留在本条，而不是下一条记录", async ({ page, app }) => {
	await page.setViewportSize({ width: 390, height: 740 });
	for (let i = 0; i < 5; i++) await app.put("memories", `coast-${i}`, { date: `2026-11-1${i}`, c: i, title: `沿海第 ${i} 天`, text: "海岸线旁的一段回忆。\n".repeat(50), photos: [] });
	await page.goto("/memories");
	const title = page.locator("#memory-coast-3");
	const row = page.getByRole("listitem").filter({ has: title });
	await row.getByRole("button", { name: "展开全文" }).click();
	const less = row.getByRole("button", { name: "收起正文" });
	await less.scrollIntoViewIfNeeded();
	await expect(title).not.toBeInViewport();
	await less.click();
	await expect(title).toBeInViewport({ ratio: 1 });
	await expect(row.getByRole("button", { name: "展开全文" })).toBeFocused();
	expect((await title.boundingBox())!.y).toBeGreaterThanOrEqual(64);
});

test("跨页日记操作标明对象，心愿不显示占位时间戳", async ({ page, app }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.clock.setFixedTime(new Date(2026, 10, 19, 12));
	await app.put("wishes", "old", { c: 1, t: "野餐", d: false });
	await app.put("wishes", "recent", { c: new Date(2026, 10, 18, 12).getTime(), t: "散步", d: false });
	await app.put("diary", "now", { date: "2026-11-19", kind: "apart", title: "我的今天", c: 1, yi: { t: "等日落", fav: "", photo: "" }, jq: { t: "", fav: "", photo: "" } });
	await page.goto("/wish");
	await expect(page.locator("#wish-old time")).toHaveCount(0);
	await expect(page.locator("#wish-recent time")).toHaveText("11.18");
	await page.getByRole("banner").getByRole("link", { name: "改今天的日记" }).click();
	await expect(page.getByRole("dialog").getByLabel("正文", { exact: true })).toHaveValue("等日落");
});
