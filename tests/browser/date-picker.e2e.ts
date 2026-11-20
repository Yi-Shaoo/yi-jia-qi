import { expect, test } from "./fixture";

test.beforeEach(async ({ page }) => {
	await page.clock.setFixedTime(new Date(2026, 10, 20, 12));
});

test("下次见面：只选今天或以后，确认后保存，也能清空", async ({ page, app }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "选个日期" }).click();
	const picker = page.getByRole("dialog", { name: "下次见面日期" });
	await expect(picker.locator('[data-bits-day][data-value="2026-11-19"]')).toBeDisabled();
	await expect(picker.getByRole("button", { name: "保存" })).toBeDisabled();
	await picker.locator('[data-bits-day][data-value="2026-11-20"]').click();
	await expect(picker).toBeVisible();
	await picker.getByRole("button", { name: "保存" }).click();
	await expect(picker).toBeHidden();
	expect((await app.docs("meta")).find((doc) => doc.id === "shared")?.data.next).toBe("2026-11-20");
	await page.getByRole("button", { name: "11.20 周五" }).click();
	await picker.getByRole("button", { name: "清空" }).click();
	await expect(page.getByRole("button", { name: "选个日期" })).toBeVisible();
});

test("日记：键盘选日、关闭日历后返回日期按钮，并保存改过的日期", async ({ page, app }) => {
	await page.goto("/diary?write=today");
	const editor = page.getByRole("dialog", { name: "新日记" });
	const date = editor.getByLabel("日期", { exact: true });
	await expect(date).toHaveText("2026-11-20");
	await date.press("Enter");
	const picker = page.getByRole("dialog", { name: "选择日期", exact: true });
	await expect(picker.locator('[data-bits-day][data-value="2026-11-20"]')).toBeFocused();
	await page.keyboard.press("ArrowLeft");
	await page.keyboard.press("Enter");
	await expect(picker).toBeHidden();
	await expect(date).toBeFocused();
	await expect(date).toHaveText("2026-11-19");
	await editor.getByLabel("正文", { exact: true }).fill("昨天看到海了。");
	await editor.getByRole("button", { name: "发布", exact: true }).click();
	await expect(editor).toBeHidden();
	expect((await app.docs("diary"))[0].data.date).toBe("2026-11-19");
});

test("时光信箱：明天起可选，日期随草稿恢复并保存到信件", async ({ page, app }) => {
	await page.goto("/play#letters");
	const date = page.getByLabel("可拆日期", { exact: true });
	await date.click();
	const picker = page.getByRole("dialog", { name: "选择日期", exact: true });
	await expect(picker.locator('[data-bits-day][data-value="2026-11-20"]')).toBeDisabled();
	await picker.locator('[data-bits-day][data-value="2026-11-21"]').click();
	await expect(date).toHaveText("2026-11-21");
	await page.reload();
	await expect(date).toHaveText("2026-11-21");
	await page.getByLabel("信件正文").fill("明天见。");
	await page.getByRole("button", { name: "寄出", exact: true }).click();
	await expect(page.getByLabel("信件正文")).toHaveValue("");
	expect((await app.docs("letters"))[0].data.open).toBe("2026-11-21");
});
