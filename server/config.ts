import { join, resolve } from "node:path";

function env(name: string, fallback?: string): string {
	const v = process.env[name];
	if (v && v.trim()) return v.trim();
	if (fallback !== undefined) return fallback;
	throw new Error(`缺少环境变量 ${name}（见 .env.example）`);
}

const isProd = process.env.NODE_ENV === "production";
const dataDir = resolve(env("DATA_DIR", "./data"));

export const config = {
	isProd,
	port: Number(env("PORT", "3000")),
	bindAddress: env("BIND_ADDRESS", "0.0.0.0"),
	dataDir,
	filesDir: join(dataDir, "files"),
	staticDir: resolve(env("STATIC_DIR", "./dist")),
	/** 两个人各自的登录密码，用哪个密码登录就是谁 */
	passwords: {
		yi: env("YI_PASSWORD", isProd ? undefined : "yi"),
		jq: env("JQ_PASSWORD", isProd ? undefined : "jq"),
	},
	sessionSecret: env("SESSION_SECRET", isProd ? undefined : "dev-secret-change-me"),
	/** 登录有效期（天） */
	sessionDays: Number(env("SESSION_DAYS", "180")),
	maxUploadBytes: Number(env("MAX_UPLOAD_MB", "15")) * 1024 * 1024,
};

if (config.isProd && config.passwords.yi === config.passwords.jq) {
	throw new Error("YI_PASSWORD 和 JQ_PASSWORD 不能一样");
}
