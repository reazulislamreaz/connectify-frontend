export type FriendshipStatus =
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received"
  | "none";

export interface UserRelationship {
  status: FriendshipStatus;
  requestId?: string;
}

export type AdminRole = "user" | "moderator" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  address?: string;
  professional?: string;
  religious?: string;
  hobby?: string;
  relationStatus?: string;
  dateOfBirth?: string;
  isOnline?: boolean;
  lastSeen?: string;
  relationship?: UserRelationship;
  /** Staff role. Absent/"user" for normal accounts. Set server-side only. */
  role?: AdminRole;
  /** Moderation state. Absent implies "active". */
  status?: AccountStatus;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FriendRequest {
  id: string;
  sender?: User;
  receiver?: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export type CallLogStatus =
  | "completed"
  | "rejected"
  | "cancelled"
  | "missed"
  | "busy"
  | "disconnected";

export type CallType = "audio" | "video";

export interface MessageReply {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  isDeleted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  messageType?: "text" | "call";
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  callStatus?: CallLogStatus;
  callDuration?: number;
  callType?: CallType;
  delivered?: boolean;
  read: boolean;
  readAt?: string;
  isDeleted?: boolean;
  editedAt?: string;
  replyTo?: MessageReply;
  createdAt: string;
}

export interface ChatListItem {
  user: User;
  lastMessage: {
    id: string;
    messageType?: "text" | "call";
    content: string;
    imageUrl?: string;
    voiceUrl?: string;
    voiceDuration?: number;
    callStatus?: CallLogStatus;
    callDuration?: number;
    callType?: CallType;
    delivered?: boolean;
    isDeleted?: boolean;
    senderId: string;
    createdAt: string;
    read: boolean;
  } | null;
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PostAuthor {
  id: string;
  name: string;
  profilePicture?: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  content: string;
  author: PostAuthor;
  createdAt: string;
}

/* ────────────────────────────── Admin ────────────────────────────── */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TimePoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  count: number;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    onlineNow: number;
    newToday: number;
    newThisWeek: number;
  };
  content: {
    postsTotal: number;
    postsToday: number;
    commentsToday: number;
  };
  /** Counts only — never message content. */
  messaging: {
    messagesToday: number;
    callsToday: number;
  };
  reports: {
    open: number;
    resolvedToday: number;
  };
  series: {
    signups: TimePoint[];
    messages: TimePoint[];
  };
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: AdminRole;
  status: AccountStatus;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  postsCount: number;
  reportsAgainst: number;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  pagination: Pagination;
}

export interface AdminPostRow {
  id: string;
  content: string;
  imageUrl?: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  reportsCount: number;
  hidden: boolean;
  createdAt: string;
}

export interface AdminPostsResponse {
  posts: AdminPostRow[];
  pagination: Pagination;
}

export type ReportTargetType = "post" | "comment" | "user" | "message";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter: PostAuthor;
  targetType: ReportTargetType;
  targetId: string;
  /** Short, privacy-safe preview of the reported target. */
  targetPreview: string;
  reason: string;
  note?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface AdminReportsResponse {
  reports: Report[];
  pagination: Pagination;
}

export interface AuditEntry {
  id: string;
  actor: PostAuthor;
  action: string;
  targetType: string;
  targetId: string;
  /** Human-readable target (e.g. the user's name) resolved by the backend. */
  targetLabel?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface AdminAuditResponse {
  entries: AuditEntry[];
  pagination: Pagination;
}

export interface SystemHealth {
  socketConnections: number;
  apiOk: boolean;
  dbOk: boolean;
  uptimeSeconds: number;
  presenceCount: number;
}
