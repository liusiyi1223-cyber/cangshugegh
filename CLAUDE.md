# 互联网总收藏夹

一个网站：用户把 B站、小红书、抖音、百度、知乎等国内平台的视频收藏，整理到一个地方。
每个用户的收藏完全私有，用户之间不互通，没有社交功能。

详细设计见 `docs/DESIGN.md`，开发计划与当前进度见 `docs/PLAN.md`。

## 不可违反的原则

- 只存「链接 + 元数据」（标题、封面、作者、来源平台），不下载、不转存视频本身。
- 所有收藏数据按用户隔离：每条记录带 `user_id`，每个查询都必须按当前登录用户过滤。
- 抓取只取公开元数据，控制请求频率，不绕过登录或平台风控。
- 抓取失败是常态：必须有降级路径，让用户手动补标题后仍能保存。
- 后端做成独立 API，网页只是它的一个客户端（将来可能加浏览器插件、小程序）。

## 技术栈

- Next.js + TypeScript（全栈）
- Postgres
- 对象存储（阿里云 OSS / 腾讯云 COS 或 S3 兼容服务），用于转存封面图
- 部署在中国大陆云服务器（需 ICP 备案）

## 目录约定

- `src/adapters/`：每个平台一个适配器文件，如 `bilibili.ts`
- `src/adapters/index.ts`：适配器注册与按链接匹配
- `tests/fixtures/`：各平台真实的分享文本样例，抓取逻辑的测试依据

## 适配器接口

新增平台只加一个文件并注册，不改主体代码：

```ts
interface PlatformAdapter {
  name: string                      // 如 "bilibili"
  match(url: string): boolean       // 这条链接是否属于该平台
  fetchMeta(url: string): Promise<{
    title: string
    cover?: string
    author?: string
    canonicalUrl: string            // 还原后的标准链接，用于去重
  }>
}
```

## 工作方式

- 复杂任务先用 Plan Mode 出方案，确认后再改代码。
- 一次只做 `docs/PLAN.md` 里的一小步，做完提交 git，并更新 PLAN.md 的进度。
- 每加一个平台，先在 `tests/fixtures/` 放几条真实分享文本，再写适配器和测试。
- 重要决定记录在 `docs/DESIGN.md` 末尾的「决策记录」。

## 常用命令

- `npm install`：安装依赖
- `npm run dev`：启动开发服务器（http://localhost:3000）
- `npm run build`：生产构建
- `npm run start`：运行生产构建
- `npm run lint`：ESLint 检查
- `npx prisma migrate dev --name <名字>`：创建并应用数据库迁移（数据库不存在时会自动创建）
- `npx prisma generate`：生成 Prisma Client
- `npx prisma studio`：打开数据库可视化界面
- `npx prisma migrate status`：查看迁移状态
