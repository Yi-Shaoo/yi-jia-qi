import type { Page } from "@playwright/test";
import { expect, test } from "./fixture";

async function login(page: Page, password: string) {
	await page.getByLabel("我们的暗号").fill(password);
	await page.getByRole("button", { name: "进门" }).click();
	await expect(page.getByRole("button", { name: "账号菜单" })).toBeVisible();
}

async function logout(page: Page) {
	await page.getByRole("button", { name: "账号菜单" }).click();
	await page.getByRole("menuitem", { name: "退出登录" }).click();
	await expect(page.getByLabel("我们的暗号")).toBeVisible();
}

test("同一浏览器两次换号：各自恢复私稿、未打卡扭蛋，共享已寄出的记录和外观", async ({ page, site, context }) => {
	await context.route(/^https:\/\/fonts\./, route => route.abort());
	await page.goto("/play");
	await page.evaluate(() => {
		for (const [key, value] of Object.entries({ ltdraft: { t: "旧信" }, btdraft: "旧瓶", gacha: { t: "旧任务", open: true }, abdraft: { "animal|jq": "旧条目" } })) {
			localStorage.setItem(key, JSON.stringify(value));
		}
	});
	await login(page, site.password);
	const bottle = page.getByLabel("瓶中留言"), letter = page.getByLabel("信件正文"), daily = page.getByLabel("我的回答", { exact: true });
	const draw = page.getByRole("button", { name: "抽个小任务" }), open = page.getByRole("button", { name: "打开扭蛋" });
	await expect(bottle).toHaveValue("");
	await expect(letter).toHaveValue("");
	await expect(draw).toBeVisible();
	await bottle.fill("Yi 的瓶子");
	await letter.fill("Yi 的信");
	await daily.fill("Yi 的答案");
	await draw.click();
	await open.click();
	const task = await page.getByText("今天的小任务", { exact: true }).locator("+ div").innerText();

	const about = await context.newPage();
	await about.goto("/about");
	const field = about.locator('input[id^="draft-"][id$="|jq"]').first();
	await expect(field).toHaveValue("");
	await field.fill("Yi 给另一栏写的条目");
	await about.getByRole("button", { name: "账号菜单" }).click();
	await about.getByRole("menuitemradio", { name: "深色模式" }).click();
	await about.keyboard.press("Escape");
	await logout(about);
	await expect(page.getByLabel("我们的暗号")).toBeVisible();
	await expect(letter).toHaveCount(0);
	await login(about, site.partner);
	await expect(field).toHaveValue("");
	await expect(bottle).toHaveValue("");
	await expect(letter).toHaveValue("");
	await expect(daily).toHaveValue("");
	await expect(draw).toBeVisible();
	await expect(about.locator("html")).toHaveClass(/dark/);
	await field.fill("JQ 的条目");
	await letter.fill("两人都能见到的标题对应的正文");
	await page.getByLabel("标题（可选）").fill("JQ 寄出的信");
	await page.getByRole("button", { name: "寄出", exact: true }).click();
	await expect(letter).toHaveValue("");
	await bottle.fill("JQ 的瓶子");
	await draw.click();
	await expect(open).toBeVisible();

	await logout(about);
	await login(about, site.password);
	await expect(field).toHaveValue("Yi 给另一栏写的条目");
	await expect(letter).toHaveValue("Yi 的信");
	await expect(bottle).toHaveValue("Yi 的瓶子");
	await expect(daily).toHaveValue("Yi 的答案");
	await expect(page.locator("#gacha").getByText(task, { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: /JQ 寄出的信/ })).toBeDisabled();
	await page.getByRole("button", { name: "完成打卡" }).click();
	await expect(draw).toBeVisible();
	await logout(about);
	await login(about, site.partner);
	await expect(field).toHaveValue("JQ 的条目");
	await expect(bottle).toHaveValue("JQ 的瓶子");
	await expect(letter).toHaveValue("");
	await expect(open).toBeVisible();
	await expect(page.locator("#gacha").getByText(task, { exact: true })).toBeVisible();
});

test("标签页重新聚焦时先遮住原表单；同账号保留临时输入，换号则重建", async ({ page, site, app }) => {
	await app.docs("miss");
	await page.goto("/play");
	const note = page.getByLabel("附言", { exact: true });
	await note.fill("未发送的附言");
	const gate = Promise.withResolvers<void>();
	await page.route("**/api/me", async route => { await gate.promise; await route.continue(); });
	await page.evaluate(() => window.dispatchEvent(new Event("focus")));
	await expect(page.getByRole("status", { name: "正在确认登录状态" })).toBeVisible();
	await expect(note).toBeHidden();
	gate.resolve();
	await expect(note).toHaveValue("未发送的附言");
	await expect(note).toBeVisible();
	await expect(await page.request.post("/api/login", { data: { password: site.partner } })).toBeOK();
	await page.evaluate(() => window.dispatchEvent(new Event("focus")));
	await expect(note).toHaveValue("");
	await expect(page.getByRole("heading", { name: "写给 Yi" })).toBeVisible();
});

test("Cookie 已换而标签页尚未收到通知，拒绝旧表单并恢复真实账号", async ({ page, site, app }) => {
	await page.goto("/play");
	const bottle = page.getByLabel("瓶中留言");
	await bottle.fill("不能以 JQ 身份发送");
	await expect(await page.request.post("/api/login", { data: { password: site.partner } })).toBeOK();
	const rejected = page.waitForResponse(r => r.url().endsWith("/api/c/bottles") && r.request().method() === "POST");
	await page.getByRole("button", { name: "扔出去" }).click();
	expect((await rejected).status()).toBe(412);
	await expect(bottle).toHaveValue("");
	expect(await app.docs("bottles")).toEqual([]);
	await logout(page);
	await login(page, site.password);
	await expect(bottle).toHaveValue("不能以 JQ 身份发送");
});
