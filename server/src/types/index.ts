// Shared type definitions

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface JwtPayload {
  userId: string;
  role: string;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface MatchScoreDetail {
  examMatch: number;
  timezoneCompat: number;
  scheduleOverlap: number;
  languageOverlap: number;
  avgRating: number;
}

export interface MatchCandidate {
  userId: string;
  nickname: string;
  avatar: string | null;
  country: string | null;
  timezone: string;
  languages: string[];
  matchScore: number;
  matchDetails: MatchScoreDetail;
  exam: {
    id: string;
    name: string;
  };
  userExam: {
    targetScore: string | null;
    targetOrg: string | null;
    major: string | null;
    dailyHours: number | null;
    preferredTime: string | null;
  };
}

export interface PrivacySettings {
  showExam: boolean;
  showCheckin: boolean;
  showContact: boolean;
  showReviews: boolean;
}

// Socket.IO event types
export interface ServerToClientEvents {
  'chat:message': (msg: ChatMessage) => void;
  'chat:read': (data: { messageId: string; readBy: string }) => void;
  'chat:typing': (data: { buddyshipId: string; userId: string; isTyping: boolean }) => void;
  'chat:online': (data: { userId: string }) => void;
  'chat:offline': (data: { userId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'chat:message': (msg: { buddyshipId: string; type: string; content: string }) => void;
  'chat:read': (data: { buddyshipId: string; messageIds: string[] }) => void;
  'chat:typing': (data: { buddyshipId: string; isTyping: boolean }) => void;
  'chat:join': (data: { buddyshipId: string }) => void;
  'chat:leave': (data: { buddyshipId: string }) => void;
}

export interface ChatMessage {
  id: string;
  buddyshipId: string;
  senderId: string;
  type: string;
  content: string;
  contentTranslated?: string;
  mediaUrl?: string;
  createdAt: string;
  sender?: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
}
