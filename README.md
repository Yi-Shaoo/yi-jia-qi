<img src="assets/icon.svg" width="64" height="64" alt="">

# Yi & Jia Qi

UCI ⇄ UCLA，405 号公路两头的我们的小网站：约会日记、回忆时间线、相册、一起玩（糯糯、每日一问、扭蛋机、想你计数器、漂流瓶、时光信箱、问题卡）、心愿清单、约会/美食/Road-trip/节日攻略。

两个人各有一个密码，用谁的密码登录就是谁；一个人改了什么，另一个人的页面会实时更新。断线时顶栏会显示「正在重连」。首次打开时若无法确认登录状态，可在原页重试；退出请求未成功时会明确提示，不会显示已退出。登录失败按来源限制：10 分钟窗口内输错 10 次后暂停尝试直到窗口结束；正确登录不占失败额度，也不清除已有失败次数。

- 约会日记单独使用甜点店的粉白条纹页头和两封明信片：桌面并排、窄屏上下阅读。日期、类型和标题两人共用，正文、瞬间、照片和个人地点各写各的。旧日记的共享地点单独展示，不会随个人编辑而改变。本机草稿按账号保存，只存文字。今日入口优先打开当天最早的一篇及其对应草稿；若没有已发布的日记，就续写本人当天最近的新建草稿。其他草稿和日记仍可在日记页单独打开。照片改动在发布时保存。删除整篇会同时移除两人的记录。
- 相册和回忆的大图都支持左右按钮、方向键和轻扫；分别在当前分类、当前回忆内翻页。回忆按最新日期排在前面。缺少标题或日期无效的旧回忆列在「待整理的回忆」，可以补全后放回时间线，也可以确认删除。相册和回忆会保留已成功的照片；离开页面前可重试暂时失败的项目，不支持或过大的文件需重新选择。移除一处照片不破坏其他记录仍引用的同一文件。
- 从地点、餐厅、路线或节日加入心愿后，点「已在心愿」可定位并高亮对应记录；按浏览器返回可恢复原列表的筛选、已加载卡片及来源链接的阅读位置。四个出游页都可复制含搜索词和筛选条件的网址。「谁想要」与「谁添加」分开记录。
- 约会地点和餐厅支持搜索和地区筛选；展开卡片可看攻略、照片或用餐贴士。节日活动名直达主办方或官方公告，跨年场次以官网为准。
- 同一浏览器换账号，已打开的标签页会重新确认身份。信件、漂流瓶、每日回答、关于我们的未提交草稿和未打卡的扭蛋只随本人账号恢复；无法确认归属的旧本机数据不自动导入。已提交的共享记录和浏览器的明暗模式不随账号清除。
- 一起玩的七个模块可从页内导航直达；关于我们的多项草稿一起保存，失败项保留原文。

## 技术栈

| 部分 | 用的什么 |
| --- | --- |
| 前端 | Svelte 5 + Vite + TypeScript |
| 样式 / 组件 | Tailwind CSS v4 + shadcn-svelte（maia 风格）+ Lucide 图标 |
| 后端 | Bun（`Bun.serve`）+ SQLite（`bun:sqlite`） |
| 实时同步 | Server-Sent Events（`/api/events`） |
| 部署 | 单个 Docker 容器，面向 Coolify |

设计方向是「方案 B · 海岸 Coastal」：沙色底、太平洋蓝主色、日落珊瑚强调色、拍立得 + 胶片日期戳。首页在没有自选照片时使用本地海岸插画，手机首屏可直接写或续写今天的日记；最近回忆同时展示照片与文字记录。颜色和内容卡片样式 `.surface-card` 统一在 [`src/app.css`](src/app.css)；普通内容卡使用 20px 圆角，拍立得保留纸边。外观默认跟随系统，可在账号菜单固定为浅色或深色；支持减少动画、键盘跳到正文和站内换页播报。缩略图保留小图原尺寸；相册会标明上传日期，没有可信时间的图片不显示日期戳。

本地评审材料位于 `reports/`（不随生产部署发布）。

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
bun run test       # 单元回归：草稿、照片重试、批量保存、心愿等
bun run build      # 构建前端到 dist/
bun run start      # 生产模式启动（需要先 build，并设置环境变量）
bunx shadcn-svelte@latest add <组件名> --yes   # 再加 shadcn 组件
```

### 浏览器回归

首次运行先执行 `bunx playwright install chromium`，再运行 `bun run test:ui`。已有 Chrome 也可用环境变量 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定其可执行文件。测试构建真实前端，每个用例使用本机回环地址、独立临时 SQLite、测试照片和随机密码；不会读写 `./data/`。覆盖桌面和窄屏、读写失败、删除确认、跨账号同步以及主要交互。

可选的移动 WebKit 核查：执行 `bunx playwright install webkit`、`bun run build`、`bunx playwright test -c playwright.webkit.config.ts`。这些用例以 iPhone 13 浏览器参数测试日记编辑、回忆翻页、不同照片比例下的连续翻页、系统外观切换、小图日期、每日一问、长文收起定位和地区筛选直达心愿；不等同于 iPhone 真机、系统软键盘或 VoiceOver 验证。

## 持续集成

向 `main` 推送或提交目标为 `main` 的 PR 时，[GitHub Actions CI](.github/workflows/ci.yml) 会从干净检出运行两项检查：

- 用锁定的 Bun 依赖运行类型检查、单元测试和 Playwright 浏览器回归（包含生产前端构建）。
- 按 `docker-compose.yml` 构建并启动生产镜像，验证 `/api/health` 和首页的构建产物引用，然后清理测试容器和卷。CI 不使用生产密码，也不会发布镜像或触发部署命令。

## 部署到 Coolify

1. Coolify 里新建资源，选这个 Git 仓库，Build Pack 选 **Docker Compose**（用仓库里的 `docker-compose.yml`）。
   也可以选 **Dockerfile**，然后自己加一个持久化存储挂到 `/data`，端口填 `3000`。
2. 在 Environment Variables 里填以下变量。它们只在容器运行时使用：保留 Runtime，关闭 Build time。
   - `YI_PASSWORD`、`JQ_PASSWORD`：两个人的密码（不能一样）
   - `SESSION_SECRET`：随机字符串，用 `openssl rand -hex 32` 生成
3. 在服务的 Domains 里填域名（例如 `https://us.example.com`），Coolify 会自动配 HTTPS。
4. 部署。健康检查地址是 `/api/health`。

如果 Coolify 只显示 `exit code: 1`，查看该次部署的完整构建日志，找到 Vite 输出的第一条错误。也可以在有 Docker 的机器上运行 `docker build --progress=plain .` 复现，构建不需要设置登录密码或 `SESSION_SECRET`。

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
