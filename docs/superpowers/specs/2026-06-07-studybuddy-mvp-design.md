# StudyBuddy MVP 设计文档

> 日期：2026-06-07 | 状态：待评审

## 1. 概述

StudyBuddy 是一款面向全球用户的跨平台学习搭子匹配应用。MVP 阶段聚焦核心闭环：**注册 → 发现搭子 → 发起连接 → 实时聊天**。

### 1.1 MVP 范围

| 包含 | 暂缓 |
|------|------|
| 手机号验证码登录 | 实名认证（护照/身份证 OCR） |
| 个人资料填写 | 社区评价体系 |
| 匹配广场（卡片瀑布流 + 筛选） | 学习打卡 |
| 一键打招呼 → 对方同意 → 聊天 | 消息敏感内容过滤 |
| WebSocket 实时聊天 + 手动翻译 | 智能推荐算法 |
| 中/英双语界面 | 其他 5 种语言 |

### 1.2 平台策略

**H5 先行 → 微信小程序跟上。** uni-app 编译 H5 模式先上线验证核心价值，随后编译为微信小程序。

---

## 2. 已确认的交互设计决策

| 模块 | 决策 |
|------|------|
| 导航结构 | 底部 TabBar（匹配·聊天·我的）+ 匹配页顶部考试分类切换 |
| 匹配页布局 | 卡片瀑布流，支持搜索 + 考试类型/时区筛选 |
| 匹配卡片 | 精简卡片：头像·昵称·考试·目标院校·时区 |
| 匹配流程 | 一键打招呼 → 对方同意 → 进入聊天 |
| 聊天翻译 | 手动翻译按钮，点击后原文与译文对照显示 |
| 用户认证 | 手机号 + 验证码登录 |

---

## 3. 系统架构

```
客户端 (H5) — uni-app (Vue 3 + Pinia + vue-i18n)
    │  HTTPS + JWT Bearer Token
    ▼
API 服务层 — Node.js + Express + TypeScript
    ├── Auth (认证)
    ├── User (用户)
    ├── Match (匹配)
    └── Chat  (聊天 + WebSocket via Socket.io)
    │
    ▼
数据层 — PostgreSQL 15 + Redis 7 + Prisma ORM
```

### 3.1 关键架构决策

- **uni-app H5 模式**：一套 Vue 代码编译多平台，无需重写
- **JWT 双 Token**：access token（15min）+ refresh token（7d），无状态认证
- **WebSocket 独立路径**：`/ws/` 上 Socket.io
- **Prisma ORM**：类型安全的数据库操作
- **Redis**：缓存热门匹配 + 验证码限频 + Token 黑名单

### 3.2 开发顺序（全栈垂直推进）

1. 项目脚手架 + 数据库 Schema + Docker 部署环境
2. 认证模块（短信验证码注册/登录）
3. 用户模块（个人资料填写）
4. 匹配模块（卡片广场 + 打招呼）
5. 聊天模块（WebSocket + 翻译）

---

## 4. 数据库设计

### User

| 字段 | 类型 | 约束 |
|------|------|------|
| id | UUID | PK |
| phone | VARCHAR(20) | UNIQUE，含国家码 |
| nickname | VARCHAR(50) | NOT NULL |
| avatar_url | TEXT | nullable |
| exam_type | VARCHAR(50) | postgraduate / certificate / language / other |
| exam_name | VARCHAR(100) | |
| target_school | VARCHAR(100) | nullable |
| timezone | VARCHAR(50) | EST / JST / CST 等 |
| study_time | VARCHAR(50) | morning / afternoon / evening / flexible |
| languages | TEXT[] | ["zh-CN", "en"] |
| bio | TEXT | nullable |
| created_at | TIMESTAMP | default now() |

### MatchRequest

| 字段 | 类型 | 约束 |
|------|------|------|
| id | UUID | PK |
| from_user_id | UUID | FK → User |
| to_user_id | UUID | FK → User |
| status | ENUM | pending / accepted / rejected |
| created_at | TIMESTAMP | |
| | | UNIQUE(from_user_id, to_user_id) |

### Message

| 字段 | 类型 | 约束 |
|------|------|------|
| id | UUID | PK |
| match_request_id | UUID | FK → MatchRequest（连接建立后） |
| sender_id | UUID | FK → User |
| content | TEXT | NOT NULL |
| translated_content | TEXT | nullable，翻译后缓存 |
| source_lang | VARCHAR(10) | 原文语言 |
| created_at | TIMESTAMP | |

---

## 5. API 设计

基础路径：`/api/v1`，统一响应格式：

```json
{ "code": 0, "data": { ... }, "message": "ok" }
```

错误码分段：`400xx` 参数、`401xx` 认证、`403xx` 权限、`404xx` 资源、`429xx` 限频、`50000` 系统。

### 5.1 认证 `/api/v1/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/send-code` | 发送验证码（1次/60s，5次/天） |
| POST | `/auth/login` | 验证码登录，返回 access + refresh token |
| POST | `/auth/refresh` | 刷新 access token |

### 5.2 用户 `/api/v1/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users/me` | 当前用户信息 |
| PATCH | `/users/me` | 更新个人资料 |
| GET | `/users/:id` | 查看用户公开信息 |

### 5.3 匹配 `/api/v1/matches`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/matches` | 匹配列表（`?exam_type=&keyword=&timezone=&page=&limit=`） |
| POST | `/matches/:userId/greet` | 打招呼 |
| GET | `/matches/requests` | 请求列表（发出 + 收到） |
| PATCH | `/matches/requests/:id` | 接受/拒绝 `{ status }` |
| GET | `/matches/connections` | 已建立连接列表 |

### 5.4 聊天 `/api/v1/chat`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chat/:connectionId/messages` | 历史消息（分页，50条/页） |
| POST | `/chat/:connectionId/translate/:messageId` | 翻译消息（按需触发，结果缓存） |
| WS | `/ws?token=jwt` | WebSocket 实时消息 |

### 5.5 WebSocket 消息格式

```json
// 发送
{ "type": "message:send", "connectionId": "uuid", "content": "Hi!" }

// 接收
{ "type": "message:new", "senderId": "uuid", "content": "...", "sourceLang": "zh-CN" }

// 已读
{ "type": "message:read", "messageId": "uuid" }
```

---

## 6. 前端组件树

```
src/
├── pages/
│   ├── auth/login.vue
│   ├── match/index.vue
│   ├── chat/list.vue
│   ├── chat/room.vue
│   └── profile/index.vue
├── components/
│   ├── MatchCard.vue
│   ├── MatchFilter.vue
│   ├── MessageBubble.vue
│   ├── TabBar.vue
│   └── PhoneLogin.vue
├── api/          # uni.request 封装
├── store/
│   ├── auth.ts
│   ├── match.ts
│   └── chat.ts
├── i18n/locales/ # zh-CN, en（MVP 两种）
└── utils/
    ├── websocket.ts
    └── auth.ts
```

---

## 7. 部署架构

```
用户浏览器 (H5)
    │
    ▼
Nginx — H5 静态文件 + /api/ 反向代理 + /ws/ WebSocket
    │
    ▼
App — Node.js Express (Docker)
    ├── PostgreSQL 15 (Docker)
    └── Redis 7 (Docker)
```

复用已有 `docker-compose.yml` 和 `nginx.conf`（调整 H5 静态文件路径）。

---

## 8. 外部服务依赖

| 服务 | 用途 | MVP 备选 |
|------|------|----------|
| 短信服务 | 验证码发送 | 腾讯云 SMS / Twilio |
| 翻译 API | 聊天消息翻译 | Google Cloud Translation / DeepL |

---

## 9. 测试策略

| 层级 | 工具 | 覆盖重点 |
|------|------|----------|
| 单元测试 | Vitest | 匹配筛选逻辑、JWT 工具、消息校验 |
| API 测试 | Supertest | 认证流程、匹配 CRUD、权限校验 |
| E2E | 暂缓 | MVP 手动验证 |

---

## 10. 未决事项

- 短信服务商选型（需根据目标市场确定）
- 翻译 API 选型
- H5 部署域名和 CDN 方案
