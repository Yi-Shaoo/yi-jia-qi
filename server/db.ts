import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config";

/**
 * 一个很小的文档库：每条数据属于某个集合（collection），用 id 区分，内容是一个 JSON 对象。
 * 结构和旧版网站用的 claude.ai 数据库一样，所以旧数据可以原样导入。
 */
export const COLLECTIONS = [
	"wishes", // 心愿清单
	"meta", // 共享设置：下次见面日期、首页封面
	"spots", // 约会地点的三张拍立得 + 攻略打勾
	"custom", // 两个人自己加的地点/餐厅
	"photos", // 相册
	"memories", // 回忆时间线
	"diary", // 约会日记
	"about", // 关于我们：条目
	"aboutcats", // 关于我们：自定义分类
	"daily", // 每日一问（一天一条，id = 日期）
	"stamps", // 扭蛋章
	"miss", // 想你计数器
	"bottles", // 漂流瓶
	"letters", // 时光信箱
	"pet", // 糯糯
] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

export function isCollection(name: string): name is CollectionName {
	return (COLLECTIONS as readonly string[]).includes(name);
}

export type DocData = Record<string, unknown>;
export interface Doc {
	id: string;
	data: DocData;
	updated: number;
}

mkdirSync(config.dataDir, { recursive: true });
mkdirSync(config.filesDir, { recursive: true });

export const db = new Database(join(config.dataDir, "yijiaqi.sqlite"), { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA busy_timeout = 5000;");
db.exec(`
CREATE TABLE IF NOT EXISTS docs (
	col TEXT NOT NULL,
	id TEXT NOT NULL,
	data TEXT NOT NULL,
	updated INTEGER NOT NULL,
	PRIMARY KEY (col, id)
);
CREATE TABLE IF NOT EXISTS files (
	id TEXT PRIMARY KEY,
	type TEXT NOT NULL,
	size INTEGER NOT NULL,
	created INTEGER NOT NULL,
	by TEXT
);
`);

const qList = db.query<{ id: string; data: string; updated: number }, [string]>(
	"SELECT id, data, updated FROM docs WHERE col = ? ORDER BY updated",
);
const qGet = db.query<{ id: string; data: string; updated: number }, [string, string]>(
	"SELECT id, data, updated FROM docs WHERE col = ? AND id = ?",
);
const qPut = db.query<unknown, [string, string, string, number]>(
	"INSERT INTO docs (col, id, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, updated = excluded.updated",
);
const qDel = db.query<unknown, [string, string]>("DELETE FROM docs WHERE col = ? AND id = ?");

function row(r: { id: string; data: string; updated: number }): Doc {
	return { id: r.id, data: JSON.parse(r.data) as DocData, updated: r.updated };
}

export function listDocs(col: CollectionName): Doc[] {
	return qList.all(col).map(row);
}

export function getDoc(col: CollectionName, id: string): Doc | null {
	const r = qGet.get(col, id);
	return r ? row(r) : null;
}

export function putDoc(col: CollectionName, id: string, data: DocData): Doc {
	const updated = Date.now();
	qPut.run(col, id, JSON.stringify(data), updated);
	return { id, data, updated };
}

/** 浅合并：只替换传进来的顶层字段（和旧版数据库的 update 行为一致） */
export function mergeDoc(col: CollectionName, id: string, patch: DocData): Doc | null {
	const cur = getDoc(col, id);
	if (!cur) return null;
	return putDoc(col, id, { ...cur.data, ...patch });
}

export function deleteDoc(col: CollectionName, id: string): boolean {
	return qDel.run(col, id).changes > 0;
}

export function newId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	const abc = "0123456789abcdefghijklmnopqrstuvwxyz";
	return Array.from(bytes, (b) => abc[b % 36]).join("");
}

const qFilePut = db.query<unknown, [string, string, number, number, string | null]>(
	"INSERT OR REPLACE INTO files (id, type, size, created, by) VALUES (?, ?, ?, ?, ?)",
);
const qFileGet = db.query<{ id: string; type: string; size: number }, [string]>(
	"SELECT id, type, size FROM files WHERE id = ?",
);
const qFileDel = db.query<unknown, [string]>("DELETE FROM files WHERE id = ?");

export function recordFile(id: string, type: string, size: number, by: string | null) {
	qFilePut.run(id, type, size, Date.now(), by);
}
export function fileInfo(id: string) {
	return qFileGet.get(id);
}
export function forgetFile(id: string) {
	qFileDel.run(id);
}
