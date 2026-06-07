# StudyBuddy 数据库 Schema 设计

## 核心表关系

```
users (1) ──────────< verifications (1)
  │
  ├── (1) ──────────< user_exams (M)
  │
  ├── (1) ──────────< buddy_requests (M) as requester
  ├── (1) ──────────< buddy_requests (M) as target
  │
  ├── (1) ──────────< buddyships (M) as user_a
  ├── (1) ──────────< buddyships (M) as user_b
  │
  ├── (1) ──────────< messages (M) as sender
  │
  ├── (1) ──────────< checkins (M)
  │
  └── (1) ──────────< reviews (M) as reviewer
  └── (1) ──────────< reviews (M) as reviewee
```

## Prisma Schema

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum VerifyStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

enum BuddyshipStatus {
  ACTIVE
  ENDED
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}

enum ExamCategory {
  POSTGRADUATE   // 考研
  CERTIFICATE    // 证书
  PROFICIENCY    // 等级考试
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

// ─── 用户表 ────────────────────────────────────

model User {
  id           String       @id @default(cuid())
  nickname     String       @db.VarChar(50)
  avatar       String?      @db.VarChar(500)
  email        String?      @unique @db.VarChar(255)
  phone        String?      @unique @db.VarChar(20)
  phoneCode    String?      @db.VarChar(5)      // 国际区号 +86
  passwordHash String       @db.VarChar(255)
  gender       Gender?
  birthday     DateTime?
  country      String?      @db.VarChar(100)    // 国家
  region       String?      @db.VarChar(100)    // 地区/城市
  timezone     String       @default("UTC") @db.VarChar(50)
  languages    String[]     @default([])        // 母语/掌握语言
  bio          String?      @db.VarChar(500)
  
  verifyStatus VerifyStatus @default(UNVERIFIED)
  role         UserRole     @default(USER)
  
  isActive     Boolean      @default(true)
  isBanned     Boolean      @default(false)
  banReason    String?      @db.VarChar(500)
  
  lastLoginAt  DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // 隐私设置 (JSONB)
  privacySettings Json?     @db.JsonB

  // 关系
  verifications Verification[]
  userExams     UserExam[]
  sentRequests  BuddyRequest[]    @relation("Requester")
  receivedRequests BuddyRequest[] @relation("Target")
  buddyshipsA   Buddyship[]       @relation("UserA")
  buddyshipsB   Buddyship[]       @relation("UserB")
  sentMessages  Message[]
  checkins      Checkin[]
  reviewsGiven  Review[]          @relation("Reviewer")
  reviewsReceived Review[]        @relation("Reviewee")
  devices       UserDevice[]

  @@index([email])
  @@index([phone])
  @@index([verifyStatus])
  @@index([country, region])
  @@map("users")
}

// ─── 用户设备 ──────────────────────────────────

model UserDevice {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  deviceToken  String   @db.VarChar(500)
  platform     String   @db.VarChar(20)    // ios / android / web
  lastActiveAt DateTime @default(now())
  createdAt    DateTime @default(now())

  @@index([userId])
  @@map("user_devices")
}

// ─── 实名认证表 ────────────────────────────────

model Verification {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id])
  
  idType        String       @db.VarChar(50)    // id_card / passport / drivers_license
  idNumber      String       @db.VarChar(100)   // 加密存储
  
  idCardFront   String       @db.VarChar(500)   // S3 URL
  idCardBack    String?      @db.VarChar(500)
  selfieImage   String       @db.VarChar(500)
  
  name          String       @db.VarChar(100)
  faceScore     Float?                          // 人脸比对分数 0-100
  
  status        VerifyStatus @default(PENDING)
  rejectReason  String?      @db.VarChar(500)
  reviewedBy    String?                         // 管理员ID
  
  submittedAt   DateTime     @default(now())
  reviewedAt    DateTime?
  createdAt     DateTime     @default(now())

  @@unique([userId])
  @@index([status])
  @@map("verifications")
}

// ─── 考试分类表（树形结构）──────────────────

model Exam {
  id          String       @id @default(cuid())
  parentId    String?
  parent      Exam?        @relation("ExamTree", fields: [parentId], references: [id])
  children    Exam[]       @relation("ExamTree")
  
  category    ExamCategory
  name        String       @db.VarChar(100)     // 考试名称
  nameEn      String?      @db.VarChar(200)     // 英文名
  nameJa      String?      @db.VarChar(200)     // 日文名
  description String?      @db.Text
  icon        String?      @db.VarChar(500)
  sortOrder   Int          @default(0)
  isActive    Boolean      @default(true)
  
  // 地区差异 (JSONB): {"CN": "全国硕士研究生招生考试", "US": "GRE"}
  regionNames Json?        @db.JsonB

  userExams   UserExam[]
  buddyRequests BuddyRequest[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([parentId])
  @@index([category])
  @@index([isActive])
  @@map("exams")
}

// ─── 用户考试关联 ─────────────────────────────

model UserExam {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  examId      String
  exam        Exam     @relation(fields: [examId], references: [id])
  
  targetScore String?  @db.VarChar(50)         // 目标分数
  targetOrg   String?  @db.VarChar(200)        // 目标院校/机构
  major       String?  @db.VarChar(200)        // 专业方向
  
  // 学习偏好
  dailyHours  Int?                             // 每日学习小时数
  preferredTime String? @db.VarChar(50)        // 偏好时段 morning/afternoon/evening/night
  
  isPrimary   Boolean  @default(false)
  isPublic    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, examId])
  @@index([examId])
  @@index([userId, isPrimary])
  @@map("user_exams")
}

// ─── 搭子请求 ─────────────────────────────────

model BuddyRequest {
  id           String        @id @default(cuid())
  requesterId  String
  requester    User          @relation("Requester", fields: [requesterId], references: [id])
  targetId     String
  target       User          @relation("Target", fields: [targetId], references: [id])
  
  examId       String
  exam         Exam          @relation(fields: [examId], references: [id])
  
  message      String?       @db.VarChar(500)  // 附带留言
  status       RequestStatus @default(PENDING)
  
  respondedAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@unique([requesterId, targetId, examId])
  @@index([targetId, status])
  @@index([requesterId])
  @@map("buddy_requests")
}

// ─── 搭子关系 ─────────────────────────────────

model Buddyship {
  id        String          @id @default(cuid())
  userAId   String
  userA     User            @relation("UserA", fields: [userAId], references: [id])
  userBId   String
  userB     User            @relation("UserB", fields: [userBId], references: [id])
  
  examId    String?
  exam      Exam?           @relation(fields: [examId], references: [id])
  
  status    BuddyshipStatus @default(ACTIVE)
  
  startedAt DateTime        @default(now())
  endedAt   DateTime?
  createdAt DateTime        @default(now())

  messages  Message[]

  @@unique([userAId, userBId, examId])
  @@index([userAId])
  @@index([userBId])
  @@map("buddyships")
}

// ─── 消息 ─────────────────────────────────────

model Message {
  id           String      @id @default(cuid())
  buddyshipId  String
  buddyship    Buddyship   @relation(fields: [buddyshipId], references: [id])
  
  senderId     String
  sender       User        @relation(fields: [senderId], references: [id])
  
  type         MessageType @default(TEXT)
  content      String      @db.Text
  contentEn    String?     @db.Text            // 翻译内容
  mediaUrl     String?     @db.VarChar(500)
  
  isRead       Boolean     @default(false)
  readAt       DateTime?
  
  createdAt    DateTime    @default(now())

  @@index([buddyshipId, createdAt])
  @@map("messages")
}

// ─── 学习打卡 ─────────────────────────────────

model Checkin {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  examId      String?
  exam        Exam?    @relation(fields: [examId], references: [id])
  
  duration    Int                                  // 学习分钟数
  content     String?  @db.VarChar(1000)           // 打卡内容
  images      String[] @default([])                // 配图
  
  checkedAt   DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([userId, checkedAt])
  @@index([userId, createdAt])
  @@map("checkins")
}

// ─── 评价 ─────────────────────────────────────

model Review {
  id          String   @id @default(cuid())
  reviewerId  String
  reviewer    User     @relation("Reviewer", fields: [reviewerId], references: [id])
  revieweeId  String
  reviewee    User     @relation("Reviewee", fields: [revieweeId], references: [id])
  
  buddyshipId String?
  buddyship   Buddyship? @relation(fields: [buddyshipId], references: [id])
  
  // 各维度评分 1-5
  attitude    Int                                  // 学习态度
  attendance  Int                                  // 出勤准时
  commSkill   Int                                  // 沟通能力
  
  comment     String?  @db.VarChar(500)
  tags        String[] @default([])                // 评价标签

  createdAt   DateTime @default(now())

  @@unique([reviewerId, buddyshipId])
  @@index([revieweeId])
  @@map("reviews")
}

// ─── 举报 ─────────────────────────────────────

model Report {
  id           String   @id @default(cuid())
  reporterId   String
  reporter     User     @relation(fields: [reporterId], references: [id])
  targetUserId String
  targetUser   User     @relation(fields: [targetUserId], references: [id])
  
  reason       String   @db.VarChar(500)
  detail       String?  @db.Text
  evidence     String[] @default([])
  
  status       String   @default("pending") @db.VarChar(20) // pending / resolved / dismissed
  resolvedBy   String?
  resolution   String?  @db.VarChar(500)

  createdAt    DateTime @default(now())
  resolvedAt   DateTime?

  @@index([targetUserId])
  @@index([status])
  @@map("reports")
}
```

## Redis 数据结构

| Key Pattern | 类型 | 用途 |
|-------------|------|------|
| `session:{userId}` | String | JWT refresh token |
| `verify:limit:{userId}` | String | 实名认证次数限制 |
| `online:{userId}` | String | 在线状态 (TTL 5min) |
| `match:cache:{userId}` | String | 匹配结果缓存 (TTL 10min) |
| `rate:{ip}` | String | API 频率限制 |
| `chat:room:{buddyshipId}` | List | 最近消息缓存 |
| `translate:{hash}` | String | 翻译结果缓存 (TTL 24h) |
| `sensitive_words` | Set | 敏感词集合 |
