---
name: study-buddy
description: StudyBuddy 跨国学习搭子匹配平台开发 Skill。用于在此项目中添加功能、修复 bug、优化代码或执行任何开发任务。
---

# StudyBuddy — Claude Code Skill

## 项目上下文

StudyBuddy 是一款帮助全球学习者找到考试搭子（学习伙伴）的跨平台小程序。详见 [CLAUDE.md](../CLAUDE.md)。

## 技术栈速查

```
前端: uni-app 3.x / Vue 3 / TypeScript / Pinia / vue-i18n
后端: Node.js / Express / TypeScript / Prisma ORM / Socket.io
数据库: PostgreSQL 15 + Redis 7
部署: Docker + docker-compose
```

## 开发工作流

### 添加新功能

1. **数据库变更**：先修改 `server/prisma/schema.prisma`，再运行 `npx prisma migrate dev --name <描述>`
2. **API 接口**：遵循 `routes → controllers → services` 分层，注册到 `server/src/routes/index.ts`
3. **前端页面**：在 `miniprogram/pages/` 下创建新页面目录，注册到 `miniprogram/pages.json`
4. **国际化**：在 `miniprogram/i18n/locales/` 的所有语言文件中同步添加新的翻译 key

### 代码规范

```typescript
// ─── 命名规范 ──────────────────────
// 文件名：kebab-case（user-card.vue, match-service.ts）
// 组件名：PascalCase（<UserCard />）
// 函数名：camelCase（getRecommendations()）
// 常量名：UPPER_SNAKE_CASE（MAX_PAGE_SIZE）
// 接口名：PascalCase, 不加 I 前缀（MatchCandidate）

// ─── API 规范 ──────────────────────
// 响应格式统一：
{ code: 0, message: "ok", data: T, pagination?: Pagination }
// 错误码：10001-参数错误, 10002-未登录, 10003-无权限, 10004-资源不存在
```

### 关键文件索引

| 文件 | 用途 |
|------|------|
| `server/src/index.ts` | 后端入口，Express + Socket.IO 启动 |
| `server/src/services/match.ts` | 匹配算法核心：computeMatchScore() |
| `server/src/middleware/auth.ts` | JWT 认证 + 实名验证中间件 |
| `server/prisma/schema.prisma` | 数据库 Schema 定义 |
| `miniprogram/pages/match/match.vue` | 搭子匹配页 |
| `miniprogram/pages/chat/chat.vue` | 实时聊天页 |
| `miniprogram/store/user.ts` | 用户状态管理 (Pinia) |
| `miniprogram/i18n/locales/en.ts` | 英文翻译（基准） |
| `docs/architecture.md` | 系统架构图 |
| `docs/api-design.md` | API 接口文档 |

## 常见开发任务

### 添加新的考试类型

1. 在 `prisma/schema.prisma` 的 `ExamCategory` enum 中添加
2. 运行 migration
3. 在 `prisma/seed.ts` 中添加新考试的种子数据
4. 在前端 `pages/exam/exam.vue` 中添加对应 tab
5. 更新所有 locale 文件的 `exam` section

### 优化匹配算法

编辑 `server/src/services/match.ts` 中的 `computeMatchScore()` 函数。权重分配：
- examMatch × 0.35
- timezoneCompat × 0.25
- scheduleOverlap × 0.20
- languageOverlap × 0.15
- avgRating × 0.05

### 添加新的语言支持

1. 在 `miniprogram/i18n/locales/` 下创建 `<locale>.ts`
2. 在 `locales/index.ts` 中注册
3. 在 `server/src/middleware/i18n.ts` 的 `SUPPORTED_LOCALES` 中添加
4. 更新 `components/LanguageSwitcher.vue` 的 `flags` map

## 启动命令

```bash
# 本地开发
cd server && pnpm dev          # 后端 http://localhost:3000
cd miniprogram && pnpm dev:mp-weixin  # 微信小程序

# Docker 部署
docker-compose up -d           # 启动所有服务
docker-compose logs -f app     # 查看日志
```

## 测试策略

- **后端单元测试**：`pnpm test` (Vitest)
- **API 集成测试**：通过请求文件手动验证 `docs/api-design.md` 中定义的接口
- **前端测试**：在微信开发者工具中预览小程序

## 注意事项

- **实名数据安全**：`Verification.idNumber` 字段必须在应用层加密存储（AES-256-GCM）
- **GDPR 合规**：用户删除账号时必须级联删除所有个人数据
- **时区处理**：所有时间从前端传入时带时区信息，后端存储 UTC，展示时转换为用户时区
- **WebSocket 重连**：`utils/socket.ts` 已配置自动重连（最多5次，间隔3秒）
- **不要硬编码字符串**：所有面向用户的文本必须通过 `$t()` 引用
