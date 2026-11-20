import { test, expect } from "./fixture";

test("回忆横图缩略图适量增高，竖图保留原比例", async ({ page, app }) => {
	const assets = ["a".repeat(32), "b".repeat(32)];
	for (const [i, asset] of assets.entries()) {
		await page.route(`**/files/${asset}`, route => route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="${i ? 900 : 1600}" height="${i ? 1600 : 900}"/>` }));
	}
	await app.put("memories", "mixed", { c: 1, date: "2026-11-19", title: "横竖两张", photos: assets, text: "" });
	await page.goto("/memories");
	for (const [i, factor] of [1.2, 1].entries()) {
		const frame = page.locator(`#memory-photo-mixed-${i}`);
		await expect(frame).toHaveCSS("padding", "8px");
		const img = frame.locator("img");
		await img.scrollIntoViewIfNeeded();
		await expect.poll(() => img.evaluate((el: HTMLImageElement) => (el.clientHeight / el.clientWidth) / (el.naturalHeight / el.naturalWidth))).toBeCloseTo(factor, 1);
	}
});

for (const [width, height] of [[360, 740], [1280, 900]]) {
	test(`不同比例照片在同一位置连续翻页，分类无需滚动 · ${width}px`, async ({ page, app }) => {
		await page.setViewportSize({ width, height });
		for (const [i, [w, h]] of [[1600, 900], [900, 1600], [2400, 600], [32, 32]].entries()) {
			const asset = (i + 1).toString(16).padStart(32, "0");
			await app.put("photos", `aspect-${i}`, { asset, cap: `海岸 ${i + 1}`, tag: "sea", c: 4 - i });
			await page.route(`**/files/${asset}`, route => route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#668e98"/></svg>` }));
		}
		await page.goto("/album");
		const thumbs = page.getByRole("button", { name: /^查看第/ });
		for (const img of await thumbs.locator("img").all()) {
			await img.scrollIntoViewIfNeeded();
			const [actual, original] = await img.evaluate(async (el: HTMLImageElement) => {
				await el.decode();
				const rect = el.getBoundingClientRect();
				return [rect.height / rect.width, el.naturalHeight / el.naturalWidth];
			});
			expect(actual).toBeCloseTo(original, 2);
		}
		await thumbs.first().click();
		const box = page.getByRole("dialog"), next = box.getByRole("button", { name: "下一张" });
		await expect(box.getByRole("heading", { name: "海岸 1" })).toBeFocused();
		const initial = (await next.boundingBox())!;
		for (let i = 1; i <= 4; i++) {
			await expect(box.getByRole("status")).toHaveText(`${i} / 4`);
			await box.getByRole("img").evaluate(el => (el as HTMLImageElement).decode());
			if (i === 4) {
				await expect(box.getByRole("img")).toHaveCSS("object-fit", "scale-down");
				expect(await box.getByRole("img").evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(32);
			}
			const now = (await next.boundingBox())!;
			expect(Math.abs(now.y - initial.y)).toBeLessThanOrEqual(1);
			expect(Math.abs(now.x - initial.x)).toBeLessThanOrEqual(1);
			await expect(box.getByRole("button", { name: "日常" })).toBeInViewport({ ratio: 1 });
			expect(await box.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
			if (i < 4) await page.mouse.click(initial.x + initial.width / 2, initial.y + initial.height / 2);
		}
	});
}
