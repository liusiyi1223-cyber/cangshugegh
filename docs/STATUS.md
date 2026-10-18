# 项目状态

> 更新时间：2026-10-19

## 一、已完成的功能

- **账号**：邮箱 + 密码注册、登录、退出；登录态用 JWT 存 httpOnly cookie（30 天）。
- **数据隔离**：所有收藏、收藏夹、统计接口都按当前登录用户过滤，用户之间数据不互通。
- **一键收藏**：粘贴分享文本 → 提取链接 → 还原短链 → 识别平台 → 抓取标题/封面/作者 → 保存。
- **手动降级**：抓取失败时提示手动补「链接 + 标题」仍可保存。
- **自动去重**：按 `(userId, canonicalUrl)` 唯一约束，同一用户不重复收藏。
- **收藏列表**：按创建时间倒序，支持搜索（标题模糊匹配）和收藏夹过滤。
- **标签**：给收藏加多个标签。
- **收藏夹**：多对多，一个收藏可归多个收藏夹；新建/重命名/删除收藏夹，删除收藏夹不删收藏本身。
- **失效标记**：标记「已失效」/恢复，失效项置灰。
- **删除**：删除单条收藏（带确认）。
- **书签小工具**：一段可拖到浏览器书签栏的 JavaScript 小书签，一键跳转并填好链接。
- **抓取统计**：记录各平台抓取成功/失败次数与失败率（`/api/stats`）。
- **界面**：卡片网格布局（封面为主）+ 温暖柔和配色（米白底、陶土橙主色）。
- **封面转存**：保存收藏时下载封面到服务器本地磁盘 `data/covers/`，经 `/api/covers/[key]` 回显，失败降级保留源站原图。

## 二、页面

| 路径 | 说明 |
|---|---|
| `/` | 重定向到 `/favorites` |
| `/login` | 登录 / 注册 / 退出 |
| `/favorites` | 主界面（收藏管理，所有功能集中在此页） |

## 三、接口（API 路由）

所有接口均在 `src/app/api/` 下，除认证接口外均需登录。

**认证**

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/me` | 当前登录用户 |

**收藏**

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/favorites` | 列表，支持 `q`（搜索）、`collectionId`（收藏夹过滤，`unfiled` 为未分类） |
| POST | `/api/favorites` | 创建；自动模式传 `text`，手动模式传 `url`+`title` |
| PATCH | `/api/favorites/[id]` | 更新 `tags` / `status` / `collectionIds` |
| DELETE | `/api/favorites/[id]` | 删除 |

**收藏夹**

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/collections` | 列表 |
| POST | `/api/collections` | 新建 |
| PATCH | `/api/collections/[id]` | 重命名 |
| DELETE | `/api/collections/[id]` | 删除 |

**统计**

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/stats` | 各平台抓取成功率 |

**封面**

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/covers/[key]` | 回显已转存到本地磁盘的封面图（key 为不可枚举随机名，无需登录） |

## 四、数据表

Postgres + Prisma，共 4 张表 + 1 个枚举（隐式多对多中间表自动生成）：

| 表 | 说明 |
|---|---|
| `users` | 用户（email 唯一、密码哈希） |
| `favorites` | 收藏（含 canonicalUrl 去重唯一约束） |
| `collections` | 收藏夹（与 favorites 多对多） |
| `fetch_logs` | 抓取日志（统计用） |

枚举 `FavoriteStatus`：`ACTIVE` / `BROKEN`。详细字段见 `docs/DESIGN.md` 第 4 节。

## 五、技术栈现状

| 项 | 选型 |
|---|---|
| 框架 | Next.js 16（App Router）+ TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| 数据库 | PostgreSQL |
| ORM | Prisma 7（driver adapter 模式 `@prisma/adapter-pg`） |
| 认证 | jose（JWT）+ bcryptjs（密码哈希） |
| 抓取解析 | cheerio（HTML 解析） |
| 测试 | vitest |

**相对最初设计的变化/补充**：核心选型（Next.js 全栈 + Postgres + Prisma）未变；补充明确了 UI 用 Tailwind 4、认证用 JWT+cookie、测试用 vitest、Prisma 采用 driver adapter 模式。封面图转存改为服务器本地磁盘（放弃 OSS，见 DESIGN 决策记录）。

## 六、还没完成的事项

- **隐私政策**：上线前必须（PLAN 阶段 0）。
- **ICP 备案**：已提交，等待审核（PLAN 阶段 0）。
- **公安联网备案**：备案通过后 30 日内办理（PLAN 阶段 0）。
- **部署上线**：部署到大陆云服务器、配置域名与备案号（PLAN 阶段 5）。
- **小范围试用 + 正式开放**（PLAN 阶段 5）。
- **浏览器插件**：目前只做了书签小工具，独立插件待做。
- **note 字段**：数据模型已预留，暂无 UI 入口。

## 七、已知问题

- 存量旧收藏的封面仍是源站原图 URL，仍存在防盗链失效风险（新收藏已转存本地，旧数据回填待做）。
- 平台适配器依赖各平台页面结构（HTML 解析），平台改版会导致抓取失败；已有手动补标题的降级路径。
- 搜索为数据库 `LIKE` 模糊匹配，适合当前小数据量，数据量增长后需换专门搜索引擎。
- 抓取可能因平台风控或网络原因失败，属正常情况，靠降级路径兜底。
