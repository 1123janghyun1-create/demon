export interface Product {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  icon: string;
  screenshot?: string;
  feedbackCount: number;
  views?: number;
  upvotes?: number;
  url: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  createdAt: string;
  createdAtRaw?: string;
  bumpedAt?: string;
  isNew?: boolean;
  instructions: string;
  // Extended fields for rich product submission
  description?: string;
  gallery?: string[];
  demoVideo?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
    threads?: string;
    youtube?: string;
  };
  additionalLinks?: Array<{ id: string; label: string; url: string }>;
  tags?: string[];
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  productId: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  avatar: string;
  content: string;
  createdAt: string;
  isMaker?: boolean;
}

export interface Feedback {
  id: string;
  productId: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  avatar: string;
  rating: number;
  content: string;
  deviceInfo: string;
  createdAt: string;
  screenshot?: string;
  replies?: FeedbackReply[];
}

export interface ProductComment {
  id: string;
  productId: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

export interface ProductTimelineEvent {
  id: string;
  productId: string;
  type: 'launch' | 'bump' | 'milestone' | 'update';
  title: string;
  description: string;
  date: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  avatar: string;
  timeAgo: string;
  tag: '런치' | '질문' | '팁' | '잡담';
  title: string;
  content: string;
  linkedApp?: {
    title: string;
    tagline: string;
    icon: string;
  };
  likes: number;
  comments: number;
  userLiked?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string;
  replyToAuthor?: string;
  author: string;
  authorId?: string;
  authorEmail?: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  email?: string;
  avatar: string;
  feedbackCount: number;
  badge?: string;
  aiScore?: number;
  aiCommentary?: string;
  role?: string;
  testedAppsCount?: number;
  launchedAppsCount?: number;
  upvotesReceived?: number;
  builderId?: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  avatar: string;
  role?: string;
  bio?: string;
  buildingApp?: string;
  tags?: string[];
  website?: string;
  github?: string;
  twitter?: string;
  isLoggedIn: boolean;
}

export interface Builder {
  id: string;
  name: string;
  email?: string;
  role: string;
  bio: string;
  avatar: string;
  buildingApp?: string | null;
  tags: string[];
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  online?: boolean;
  website?: string | null;
  github?: string | null;
  twitter?: string | null;
  joinedAt?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  read?: boolean;
}

export type NotificationType = 'dm' | 'upvote' | 'feedback' | 'system' | 'community';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  userId?: string;
  senderName?: string;
  senderAvatar?: string;
  productId?: string;
  productTitle?: string;
  builderId?: string;
  commentText?: string;
}

export type NavTab = 'test' | 'builders' | 'leaderboard' | 'submit' | 'community' | 'about';
export type FilterSort = 'newest' | 'upvotes' | 'views' | 'feedback';
