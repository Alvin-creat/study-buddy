# StudyBuddy 架构设计

## 系统架构总览

```
┌──────────────────────────────────────────────────────┐
│                    客户端层                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ 微信小程序│ │支付宝小程序│ │抖音小程序 │ │H5 Web  │  │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └───┬────┘  │
│        └──────────────┴──────────────┴─────────┘      │
│                        │ uni-app                       │
└────────────────────────┼──────────────────────────────┘
                         │ HTTPS / WSS
                         ▼
┌──────────────────────────────────────────────────────┐
│                   网关层 (Nginx)                       │
│            SSL Termination / Rate Limiting             │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                   应用服务层                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │Auth Svc  │ │ Match Svc│ │ Chat Svc │ │User Svc│  │
│  │JWT/KYC   │ │ 推荐引擎  │ │Socket.io │ │ Profile│  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘  │
│       └──────────────┴──────────────┴─────────┘       │
│                        │                              │
│              Express + TypeScript                      │
└────────────────────────┬─────────────────────────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
       ┌──────────┐ ┌──────┐  ┌──────────┐
       │PostgreSQL│ │Redis │  │S3/OSS    │
       │ 主数据库  │ │缓存  │  │文件存储   │
       └──────────┘ └──────┘  └──────────┘
```

## 后端分层架构

```
server/src/
├── routes/          # 路由定义 → 参数校验 → 调用 controller
├── controllers/     # 请求处理 → 参数解析 → 调用 service → 返回响应
├── services/        # 业务逻辑 → 数据校验 → 调用 model → 返回数据
├── models/          # Prisma ORM → 数据库操作
├── middleware/      # auth, rateLimiter, validator, i18n, errorHandler
├── utils/           # jwt, hash, ocr, translate, s3, logger
└── config/          # env, db, redis, i18n, constants
```

## 数据流

### 用户注册+实名认证流程

```
Client                    Server                    3rd Party
  │                         │                          │
  │ POST /auth/register     │                          │
  │ ──────────────────────> │                          │
  │                         │ INSERT user              │
  │ <── JWT token + user ── │                          │
  │                         │                          │
  │ POST /verify/id-card    │                          │
  │ (multipart: image)      │                          │
  │ ──────────────────────> │                          │
  │                         │ ─── OCR Request ──────> │
  │                         │ <── OCR Result ──────────│
  │                         │ INSERT verification      │
  │ <── verification_id ────│                          │
  │                         │                          │
  │ POST /verify/face       │                          │
  │ (multipart: selfie)     │                          │
  │ ──────────────────────> │                          │
  │                         │ ─── Face Compare ──────> │
  │                         │ <── Match Score ─────────│
  │                         │ UPDATE user.verified=true│
  │ <── verified ✓ ──────── │                          │
```

### 搭子匹配流程

```
Client                    Server                     Database
  │                         │                          │
  │ GET /match/recommend    │                          │
  │ (query: exam,subject)   │                          │
  │ ──────────────────────> │                          │
  │                         │ ─── get user profile ──>│
  │                         │ <── preferences ────────│
  │                         │                          │
  │                         │ ─── find candidates ───>│
  │                         │     (exam + subject      │
  │                         │      + timezone + ...)   │
  │                         │ <── candidates[] ───────│
  │                         │                          │
  │                         │ calculate match score:   │
  │                         │   exam_match x0.35       │
  │                         │   + timezone x0.25       │
  │                         │   + schedule x0.20       │
  │                         │   + language x0.15       │
  │                         │   + rating x0.05          │
  │                         │                          │
  │ <── ranked results ──── │                          │
```

## 安全设计

- **认证**：JWT (access 15min + refresh 7d)，双 token 机制
- **实名数据**：AES-256-GCM 加密存储，密钥通过 KMS 管理
- **图片上传**：前端压缩 + 后端验证文件类型 + 病毒扫描
- **API 限流**：基于用户/IP 的令牌桶算法 (Redis)
- **SQL 注入防护**：Prisma ORM 参数化查询
- **XSS 防护**：输入输出过滤，CSP Header
- **敏感词过滤**：基于 Trie 树 + 正则的实时过滤

## 部署架构

```
┌──────────────────────────────────────┐
│             Docker Compose            │
│                                       │
│  ┌─────────┐  ┌─────────┐           │
│  │ nginx   │  │  app x2 │ (cluster) │
│  │ :443    │  │  :3000  │           │
│  └────┬────┘  └────┬────┘           │
│       │            │                 │
│  ┌────┴────────────┴────┐           │
│  │    postgres :5432     │           │
│  │    redis    :6379     │           │
│  └───────────────────────┘           │
└──────────────────────────────────────┘
```
