<img src="assets/icon.svg" width="64" height="64" alt="">

# Yi & Jia Qi

UCI ⇄ UCLA，405 号公路两头的我们的小网站：约会日记、回忆时间线、相册、一起玩（糯糯、每日一问、扭蛋机、想你计数器、漂流瓶、时光信箱、问题卡）、心愿清单、约会/美食/Road-trip/节日攻略。

两个人各有一个密码，用谁的密码登录就是谁；一个人改了什么，另一个人的页面会实时更新。

## 技术栈

| 部分 | 用的什么 |
| --- | --- |
| 前端 | Svelte 5 + Vite + TypeScript |
| 样式 / 组件 | Tailwind CSS v4 + shadcn-svelte（maia 风格）+ Lucide 图标 |
| 后端 | Bun（`Bun.serve`）+ SQLite（`bun:sqlite`） |
| 实时同步 | Server-Sent Events（`/api/events`） |
| 部署 | 单个 Docker 容器，面向 Coolify |

设计方向是「方案 B · 海岸 Coastal」：沙色底、太平洋蓝主色、日落珊瑚强调色、拍立得 + 胶片日期戳。颜色都在 [`src/app.css`](src/app.css) 的 CSS 变量里，支持深色模式。

## 目录

```
src/
  App.svelte              路由和整体布局
  pages/                  每个页面一个文件（Home、Diary、Play…）
  lib/
    components/ui/        shadcn-svelte 组件（用 CLI 生成，尽量不手改）
    components/           自己写的组件（拍立得、导航、日记明信片、一起玩的各个卡片…）
    data/content.ts       静态内容：32 个约会地点、24 家店、12 条路线、节日活动、问题卡题库…
    sync.svelte.ts        数据层：useCollection("wishes") 拿到一个实时同步的集合
    session.svelte.ts     登录状态
    router.svelte.ts      很小的 history 路由
server/
  index.ts                API + 静态文件 + 照片
  db.ts                   SQLite 文档库（集合 / id / JSON）
  auth.ts                 双密码登录、签名 Cookie
  events.ts               SSE 实时推送
scripts/
  dev.ts                  本地同时启动前后端
  import-legacy.ts        从旧版网站导入数据
```

## 本地开发

```bash
bun install
bun run dev        # 后端 :3000 + Vite :5173（打开 http://localhost:5173）
```

本地默认密码：Yi 是 `yi`，Jia Qi 是 `jq`，数据存在 `./data/`（已在 .gitignore 里）。

其他命令：

```bash
bun run check      # svelte-check + 前后端 TypeScript 检查
bun run build      # 构建前端到 dist/
bun run start      # 生产模式启动（需要先 build，并设置环境变量）
bunx shadcn-svelte@latest add <组件名> --yes   # 再加 shadcn 组件
```

## 部署到 Coolify

1. Coolify 里新建资源，选这个 Git 仓库，Build Pack 选 **Docker Compose**（用仓库里的 `docker-compose.yml`）。
   也可以选 **Dockerfile**，然后自己加一个持久化存储挂到 `/data`，端口填 `3000`。
2. 在 Environment Variables 里填：
   - `YI_PASSWORD`、`JQ_PASSWORD`：两个人的密码（不能一样）
   - `SESSION_SECRET`：随机字符串，用 `openssl rand -hex 32` 生成
3. 在服务的 Domains 里填域名（例如 `https://us.example.com`），Coolify 会自动配 HTTPS。
4. 部署。健康检查地址是 `/api/health`。

**数据都在 `/data` 卷里**（`yijiaqi.sqlite` + `files/` 照片）。备份就是备份这个卷；Coolify 的 Persistent Storage 里可以看到。

所有变量见 [`.env.example`](.env.example)。

## 从旧版网站导入数据

旧版是 claude.ai 上的一个 Artifact。导入需要三样东西，都放在仓库根目录（都已经 gitignore，不会被提交）：

- `Yi & Jia Qi.html`：旧版网站的单文件快照（里面内嵌了大部分照片）
- `legacy/export/`：从旧版数据库导出的数据（每个集合一个文件夹）
- `legacy/assets/`：快照之后才上传的照片

然后对着**正在运行的**新网站执行（本地或线上都行）：

```bash
bun scripts/import-legacy.ts --to http://localhost:3000 --password yi
bun scripts/import-legacy.ts --to https://us.example.com --password <Yi 的密码>
```

已经存在的数据会跳过，可以放心重复运行；加 `--force` 会用旧数据覆盖。
