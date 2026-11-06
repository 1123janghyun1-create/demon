export interface Product {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  icon: string;
  screenshot?: string;
  feedbackCount: number;
  url: string;
  author: string;
  createdAt: string;
  isNew?: boolean;
  instructions: string;
}

export interface Feedback {
  id: string;
  productId: string;
  author: string;
  avatar: string;
  rating: number;
  content: string;
  deviceInfo: string;
  createdAt: string;
  screenshot?: string;
}

export interface CommunityPost {
  id: string;
  author: string;
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

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  feedbackCount: number;
  badge?: string;
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
  buildingApp?: string;
  tags: string[];
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  online?: boolean;
  github?: string;
  twitter?: string;
  joinedAt?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isMine: boolean;
}

export type NavTab = 'test' | 'builders' | 'leaderboard' | 'submit' | 'community';
export type FilterSort = 'newest' | 'feedback';
