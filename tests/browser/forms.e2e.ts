import { test, expect } from "./fixture";

const failed = { status: 503, json: { error: "测试保存失败" } };

test("批量保存按项汇报失败，只重试没有保存的原文", async ({ page, app }) => {
	await page.goto("/about");
	const yi = page.getByRole("textbox", { name: "Yi的喜欢的动物" }), jq = page.getByRole("textbox", { name: "Jia Qi的爱吃的东西" });
	await yi.fill("海獭"); await jq.fill("沙拉");
	await page.reload();
	await expect(yi).toHaveValue("海獭"); await expect(jq).toHaveValue("沙拉");
	await expect(page.getByRole("button", { name: /保存/ })).toHaveCount(1);
	const col = "**/api/c/about";
	await page.route(col, (r) => r.request().method() === "POST" ? r.fulfill(failed) : r.continue());
	await expect(page.getByRole("button", { name: "全部保存" })).toBeEnabled();
	await yi.press("Enter");
	await expect(page.getByText("2 项未保存", { exact: true })).toBeVisible();
	await expect(yi).toHaveValue("海獭"); await expect(jq).toHaveValue("沙拉");
	await page.unroute(col);
	await page.route(col, (r) => r.request().method() === "POST" && r.request().postDataJSON().who === "jq" ? r.fulfill(failed) : r.continue());
	const retry = page.getByRole("button", { name: "重试", exact: true });
	await retry.click();
	await expect(page.getByText("已保存 1 项，1 项未保存", { exact: true })).toBeVisible();
	await expect(yi).toHaveValue(""); await expect(jq).toHaveValue("沙拉");
	await page.unroute(col);
	await retry.click();
	await expect(jq).toHaveValue("");
	expect((await app.docs("about")).map((d) => d.data.t).sort()).toEqual(["沙拉", "海獭"]);
});

test("部分重复时标明具体输入，只重试失败项，改正后可提交", async ({ page, app }) => {
	await app.put("about", "known", { cat: "animal", who: "yi", t: "海獭", c: 1 });
	await page.goto("/about");
	const animal = page.getByLabel("Yi的喜欢的动物", { exact: true }), food = page.getByLabel("Yi的爱吃的东西", { exact: true }), gift = page.getByLabel("Jia Qi的想收到的礼物", { exact: true });
	const posted: string[] = [];
	await page.route("**/api/c/about", (r) => {
		if (r.request().method() !== "POST") return r.continue();
		const text = r.request().postDataJSON().t;
		posted.push(text);
		return text === "沙拉" && posted.filter((t) => t === text).length === 1 ? r.fulfill(failed) : r.continue();
	});
	await animal.fill(" 海獭 ");
	await expect(animal).toHaveAccessibleDescription("「海獭」已存在");
	await expect(animal).toHaveAttribute("aria-invalid", "true");
	await expect(page.getByRole("button", { name: "保存", exact: true })).toBeDisabled();
	await animal.press("Enter");
	await food.fill("沙拉"); await gift.fill("相册");
	await page.getByRole("button", { name: "保存", exact: true }).click();
	await expect(page.getByText("已保存 1 项，1 项已存在，1 项未保存")).toBeVisible();
	await expect(animal).toBeFocused();
	await expect(animal).toHaveValue(" 海獭 ");
	await expect(food).toHaveAccessibleDescription("这项没能保存，请重试");
	await expect(food).not.toHaveAttribute("aria-invalid", "true");
	await expect(gift).toHaveValue("");
	expect(posted.slice().sort()).toEqual(["沙拉", "相册"]);
	await page.getByRole("button", { name: "重试", exact: true }).click();
	await expect(food).toHaveValue("");
	await expect(page.getByRole("button", { name: "保存", exact: true })).toBeDisabled();
	await animal.press("Enter");
	await animal.fill("海豹");
	await expect(animal).not.toHaveAttribute("aria-invalid", "true");
	await expect(animal).toHaveAccessibleDescription("");
	await animal.press("Enter");
	await expect(animal).toHaveValue("");
	await expect(animal).toBeFocused();
	expect(posted.slice(2)).toEqual(["沙拉", "海豹"]);
	expect(await app.docs("about")).toHaveLength(4);
});

test("同步增删已有项时更新重复提示，不要求重输原文", async ({ page, app }) => {
	await page.goto("/about");
	await expect(page.locator('header [role="status"]')).toHaveText("实时同步中");
	const input = page.getByRole("textbox", { name: "Yi的喜欢的动物" }), save = page.getByRole("button", { name: /保存/ });
	await input.fill(" 海獭 ");
	await expect(save).toBeEnabled();
	await app.put("about", "known", { cat: "animal", who: "yi", t: "海獭", c: 1 });
	await expect(save).toBeDisabled();
	await expect(input).toHaveAccessibleDescription("「海獭」已存在");
	await expect(await page.request.delete("/api/c/about/known")).toBeOK();
	await expect(input).toHaveAccessibleDescription("");
	await expect(save).toBeEnabled();
	await expect(input).toHaveValue(" 海獭 ");
	await expect(input).toBeFocused();
});

test("保存中修改的草稿不被成功清空或被旧错误标记，也不抢焦点", async ({ page, app }) => {
	await page.goto("/about");
	const animal = page.getByLabel("Yi的喜欢的动物", { exact: true }), food = page.getByLabel("Yi的爱吃的东西", { exact: true }), other = page.getByLabel("分类名");
	const gate = Promise.withResolvers<void>();
	await page.route("**/api/c/about", async (r) => {
		if (r.request().method() !== "POST") return r.continue();
		await gate.promise;
		return r.request().postDataJSON().cat === "animal" ? r.continue() : r.fulfill(failed);
	});
	await animal.fill("海獭"); await food.fill("沙拉");
	await page.getByRole("button", { name: "全部保存" }).click();
	await expect(page.getByRole("button", { name: "保存中…" })).toBeDisabled();
	await animal.fill("海豹"); await food.fill("米饭"); await other.focus();
	gate.resolve();
	await expect(page.getByRole("button", { name: "全部保存" })).toBeEnabled();
	await expect(other).toBeFocused();
	await expect(animal).toHaveValue("海豹"); await expect(food).toHaveValue("米饭");
	await expect(food).toHaveAccessibleDescription("");
	await expect(page.getByText("2 项待保存", { exact: true })).toBeVisible();
	expect((await app.docs("about")).map((d) => d.data.t)).toEqual(["海獭"]);
});

test("新建分类对齐卡片，重复可纠正，失败可重试，不覆盖稍后输入", async ({ page, app }) => {
	await page.goto("/about");
	const input = page.getByLabel("分类名"), submit = page.getByRole("button", { name: "新建分类" });
	const card = page.getByRole("form", { name: "新建分类" });
	for (const width of [320, 1024]) {
		await page.setViewportSize({ width, height: 800 });
		await expect.poll(() => card.evaluate((form, width) => {
			const box = form.getBoundingClientRect();
			const ref = document.querySelector("#about-drafts section:last-child")!.getBoundingClientRect();
			const button = form.querySelector("button[type=submit]")!.getBoundingClientRect();
			return Math.abs(box.width - ref.width) < 1 && (width === 320 ? box.x === ref.x : box.y === ref.y) && button.right <= box.right;
		}, width)).toBe(true);
	}
	const border = () => input.evaluate((el) => getComputedStyle(el).borderColor);
	const normalBorder = await border();
	await input.fill(" 喜欢的动物 ");
	await expect(input).toHaveAttribute("aria-invalid", "true");
	await expect(input).toHaveAccessibleDescription("分类「喜欢的动物」已存在");
	await expect(submit).toBeDisabled();
	await input.blur(); await expect.poll(border).not.toBe(normalBorder);
	await input.fill("喜欢的电影"); await input.blur();
	await expect.poll(border).toBe(normalBorder);
	await page.route("**/api/c/aboutcats", (r) => r.fulfill(failed));
	await submit.click();
	await expect(input).toBeFocused();
	await expect(input).toHaveValue("喜欢的电影");
	await expect(input).toHaveAccessibleDescription("分类没能保存，请重试");
	await page.unroute("**/api/c/aboutcats");
	await page.getByRole("button", { name: "重试新建" }).click();
	await expect(input).toHaveValue("");
	await expect(input).toBeFocused();
	await expect(page.getByRole("heading", { name: "喜欢的电影" })).toBeVisible();
	const gate = Promise.withResolvers<void>();
	await page.route("**/api/c/aboutcats", async (r) => { await gate.promise; await r.fulfill(failed); });
	await input.fill("书单"); await submit.click();
	await input.fill("歌单");
	const animal = page.getByLabel("Yi的喜欢的动物"); await animal.focus();
	gate.resolve();
	await expect(submit).toBeEnabled(); await expect(animal).toBeFocused();
	await expect(input).toHaveAccessibleDescription(""); await expect(input).toHaveValue("歌单");
	expect((await app.docs("aboutcats")).map((d) => d.data.name)).toEqual(["喜欢的电影"]);
});

test("新心愿在窄屏可见；失败保留原文，添加者变更不改想要人", async ({ page, app }) => {
	await page.goto("/wish");
	const text = page.getByLabel("新心愿"), submit = page.getByRole("button", { name: "添加心愿", exact: true });
	const name = "一起去海边散步".repeat(10);
	await text.fill(name);
	await expect(submit).toBeEnabled();
	for (const width of [320, 360, 390]) {
		await page.setViewportSize({ width, height: 800 });
		const box = await submit.boundingBox();
		expect(box!.x + box!.width).toBeLessThanOrEqual(width);
	}
	await page.route("**/api/c/wishes", (r) => r.request().method() === "POST" ? r.fulfill(failed) : r.continue());
	await submit.click();
	await expect(page.getByRole("button", { name: "重试添加" })).toBeVisible();
	await expect(text).toHaveValue(name);
	await page.unroute("**/api/c/wishes");
	await page.getByRole("button", { name: "重试添加" }).click();
	await expect(text).toHaveValue("");
	const row = page.getByRole("listitem").filter({ has: page.getByRole("checkbox", { name }) });
	const more = row.getByRole("button", { name: `更多操作：${name}` });
	await expect(row.getByRole("button")).toHaveCount(1);
	await more.press("Enter");
	await page.getByRole("menuitem", { name: "Jia Qi", exact: true }).click();
	await expect(row.getByText("Yi 想要")).toBeVisible();
	await expect(row.getByText("Jia Qi 加的")).toBeVisible();
	await more.click();
	await page.getByRole("menuitem", { name: "删除心愿" }).click();
	const dialog = page.getByRole("alertdialog", { name: "删除这条心愿？" });
	await expect(dialog).toContainText(name);
	await dialog.getByRole("button", { name: "取消" }).press("Enter");
	await expect(more).toBeFocused();
	expect((await app.docs("wishes"))[0].data).toMatchObject({ t: name, from: "yi", by: "jq" });
	await more.click();
	await page.getByRole("menuitem", { name: "删除心愿" }).click();
	await dialog.getByRole("button", { name: "确认删除" }).click();
	await expect(row).toHaveCount(0);
	await expect.poll(() => app.docs("wishes")).toHaveLength(0);
});

test("留言失败后仍能重试；换牌堆不改旧题的归属；扭蛋只给当前阶段的操作", async ({ page, app }) => {
	await page.goto("/play");
	const note = page.getByLabel("附言"), send = page.getByRole("button", { name: "发送留言" });
	await expect(send).toBeDisabled();
	await note.fill("看到海獭了");
	await page.route("**/api/c/miss", (r) => r.fulfill(failed));
	await send.click();
	await expect(page.getByText(/留言没发出/)).toBeVisible();
	await expect(note).toHaveValue("看到海獭了");
	await page.unroute("**/api/c/miss");
	await send.click();
	await expect(note).toHaveValue("");
	expect((await app.docs("miss"))[0].data.note).toBe("看到海獭了");
	const deck = page.locator("main section").filter({ has: page.getByRole("heading", { name: "问题卡" }) });
	await deck.getByRole("button", { name: "抽一张" }).click();
	await expect(deck.getByText("轻松 · 第 1 张")).toBeVisible();
	await deck.getByText("走心", { exact: true }).click();
	await expect(deck.getByText(/第 1 张/)).toHaveCount(0);
	await page.getByRole("button", { name: "抽个小任务" }).click();
	await page.getByRole("button", { name: "打开扭蛋" }).click();
	await expect(page.getByRole("button", { name: "抽个小任务" })).toHaveCount(0);
	await page.getByRole("button", { name: "完成打卡" }).click();
	await expect(page.getByRole("button", { name: "抽个小任务" })).toBeVisible();
	expect(await app.docs("stamps")).toHaveLength(1);
});

test("七个模块均可键盘直达，历史与深链定位标题，切换不丢草稿", async ({ page, app }) => {
	await app.docs("daily");
	await page.goto("/play");
	const main = page.getByRole("main"), nav = main.getByRole("navigation", { name: "一起玩模块" });
	await expect(main.getByRole("heading", { level: 2 }).first()).toHaveText("每日一问");
	const answer = main.getByLabel("我的回答");
	await answer.fill("一起看日落");
	const links = nav.getByRole("link");
	await expect(links).toHaveCount(7);
	for (const link of await links.all()) {
		const hash = (await link.getAttribute("href"))!;
		await link.press("Enter");
		await expect(page).toHaveURL(new RegExp(`${hash}$`));
		await expect(main.locator(hash).getByRole("heading", { level: 2 })).toBeFocused();
	}
	await page.reload();
	await expect(main.getByRole("heading", { name: "时光信箱" })).toBeFocused();
	await page.goBack();
	await expect(main.getByRole("heading", { name: "漂流瓶" })).toBeFocused();
	await nav.getByRole("link", { name: "每日一问" }).click();
	await expect(answer).toHaveValue("一起看日落");
	await nav.getByRole("link", { name: "每日一问" }).press("Enter");
	await expect(main.getByRole("heading", { name: "每日一问" })).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(answer).toBeFocused();
});

test("减少动画时糯糯留在原处，也能正常投喂", async ({ page, app }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.clock.install({ time: new Date("2026-11-19T12:00:00") });
	await page.goto("/play#pet");
	const pet = page.getByRole("region", { name: /糯糯/ });
	const position = () => pet.getByRole("button", { name: "摸摸糯糯" }).evaluate((el) => el.getBoundingClientRect().x);
	const start = await position();
	await pet.getByRole("button", { name: "喂一个马卡龙" }).click();
	await page.clock.runFor(1500);
	expect(await position()).toBe(start);
	await page.evaluate(() => { Math.random = () => 0.1; });
	await page.clock.fastForward(5000);
	expect(await position()).toBe(start);
	expect((await app.docs("pet"))[0].data.feeds).toBe(1);
});

test("另一账号加心愿时，当前节日卡通过实时同步更新", async ({ browser, page, site, app }) => {
	await page.goto("/holiday");
	await page.getByRole("searchbox").fill("Zoo Lights");
	const row = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "LA Zoo Lights" }) });
	await expect(row.getByRole("button", { name: /加入心愿/ })).toBeEnabled();
	await expect(page.locator('header [role="status"]')).toHaveText("实时同步中");
	const partner = await browser.newContext({ baseURL: site.url });
	try {
		await expect(await partner.request.post("/api/login", { data: { password: site.partner } })).toBeOK();
		await expect(await partner.request.post("/api/c/wishes", { data: { t: "圣诞节：LA Zoo Lights", cat: "place", by: "jq", d: false, c: Date.now() } })).toBeOK();
		await expect(row.getByRole("link", { name: /已在心愿/ })).toBeVisible();
		expect(await app.docs("wishes")).toHaveLength(1);
	} finally {
		await partner.close();
	}
});
