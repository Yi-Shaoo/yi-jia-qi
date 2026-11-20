import { expect, test } from "./fixture";

const day = "2026-11-10";
const emptySide = { t: "", fav: "", photo: "" };

for (const mine of [true, false]) {
	test(`${mine ? "本人" : "仅对方"}已写今天：首页、顶栏和日记页的入口与打开的内容一致`, async ({ page, app, site }) => {
		await page.clock.setFixedTime(new Date(2026, 10, 10, 12));
		await app.put("diary", "first", { date: day, kind: "apart", title: "同行", c: 1,
			yi: { ...emptySide, fav: "等红灯时看到彩虹" }, jq: { ...emptySide, t: "  " } });
		if (!mine) await expect(await page.request.post("/api/login", { data: { password: site.partner } })).toBeOK();
		const label = mine ? "改我的这一边" : "写下今天";
		await page.goto("/");
		const hero = page.locator("main section").first();
		await expect(hero.getByRole("link", { name: label })).toBeVisible();
		const today = page.locator("section").filter({ has: page.getByRole("heading", { name: "同一天，两扇窗" }) });
		await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(1);
		await expect(today.getByText("等红灯时看到彩虹", { exact: true })).toBeVisible();
		await page.setViewportSize({ width: 1280, height: 900 });
		await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(1);
		await page.getByRole("banner").getByRole("link", { name: label }).click();
		const editor = page.getByRole("dialog", { name: "同行" });
		await expect(editor).toBeVisible();
		await expect(editor.getByLabel("最喜欢的瞬间", { exact: true })).toHaveValue(mine ? "等红灯时看到彩虹" : "");
		await page.keyboard.press("Escape");
		await expect(page.getByRole("article").getByRole("button", { name: /我的这一边/ })).toHaveCount(0);
		await page.getByRole("main").getByRole("button", { name: label, exact: true }).click();
		await expect(editor).toBeVisible();
	});
}

test("手机首屏、桌面页头和日记主按钮跟随本机草稿；恢复、丢掉后无需刷新", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date(2026, 10, 10, 12));
	await app.docs("diary");
	await page.goto("/");
	await page.getByRole("link", { name: "写下今天", exact: true }).click();
	const editor = page.getByRole("dialog", { name: "新日记" });
	await editor.getByLabel("正文", { exact: true }).fill("等天晴一起走");
	await editor.getByLabel("标题", { exact: true }).fill("海边散步");
	await editor.getByRole("button", { name: "存草稿" }).click();
	await expect(page.getByText("今天 · 海边散步", { exact: true })).toBeVisible();
	const resume = page.getByRole("button", { name: "继续写草稿", exact: true });
	await expect(resume).toHaveCount(1);
	await expect(page.getByRole("region", { name: "本机文字草稿" })).toHaveCount(0);
	await page.getByRole("banner").getByRole("link", { name: "Yi & Jia Qi" }).click();
	const quick = page.getByRole("link", { name: "继续写草稿", exact: true });
	await expect(quick).toBeInViewport();
	await expect(page.getByText("有本机文字草稿", { exact: true })).toBeVisible();
	await quick.click();
	await expect(editor.getByLabel("正文", { exact: true })).toHaveValue("等天晴一起走");
	await page.keyboard.press("Escape");
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.getByRole("banner").getByRole("link", { name: "首页", exact: true }).click();
	await page.getByRole("banner").getByRole("link", { name: "继续写草稿" }).click();
	await expect(editor.getByLabel("正文", { exact: true })).toHaveValue("等天晴一起走");
	await editor.getByRole("button", { name: "丢掉草稿" }).click();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("button", { name: "写下今天", exact: true })).toBeEnabled();
	await page.getByRole("banner").getByRole("link", { name: "首页", exact: true }).click();
	await expect(page.getByRole("banner").getByRole("link", { name: "写下今天" })).toBeVisible();
});

test("其他标签页存下的草稿即时更新；隔天切回不会误开昨天的草稿", async ({ page, app, site }) => {
	await app.docs("diary");
	await page.clock.setFixedTime(new Date(2026, 10, 10, 23, 59));
	await page.goto("/");
	const write = page.getByRole("link", { name: "写下今天", exact: true });
	await expect(write).toBeVisible();
	const other = await page.context().newPage();
	try {
		await other.goto(site.url + "/coast.svg");
		await other.evaluate((date) => localStorage.setItem("dydraft:new:yi", JSON.stringify({ date, text: "昨天的文字" })), day);
		await expect(page.getByRole("link", { name: "继续写草稿" })).toBeVisible();
	} finally { await other.close(); }
	await page.clock.setFixedTime(new Date(2026, 10, 11, 0, 1));
	await page.evaluate(() => window.dispatchEvent(new Event("focus")));
	await write.click();
	const editor = page.getByRole("dialog");
	await expect(editor.getByLabel("日期", { exact: true })).toHaveValue("2026-11-11");
	await expect(editor.getByLabel("正文", { exact: true })).toHaveValue("");
	await page.keyboard.press("Escape");
	await page.getByRole("region", { name: "本机文字草稿" }).getByRole("button", { name: "继续写" }).click();
	await expect(editor.getByLabel("正文", { exact: true })).toHaveValue("昨天的文字");
});

test("已有日记、同日另一篇、独立旧版草稿及其他日期均按入口恢复本人草稿", async ({ page, app, site }) => {
	await page.clock.setFixedTime(new Date(2026, 10, 10, 12));
	const entry = { date: day, kind: "apart" as const, title: "第一站", c: 1, yi: { ...emptySide, t: "原文" }, jq: emptySide };
	await app.put("diary", "first", entry);
	await app.put("diary", "second", { ...entry, c: 2, title: "第二站" });
	await app.put("diary", "old", { ...entry, date: "2026-11-09", title: "前一天" });
	await page.addInitScript((date) => {
		for (const [key, text] of [["dydraft:first:yi", "第一篇的修改"], ["dydraft:second:yi", "第二篇的修改"], ["dydraft:old:yi", "昨天的修改"]]) {
			localStorage.setItem(key, JSON.stringify({ text, at: 1 }));
		}
		localStorage.setItem("dydraft:new:yi", JSON.stringify({ date, kind: "apart", title: "未完", place: "", text: "独立草稿", fav: "", at: 1 }));
	}, day);
	await page.goto("/");
	await page.getByRole("link", { name: "继续写草稿" }).click();
	const editor = page.getByRole("dialog");
	const body = editor.getByLabel("正文", { exact: true });
	await expect(body).toHaveValue("第一篇的修改");
	await page.keyboard.press("Escape");
	const row = (title: string) => page.getByRole("article").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
	await expect(row("第一站").getByRole("button", { name: "继续写草稿" })).toHaveCount(0);
	for (const [title, text] of [["第二站", "第二篇的修改"], ["前一天", "昨天的修改"]]) {
		await row(title).getByRole("button", { name: "继续写草稿" }).click();
		await expect(body).toHaveValue(text);
		await page.keyboard.press("Escape");
	}
	await page.getByRole("region", { name: "本机文字草稿" }).getByRole("button", { name: "继续写" }).click();
	await expect(editor).toHaveAccessibleName("新日记");
	await expect(body).toHaveValue("独立草稿");
	await expect(editor.getByText(/发布会另存一篇/)).toBeVisible();
	await expect(await page.request.post("/api/login", { data: { password: site.partner } })).toBeOK();
	await page.goto("/");
	await expect(page.getByRole("link", { name: "继续写草稿" })).toHaveCount(0);
	await page.getByRole("link", { name: "写下今天" }).click();
	await expect(editor).toHaveAccessibleName("第一站");
	await expect(body).toHaveValue("");
	await page.keyboard.press("Escape");
	await expect(page.getByRole("button", { name: /^继续写/ })).toHaveCount(0);
});

test("纯文字回忆按日期及创建时间排序，点同名回忆精确定位；空心愿只留入口", async ({ page, app }) => {
	const data = { date: day, c: 1, title: "散步", text: "旧路", photos: [] };
	await app.put("memories", "old", data);
	await app.put("memories", "new", { ...data, c: 2, text: "新路" });
	await page.goto("/");
	const cards = page.locator('main a[href^="/memories?item="]');
	await expect(cards).toHaveCount(2);
	await expect(cards.first()).toContainText("新路");
	await expect(cards.locator("img")).toHaveCount(0);
	await expect(page.getByRole("button", { name: /^加入心愿/ })).toBeEnabled();
	await expect(page.getByText(/心愿完成/)).toHaveCount(0);
	await expect(page.getByRole("main").getByRole("link", { name: "心愿清单" })).toBeVisible();
	await cards.first().click();
	await expect(page.locator("#memory-new")).toBeFocused();
	await app.put("wishes", "wish", { c: 1, t: "去散步", d: true });
	await page.goto("/");
	await expect(page.getByText(/心愿完成 1 \/ 1/)).toBeVisible();
});

test("冷启动和读取失败不猜测写改或空记录，恢复读取后再判断", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date(2026, 10, 10, 12));
	await app.put("diary", "today", { date: day, c: 1, title: "相片", kind: "apart", yi: { ...emptySide, photo: await app.photo() }, jq: emptySide });
	await app.put("memories", "bad", { date: "未知", c: 1, title: "旧回忆", text: "", photos: [] });
	const blocked = /\/api\/c\/(memories|diary)$/;
	let release!: () => void;
	const pending = new Promise<void>((resolve) => { release = resolve; });
	await page.route(blocked, async (r) => { await pending; await r.fulfill({ status: 503, body: "" }); });
	await page.goto("/");
	const falseClaims = page.getByText(/写下今天|改我的这一边|还没有回忆|写下第一段|今天还没写|心愿完成/);
	try {
		await expect(page.getByText("正在加载今日日记…")).toBeVisible();
		await expect(page.getByText("正在加载回忆…")).toBeVisible();
		await expect(falseClaims).toHaveCount(0);
	} finally { release(); }
	await expect(page.getByText("没能载入今日日记。")).toBeVisible();
	await expect(page.getByText("没能载入回忆。")).toBeVisible();
	await expect(falseClaims).toHaveCount(0);
	await page.unroute(blocked);
	await page.locator("section").filter({ has: page.getByRole("heading", { name: "我们的回忆" }) }).getByRole("button", { name: "重试" }).click();
	await expect(page.getByText(/现有回忆缺少有效日期或标题/)).toBeVisible();
	await expect(page.getByText("写下第一段", { exact: false })).toHaveCount(0);
	await page.getByRole("link", { name: "今日日记", exact: true }).click();
	await expect(page.getByRole("button", { name: "今日日记" })).toBeDisabled();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await page.getByRole("button", { name: "重试" }).click();
	await expect(page.getByRole("dialog", { name: "相片" })).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("button", { name: "改我的这一边" }).first()).toBeEnabled();
});
