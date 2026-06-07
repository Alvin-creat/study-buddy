# StudyBuddy — 跨国学习搭子匹配平台

帮助来自不同国家和地区的学习者，找到最合适的考试搭子。

## 功能亮点

- **全球实名认证** — 支持护照、身份证 OCR 识别 + 人脸比对
- **多考试类型匹配** — 考研 / 证书考试 / 等级考试，精准匹配
- **实时多语言聊天** — WebSocket 实时通讯 + 消息自动翻译
- **智能推荐算法** — 基于目标院校、专业、学习时段、地区多维匹配
- **7 种语言界面** — 中/英/日/韩/西/法/阿

## 支持考试类型

| 类别 | 考试 |
|------|------|
| 研究生入学 | 全国统考、MBA、MPA、法律硕士、教育硕士... |
| 职业证书 | CPA、CFA、FRM、ACCA、法考、执业医师、一建... |
| 语言等级 | CET-4/6、IELTS、TOEFL、JLPT、TOPIK、DELE、DELF... |
| 其他考试 | 公务员、教师资格证、计算机等级、PMP... |

## 快速开始

```bash
# 1. 克隆项目
git clone <repo-url> && cd study-buddy

# 2. 启动后端
cd server
cp .env.example .env
pnpm install
pnpm db:setup   # 初始化数据库
pnpm dev

# 3. 启动小程序
cd miniprogram
pnpm install
pnpm dev:mp-weixin
```

## 技术栈

- **前端**: uni-app 3.x / Vue 3 / TypeScript / Pinia
- **后端**: Node.js / Express / TypeScript / Prisma ORM
- **数据库**: PostgreSQL / Redis
- **文件存储**: S3 兼容存储
- **实时通信**: Socket.io
- **认证/实名**: JWT + 第三方 KYC API
- **部署**: Docker + Nginx

## 项目文档

- [需求文档](docs/requirements.md)
- [架构设计](docs/architecture.md)
- [API 设计](docs/api-design.md)
- [数据库设计](docs/database-schema.md)
- [Claude Code 指南](skills/study-buddy.md)

## 许可证

MIT License
