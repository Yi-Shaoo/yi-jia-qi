import { test, expect } from "./fixture";

const pages = [
	["/", "Yi & Jia Qi"], ["/diary", "约会日记"], ["/memories", "我们的回忆"], ["/album", "情侣相册"],
	["/about", "关于我们"], ["/play", "一起玩"], ["/wish", "心愿清单"], ["/dates", "约会去哪"],
	["/food", "今天吃什么"], ["/roadtrip", "Road-trip 路线"], ["/holiday", "感恩节和圣诞"], ["/no-such-page", "这一页走丢了"],
];

for (const [width, height] of [[360, 800], [1280, 900]]) {
	test(`登录、11 条路由和 404 · ${width}px`, async ({ page, site }) => {
		await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (r) => r.abort());
		await page.setViewportSize({ width, height });
		const errors: string[] = [];
		page.on("pageerror", (e) => errors.push(e.message));
		await page.goto("/diary");
		const field = page.getByLabel("我们的暗号");
		await expect(field).toHaveAccessibleDescription(/自己的密码/);
		await field.fill(site.password);
		await page.getByRole("button", { name: "进门" }).click();
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("约会日记");
		for (const [route, title] of pages) {
			await page.goto(route);
			await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
		}
		expect(errors).toEqual([]);
	});
}

test("断线在手机上显示文字，菜单标明当前页并可用键盘关闭", async ({ page, app }) => {
	await app.docs("about");
	await page.route("**/api/events", (r) => r.fulfill({ status: 503, body: "offline" }));
	await page.goto("/about");
	await expect(page.getByText("正在重连", { exact: true })).toBeInViewport();
	await page.getByRole("navigation", { name: "主导航" }).getByRole("button", { name: "我们的" }).click();
	const sheet = page.getByRole("dialog");
	await expect(sheet.getByRole("link", { name: "关于我们" })).toHaveAttribute("aria-current", "page");
	await expect(sheet.getByRole("button", { name: "关闭" })).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(sheet).toHaveCount(0);
});

test("每日一问入口保留保存的题目、定位标题；历史不会暴露未解锁的答案", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date("2026-11-19T12:00:00"));
	const q = "下次散步想走哪条路？";
	await app.put("daily", "2026-11-19", { q, jq: { t: "沿着海岸", at: 2 } });
	await app.put("daily", "2026-11-18", { q: "昨天的风景？", jq: { t: "昨日私密回答", at: 1 } });
	await app.put("memories", "text-only", { c: 1, date: "2026-11-17", title: "文字回忆", text: "散步", photos: [] });
	await page.goto("/");
	await expect(page.getByRole("link", { name: /文字回忆/ })).toHaveAttribute("href", "/memories?item=text-only");
	await page.getByRole("link", { name: new RegExp(q) }).click();
	await expect(page).toHaveURL(/\/play#daily$/);
	const card = page.locator("#daily");
	await expect(card.getByRole("heading")).toBeFocused();
	await expect(card.getByText(q)).toBeInViewport();
	await expect(card.getByText("沿着海岸")).toHaveCount(0);
	await card.locator("summary").click();
	await expect(card.getByText(/历史问答不能补答/)).toBeVisible();
	await expect(card.getByText("昨日私密回答")).toHaveCount(0);
	await card.getByLabel("我的回答").fill("去看日落");
	await card.getByRole("button", { name: "提交我的回答" }).click();
	await expect(card.getByText("沿着海岸")).toBeVisible();
});

test("地区筛选用方向键，新增默认当前地区，自建地点入旅行心愿", async ({ page, app }) => {
	await page.goto("/dates");
	const radios = page.getByRole("group", { name: "按位置筛选" }).getByRole("radio");
	await radios.first().focus();
	for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
	await expect(page.getByRole("radio", { name: "中间点" })).toBeChecked();
	await page.getByRole("button", { name: "添加地点" }).click();
	const dialog = page.getByRole("dialog");
	await expect(dialog.getByRole("combobox", { name: /地区/ })).toContainText("中间点");
	await dialog.getByLabel("名字").fill("海风步道");
	await dialog.getByRole("button", { name: "保存", exact: true }).click();
	const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "海风步道" }) });
	await card.getByRole("button", { name: /加入心愿/ }).click();
	await expect(card.getByRole("link", { name: /已在心愿/ })).toBeVisible();
	expect((await app.docs("wishes")).map((d) => d.data.cat)).toEqual(["place"]);
	await page.getByRole("radio", { name: "中间点" }).focus();
	await page.keyboard.press("ArrowRight");
	const park = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Joshua Tree 星空夜" }) });
	await expect(park.getByRole("button", { name: "出发前查月相" })).toHaveCount(0);
	await park.locator("summary").click();
	await expect(park.getByText("挑没有月亮的晚上")).toBeVisible();
	await park.getByRole("button", { name: "出发前查月相" }).click();
	await expect(park.locator("summary")).toContainText("1/4");
});

test("新年后仍读得懂跨年活动，14 项均有来源；直达后加心愿即时反映", async ({ page, app }) => {
	await page.clock.setFixedTime(new Date("2027-01-02T12:00:00"));
	await page.goto("/holiday");
	const main = page.getByRole("main");
	await expect(main.getByText("今年已过")).toHaveCount(0);
	const events = main.getByText(/^南加州活动/);
	await events.first().click();
	await events.last().click();
	await expect(main.locator('a[rel~="external"][href^="https://"]')).toHaveCount(14);
	await expect(main.getByText("11.20–次年 1.10")).toBeVisible();
	const row = main.getByRole("listitem").filter({ has: page.getByRole("link", { name: "LA Zoo Lights" }) });
	await row.getByRole("button", { name: /加入心愿/ }).click();
	await expect(row.getByRole("link", { name: /已在心愿/ })).toBeVisible();
	await page.reload();
	await events.last().click();
	await expect(row.getByRole("link", { name: /已在心愿/ })).toBeVisible();
	expect(await app.docs("wishes")).toHaveLength(1);
});
