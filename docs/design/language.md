# Yi & Jia Qi · 草莓奶油铺（A）

**已确认：全站一种基调，Header 无动画，基础组件在项目内维护。** 首页、日记、列表和挂在 `body` 下的浮层共用同一套明暗配色，不按路由重置 `html`。保留一道静态粉白店招；波点只在封面。纸张、照片、马卡龙和小游戏是内容，不是新的按钮或表单主题。

## 基础样式

数值的唯一代码来源是 [`src/app.css`](../../src/app.css)。页面消费 Tailwind 语义类（如 `bg-card`、`text-muted-foreground`），不复制下面的色值。

| 用途 | 浅色 | 深色 |
| --- | --- | --- |
| 画布 / 正文 | `#fff7f5` / `#4a2a33` | `#1f181d` / `#f7e8ec` |
| 卡片、浮层 / 前景 | `#fffdfb` / 正文 | `#2b2228` / 正文 |
| 主操作、焦点 / 按钮文字 | `#b4416a` / 白 | `#ff9fbb` / `#3a1424` |
| 次选背景 / 次选文字 | `#ffe3ec` / `#8e2f52` | `#45293a` / `#ffc6d6` |
| 次要文字 / 卡片边界 | `#795963` / `#f0d4d6` | `#cfb3bb` / `#4a3a43` |

- `primary` 表示操作，`destructive` 表示风险，`yi/jq` 表示人物，不能互相替代。旧 `sea` 是 `primary` 的兼容别名，不再是独立色板。人物和错误都要有文字，不能只凭颜色识别。
- 标题用 `font-display`（共享 `PageHeader` 为 34/44px）；中文正文用 `font-sans`，日期用 `font-mono`。Pacifico 用于英文店名和签名，不用于表单。普通内容卡用 20px 圆角、单圈边界；紧凑列表内距 16px，常规内容 20–24px。照片纸边和双人明信片不套普通卡的圆角。
- **Header 始终静止**，不是仅在系统要求减少动态时才静止。顶栏不设写日记快捷按钮；长短页面切换时保留滚动条槽位，不让账号和导航横移。菜单开合、悬停、按下、箭头和通过 portal 渲染的账号菜单均无过渡；通过底色、当前页语义和可见焦点反馈。此决定不删除其他页面已有的业务反馈、小游戏动效或移动端底栏 Sheet 的开合。全站继续尊重 `prefers-reduced-motion`。

## 本地组件库

入口：[`src/lib/components/ui/`](../../src/lib/components/ui/)；注册表及别名见 [`components.json`](../../components.json)。shadcn-svelte 的组件源码归项目维护，不是只能原样使用的依赖。Bits UI 负责交互语义；皮肤和变体在本地 `ui/<组件>/` 修改，统一通过该目录的 `index.ts` 导出。页面只决定内容、布局和业务状态。

| 场景 | 使用方式 |
| --- | --- |
| 主次操作 | `Button` 默认草莓粉胶囊；次要操作用 `outline`、低强调用 `ghost`、行内动作用 `link`。跳转传 `href`，不要在 `<a>` 里再嵌按钮。危险操作用 `destructive` 并保留确认。 |
| 可点击照片、手绘玩具 | `Button variant="surface"` 保留原生按钮、键盘焦点和禁用状态，不强制插画尺寸或填充色。只用于内容本身就是点击目标，不用它复制普通按钮。 |
| 卡片 | 标准结构使用 `Card.Root/Header/Title/Content/Footer`。简单容器用 `Card.Root variant="surface" as="article"`（也支持 `section`、`div`、`p`）。需要保留原生 `<form>` 时使用同库导出的 `cardSurface` 配方，不另写阴影和边框。 |
| 表单、选择 | `Input`、`Textarea`、`Label`、`Select`、`Checkbox`；筛选与日记类型共用本地 `RadioChoice`（`chip` / `segment`，shadcn Label + 原生单选）。保留 fieldset/legend、方向键、字段错误关联和禁用状态。 |
| 导航 | [`nav.ts`](../../src/lib/nav.ts) 是桌面与手机共用的顺序、路径和名称来源。桌面使用 `NavigationMenu.Root/List/Item/Trigger/Content/Link`；手机用 `Button` 页签与 `Sheet`。两者共用 `NavigationMenu.Entry`，子菜单只显示页面名称。桌面面板按本组最长名称加内边距定宽，不窄于触发按钮；手机保持整行可点。 |
| 账号、浮层 | 账号使用 `DropdownMenu`（外观为 RadioGroup）；编辑用 `Dialog`，删除确认用 `AlertDialog`。不要用自制绝对定位面板模拟菜单、焦点管理或关闭行为。 |

```svelte
<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
</script>

<Card.Root as="article" variant="surface" class="grid gap-3 p-5">
  <h2>海边的傍晚</h2>
  <Button href="/diary?write=today" class="justify-self-start">写日记</Button>
</Card.Root>
```

新增控件前先查 `ui/`，缺少原语才用 `bunx shadcn-svelte@latest add <组件名>`。产品差异优先做变体；同一种样式第二次出现就提回组件库。业务组合（如 `PlayCard`、`TravelCard`）留在 `components/`，不要把路由、账号或数据请求引入 `ui/`。升级注册表组件时逐项审查差异，不覆盖本地变体。

## 页面配方

| 页面 | 复用与例外 |
| --- | --- |
| 首页、日记 | 首页先显示封面与当日日记入口。「出去玩」卡片先列名称，再列数量或日期和简介；「今天的灵感」用独立同级标题，不把区块标题包在卡片内。两人的摘要和完整日记共用 `diary/PaperCard`：浅色用暖白横线信纸、深蓝正文和棕色邮戳，Yi 用草莓粉签名与浅粉便笺，Jia Qi 用湖蓝签名与浅蓝便笺；深色保留粉蓝区分，不改变全站身份色；日记外层仍是普通卡片。见面日不提供地点输入或展示；各自日的个人地点只在对应署名下展示，未填写不占位。编辑器优先呈现个人正文；桌面将共用字段置于右栏，窄屏移至正文下方，发布操作留在滚动区之外。用状态文字反馈草稿自动保存和打开时的恢复，不提供手动存草稿按钮；照片仅在发布时保存。 |
| 回忆、相册 | 回忆沿时间线直接排版，不在条目外套卡片；桌面左文右图，无照片的记录不预留图位。回忆里的横图缩略图按原高度最多增加 20%，竖图和大图不裁切。相册筛选无外框，照片按原比例分栏排列。两页均复用 `Polaroid`，保留上传日期与原始日期的区别。 |
| 地点、美食、自驾、节日 | `PageHeader` 放标题、出行提示及新增入口；`TravelToolbar` 不套卡片：桌面搜索框和筛选项同排、等高，窄屏先搜索、再按需换行展示筛选。搜索标签始终可见，输入框提示可搜的内容。地点、餐厅和路线列表初始显示 9 项，接近列表底部时自动追加下一批，无需点击。 |
| 心愿、关于我们 | 新心愿表单不套卡片，用 `InputGroup.Input` 输入内容，提交按钮放在 `InputGroup.Addon` 末端；分类和想要人保持独立选择。关于我们的分类卡按内容定高，不随相邻卡拉伸；每人一栏，输入框靠近姓名，已存条目在下方换行，手机上下排列。进度属于对应分类；批量保存属于整个表单，不重复到每一项。 |
| 一起玩 | 页内导航用链接型 `Button`，模块复用 `PlayCard`，想你记录用本地 `ScrollArea` 独立纵向滚动；插画可有自己的颜色，展开的信件和留言仍使用主题卡片。 |
| 登录、404 | 登录保留店名、暗号和失败原因；404 仅保留状态、原因和回首页操作。两者不另起配色。 |

常规页面统一使用 `PageHeader`（标题、可选说明与操作）。列表无记录或无匹配时用 `EmptyState` 放结果及下一步；加载中或请求失败仍用 `CollectionNotice`，不要把失败渲染成空数据。

## 迁移验收

1. 同一操作在首页、日记与弹窗使用同一语义色；检查浅/深色、长中文、空态和错误态。
2. 至少覆盖窄屏、768px 导航切换点及桌面。用键盘打开分组、进入当前链接、Escape 关闭账号/Sheet，检查可见焦点与触控范围。
3. 在**正常动态偏好**下核对 Header 没有动画和按压位移；在减少动态下检查其他浮层和玩具仍能给出结果。
4. 运行 `bun run check`、`bun run test`、`bun run test:ui`；调整公共变体同时验证至少两个真实消费者。

