import { test, expect } from "./fixture";

test("日记编辑器：宽屏并排写个人内容和共用字段，窄屏先写正文", async ({ page, app }) => {
	await app.docs("diary");
	await page.goto("/diary?write=today");
	const editor = page.getByRole("dialog");
	const personal = editor.getByRole("group", { name: "Yi 的这一边", exact: true });
	const shared = editor.getByRole("group", { name: "两人共用", exact: true });
	await expect(editor.getByLabel("正文", { exact: true })).toBeFocused();
	for (const width of [320, 768, 1280]) {
		await page.setViewportSize({ width, height: 700 });
		const [p, s] = await Promise.all([personal.boundingBox(), shared.boundingBox()]);
		if (width < 768) expect(s!.y).toBeGreaterThanOrEqual(p!.y + p!.height);
		else {
			expect(s!.x).toBeGreaterThan(p!.x + p!.width);
			expect(p!.width).toBeGreaterThan(s!.width);
		}
		expect(await editor.locator("form").evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
		await expect(editor.getByRole("button", { name: "发布", exact: true })).toBeInViewport({ ratio: 1 });
	}
});

test("见面日没有地点栏，切回各自日保留个人地点和历史数据", async ({ page, app }) => {
	await app.put("diary", "places", { date: "2024-05-01", c: 1, kind: "apart", title: "五一", place: "公园", yi: { t: "看书", pl: "家", fav: "", photo: "" }, jq: { t: "上课", pl: "学校", fav: "", photo: "" } });
	await page.goto("/diary");
	const card = page.getByRole("article", { name: "五一" }), editor = page.getByRole("dialog");
	await expect(card.getByText(/共享地点/)).toHaveCount(0);
	await expect(card.getByRole("region", { name: "From Yi" }).getByText("家", { exact: true })).toBeVisible();
	await expect(card.getByRole("region", { name: "From Jia Qi" }).getByText("学校", { exact: true })).toBeVisible();
	await card.getByRole("button", { name: "改我的这一边" }).click();
	await editor.getByText("见面的一天", { exact: true }).click();
	await expect(editor.getByLabel("我在哪")).toHaveCount(0);
	await expect(editor.getByLabel("共享地点", { exact: true })).toHaveCount(0);
	await page.keyboard.press("Escape");
	await card.getByRole("button", { name: "继续写草稿" }).click();
	await expect(editor.getByLabel("共享地点", { exact: true })).toHaveCount(0);
	await editor.getByRole("button", { name: "发布", exact: true }).click();
	await expect(editor).toHaveCount(0);
	await expect(card.getByText(/公园|共享地点/)).toHaveCount(0);
	expect((await app.docs("diary"))[0].data.place).toBe("公园");
	await expect(card.getByText(/^(家|学校)$/)).toHaveCount(0);
	await card.getByRole("button", { name: "改我的这一边" }).click();
	await editor.getByText("各自的一天", { exact: true }).click();
	await expect(editor.getByLabel("我在哪")).toHaveValue("家");
	await editor.getByRole("button", { name: "发布", exact: true }).click();
	await expect(card.getByText(/共享地点/)).toHaveCount(0);
	await expect(card.getByText("学校", { exact: true })).toBeVisible();
});

test("日记的两张明信片在窄屏叠放、桌面并排，保留作者、照片与编辑入口", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date(2026, 10, 19, 12));
	await app.put("diary", "postcards", {
		date: "2026-11-18", c: 1, kind: "together", title: "书店的明信片", place: "书店",
		yi: { t: "PostcardWithoutSpaces".repeat(23), pl: "窗边", fav: "一起挑的那张卡", photo: await app.photo() },
		jq: { t: "", photo: "", fav: "" },
	});
	await page.goto("/diary");
	const entry = page.getByRole("article", { name: "书店的明信片" });
	await expect(entry.locator('time[datetime="2026-11-18"]')).toHaveText("2026.11.18");
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
