import { test, expect } from "./fixture";

test("封面照片上半部保留原色，桌面白色手写签名压在左下暗角，窄屏签名在照片下方；倒计时为四块磨砂玻璃", async ({ page, app }) => {
	await app.put("meta", "shared", { hero: await app.photo() });
	await page.goto("/");
	const image = page.getByRole("img", { name: "我们的封面照片" });
	await image.evaluate((el: HTMLImageElement) => el.decode());
	for (const width of [1280, 390, 320]) {
		await page.setViewportSize({ width, height: 800 });
		const screenshot = await image.screenshot({ animations: "disabled" });
		const [original, left, middle] = await image.evaluate(async (el: HTMLImageElement, data) => {
			const frame = new Image();
			frame.src = `data:image/png;base64,${data}`;
			await frame.decode();
			const canvas = document.createElement("canvas");
			canvas.width = frame.width; canvas.height = frame.height;
			const ctx = canvas.getContext("2d")!;
			const pixel = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
			ctx.drawImage(el, 0, 0);
			const source = pixel(0, 0);
			ctx.drawImage(frame, 0, 0);
			return [source, pixel(frame.width * .1, frame.height * .1), pixel(frame.width * .5, frame.height * .1)];
		}, screenshot.toString("base64"));
		expect(left).toEqual(original);
		expect(middle).toEqual(original);
		const heading = page.getByRole("heading", { level: 1 });
		const photo = (await image.boundingBox())!, title = (await heading.boundingBox())!;
		const look = await heading.evaluate(async (el) => {
			await document.fonts.ready;
			const shade = getComputedStyle(el.closest("section")!.firstElementChild!, "::after").backgroundImage;
			return { color: getComputedStyle(el).color, script: document.fonts.check("40px Pacifico"), shade };
		});
		expect(look.script).toBe(true);
		if (width < 768) {
			expect(title.y).toBeGreaterThanOrEqual(photo.y + photo.height);
			expect(look.shade).toBe("none");
		} else {
			expect(title.y + title.height).toBeLessThanOrEqual(photo.y + photo.height);
			expect(title.x).toBeLessThan(photo.x + photo.width * 0.4);
			expect(look.color).toBe("rgb(255, 255, 255)");
			expect(look.shade).toContain("radial-gradient");
		}
		const tiles = page.getByRole("region", { name: "倒计时" }).locator(":scope > div");
		await expect(tiles).toHaveCount(4);
		for (const glass of await tiles.evaluateAll((list) => list.map((el) => getComputedStyle(el)))) {
			expect(glass.backdropFilter).toContain("blur");
			expect(glass.backgroundColor).toMatch(/rgba\(.*, 0\.\d+\)/);
		}
	}
});

test("节日卡使用薄荷色，日期在两种外观下均随卡片文字配色", async ({ page, app }) => {
	await app.docs("meta");
	await page.goto("/");
	const card = page.getByRole("link", { name: /11\.26.*感恩节和圣诞/ });
	for (const theme of ["light", "dark"] as const) {
		await page.emulateMedia({ colorScheme: theme });
		await expect.poll(() => page.locator("html").evaluate(el => el.classList.contains("dark"))).toBe(theme === "dark");
		const { color, backgroundColor } = await card.evaluate(el => {
			const { color, backgroundColor } = getComputedStyle(el);
			return { color, backgroundColor };
		});
		const [r, g, b] = backgroundColor.match(/\d+/g)!.map(Number);
		expect(g).toBeGreaterThan(Math.max(r, b));
		if (theme === "light") expect(Math.min(r, g, b)).toBeGreaterThan(200);
		await expect(card.getByText("11.26 · 12.25")).toHaveCSS("color", color);
	}
});

test("外观默认跟随系统，手动覆盖可持久化并能恢复自动", async ({ page, app }) => {
	await app.docs("meta");
	await page.emulateMedia({ colorScheme: "dark" });
	await page.goto("/");
	const root = page.locator("html"), menu = page.getByRole("button", { name: "账号菜单" });
	await expect(root).toHaveClass(/\bdark\b/);
	await menu.click();
	await expect(page.getByRole("menuitemradio", { name: "跟随系统" })).toBeChecked();
	await page.getByRole("menuitemradio", { name: "浅色模式" }).click();
	await expect(root).not.toHaveClass(/\bdark\b/);
	await page.reload();
	await expect(menu).toBeVisible();
	await expect(root).not.toHaveClass(/\bdark\b/);
	await menu.click();
	await page.getByRole("menuitemradio", { name: "跟随系统" }).click();
	await expect(root).toHaveClass(/\bdark\b/);
	await page.emulateMedia({ colorScheme: "light" });
	await expect(root).not.toHaveClass(/\bdark\b/);
});

test("缩略图不放大小图；日期区分原戳、上传时间与无日期", async ({ page, app }) => {
	const asset = await app.photo();
	await app.put("photos", "old", { asset, cap: "旧数据", c: 1, tag: "sea" });
	await app.put("photos", "upload", { asset, cap: "新上传", c: new Date(2026, 10, 19, 12).getTime(), tag: "sea" });
	await app.put("photos", "source", { asset, cap: "原照", st: "'25 03 08", c: 0, tag: "sea" });
	await page.goto("/album");
	await expect(page.getByRole("button", { name: /查看第.*旧数据/ }).locator(".film-stamp")).toHaveCount(0);
	await expect(page.getByRole("button", { name: /查看第.*新上传/ }).locator(".film-stamp")).toHaveText("上传 '26 11 19");
	await expect(page.getByRole("button", { name: /查看第.*原照/ }).locator(".film-stamp")).toHaveText("'25 03 08");
	await expect(page.getByRole("img", { name: "新上传" })).toHaveCSS("object-fit", "scale-down");
	await page.route(`**/files/${asset}`, route => route.abort());
	await page.reload();
	await page.getByRole("button", { name: /查看第.*新上传/ }).click();
	const viewer = page.getByRole("dialog");
	await expect(viewer.getByText("照片没能打开。")).toBeVisible();
	await page.unroute(`**/files/${asset}`);
	await viewer.getByRole("button", { name: "重新加载照片" }).click();
	await viewer.getByRole("img").evaluate(el => (el as HTMLImageElement).decode());
	await page.keyboard.press("Escape");
	const text = "傍晚一起走在海边。".repeat(60);
	await app.put("memories", "note", { date: "2026-11-20", photos: [], c: 1, text, title: "最近的散步。".repeat(20) });
	await app.put("memories", "photo", { date: "2026-11-19", photos: [asset], c: 1, text, title: "海边" });
	await page.goto("/");
	const photo = page.locator('a[href="/memories?item=photo"]');
	await expect(photo.locator("img")).toHaveCSS("object-fit", "scale-down");
	expect((await photo.locator(".line-clamp-2").last().boundingBox())!.height).toBeLessThan(45);
	const note = page.locator('a[href="/memories?item=note"]');
	expect((await note.boundingBox())!.height).toBeLessThan(250);
	await note.click();
	await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
});

test("两扇窗：明信片长文字恰好露 4 行不露半行，每日一问是可聚焦的淡粉纸质甜点券", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date("2026-11-19T12:00:00"));
	const long = Array.from({ length: 8 }, (_, i) => `第 ${i + 1} 行：今天考完试去吃了泰国菜，被说成韩国菜。`).join("\n");
	await app.put("diary", "today", { date: "2026-11-19", kind: "apart", title: "", c: 1, yi: { t: long, fav: "", photo: "" }, jq: { t: "", fav: "", photo: "" } });
	await app.put("daily", "2026-11-19", { q: "如果有一天假期，你想怎么和我过？", yi: { t: "去海边", at: 1 } });
	await page.goto("/");
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 900 });
		const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "同一天，两扇窗" }) });
		await expect(section.getByRole("heading", { name: "Yi", level: 3 })).toBeVisible();
		await expect(section.getByText("Jia Qi 今天还没写")).toBeVisible();
		const text = section.locator("p").filter({ hasText: "第 1 行" });
		const box = await text.evaluate((el) => ({ height: el.getBoundingClientRect().height, line: parseFloat(getComputedStyle(el).lineHeight), cut: el.scrollHeight > el.clientHeight }));
		expect(box.cut).toBe(true);
		expect(box.height).toBeCloseTo(box.line * 4, 0);
		const ticket = section.getByRole("link", { name: /如果有一天假期/ });
		await expect(ticket).toContainText("Yi 已回答");
		await expect(ticket).toContainText("Jia Qi 还没答");
		expect(await ticket.evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/svg.*linear-gradient/s);
		await ticket.focus();
		expect(await ticket.evaluate((el) => getComputedStyle(el, "::before").borderTopStyle)).toBe("solid");
		await ticket.blur();
	}
});
