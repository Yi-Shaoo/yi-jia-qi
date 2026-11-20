import { test, expect } from "./fixture";

for (const width of [360, 1280]) {
	test(`主操作和照片浏览工具保持一致尺寸 · ${width}px`, async ({ page, app }) => {
		const asset = await app.photo();
		await app.put("memories", "coast", { date: "2026-11-19", title: "海边", photos: [asset, asset], text: "", c: 1 });
		await page.setViewportSize({ width, height: 800 });
		await page.goto("/play");
		const buttons = page.locator('main button:visible, main summary:visible');
		await expect(page.getByRole("button", { name: "喂一个马卡龙" })).toBeVisible();
		for (const b of await buttons.all()) expect((await b.boundingBox())!.height, await b.textContent()).toBeGreaterThanOrEqual(40);
		if (width >= 1024) {
			const pet = (await page.locator("#pet").boundingBox())!, gacha = (await page.locator("#gacha").boundingBox())!;
			expect(pet.y).toBe(gacha.y);
			expect(pet.height).toBe(gacha.height);
		}
		await page.goto("/memories");
		await page.getByRole("button", { name: /查看.*第 1 张/ }).click();
		const dialog = page.getByRole("dialog"), more = dialog.getByRole("button", { name: "照片操作" });
		for (const name of ["上一张", "下一张", "照片操作", "关闭"]) {
			const box = (await dialog.getByRole("button", { name }).boundingBox())!;
			expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
		}
		await expect(dialog.getByText("删除这张照片")).toHaveCount(0);
		await more.click();
		await page.getByRole("menuitem", { name: "删除这张照片" }).click();
		await expect(page.getByRole("alertdialog")).toHaveAccessibleDescription(/海边.*第 1 张.*无法撤销/);
		await page.getByRole("button", { name: "取消" }).click();
		await expect(more).toBeFocused();
		await expect(dialog.getByRole("status")).toHaveText("1 / 2");
		await dialog.getByRole("button", { name: "关闭" }).click();
		await page.getByRole("button", { name: "编辑回忆：海边" }).click();
		await expect(dialog.getByRole("heading", { name: "编辑回忆" })).toBeFocused();
		for (const node of [dialog.getByRole("button", { name: "关闭" }), dialog.getByRole("button", { name: /移除.*第 1 张/ })]) {
			const bounds = (await node.boundingBox())!;
			expect(Math.min(bounds.width, bounds.height)).toBeGreaterThanOrEqual(44);
		}
		await app.put("photos", "album-photo", { c: 1, cap: "海边", asset, tag: "sea" });
		await page.goto("/album");
		await page.getByRole("button", { name: /^查看第/ }).click();
		await expect(dialog.getByRole("heading", { name: "海边" })).toBeFocused();
		expect((await dialog.getByLabel("照片名", { exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
		if (width >= 1024) {
			await expect(dialog.getByRole("button", { name: "日常" })).toBeInViewport({ ratio: 1 });
			expect(await dialog.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
		}
	});
}
