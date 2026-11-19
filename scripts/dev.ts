export {};
// 本地开发：同时启动后端（:3000）和 Vite（:5173，/api 和 /files 代理到后端）
const procs = [
	Bun.spawn(["bun", "--watch", "server/index.ts"], { stdout: "inherit", stderr: "inherit" }),
	Bun.spawn(["bunx", "vite"], { stdout: "inherit", stderr: "inherit", stdin: "inherit" }),
];
const stop = () => {
	for (const p of procs) p.kill();
	process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await Promise.race(procs.map((p) => p.exited));
stop();
