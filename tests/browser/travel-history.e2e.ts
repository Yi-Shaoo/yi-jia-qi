import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixture";
import { spotKey } from "../../src/lib/spots";

const y = (link: Locator) => link.evaluate((el) => el.getBoundingClientRect().top);

async function visitWish(page: Page, source: Locator) {
	await source.getByRole("button", { name: /^加入心愿/ }).click();
	const link = source.getByRole("link", { name: /^已在心愿/ });
	await link.evaluate((el) => el.scrollIntoView({ block: "center" }));
	const top = await y(link);
	await link.click();
	await expect(page.locator('li[aria-current="location"]')).toBeFocused();
	return { link, top };
}

async function restored(link: Locator, top: number) {
	await expect(link).toBeFocused();
	await expect.poll(async () => Math.abs(await y(link) - top)).toBeLessThan(6);
	await expect(link).toBeInViewport({ ratio: 1 });
}

test("390px 约会中间点第4张收藏后返回原卡，再前进、返回并连续收藏", async ({ page, app }) => {
	await app.docs("custom");
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/dates");
	const mid = page.getByRole("radio", { name: "中间点" });
	await mid.locator("..").click();
	const cards = page.getByRole("article"), card = cards.nth(3);
	await card.locator("summary").click();
	const { link, top } = await visitWish(page, card);
	await page.goBack();
	await expect(mid).toBeChecked();
	await restored(link, top);
	await expect(card.locator("details")).toHaveAttribute("open", "");
	await page.goForward();
	await expect(page.locator('li[aria-current="location"]')).toBeFocused();
	await page.goBack();
	await restored(link, top);
	const next = await visitWish(page, cards.nth(4));
	await page.goBack();
	await restored(next.link, next.top);
	await expect(link).toBeVisible();
	expect(await app.docs("wishes")).toHaveLength(2);
});

test("分享链接恢复查询和地区；输入不堆历史，不移走焦点；同页换参可后退", async ({ page, app }) => {
	await app.docs("custom");
	await page.goto("/food?area=mid&q=Naples&ref=shared#main-content");
	const search = page.getByRole("searchbox"), mid = page.getByRole("radio", { name: "中间点" });
	await expect(mid).toBeChecked();
	await expect(search).toHaveValue("Naples");
	await expect(page.getByRole("article")).toHaveCount(1);
	const length = await page.evaluate(() => history.length);
	await search.fill("");
	await search.pressSequentially("Rib Company");
	await expect(search).toBeFocused();
	await expect(page).toHaveURL((url) => url.searchParams.get("q") === "Rib Company" && url.searchParams.get("area") === "mid" && url.searchParams.get("ref") === "shared" && url.hash === "#main-content");
	expect(await page.evaluate(() => history.length)).toBe(length);
	const tab = page.getByRole("navigation", { name: "主导航" });
	await tab.getByRole("button", { name: "出去玩" }).click();
	await page.getByRole("dialog").getByRole("link", { name: /今天吃什么/ }).click();
	await expect(search).toHaveValue("");
	await expect(page.getByRole("radio", { name: "全部" })).toBeChecked();
	await page.goBack();
	await expect(mid).toBeChecked();
	await expect(search).toHaveValue("Rib Company");
	await page.goForward();
	await expect(search).toHaveValue("");
	await page.goto("/food?area=far");
	await expect(page.getByRole("radio", { name: "全部" })).toBeChecked();
});

test("餐厅加载更多后返回保留地区、末张和此前展开的贴士", async ({ page, app }) => {
	await app.docs("custom");
	await page.goto("/food?area=la");
	const cards = page.getByRole("article");
	await expect(cards).toHaveCount(9);
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await expect(cards).toHaveCount(11);
	await cards.nth(9).locator("summary").click();
	const { link, top } = await visitWish(page, cards.nth(10));
	await page.goBack();
	await expect(page.getByRole("radio", { name: "Westwood / LA" })).toBeChecked();
	await expect(cards).toHaveCount(11);
	await restored(link, top);
	await expect(cards.nth(9).locator("details")).toHaveAttribute("open", "");
	await page.getByRole("radio", { name: "全部" }).locator("..").click();
	await expect(cards).toHaveCount(9);
	await expect(page).toHaveURL(/\/food$/);
});

test("重新加载心愿后返回，等待异步地点；源卡移到下一批、上方图片晚到仍能回位", async ({ page, app }) => {
	await page.goto("/dates");
	const cards = page.getByRole("article");
	const aboveName = await cards.nth(7).getByRole("heading").first().innerText();
	const sourceName = await cards.nth(8).getByRole("heading").first().innerText();
	const above = cards.filter({ has: page.getByRole("heading", { name: aboveName, exact: true }) });
	const source = cards.filter({ has: page.getByRole("heading", { name: sourceName, exact: true }) });
	const id = await app.photo();
	await app.put("spots", spotKey(aboveName), { n: aboveName, p: [id, "", ""], d: [] });
	await above.locator("summary").click();
	await expect(above.getByRole("img")).toBeVisible();
	const { link, top } = await visitWish(page, source);
	await app.put("custom", "new-first", { kind: "date", name: "新步道", area: "oc", c: 1, type: "散步", desc: "", tip: "", q: "" });
	await page.reload();
	await expect(page.locator('li[aria-current="location"]')).toBeFocused();
	const data = Promise.withResolvers<void>(), image = Promise.withResolvers<void>();
	await page.route("**/api/c/custom", async (r) => { await data.promise; await r.continue(); });
	await page.route(`**/files/${id}*`, async (r) => { await image.promise; await r.continue(); });
	try {
		await page.goBack({ waitUntil: "domcontentloaded" });
		await expect(page.getByRole("searchbox")).toBeVisible();
		data.resolve();
		await expect(cards.nth(9).getByRole("heading", { name: sourceName, exact: true })).toBeAttached();
		await restored(link, top);
		image.resolve();
		await expect.poll(() => above.locator("img").evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
		await restored(link, top);
	} finally {
		data.resolve(); image.resolve();
	}
});

test("路线直链取时长与搜索交集；节日返回先展开来源再定位心愿链接", async ({ page, app }) => {
	await app.docs("wishes");
	await page.goto("/roadtrip?kind=wk&q=Bear");
	const search = page.getByRole("searchbox"), weekend = page.getByRole("radio", { name: "周末" });
	await expect(weekend).toBeChecked();
	await expect(page.getByRole("article")).toHaveCount(1);
	const road = await visitWish(page, page.getByRole("article"));
	await page.goBack();
	await restored(road.link, road.top);
	await expect(search).toHaveValue("Bear");
	await expect(weekend).toBeChecked();
	await page.goto("/holiday?q=姜饼");
	await expect(page.getByRole("listitem")).toHaveCount(1);
	await expect(search).toHaveValue("姜饼");
	await search.fill("");
	await page.getByText(/^南加州活动/).last().click();
	const row = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "LA Zoo Lights" }) });
	const holiday = await visitWish(page, row);
	await page.goBack();
	await restored(holiday.link, holiday.top);
	await expect(page.locator("details[open]")).toHaveCount(1);
});
