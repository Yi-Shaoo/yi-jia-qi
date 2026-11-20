import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { accountApi, setApiAccount } from "../../src/lib/api";

afterEach(() => {
	setApiAccount(null);
	mock.restore();
});

test("旧任务即使在同一账号重新登录后才开始，也不能借用新会话", async () => {
	const request = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({}));
	setApiAccount("yi");
	const old = accountApi();
	setApiAccount(null);
	setApiAccount("yi");
	await expect(old("/c/letters", { method: "POST" })).rejects.toThrow();
	expect(request).not.toHaveBeenCalled();
	await accountApi()("/c/letters");
	expect(new Headers(request.mock.calls[0][1]?.headers).get("x-yjq-account")).toBe("yi");
});

test("切换账号后忽略上一会话迟到的响应", async () => {
	const response = Promise.withResolvers<Response>();
	const fetch = spyOn(globalThis, "fetch").mockImplementation(() => response.promise);
	setApiAccount("yi");
	const old = accountApi()("/c/stamps");
	const signal = fetch.mock.calls[0][1]?.signal;
	setApiAccount("jq");
	expect(signal?.aborted).toBe(true);
	response.resolve(Response.json({ docs: [] }));
	await expect(old).rejects.toThrow();
});
