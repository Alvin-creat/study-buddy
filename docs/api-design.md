# StudyBuddy API 设计

Base URL: `/api/v1`

## 通用约定

- 请求体：JSON (Content-Type: application/json)
- 文件上传：multipart/form-data
- 认证：Authorization: Bearer `<jwt_token>`
- 语言：Accept-Language: zh-CN / en / ja / ko / es / fr / ar
- 分页：?page=1&pageSize=20
- 响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

## 错误码

| Code | 含义 |
|------|------|
| 0 | 成功 |
| 10001 | 参数错误 |
| 10002 | 未登录 |
| 10003 | 无权限 |
| 10004 | 资源不存在 |
| 10005 | 操作频率过高 |
| 10006 | 账号已禁用 |
| 10007 | 实名未认证 |
| 10008 | 敏感内容拦截 |
| 20001 | 账号已存在 |
| 20002 | 密码错误 |
| 20003 | 验证码错误 |
| 50000 | 服务器内部错误 |

---

## 一、认证模块 `/auth`

### POST /auth/register
注册新用户

```json
// Request
{
  "type": "email",          // email | phone
  "email": "user@example.com",
  "phone": null,
  "phoneCode": null,        // +86
  "password": "Abc123!@#",
  "nickname": "StudyCat",
  "country": "China",
  "timezone": "Asia/Shanghai",
  "language": "zh-CN"
}

// Response
{
  "code": 0,
  "data": {
    "user": { "id": "...", "nickname": "StudyCat", ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

### POST /auth/login
登录

### POST /auth/refresh
刷新 token

### POST /auth/send-code
发送验证码（注册/找回密码）

### POST /auth/logout
退出登录

---

## 二、用户模块 `/users`

### GET /users/:id
获取用户公开信息

### PUT /users/me
更新个人资料

```json
{
  "nickname": "...",
  "avatar": "...",
  "gender": "MALE",
  "bio": "...",
  "country": "...",
  "region": "...",
  "timezone": "...",
  "languages": ["zh-CN", "en"],
  "privacySettings": {
    "showExam": true,
    "showCheckin": true,
    "showContact": false
  }
}
```

### GET /users/me/exams
获取我的考试列表

### POST /users/me/exams
添加考试

```json
{
  "examId": "...",
  "targetScore": "380",
  "targetOrg": "北京大学",
  "major": "计算机科学",
  "dailyHours": 4,
  "preferredTime": "morning",
  "isPrimary": true
}
```

### PUT /users/me/exams/:id
更新考试信息

### DELETE /users/me/exams/:id
删除考试

---

## 三、实名认证 `/verify`

### POST /verify/id-card
上传证件 OCR

```
Content-Type: multipart/form-data

idType: id_card | passport | drivers_license
frontImage: <file>
backImage: <file>  (optional for passport)
```

Response:
```json
{
  "data": {
    "verificationId": "...",
    "name": "张三",
    "idNumber": "310***********1234",
    "ocrConfidence": 0.98,
    "status": "PENDING"
  }
}
```

### POST /verify/face
上传自拍进行人脸比对

```
Content-Type: multipart/form-data
selfieImage: <file>
```

### GET /verify/status
查询认证状态

---

## 四、考试分类 `/exams`

### GET /exams
获取考试分类树

```
?category=POSTGRADUATE     // 可选筛选
&parentId=null             // null=根节点
&lang=zh-CN
```

Response:
```json
{
  "data": [
    {
      "id": "...",
      "name": "全国硕士研究生招生考试",
      "children": [
        { "id": "...", "name": "计算机科学与技术" },
        { "id": "...", "name": "金融学" }
      ]
    }
  ]
}
```

### GET /exams/hot
热门考试

### GET /exams/search?q=IELTS
搜索考试

---

## 五、搭子匹配 `/match`

### GET /match/recommend
智能推荐搭子

```
?examId=...           // 必填
&page=1&pageSize=20
```

Response:
```json
{
  "data": [
    {
      "user": {
        "id": "...",
        "nickname": "StudyBuddy",
        "avatar": "...",
        "country": "Japan",
        "timezone": "Asia/Tokyo",
        "languages": ["ja", "en"]
      },
      "exam": { "name": "JLPT N1" },
      "matchScore": 0.87,
      "matchDetails": {
        "examMatch": 0.95,
        "timezoneCompat": 0.80,
        "scheduleOverlap": 0.90,
        "languageOverlap": 0.75,
        "avgRating": 4.2
      }
    }
  ]
}
```

### GET /match/search
手动搜索搭子

```
?examId=...&country=Japan&language=ja&timezone=Asia/Tokyo&dailyHoursMin=3
```

### POST /match/request
发送搭子邀请

```json
{
  "targetId": "...",
  "examId": "...",
  "message": "一起备考N1吧！我每天学习4小时"
}
```

### GET /match/requests/received
收到的邀请

### GET /match/requests/sent
发出的邀请

### POST /match/requests/:id/accept
接受邀请

### POST /match/requests/:id/reject
拒绝邀请

---

## 六、搭子管理 `/buddies`

### GET /buddies
我的搭子列表

### GET /buddies/:id
搭子详情

### POST /buddies/:id/end
结束搭子关系

```json
{ "reason": "考试已结束" }
```

---

## 七、即时通讯 `/chat`

### GET /chat/rooms
聊天列表（按最近消息排序）

### GET /chat/rooms/:buddyshipId/messages
历史消息

```
?before=2024-01-01T00:00:00Z   // 加载更早消息
&limit=50
```

### POST /chat/rooms/:buddyshipId/messages
发送消息（HTTP 备选方案）

```json
{
  "type": "TEXT",
  "content": "今天复习到第几章了？"
}
```

### WebSocket 事件

```
连接: ws://host/chat?token=<jwt>
```

| 事件 | 方向 | 说明 |
|------|------|------|
| `chat:message` | client→server | 发送消息 |
| `chat:message` | server→client | 接收消息 |
| `chat:read` | client→server | 标记已读 |
| `chat:typing` | client↔server | 输入中状态 |
| `chat:online` | server→client | 对方上线 |
| `chat:offline` | server→client | 对方离线 |
| `error` | server→client | 错误 |

消息格式：
```json
{
  "event": "chat:message",
  "data": {
    "id": "...",
    "buddyshipId": "...",
    "senderId": "...",
    "type": "TEXT",
    "content": "原文",
    "contentTranslated": "translated text",
    "createdAt": "2024-..."
  }
}
```

---

## 八、打卡 `/checkin`

### POST /checkin
学习打卡

```json
{
  "examId": "...",
  "duration": 120,
  "content": "今天完成了第三章习题",
  "images": ["url1", "url2"]
}
```

### GET /checkin
我的打卡记录（可按周/月聚合）

```
?examId=...
&startDate=2024-01-01
&endDate=2024-01-31
```

### GET /checkin/streak
连续打卡天数

### GET /users/:id/checkin
查看他人打卡（公开的）

---

## 九、评价 `/reviews`

### POST /reviews
评价搭子

```json
{
  "buddyshipId": "...",
  "revieweeId": "...",
  "attitude": 5,
  "attendance": 4,
  "commSkill": 5,
  "comment": "非常认真的学习伙伴！",
  "tags": ["认真负责", "守时", "善于沟通"]
}
```

### GET /users/:id/reviews
查看某用户的评价

---

## 十、通用 `/common`

### POST /upload
文件上传
```
multipart/form-data: file
```

### POST /translate
文本翻译

```json
{
  "text": "今天复习了三个小时",
  "targetLang": "en"
}
```

### GET /countries
国家/区号列表

### GET /timezones
时区列表

### GET /report
举报用户

```json
{
  "targetUserId": "...",
  "reason": "骚扰",
  "detail": "...",
  "evidence": ["url1"]
}
```
