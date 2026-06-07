# StudyBuddy 📚

A cross-border study buddy matching platform that connects learners worldwide. Find the perfect study partner for your exams — CFA, IELTS, JLPT, postgraduate entrance exams, and more.

![Design](https://img.shields.io/badge/design-warm%20scholarly-c8a45c) ![License](https://img.shields.io/badge/license-MIT-green) ![Stack](https://img.shields.io/badge/stack-Vue%203%20%2B%20Node.js-blue)

## Features

- **Smart Matching** — Find study buddies by exam type, timezone, and target school
- **One-Click Connect** — Send a greeting and start studying together instantly
- **Real-Time Chat** — WebSocket messaging with on-demand translation
- **Phone Auth** — Verification code login, auto-register on first use
- **7 Languages** — i18n support for Chinese, English, Japanese, Korean, Spanish, French, Arabic
- **Multi-Platform** — H5 web app now, WeChat Mini Program ready

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + TypeScript + Vite + Pinia + vue-i18n |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + Redis 7 |
| ORM | Prisma |
| Real-time | Socket.io (WebSocket) |
| Auth | JWT + SMS verification code |
| Deployment | Docker + Nginx |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- pnpm

### Setup

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/study-buddy.git
cd study-buddy

# 2. Backend
cd server
cp .env.example .env    # Edit with your DB credentials
pnpm install
npx prisma db push      # Create database tables
pnpm dev                # Starts on :3000

# 3. Frontend
cd miniprogram
pnpm install
pnpm dev                # Starts on :8080
```

Open http://localhost:8080 in your browser. In dev mode, API calls proxy to the backend automatically.

### Docker

```bash
docker-compose up -d     # PostgreSQL + Redis + App + Nginx
```

## Project Structure

```
study-buddy/
├── miniprogram/          # Frontend (Vue 3 + Vite)
│   ├── pages/            # Page components
│   │   ├── match/        # Match discovery + requests
│   │   ├── chat/         # Chat rooms + messaging
│   │   ├── auth/         # Phone login
│   │   └── profile/      # User profile + settings
│   ├── components/       # Shared components
│   ├── store/            # Pinia stores
│   ├── i18n/             # Translation files
│   ├── utils/            # API client, WebSocket, uni polyfill
│   └── styles/           # Design tokens (Warm Scholarly theme)
├── server/               # Backend (Express + Prisma)
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── services/     # Business logic
│       ├── routes/       # API routes
│       ├── middleware/    # Auth, validation, rate limiting
│       └── utils/        # JWT, Redis, hashing
├── docs/                 # Design docs & specs
├── docker-compose.yml
├── nginx.conf
└── LICENSE
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /auth/send-code` | Send SMS verification code |
| `POST /auth/login` | Login/register with code |
| `GET /users/me` | Get current user profile |
| `PUT /users/me` | Update profile |
| `GET /match?examType=&keyword=&timezone=` | Browse study buddies |
| `POST /match/:id/greet` | Send greeting to a user |
| `GET /match/requests` | View sent/received requests |
| `PATCH /match/requests/:id` | Accept or reject a request |
| `GET /match/connections` | List active buddies |
| `GET /chat/rooms` | List chat rooms |
| `GET /chat/rooms/:id/messages` | Get message history |
| `POST /chat/rooms/:id/translate/:msgId` | Translate a message |

## Design

The UI follows a **"Warm Scholarly"** aesthetic — inspired by old university libraries with deep ink blues, warm brass-gold accents, and parchment-like textures. Georgia serif typography throughout.

See [design spec](docs/superpowers/specs/2026-06-07-studybuddy-mvp-design.md) for the full MVP design document.

## Roadmap

- [x] Phone verification code login
- [x] Browse & filter study buddies
- [x] Send greetings & manage requests
- [x] Real-time chat with translation
- [x] Profile editing
- [x] i18n (zh-CN, en, ja)
- [ ] WeChat Mini Program build
- [ ] Real-name verification (KYC)
- [x] Dark mode
- [ ] Community reviews & check-ins
- [ ] Smart recommendation algorithm

## Contributing

Pull requests welcome! For major changes, please open an issue first to discuss.

## License

[MIT](LICENSE)
