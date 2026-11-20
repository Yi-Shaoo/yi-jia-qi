import { describe, expect, mock, test } from "bun:test";
import { sendMissNote, type MissNoteDraft } from "../../src/lib/components/play/miss-note";

const draft = (text: string): MissNoteDraft => ({ text, edits: 0, sending: false });

function deferred() {
	let resolve!: () => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
	return { promise, resolve, reject };
}

describe("想你留言", () => {
	test("空白不发送，也不结算连击", async () => {
		const save = mock(async () => {});
		await sendMissNote(draft(" \t　"), save);
		expect(save).not.toHaveBeenCalled();
	});

	test("保存前保留原输入，等待中不重复发送，成功才清空", async () => {
		const note = draft(" 早上好 ");
		const request = deferred();
		const save = mock((_text: string) => request.promise);
		const sent = sendMissNote(note, save);
		await sendMissNote(note, save);
		expect(note.sending).toBe(true);
		expect(note.text).toBe(" 早上好 ");
		expect(save.mock.calls).toEqual([["早上好"]]);
		request.resolve();
		await sent;
		expect(note).toEqual(draft(""));
	});

	test("写入失败保留未裁剪的原文，可以再次发送", async () => {
		const note = draft(" 下次见 ");
		await expect(sendMissNote(note, async () => { throw new Error("offline"); })).rejects.toThrow("offline");
		expect(note).toEqual(draft(" 下次见 "));
		const save = mock(async (_text: string) => {});
		await sendMissNote(note, save);
		expect(save.mock.calls).toEqual([["下次见"]]);
		expect(note.text).toBe("");
	});

	for (const success of [false, true]) {
		test(`请求${success ? "成功" : "失败"}时不覆盖等候期间的新文字`, async () => {
			const note = draft("第一句");
			const request = deferred();
			const sent = sendMissNote(note, () => request.promise);
			note.text = "第二句";
			note.edits++;
			if (success) {
				request.resolve();
				await sent;
			} else {
				request.reject(new Error("offline"));
				await expect(sent).rejects.toThrow("offline");
			}
			expect(note.text).toBe("第二句");
			expect(note.sending).toBe(false);
		});
	}
});
