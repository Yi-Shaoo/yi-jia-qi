import { test, expect, png } from "./fixture";

test("手机上四个出游页的全部及各分类初始高度不超过 6000px", async ({ page, app }, info) => {
	await app.docs("custom");
	const heights: Record<string, number> = {};
	for (const path of ["dates", "food", "roadtrip", "holiday"]) {
		await page.goto(`/${path}`);
		await expect(page.getByRole("searchbox")).toBeVisible();
		const radios = page.getByRole("radio");
		for (let i = 0, count = await radios.count(); i < Math.max(count, 1); i++) {
			if (count) {
				await radios.nth(i).focus();
				await page.keyboard.press("Space");
				await expect(radios.nth(i)).toBeChecked();
			}
			if (path !== "holiday") await expect(page.getByRole("article").first()).toBeVisible();
			const key = `${path}:${count ? await radios.nth(i).inputValue() : "all"}`;
			heights[key] = await page.evaluate(() => document.documentElement.scrollHeight);
			expect(heights[key], key).toBeLessThanOrEqual(6000);
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
		}
	}
	await info.attach("360px 分类实测高度", { body: JSON.stringify(heights), contentType: "application/json" });
});

test("全库搜索与地区取交集，加载更多不绕过筛选，空结果可恢复", async ({ page, app }) => {
	await app.docs("custom");
	await page.goto("/food");
	const cards = page.getByRole("article"), search = page.getByRole("searchbox"), more = page.getByRole("button", { name: "加载更多餐厅" });
	await expect(cards).toHaveCount(9);
	await more.click();
	await expect(cards).toHaveCount(18);
	await more.click();
	await expect(cards).toHaveCount(24);
	await expect(more).toHaveCount(0);
	await search.fill("  nApLes   肋排 ");
	await expect(cards).toHaveCount(1);
	await expect(cards.getByText("吃完去 Naples 岛散步")).toHaveCount(0);
	await cards.locator("summary").click();
	await expect(cards.getByText("吃完去 Naples 岛散步")).toBeVisible();
	await expect(cards.getByRole("link", { name: "地图" })).toHaveAttribute("href", /Naples%20Rib%20Company/);
	await cards.getByRole("button", { name: /加入心愿/ }).click();
	await expect(cards.getByRole("link", { name: /已在心愿/ })).toBeVisible();
	expect((await app.docs("wishes"))[0].data.cat).toBe("food");
	await page.getByText("Westwood / LA", { exact: true }).click();
	await expect(page.getByText("没有匹配的餐厅")).toBeVisible();
	await page.getByRole("button", { name: "清除筛选" }).click();
	await expect(search).toHaveValue("");
	await expect(page.getByRole("radio", { name: "全部" })).toBeChecked();
	await expect(cards).toHaveCount(9);
});

test("自建地点可从搜索结果上传照片，收起重开仍可看大图和移除", async ({ page, app }) => {
	await app.put("custom", "cove", { kind: "date", name: "海獭湾", desc: "", area: "mid", q: "", c: 1, type: "散步", tip: "" });
	await page.goto("/dates");
	await page.getByRole("searchbox").fill("海獭湾");
	const card = page.getByRole("article"), details = card.locator("summary");
	await expect(card.getByText("我们加的")).toBeVisible();
	await expect(card.getByRole("button", { name: "编辑" })).toBeVisible();
	await expect(card.locator('input[type="file"]')).toHaveCount(0);
	await details.click();
	const chooser = page.waitForEvent("filechooser");
	await card.getByRole("button", { name: /照片 1，加照片/ }).click();
	await (await chooser).setFiles(png);
	const view = card.getByRole("button", { name: /照片 1，看大图/ });
	await expect(view).toBeVisible();
	await details.click();
	await expect(view).toHaveCount(0);
	await details.click();
	await view.click();
	await page.getByRole("dialog").getByRole("button", { name: "移除照片" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "确认移除" }).click();
	await expect(card.getByRole("button", { name: /照片 1，加照片/ })).toBeVisible();
	expect((await app.docs("spots"))[0].data.p).toEqual(["", "", ""]);
});

test("心愿读取失败可从概览重试；已收藏的地点链接到原心愿", async ({ page, app }) => {
	await app.put("wishes", "cove", { t: "Crystal Cove 州立公园", cat: "place", d: false, c: 1 });
	const url = "**/api/c/wishes";
	await page.route(url, (r) => r.fulfill({ status: 503, json: { error: "离线" } }));
	await page.goto("/dates");
	const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Crystal Cove 州立公园" }) });
	await expect(card.getByRole("button", { name: /重试载入心愿/ })).toBeEnabled();
	await page.unroute(url);
	await card.getByRole("button", { name: /重试载入心愿/ }).click();
	await card.getByRole("link", { name: /已在心愿/ }).click();
	await expect(page).toHaveURL(/\/wish.*cove$/);
	expect(await app.docs("wishes")).toHaveLength(1);
});

test("路线按站点搜索，节日按小计划搜索，只展开命中分组", async ({ page, app }) => {
	await app.docs("wishes");
	await page.goto("/roadtrip");
	const search = page.getByRole("searchbox");
	await search.fill("mcway");
	const card = page.getByRole("article");
	await expect(card.getByRole("heading")).toHaveText("Big Sur 海岸线");
	await card.locator("summary").click();
	await expect(card.getByRole("listitem")).toHaveCount(3);
	await page.goto("/holiday");
	await search.fill("姜饼屋");
	await expect(page.getByRole("listitem")).toHaveCount(1);
	await expect(page.getByRole("button", { name: "加入心愿：圣诞节：一起做姜饼屋" })).toBeVisible();
	await page.getByText(/^两个人的小计划/).click();
	await search.fill("姜饼");
	await expect(page.getByRole("listitem")).toHaveCount(1);
	await search.fill("没有这个小计划");
	await page.getByRole("button", { name: "清除筛选" }).click();
	await expect(page.getByRole("heading", { name: "感恩节", exact: true })).toBeVisible();
	await expect(page.getByRole("listitem")).toHaveCount(0);
});
