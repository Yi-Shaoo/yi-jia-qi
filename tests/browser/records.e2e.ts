import { test, expect, png } from "./fixture";

const busy = { status: 503, json: { error: "测试服务暂不可用" } };
const txt = { name: "笔记.txt", mimeType: "text/plain", buffer: Buffer.from("不是图片") };

test("读取失败可重试，不冒充第一次使用", async ({ page, app }) => {
	await app.put("wishes", "sea", { t: "散步", cat: "you", d: false, c: 1 });
	for (const [route, collection, empty] of [["/diary", "diary", "还没有日记"], ["/memories", "memories", "还没有回忆"], ["/album", "photos", "还没有照片"], ["/wish", "wishes", "还没有心愿"]]) {
		const url = `**/api/c/${collection}`;
		await page.route(url, (r) => r.fulfill(busy));
		await page.goto(route);
		await expect(page.getByText(/没能载入/).first()).toBeVisible();
		await expect(page.getByText(empty, { exact: false })).toHaveCount(0);
		await page.unroute(url);
		await page.getByRole("button", { name: "重试", exact: true }).click();
		await expect(page.getByText(/没能载入/)).toHaveCount(0);
		if (collection === "wishes") await expect(page.getByRole("checkbox", { name: "散步" })).toBeVisible();
		else await expect(page.getByText(empty, { exact: false })).toBeVisible();
	}
});

test("同日两篇精确编辑；整篇确认列出两人的照片且可取消", async ({ page, app }) => {
	const date = "2026-11-18", first = await app.photo(), second = await app.photo();
	const entry = { date, kind: "together" as const, title: "第一站", c: 1, yi: { t: "第一天的记录", fav: "", photo: "" }, jq: { t: "一起走", fav: "", photo: "" } };
	await app.put("diary", "one", entry);
	await app.put("diary", "two", { ...entry, title: "第二站", c: 2, yi: { ...entry.yi, photo: first }, jq: { ...entry.jq, photo: second } });
	await page.goto("/diary");
	const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "第二站" }) });
	await row.getByRole("button", { name: "改我的这一边" }).click();
	const editor = page.getByRole("dialog");
	await expect(editor.getByLabel("正文", { exact: true })).toBeFocused();
	await expect(editor.getByLabel("约会标题（必填）")).toHaveValue("第二站");
	await editor.getByLabel("正文", { exact: true }).fill("第二站的日落");
	await editor.getByRole("button", { name: "发布", exact: true }).click();
	await expect(row.getByText("第二站的日落")).toBeVisible();
	expect((await app.docs("diary")).find((d) => d.id === "one")?.data.yi.t).toBe("第一天的记录");
	await row.getByRole("button", { name: "改我的这一边" }).click();
	await editor.getByRole("button", { name: "删除整篇", exact: true }).click();
	const confirmation = page.getByRole("alertdialog");
	await expect(confirmation).toHaveAccessibleDescription(/第二站.*Yi 和 Jia Qi.*2 张照片.*无法撤销/);
	await confirmation.getByRole("button", { name: "取消" }).click();
	await expect(editor).toBeVisible();
	expect(await app.docs("diary")).toHaveLength(2);
	await editor.getByRole("button", { name: "删除整篇", exact: true }).click();
	await confirmation.getByRole("button", { name: /删除整篇/ }).click();
	await expect(row).toHaveCount(0);
	expect((await app.docs("diary")).map((d) => d.id)).toEqual(["one"]);
	await expect.poll(async () => (await page.request.get(`/files/${second}`)).status()).toBe(404);
});

test("只有照片与文字草稿的界限准确，发布后不再恢复旧草稿", async ({ page, app }) => {
	await page.goto("/diary?write=today");
	const editor = page.getByRole("dialog"), keep = editor.getByRole("button", { name: "存草稿" });
	await editor.locator('input[type="file"]').setInputFiles(png);
	await expect(editor.getByText(/草稿只存文字/)).toBeVisible();
	await keep.click();
	await expect(editor.getByText(/只有照片变更/)).toBeVisible();
	await editor.getByLabel("正文", { exact: true }).fill("一路沿着海边走");
	await keep.click();
	await page.getByRole("button", { name: "继续写草稿", exact: true }).click();
	await expect(editor.getByLabel("正文", { exact: true })).toHaveValue("一路沿着海边走");
	await expect(editor.getByRole("button", { name: "移除照片" })).toHaveCount(0);
	await editor.getByRole("button", { name: "发布", exact: true }).click();
	await expect(page.getByText("一路沿着海边走", { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole("button", { name: /^继续写/ })).toHaveCount(0);
	expect(await app.docs("diary")).toHaveLength(1);
});

test("回忆大图按本段顺序翻页，关闭后聚焦当前照片", async ({ page, app }) => {
	const photos = await Promise.all([app.photo(), app.photo(), app.photo()]);
	await app.put("memories", "cove", { c: 1, date: "2026-11-16", title: "海边", text: "", photos });
	await page.goto("/memories");
	const thumbs = page.getByRole("button", { name: /^查看「海边」/ });
	await thumbs.first().click();
	const box = page.getByRole("dialog");
	await expect(box.getByRole("heading", { name: "海边" })).toBeFocused();
	await expect(box.getByRole("button", { name: "上一张" })).toBeDisabled();
	await page.keyboard.press("ArrowRight");
	await expect(box.getByRole("status")).toHaveText("2 / 3");
	await expect(box.getByRole("img")).toHaveAttribute("src", `/files/${photos[1]}`);
	await box.getByRole("button", { name: "下一张" }).click();
	await expect(box.getByRole("button", { name: "下一张" })).toBeDisabled();
	await page.keyboard.press("Escape");
	await expect(thumbs.last()).toBeFocused();
});

test("回忆按已保存照片计数；删除不破坏仍被相册引用的文件", async ({ page, app }) => {
	const assets = await Promise.all([app.photo(), app.photo(), app.photo()]);
	await app.put("memories", "cove", { c: 1, date: "2026-11-16", title: "海边的下午", text: "", photos: assets });
	await app.put("photos", "shared", { c: 1, cap: "相册也在使用", asset: assets[1], tag: "sea" });
	await page.goto("/memories");
	await page.getByRole("button", { name: /编辑回忆.*海边的下午/ }).click();
	const editor = page.getByRole("dialog"), confirm = page.getByRole("alertdialog");
	await editor.getByRole("button", { name: /移除.*第 2 张/ }).click();
	await editor.getByRole("button", { name: /删除回忆：海边的下午/ }).click();
	await expect(confirm).toHaveAccessibleDescription(/海边的下午.*3 张照片.*无法撤销/);
	await confirm.getByRole("button", { name: "取消" }).click();
	await expect(editor.getByRole("button", { name: /移除.*张/ })).toHaveCount(2);
	await editor.getByRole("button", { name: /删除回忆：海边的下午/ }).click();
	await confirm.getByRole("button", { name: "删除回忆", exact: true }).click();
	await expect(page.getByText("还没有回忆", { exact: true })).toBeVisible();
	await expect.poll(async () => (await page.request.get(`/files/${assets[0]}`)).status()).toBe(404);
	await expect(await page.request.get(`/files/${assets[1]}`)).toBeOK();
	expect(await app.docs("photos")).toHaveLength(1);
});

test("回忆部分上传失败，重试仅补未成功的照片", async ({ page, app }) => {
	let uploads = 0;
	await page.route("**/api/files", (r) => ++uploads === 2 ? r.fulfill(busy) : r.continue());
	await page.goto("/memories");
	await page.getByRole("button", { name: "添加一段回忆" }).click();
	const editor = page.getByRole("dialog");
	await editor.getByLabel("标题", { exact: true }).fill("有两张照片");
	await editor.locator('input[type="file"]').setInputFiles([png, { ...png, name: "下一张.png" }]);
	await editor.getByRole("button", { name: "保存回忆" }).click();
	await expect(editor.getByText(/下一张.png.*稍后重试/)).toBeVisible();
	const [before] = await app.docs("memories");
	expect(before.data.photos).toHaveLength(1);
	await editor.getByRole("button", { name: "重试未上传照片" }).click();
	await expect(editor).toHaveCount(0);
	const after = await app.docs("memories");
	expect(after).toHaveLength(1);
	expect(after[0].id).toBe(before.id);
	expect(after[0].data.photos).toHaveLength(2);
	expect(after[0].data.photos[0]).toBe(before.data.photos[0]);
	expect(uploads).toBe(3);
});

test("回忆拒绝非图片但保留已保存的部分，可以换一张而不重传", async ({ page, app }) => {
	let uploads = 0;
	await page.route("**/api/files", r => { uploads++; return r.continue(); });
	await page.goto("/memories");
	await page.getByRole("button", { name: "添加一段回忆" }).click();
	const editor = page.getByRole("dialog"), input = editor.locator('input[type="file"]');
	await editor.getByLabel("标题", { exact: true }).fill("六月");
	await input.setInputFiles([png, txt]);
	await editor.getByRole("button", { name: "保存回忆" }).click();
	await expect(editor.getByText(/笔记.txt.*重新选择/)).toBeVisible();
	await expect(editor.getByRole("button", { name: /重试/ })).toHaveCount(0);
	await expect(editor.getByRole("button", { name: "完成" })).toBeVisible();
	const [before] = await app.docs("memories");
	expect(before.data.photos).toHaveLength(1);
	await editor.getByRole("button", { name: /移除.*第 2 张/ }).click();
	await input.setInputFiles({ ...png, name: "新照片.png" });
	await editor.getByRole("button", { name: "保存回忆" }).click();
	await expect(editor).toHaveCount(0);
	const [after] = await app.docs("memories");
	expect(after.id).toBe(before.id);
	expect(after.data.photos).toHaveLength(2);
	expect(after.data.photos[0]).toBe(before.data.photos[0]);
	expect(uploads).toBe(2);
});

test("相册混选失败只重试暂时失败项，切换筛选不改变原分类", async ({ page, app }) => {
	let uploads = 0;
	await page.route("**/api/files", r => ++uploads === 2 ? r.abort() : r.continue());
	await page.goto("/album");
	await page.getByText("海边", { exact: true }).click();
	await page.locator('input[type="file"]').setInputFiles([txt, png, { ...png, name: "断网.png" }]);
	await expect(page.getByText(/笔记.txt.*重新选择/)).toBeVisible();
	await expect(page.getByText(/断网.png.*网络/)).toBeVisible();
	await page.getByText("旅行", { exact: true }).click();
	await page.getByRole("button", { name: "重试 1 张照片" }).click();
	await expect(page.getByText("已存入相册 1 张。1 张未存入相册。")).toBeVisible();
	await expect(page.getByRole("button", { name: /重试/ })).toHaveCount(0);
	await expect(page.getByText(/断网.png.*网络/)).toHaveCount(0);
	await expect(page.getByText(/笔记.txt.*重新选择/)).toBeVisible();
	expect((await app.docs("photos")).map(doc => doc.data.tag)).toEqual(["sea", "sea"]);
	expect(uploads).toBe(3);
});

test("分类为空与相册为空有区别；标签独立保存，照片名仍可见", async ({ page, app }) => {
	await app.put("photos", "one", { cap: "海边合照", c: 1, asset: await app.photo(), tag: "sea" });
	await page.goto("/album");
	await page.getByText("旅行", { exact: true }).click();
	await expect(page.getByText(/旅行分类还没有照片/)).toBeVisible();
	await page.getByRole("button", { name: "查看全部" }).click();
	await page.getByRole("button", { name: /查看.*海边合照/ }).click();
	const lb = page.getByRole("dialog");
	await expect(lb.getByLabel("照片名", { exact: true })).toHaveValue("海边合照");
	await lb.getByRole("button", { name: "海边" }).click();
	await expect(lb.getByRole("button", { name: "海边" })).toHaveAttribute("aria-pressed", "true");
	await lb.getByRole("button", { name: "未分类" }).click();
	await expect.poll(async () => (await app.docs("photos"))[0].data.tag).toBe("");
	await expect(lb.getByRole("button", { name: "未分类" })).toHaveAttribute("aria-pressed", "true");
	await lb.getByRole("button", { name: "日常" }).click();
	await expect(lb.getByRole("button", { name: "日常" })).toHaveAttribute("aria-pressed", "true");
	await lb.getByLabel("照片名", { exact: true }).fill("日落");
	await lb.getByRole("button", { name: "保存名字" }).click();
	await expect.poll(async () => (await app.docs("photos"))[0].data).toMatchObject({ tag: "daily", cap: "日落" });
});

test("相册在筛选内翻页，保护未保存名字，关闭后回到当前缩略图", async ({ page, app }) => {
	const asset = await app.photo();
	for (const [i, cap] of ["末张", "不在分类里", "中间", "首张"].entries()) {
		await app.put("photos", `photo-${i}`, { cap, c: i, asset, tag: i === 1 ? "trip" : "sea" });
	}
	await page.goto("/album");
	await page.getByText("海边", { exact: true }).click();
	const thumbs = page.getByRole("button", { name: /^查看第/ });
	await thumbs.first().focus();
	await page.keyboard.press("Tab");
	await expect(thumbs.nth(1)).toBeFocused();
	const [a, b] = await Promise.all([thumbs.first().boundingBox(), thumbs.nth(1).boundingBox()]);
	expect(a!.y).toBe(b!.y);
	expect(b!.x).toBeGreaterThan(a!.x);
	await thumbs.first().click();
	const box = page.getByRole("dialog"), prev = box.getByRole("button", { name: "上一张" }), next = box.getByRole("button", { name: "下一张" });
	const caption = box.getByLabel("照片名", { exact: true });
	await expect(prev).toBeDisabled();
	await expect(box.getByRole("status")).toHaveText("1 / 3");
	await next.click();
	await expect(caption).toHaveValue("中间");
	await page.keyboard.press("ArrowRight");
	await expect(next).toBeDisabled();
	await expect(caption).toHaveValue("末张");
	await page.keyboard.press("ArrowLeft");
	await expect(box.getByRole("status")).toHaveText("2 / 3");
	await caption.fill("还没保存");
	await page.keyboard.press("ArrowLeft");
	await expect(caption).toHaveValue("还没保存");
	for (const action of [() => prev.click(), () => page.keyboard.press("Escape"), () => box.getByRole("button", { name: "关闭" }).click()]) {
		await action();
		const prompt = page.getByRole("alertdialog", { name: "放弃照片名修改？" });
		await expect(prompt).toHaveAccessibleDescription(/尚未保存/);
		await prompt.getByRole("button", { name: "继续编辑" }).click();
		await expect(box.getByRole("status")).toHaveText("2 / 3");
		await expect(caption).toHaveValue("还没保存");
	}
	await next.click();
	await page.getByRole("alertdialog").getByRole("button", { name: "放弃修改" }).click();
	await expect(caption).toHaveValue("末张");
	const image = await box.getByRole("img").boundingBox();
	const touch = await page.context().newCDPSession(page);
	await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true });
	const x = image!.x + 20, y = image!.y + image!.height / 2;
	await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
	await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 100, y }] });
	await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
	await expect(caption).toHaveValue("中间");
	await box.getByRole("button", { name: "旅行" }).click();
	await expect(caption).toHaveValue("末张");
	await expect(box.getByRole("status")).toHaveText("2 / 2");
	await page.keyboard.press("Escape");
	await expect(thumbs.last()).toBeFocused();
});

test("首页按 id 定位回忆，时间线按日期、同日创建时间倒序", async ({ page, app }) => {
	const memory = { date: "2026-11-05", c: 1, text: "一段回忆。".repeat(45), photos: [] };
	await app.put("memories", "old", { ...memory, title: "同名回忆", photos: [await app.photo()] });
	await app.put("memories", "new", { ...memory, date: "2026-11-12", title: "同名回忆" });
	await app.put("memories", "latest", { ...memory, date: "2026-11-12", c: 2, title: "傍晚" });
	await page.goto("/");
	await page.locator('a[href="/memories?item=old"]').click();
	await expect(page.locator("ol h2")).toHaveText(["傍晚", "同名回忆", "同名回忆"]);
	await expect(page.locator("#memory-old")).toBeFocused();
	await expect(page.locator("#memory-old")).toBeInViewport();
	await page.goto("/memories?item=new");
	await expect(page.locator("#memory-new")).toBeFocused();
	await page.goto("/memories?item=missing");
	await expect(page.getByText("找不到这段回忆。")).toBeVisible();
});

test("手机新日记先写正文，滚动和上传时发布区保持可见", async ({ page, app }) => {
	await page.setViewportSize({ width: 360, height: 480 });
	await page.goto("/diary?write=today");
	const editor = page.getByRole("dialog"), text = editor.getByLabel("正文", { exact: true });
	const publish = editor.getByRole("button", { name: "发布", exact: true });
	await expect(text).toBeFocused();
	await expect(text).toBeInViewport({ ratio: 1 });
	await expect(publish).toBeInViewport({ ratio: 1 });
	await text.fill("我们去看海");
	await page.setViewportSize({ width: 360, height: 360 });
	const title = editor.getByLabel("标题", { exact: true });
	await title.click();
	await title.fill("海边");
	await expect(publish).toBeInViewport({ ratio: 1 });
	const titleBox = await title.boundingBox();
	expect(titleBox!.y + titleBox!.height).toBeLessThan((await publish.boundingBox())!.y);
	await editor.locator('input[type="file"]').setInputFiles(png);
	let release!: () => void;
	const pending = new Promise<void>((resolve) => { release = resolve; });
	await page.route("**/api/files", async (r) => { await pending; await r.fulfill(busy); });
	await publish.click();
	try {
		await expect(editor.getByRole("button", { name: "上传照片中…" })).toBeDisabled();
		await page.keyboard.press("Escape");
		await expect(editor).toBeVisible();
	} finally { release(); }
	await expect(editor.getByRole("alert")).toBeVisible();
	await expect(text).toHaveValue("我们去看海");
	await page.unroute("**/api/files");
	await publish.click();
	await expect(editor).toHaveCount(0);
	const [entry] = await app.docs("diary");
	expect(entry.data.yi.photo).toMatch(/^[a-f0-9]{32}$/);
	expect(entry.data.yi.t).toBe("我们去看海");
});
