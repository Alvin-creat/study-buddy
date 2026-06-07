# CLAUDE.md — StudyBuddy 跨国学习搭子匹配平台

## 项目概述

StudyBuddy 是一款面向全球用户的跨平台小程序，帮助来自不同国家和地区的学习者找到考试搭子（学习伙伴）。支持考研、证书考试、等级考试等多种考试类型的精准匹配。

## 技术栈

| 层 | 技术 |
|---|------|
| 小程序框架 | uni-app 3.x (Vue 3 + Composition API + TypeScript) |
| 状态管理 | Pinia |
| UI 组件 | uni-ui + 自定义组件 |
| 后端框架 | Node.js + Express + TypeScript |
| 数据库 | PostgreSQL 15 + Redis 7 |
| 文件存储 | AWS S3 / 阿里云 OSS |
| 实时通信 | WebSocket (Socket.io) |
| 实名认证 | 集成 Stripe Identity / 阿里云证件识别 |
| 国际化 | vue-i18n (中/英/日/韩/西/法/阿) |
| 部署 | Docker + Nginx 反向代理 |

## 核心功能模块

### 1. 用户系统
- 多国手机号/邮箱注册登录
- JWT token 认证
- 实名认证（护照/身份证 OCR + 人脸比对）
- 个人主页（学习档案、考试记录、评价、动态）

### 2. 考试搭子匹配
- 考试类型选择：考研（按学科）、证书（CPA/CFA/FRM/法考等）、等级考试（CET/IELTS/TOEFL/JLPT/TOPIK等）
- 智能匹配算法：目标院校+专业+地区+学习时间段
- 手动筛选+关键词搜索

### 3. 即时通讯
- WebSocket 实时消息
- 消息翻译（集成翻译 API）
- 敏感内容过滤

### 4. 社区评价
- 搭子互评体系
- 学习打卡
- 经验分享

## 项目结构

```
study-buddy/
├── CLAUDE.md                    # 本文档
├── README.md                    # 项目说明
├── docs/                        # 设计文档
│   ├── architecture.md
│   ├── api-design.md
│   ├── database-schema.md
│   └── requirements.md
├── miniprogram/                 # 前端 uni-app 代码
│   ├── pages/                   # 页面
│   │   ├── index/               # 首页/匹配广场
│   │   ├── auth/                # 登录注册
│   │   ├── verify/              # 实名认证
│   │   ├── profile/             # 个人中心
│   │   ├── match/               # 搭子匹配
│   │   ├── chat/                # 聊天
│   │   ├── exam/                # 考试选择
│   │   └── settings/            # 设置
│   ├── components/              # 公共组件
│   ├── utils/                   # 工具函数
│   ├── api/                     # 接口层
│   ├── store/                   # Pinia 状态管理
│   ├── i18n/locales/            # 多语言文件
│   └── static/                  # 静态资源
├── server/                      # 后端代码
│   └── src/
│       ├── controllers/         # 路由处理器
│       ├── services/            # 业务逻辑
│       ├── models/              # 数据模型 (Prisma)
│       ├── routes/              # 路由定义
│       ├── middleware/           # 中间件
│       ├── utils/               # 工具
│       └── config/              # 配置
└── skills/                      # Claude Code Skills
    └── study-buddy.md
```

## 开发约定

- **组件**：使用 PascalCase，如 `<UserCard />`
- **文件名**：kebab-case，如 `user-card.vue`
- **API 路径**：RESTful，`/api/v1/users/:id`
- **Git 分支**：`feat/xxx`, `fix/xxx`, `docs/xxx`
- **提交信息**：遵循 Conventional Commits

## 启动命令

```bash
# 后端
cd server && pnpm install && pnpm dev

# 小程序前端
cd miniprogram && pnpm install && pnpm dev:mp-weixin

# 数据库迁移
cd server && npx prisma migrate dev

# Docker 部署
docker-compose up -d
```

## 多平台支持

uni-app 编译目标：
- `dev:mp-weixin` — 微信小程序
- `dev:mp-alipay` — 支付宝小程序
- `dev:mp-toutiao` — 抖音小程序
- `dev:h5` — H5 移动端 Web

## 国际化覆盖

支持 7 种语言：简体中文、English、日本語、한국어、Español、Français、العربية

所有用户可见文本必须通过 `$t()` 或 `i18n.t()` 引用，禁止硬编码字符串。
