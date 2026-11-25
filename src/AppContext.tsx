import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import initialProducts from './data/products.json';
import initialBuilders from './data/builders_data.json';
import initialFeedbacks from './data/feedbacks_data.json';
import initialCommunity from './data/community_data.json';
import initialQuotes from './data/quotes_data.json';
import { Product, Feedback, FeedbackReply, CommunityPost, CommunityComment, LeaderboardUser, Quote, NavTab, FilterSort, UserProfile, Builder, DirectMessage, AppNotification } from './types';
import { supabase, isSupabaseConfigured, signOutUser } from './lib/supabase';
import {
  fetchProductsFromDB,
  insertProductToDB,
  updateProductInDB,
  bumpProductInDB,
  deleteProductFromDB,
  incrementProductViewsInDB,
  incrementProductUpvoteInDB,
  decrementProductUpvoteInDB,
  fetchUserUpvotesFromDB,
  recordProductUpvoteInDB,
  toggleProductUpvoteAtomicInDB,
  fetchFeedbacksFromDB,
  insertFeedbackToDB,
  deleteFeedbackFromDB,
  fetchBuildersFromDB,
  upsertBuilderToDB,
  fetchCommunityPostsFromDB,
  insertCommunityPostToDB,
  deleteCommunityPostFromDB,
  updateCommunityPostLikesInDB,
  fetchDirectMessagesFromDB,
  sendDirectMessageToDB,
  markDirectMessagesAsReadInDB,
  fetchNotificationsFromDB,
  insertNotificationToDB,
  markNotificationAsReadInDB,
  markAllNotificationsAsReadInDB,
  deleteNotificationFromDB,
} from './lib/database';
import { pingSearchEngines } from './lib/seoPinger';

interface AppContextType {
  products: Product[];
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  updateProduct: (updated: Product) => void;
  deleteProduct: (productId: string) => void;
  bumpProduct: (productId: string) => Promise<boolean>;
  incrementProductViews: (productId: string) => void;
  toggleProductUpvote: (productId: string) => void;
  isProductUpvoted: (productId: string) => boolean;
  feedbacks: Record<string, Feedback[]>;
  addFeedback: (productId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
  deleteFeedback: (productId: string, feedbackId: string) => void;
  feedbackReplies: Record<string, FeedbackReply[]>;
  addFeedbackReply: (productId: string, feedbackId: string, content: string) => void;
  deleteFeedbackReply: (feedbackId: string, replyId: string) => void;
  user: UserProfile;
  loginAsDemoUser: () => void;
  loginWithCustomEmail: (customUser: UserProfile) => void;
  logout: () => void;
  requireAuth: (callback: () => void, reason?: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginModalMessage: string;
  isProfileEditOpen: boolean;
  setIsProfileEditOpen: (open: boolean) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  communityPosts: CommunityPost[];
  addCommunityPost: (post: Omit<CommunityPost, 'id' | 'timeAgo' | 'likes' | 'comments'>) => void;
  deleteCommunityPost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleCommunityPostUpvote: (postId: string) => void;
  isCommunityPostUpvoted: (postId: string) => boolean;
  communityComments: Record<string, CommunityComment[]>;
  addCommunityComment: (postId: string, content: string, parentId?: string, replyToAuthor?: string) => void;
  deleteCommunityComment: (postId: string, commentId: string) => void;
  addProduct: (newApp: Omit<Product, 'id' | 'slug' | 'feedbackCount' | 'createdAt'>) => Product;
  leaderboard: LeaderboardUser[];
  builders: Builder[];
  refreshBuilders: () => Promise<void>;
  isRefreshingBuilders: boolean;
  toggleFollowBuilder: (builderId: string) => void;
  activeDmBuilder: Builder | null;
  setActiveDmBuilder: (b: Builder | null) => void;
  dmMessages: Record<string, DirectMessage[]>;
  sendDirectMessage: (builderId: string, text: string) => void;
  // Notifications & DM Inbox
  notifications: AppNotification[];
  unreadNotificationCount: number;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isDmInboxOpen: boolean;
  setIsDmInboxOpen: (open: boolean) => void;
  unreadDmCount: number;
  openDmWithBuilder: (builder: Builder) => void;
  markDmThreadAsRead: (builderId: string) => void;
  currentQuote: Quote;
  nextQuote: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterSort: FilterSort;
  setFilterSort: (s: FilterSort) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User profile state
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('demon_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {
      id: '',
      email: '',
      name: '게스트',
      avatar: '/demon-mascot.png',
      role: '인디 메이커',
      bio: '새로운 사이드 프로젝트를 코딩하는 메이커입니다.',
      buildingApp: '',
      tags: ['개발자', 'SaaS', 'AI'],
      isLoggedIn: false,
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState('활동을 위해 로그인이 필요합니다.');
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(() => {
    let deletedIds: Set<string> = new Set();
    try {
      const savedDeleted = localStorage.getItem('demon_deleted_product_ids');
      if (savedDeleted) deletedIds = new Set(JSON.parse(savedDeleted));
    } catch {}

    try {
      const saved = localStorage.getItem('demon_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (p: Product) => !deletedIds.has(p.id) && (!p.slug || !deletedIds.has(p.slug))
          );
        }
      }
    } catch {}
    return ((initialProducts as Product[]) || []).filter(
      (p: Product) => !deletedIds.has(p.id) && (!p.slug || !deletedIds.has(p.slug))
    );
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('test');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>(() => {
    try {
      const saved = localStorage.getItem('demon_feedbacks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
      }
    } catch {}
    return (initialFeedbacks as Record<string, Feedback[]>) || {};
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem('demon_community');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (p: any) =>
              p.id !== 'c-welcome' &&
              !p.title?.includes('환영합니다') &&
              !p.title?.includes('demon')
          );
        }
      }
    } catch {}
    return (initialCommunity as CommunityPost[]) || [];
  });

  const [communityComments, setCommunityComments] = useState<Record<string, CommunityComment[]>>(() => {
    try {
      const saved = localStorage.getItem('demon_community_comments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  const [feedbackReplies, setFeedbackReplies] = useState<Record<string, FeedbackReply[]>>(() => {
    try {
      const saved = localStorage.getItem('demon_feedback_replies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => {
    try {
      const saved = localStorage.getItem('demon_leaderboard');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Builders State (Pre-populated with 6 real builders from Supabase + localStorage merge)
  const [builders, setBuilders] = useState<Builder[]>(() => {
    const defaults = (initialBuilders as unknown as Builder[]) || [];
    try {
      const saved = localStorage.getItem('demon_builders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedIds = new Set(parsed.map((b: Builder) => b.id));
          const missingDefaults = defaults.filter((b) => !parsedIds.has(b.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch {}
    return defaults;
  });
  const [isRefreshingBuilders, setIsRefreshingBuilders] = useState(false);

  const refreshBuilders = useCallback(async () => {
    setIsRefreshingBuilders(true);
    try {
      const dbBuilders = await fetchBuildersFromDB();
      if (dbBuilders && Array.isArray(dbBuilders)) {
        setBuilders((prevLocal) => {
          if (dbBuilders.length === 0) return prevLocal;
          const localFollowMap = new Map(prevLocal.map((b) => [b.id, b.isFollowing]));
          const remoteIds = new Set(dbBuilders.map((b) => b.id));
          const merged = dbBuilders.map((b) => ({
            ...b,
            isFollowing: localFollowMap.get(b.id) ?? false,
          }));
          const localOnly = prevLocal.filter((b) => !remoteIds.has(b.id));
          const fullList = [...merged, ...localOnly];
          try {
            localStorage.setItem('demon_builders', JSON.stringify(fullList));
          } catch {}
          return fullList;
        });
      }
    } catch (e) {
      console.warn('refreshBuilders error:', e);
    } finally {
      setIsRefreshingBuilders(false);
    }
  }, []);

  // Active DM Chat Modal
  const [activeDmBuilder, setActiveDmBuilder] = useState<Builder | null>(null);

  // Direct Messages History
  const [dmMessages, setDmMessages] = useState<Record<string, DirectMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('demon_dm_messages');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Toast Notification Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('demon_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDmInboxOpen, setIsDmInboxOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('demon_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const unreadDmCount = useMemo(() => {
    let count = 0;
    Object.values(dmMessages).forEach((msgs) => {
      count += msgs.filter((m) => !m.isMine && !m.read).length;
    });
    return count;
  }, [dmMessages]);

  const addNotification = useCallback(
    (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const newNotif: AppNotification = {
        ...notif,
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        createdAt: '방금 전',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      insertNotificationToDB(newNotif).catch((err) => console.warn('insertNotificationToDB error:', err));
    },
    []
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationAsReadInDB(id);
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsAsReadInDB(user.id, user.email);
  }, [user.id, user.email]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteNotificationFromDB(id);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    markAllNotificationsAsReadInDB(user.id, user.email);
  }, [user.id, user.email]);

  // Load remote notifications (targeted alerts + global activities)
  const refreshNotifications = useCallback(async () => {
    try {
      const currentId = user.id || undefined;
      const currentEmail = user.email || undefined;
      const notifs = await fetchNotificationsFromDB(currentId, currentEmail);
      if (notifs && notifs.length > 0) {
        setNotifications((prev) => {
          const map = new Map<string, AppNotification>();
          notifs.forEach((n) => map.set(n.id, n));
          prev.forEach((n) => {
            if (!map.has(n.id)) map.set(n.id, n);
          });
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.warn('refreshNotifications error:', e);
    }
  }, [user.id, user.email]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 15000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Real-time Supabase notifications listener
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const row: any = payload.new;
          if (!row) return;

          const currentId = (user.id || '').trim().toLowerCase();
          const currentEmail = (user.email || '').trim().toLowerCase();
          const target = (row.user_id || '').trim().toLowerCase();

          // Targeted or global
          const isTargeted = !target || target === 'all' || target === currentId || target === currentEmail;

          if (isTargeted) {
            const newNotif: AppNotification = {
              id: row.id,
              type: row.type || 'system',
              title: row.title,
              message: row.message,
              createdAt: '방금 전',
              read: false,
              userId: row.user_id,
              senderName: row.sender_name,
              senderAvatar: row.sender_avatar,
              productId: row.product_id,
              productTitle: row.product_title,
              builderId: row.builder_id,
            };

            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });

            // If it is targeted to me and from someone else, show toast!
            const sender = (row.sender_name || '').trim();
            if (target && target !== 'all' && sender !== user.name) {
              showToast(`🔔 ${newNotif.title}: ${newNotif.message}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user.id, user.email, user.name, showToast]);

  // Function to load all real direct messages for the logged-in user from Supabase (strictly isolated to parties involved)
  const refreshDirectMessages = useCallback(async () => {
    if (!user.isLoggedIn || (!user.id && !user.email)) {
      setDmMessages({});
      return;
    }

    try {
      const dbMsgs = await fetchDirectMessagesFromDB(user.id, user.email);
      if (dbMsgs && dbMsgs.length > 0) {
        setDmMessages((prev) => {
          const grouped: Record<string, DirectMessage[]> = { ...prev };
          const myId = user.id || user.email;

          dbMsgs.forEach((msg) => {
            const isSenderMe =
              msg.senderId === myId ||
              (user.email && (msg.senderId || '').toLowerCase() === user.email.toLowerCase());
            const partnerId = isSenderMe ? msg.receiverId : msg.senderId;

            if (!grouped[partnerId]) grouped[partnerId] = [];
            const exists = grouped[partnerId].some((m) => m.id === msg.id);
            if (!exists) {
              grouped[partnerId].push(msg);
            } else {
              grouped[partnerId] = grouped[partnerId].map((m) => (m.id === msg.id ? msg : m));
            }
          });

          try {
            localStorage.setItem('demon_dm_messages', JSON.stringify(grouped));
          } catch {}
          return grouped;
        });
      }
    } catch (e) {
      console.warn('refreshDirectMessages error:', e);
    }
  }, [user.isLoggedIn, user.id, user.email]);

  const markDmThreadAsRead = useCallback(
    (builderId: string) => {
      setDmMessages((prev) => {
        const list = prev[builderId];
        if (!list) return prev;
        const next = {
          ...prev,
          [builderId]: list.map((m) => ({ ...m, read: true })),
        };
        try {
          localStorage.setItem('demon_dm_messages', JSON.stringify(next));
        } catch {}
        return next;
      });
      // Also mark DM notifications for this builder as read
      setNotifications((prev) =>
        prev.map((n) => (n.type === 'dm' && n.builderId === builderId ? { ...n, read: true } : n))
      );

      // Persist read status in Supabase
      const myId = user.id || user.email;
      if (myId) {
        markDirectMessagesAsReadInDB(myId, builderId).catch(() => {});
      }
    },
    [user.id, user.email]
  );

  const [quotes] = useState<Quote[]>(initialQuotes as Quote[]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('demon_theme') === 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState<FilterSort>('newest');

  // Googlebot & Deep-linking URL Sync (Search Params & Hash)
  const handleSetCurrentTab = useCallback((tab: NavTab) => {
    setCurrentTab(tab);
    try {
      const url = new URL(window.location.href);
      if (tab === 'test') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      url.hash = '';
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {}
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const validTabs: NavTab[] = ['test', 'builders', 'leaderboard', 'submit', 'community', 'about'];
      if (validTabs.includes(hash as NavTab)) {
        setCurrentTab(hash as NavTab);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [hasInitializedUrlProductRef, setHasInitializedUrlProductRef] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['test', 'builders', 'leaderboard', 'submit', 'community', 'about'].includes(tabParam)) {
        setCurrentTab(tabParam as NavTab);
      }
      const prodParam = params.get('product');
      if (prodParam && products.length > 0) {
        const found = products.find((p) => p.id === prodParam || p.slug === prodParam);
        if (found) {
          setSelectedProduct(found);
        }
      }
      const builderParam = params.get('builder');
      if (builderParam) {
        setCurrentTab('builders');
      }
      setHasInitializedUrlProductRef(true);
    } catch {
      setHasInitializedUrlProductRef(true);
    }
  }, [products]);

  useEffect(() => {
    // Only update window history after initial URL param parsing has completed!
    if (!hasInitializedUrlProductRef) return;
    try {
      const url = new URL(window.location.href);
      if (selectedProduct) {
        url.searchParams.set('product', selectedProduct.id);
      } else {
        url.searchParams.delete('product');
      }
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }, [selectedProduct, hasInitializedUrlProductRef]);

  // Sync Supabase Database / Server API to Local State on App Startup (with Smart Merge & Fallback)
  useEffect(() => {
    // 1. Fetch products from DB / API
    fetchProductsFromDB().then((dbProducts) => {
      if (!dbProducts) return;

      // Read tombstone deleted IDs to strictly prevent resurrection
      let deletedIds = new Set<string>();
      try {
        const savedDeleted = localStorage.getItem('demon_deleted_product_ids');
        if (savedDeleted) deletedIds = new Set(JSON.parse(savedDeleted));
      } catch {}

      setProducts((prevLocal) => {
        // Exclude any deleted items
        const activeDbProducts = dbProducts.filter(
          (p) => !deletedIds.has(p.id) && (!p.slug || !deletedIds.has(p.slug))
        );

        // Authoritative DB sync: Never auto-insert local-only products back into remote DB!
        let finalProducts: Product[] = [];
        if (activeDbProducts.length > 0) {
          finalProducts = activeDbProducts;
        } else if (dbProducts.length === 0) {
          finalProducts = prevLocal.filter(
            (p) => !deletedIds.has(p.id) && (!p.slug || !deletedIds.has(p.slug))
          );
        }

        try {
          localStorage.setItem('demon_products', JSON.stringify(finalProducts));
        } catch {}
        return finalProducts;
      });
    });

    // 2. Fetch feedbacks from DB / API
    fetchFeedbacksFromDB().then((dbFeedbacks) => {
      if (!dbFeedbacks) return;

      setFeedbacks((prevLocal) => {
        if (Object.keys(dbFeedbacks).length === 0) {
          return prevLocal;
        }

        const merged: Record<string, Feedback[]> = { ...prevLocal };
        Object.entries(dbFeedbacks).forEach(([prodId, remoteList]) => {
          const localList = merged[prodId] || [];
          const remoteIds = new Set(remoteList.map((f) => f.id));
          const localOnly = localList.filter((f) => !remoteIds.has(f.id));
          merged[prodId] = [...remoteList, ...localOnly];
        });

        try {
          localStorage.setItem('demon_feedbacks', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });

    // 2b. Fetch feedback replies & community comments from Supabase (graceful fallback if tables not created yet)
    if (supabase) {
      supabase
        .from('feedback_replies')
        .select('*')
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const remoteMap: Record<string, FeedbackReply[]> = {};
            data.forEach((row: any) => {
              const r: FeedbackReply = {
                id: row.id,
                feedbackId: row.feedback_id,
                productId: row.product_id,
                author: row.author || '인디 메이커',
                authorId: row.author_id || '',
                authorEmail: row.author_email || '',
                avatar: row.avatar || '/demon-mascot.png',
                content: row.content || '',
                createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '방금 전',
                isMaker: Boolean(row.is_maker),
              };
              if (!remoteMap[r.feedbackId]) remoteMap[r.feedbackId] = [];
              remoteMap[r.feedbackId].push(r);
            });
            setFeedbackReplies((prev) => {
              const merged = { ...prev };
              Object.entries(remoteMap).forEach(([fbId, rList]) => {
                const localList = merged[fbId] || [];
                const remoteIds = new Set(rList.map((x) => x.id));
                merged[fbId] = [...rList, ...localList.filter((x) => !remoteIds.has(x.id))];
              });
              try {
                localStorage.setItem('demon_feedback_replies', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }, () => {});

      supabase
        .from('community_comments')
        .select('*')
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const remoteMap: Record<string, CommunityComment[]> = {};
            data.forEach((row: any) => {
              const c: CommunityComment = {
                id: row.id,
                postId: row.post_id,
                parentId: row.parent_id || undefined,
                replyToAuthor: row.reply_to_author || undefined,
                author: row.author || '인디 메이커',
                authorId: row.author_id || '',
                authorEmail: row.author_email || '',
                avatar: row.avatar || '/demon-mascot.png',
                content: row.content || '',
                createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '방금 전',
              };
              if (!remoteMap[c.postId]) remoteMap[c.postId] = [];
              remoteMap[c.postId].push(c);
            });
            setCommunityComments((prev) => {
              const merged = { ...prev };
              Object.entries(remoteMap).forEach(([pId, cList]) => {
                const localList = merged[pId] || [];
                const remoteIds = new Set(cList.map((x) => x.id));
                merged[pId] = [...cList, ...localList.filter((x) => !remoteIds.has(x.id))];
              });
              try {
                localStorage.setItem('demon_community_comments', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }, () => {});
    }

    // 3. Fetch builders from DB / API
    refreshBuilders();

    // 4. Fetch community posts from DB / API
    fetchCommunityPostsFromDB().then((dbPosts) => {
      if (!dbPosts) return;

      setCommunityPosts((prevLocal) => {
        if (dbPosts.length === 0) {
          return prevLocal;
        }

        const remoteIds = new Set(dbPosts.map((p) => p.id));
        const localOnly = prevLocal.filter((p) => !remoteIds.has(p.id));
        const merged = [...dbPosts, ...localOnly];

        try {
          localStorage.setItem('demon_community', JSON.stringify(merged));
        } catch {}
        return merged;
      });
    });
  }, [refreshBuilders]);

  // Automatically refresh builders whenever switching to the Builders tab
  useEffect(() => {
    if (currentTab === 'builders') {
      refreshBuilders();
    }
  }, [currentTab, refreshBuilders]);

  // Supabase Real-time Listener for Builders table
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    try {
      const channel = client
        .channel('realtime:builders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'builders' },
          (payload) => {
            console.log('[Supabase Realtime Builders Event]:', payload);
            refreshBuilders();
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase realtime listener setup error:', e);
    }
  }, [refreshBuilders]);

  // Supabase Real-time Listener for Products table (instantly sync deletions across devices)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    try {
      const channel = client
        .channel('realtime:products_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as any)?.id;
              if (oldId) {
                // Record tombstone
                try {
                  const saved = localStorage.getItem('demon_deleted_product_ids');
                  const list: string[] = saved ? JSON.parse(saved) : [];
                  if (!list.includes(oldId)) {
                    list.push(oldId);
                    localStorage.setItem('demon_deleted_product_ids', JSON.stringify(list));
                  }
                } catch {}

                setProducts((prev) => prev.filter((p) => p.id !== oldId && p.slug !== oldId));
                setSelectedProduct((prev) => (prev && (prev.id === oldId || prev.slug === oldId) ? null : prev));
              }
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime products setup error:', e);
    }
  }, []);

  // Supabase Real-time Listener for Direct Messages (Real Person-to-Person)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user.isLoggedIn) return;
    const client = supabase;
    const currentUserId = user.id;
    const currentUserEmail = user.email ? user.email.toLowerCase() : '';

    try {
      const channel = client
        .channel(`realtime:dm:${currentUserId || 'guest'}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'direct_messages' },
          (payload) => {
            const row = payload.new as any;
            if (!row) return;

            // Only process messages involving current user by ID or email
            const sId = (row.sender_id || '').toLowerCase();
            const rId = (row.receiver_id || '').toLowerCase();
            const myId = (currentUserId || '').toLowerCase();
            const myEmail = currentUserEmail;

            const involvesMe =
              sId === myId ||
              rId === myId ||
              (myEmail && (sId === myEmail || rId === myEmail));

            if (!involvesMe) return;

            const isMine = sId === myId || (Boolean(myEmail) && sId === myEmail);
            const partnerId = isMine ? row.receiver_id : row.sender_id;

            let timestamp = '방금';
            if (row.created_at) {
              const d = new Date(row.created_at);
              if (!isNaN(d.getTime())) {
                const hours = d.getHours();
                const minutes = d.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? '오후' : '오전';
                const formattedHours = hours % 12 || 12;
                timestamp = `${ampm} ${formattedHours}:${minutes}`;
              }
            }

            const newMsg: DirectMessage = {
              id: row.id,
              senderId: row.sender_id,
              receiverId: row.receiver_id,
              text: row.text,
              timestamp,
              isMine,
              read: Boolean(row.read),
            };

            setDmMessages((prev) => {
              const list = prev[partnerId] || [];
              if (list.some((m) => m.id === newMsg.id)) return prev;
              const next = {
                ...prev,
                [partnerId]: [...list, newMsg],
              };
              try {
                localStorage.setItem('demon_dm_messages', JSON.stringify(next));
              } catch {}
              return next;
            });

            // If incoming message from someone else:
            if (!isMine) {
              const senderBuilder = builders.find(
                (b) =>
                  b.id === row.sender_id ||
                  (b.email && b.email.toLowerCase() === (row.sender_id || '').toLowerCase())
              );
              const senderName = senderBuilder?.name || '상대방 빌더';

              addNotification({
                type: 'dm',
                title: `${senderName}님의 새 1:1 메시지`,
                message: row.text,
                senderName: senderName,
                senderAvatar: senderBuilder?.avatar || '/demon-mascot.png',
                builderId: partnerId,
              });

              showToast(`💬 ${senderName}: "${row.text.length > 25 ? row.text.slice(0, 25) + '...' : row.text}"`);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'direct_messages' },
          (payload) => {
            const row = payload.new as any;
            if (!row) return;

            const sId = (row.sender_id || '').toLowerCase();
            const rId = (row.receiver_id || '').toLowerCase();
            const myId = (currentUserId || '').toLowerCase();
            const myEmail = currentUserEmail;

            const involvesMe =
              sId === myId ||
              rId === myId ||
              (myEmail && (sId === myEmail || rId === myEmail));

            if (!involvesMe) return;

            const isMine = sId === myId || (Boolean(myEmail) && sId === myEmail);
            const partnerId = isMine ? row.receiver_id : row.sender_id;

            setDmMessages((prev) => {
              const list = prev[partnerId];
              if (!list) return prev;
              return {
                ...prev,
                [partnerId]: list.map((m) => (m.id === row.id ? { ...m, read: Boolean(row.read) } : m)),
              };
            });
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime DM setup error:', e);
    }
  }, [user.isLoggedIn, user.id, user.email, builders, addNotification, showToast]);

  // Periodic and on-modal-open DM refresh
  useEffect(() => {
    if (!user.isLoggedIn) return;
    refreshDirectMessages();

    // Poll every 10 seconds for real-time reliability across mobile networks
    const interval = setInterval(() => {
      refreshDirectMessages();
    }, 10000);

    return () => clearInterval(interval);
  }, [user.isLoggedIn, refreshDirectMessages]);

  // Sync Logged-in User into Builders list (Strictly by ID and Email, NEVER name!)
  const syncUserToBuilders = useCallback((currentUser: UserProfile) => {
    if (!currentUser.isLoggedIn || !currentUser.id) return;

    setBuilders((prev) => {
      const idx = prev.findIndex(
        (b) =>
          b.id === currentUser.id ||
          (currentUser.email && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      let updatedList: Builder[];

      if (idx !== -1) {
        updatedList = [...prev];
        updatedList[idx] = {
          ...updatedList[idx],
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          role: currentUser.role || updatedList[idx].role || '인디 메이커',
          bio: currentUser.bio || updatedList[idx].bio || '새로운 가치를 코딩하는 메이커입니다.',
          buildingApp: currentUser.buildingApp || updatedList[idx].buildingApp || '',
          tags: currentUser.tags || updatedList[idx].tags || ['개발자'],
          website: currentUser.website || updatedList[idx].website,
          github: currentUser.github || updatedList[idx].github,
          twitter: currentUser.twitter || updatedList[idx].twitter,
          online: true,
        };
      } else {
        const newBuilder: Builder = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role || '인디 메이커',
          bio: currentUser.bio || '새로운 가치를 만드는 메이커입니다.',
          avatar: currentUser.avatar || '/demon-mascot.png',
          buildingApp: currentUser.buildingApp || '',
          tags: currentUser.tags || ['개발자', 'SaaS'],
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
          online: true,
          website: currentUser.website,
          github: currentUser.github,
          twitter: currentUser.twitter,
          joinedAt: '방금',
        };
        updatedList = [newBuilder, ...prev];
      }

      // Upsert to Supabase DB in background
      const targetBuilder = updatedList.find((b) => b.id === currentUser.id);
      if (targetBuilder) {
        upsertBuilderToDB(targetBuilder).catch(() => {});
      }

      return updatedList;
    });
  }, []);

  // Helper to thoroughly clean OAuth parameters and errors from the address bar
  const cleanAuthUrl = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      url.searchParams.delete('error_code');

      let newHash = window.location.hash;
      if (newHash.includes('access_token') || newHash.includes('error')) {
        newHash = '';
      }
      const cleanPath = url.pathname + (url.search ? url.search : '') + newHash;
      window.history.replaceState({}, document.title, cleanPath);
    } catch {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Unified, bulletproof session applicator for Supabase
  const applySupabaseSession = useCallback(
    (session: any) => {
      if (!session?.user) return;
      const u = session.user;
      const email = u.email || 'demonst1004@gmail.com';
      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.user_metadata?.user_name ||
        email.split('@')[0] ||
        'demonst';
      const avatar =
        u.user_metadata?.avatar_url ||
        u.user_metadata?.picture ||
        '/demon-mascot.png';

      setUser((prev) => {
        const updated: UserProfile = {
          ...prev,
          id: u.id,
          email: email,
          name: name,
          avatar: avatar,
          role: prev.role && prev.role !== '인디 메이커' ? prev.role : 'demonst 메이커',
          bio: prev.bio || 'demonst 사이드 프로젝트 메이커입니다.',
          buildingApp: prev.buildingApp || 'demonst',
          tags: prev.tags && prev.tags.length > 0 ? prev.tags : ['메이커', '개발자', 'SaaS', 'AI'],
          github: prev.github || 'https://github.com',
          isLoggedIn: true,
        };
        localStorage.setItem('demon_user', JSON.stringify(updated));
        syncUserToBuilders(updated);

        // Immediately refresh products, feedbacks, builders & user upvotes as authenticated user!
        fetchProductsFromDB().then((dbProducts) => {
          if (dbProducts && dbProducts.length > 0) {
            setProducts((prevLocal) => {
              const remoteIds = new Set(dbProducts.map((p) => p.id));
              const localOnly = prevLocal.filter((p) => !remoteIds.has(p.id));
              return [...dbProducts, ...localOnly];
            });
          }
        });
        fetchFeedbacksFromDB().then((dbFeedbacks) => {
          if (dbFeedbacks && Object.keys(dbFeedbacks).length > 0) {
            setFeedbacks((prev) => ({ ...prev, ...dbFeedbacks }));
          }
        });
        refreshBuilders();
        refreshDirectMessages();

        return updated;
      });

      // Thoroughly clean URL tokens after capturing session
      cleanAuthUrl();
    },
    [syncUserToBuilders, cleanAuthUrl, refreshBuilders, refreshDirectMessages]
  );

  // Supabase Auth Listener & OAuth Redirect Processor
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Immediately detect and clean any OAuth errors from address bar so it never loops!
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorDesc =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (errorDesc) {
        console.warn('OAuth redirect error detected and cleaned:', errorDesc);
        // CRITICAL: Clean URL immediately so the error toast never repeats on refresh
        cleanAuthUrl();

        if (errorDesc.includes('Unable to exchange external code') || errorDesc.includes('invalid_grant')) {
          showToast('Google 인증 세션이 만료되었습니다. 다시 시도하시거나 [이메일 로그인]을 이용해주세요.');
        } else {
          showToast(`로그인 안내: ${decodeURIComponent(errorDesc)}`);
        }
        return;
      }

      // 2. Initial check on mount
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          cleanAuthUrl();
          applySupabaseSession(session);
        }
      });

      // 3. Direct URL Hash Handler (Implicit OAuth grant: #access_token=...)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken) {
          cleanAuthUrl();
          supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            .then(({ data }) => {
              if (data?.session) {
                applySupabaseSession(data.session);
              }
            })
            .catch((e) => console.warn('setSession error:', e));
        }
      }

      // 4. OnAuthStateChange listener - captures INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, etc.
      // (Supabase SDK internally exchanges ?code= when detectSessionInUrl is true, avoiding race conditions)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Supabase Auth Event]:', event, session?.user?.email);
        if (session?.user) {
          cleanAuthUrl();
          applySupabaseSession(session);
        } else if (event === 'SIGNED_OUT') {
          // Only clear session if the active user was signed in via Supabase OAuth
          const savedUserRaw = localStorage.getItem('demon_user');
          let isLocalOrDemoSession = false;
          try {
            if (savedUserRaw) {
              const u = JSON.parse(savedUserRaw);
              if (u && u.isLoggedIn && (u.id === 'demo-google-user' || u.isDemoUser)) {
                isLocalOrDemoSession = true;
              }
            }
          } catch {}

          if (!isLocalOrDemoSession) {
            const guestUser: UserProfile = {
              id: '',
              email: '',
              name: '게스트',
              avatar: '/demon-mascot.png',
              role: '인디 메이커',
              bio: '새로운 사이드 프로젝트를 코딩하는 메이커입니다.',
              buildingApp: '',
              tags: ['개발자', 'SaaS', 'AI'],
              isLoggedIn: false,
            };
            setUser(guestUser);
            localStorage.setItem('demon_user', JSON.stringify(guestUser));
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [applySupabaseSession, cleanAuthUrl, showToast]);

  // Persist local state
  useEffect(() => {
    try {
      localStorage.setItem('demon_user', JSON.stringify(user));
    } catch {}
    if (user.isLoggedIn) {
      syncUserToBuilders(user);
    }
  }, [user, syncUserToBuilders]);

  useEffect(() => {
    try {
      localStorage.setItem('demon_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('demon_feedbacks', JSON.stringify(feedbacks));
    } catch {}
  }, [feedbacks]);

  useEffect(() => {
    try {
      localStorage.setItem('demon_community', JSON.stringify(communityPosts));
    } catch {}
  }, [communityPosts]);

  useEffect(() => {
    try {
      localStorage.setItem('demon_leaderboard', JSON.stringify(leaderboard));
    } catch {}
  }, [leaderboard]);

  useEffect(() => {
    try {
      localStorage.setItem('demon_builders', JSON.stringify(builders));
    } catch {}
  }, [builders]);

  useEffect(() => {
    try {
      localStorage.setItem('demon_dm_messages', JSON.stringify(dmMessages));
    } catch {}
  }, [dmMessages]);

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('demon_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('demon_theme', 'light');
      }
    } catch {}
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const requireAuth = (callback: () => void, reason?: string) => {
    if (user.isLoggedIn) {
      callback();
    } else {
      setLoginModalMessage(reason || '해당 활동을 진행하려면 먼저 Google 로그인이 필요합니다.');
      setIsLoginModalOpen(true);
    }
  };

  const loginAsDemoUser = () => {
    const demoUser: UserProfile = {
      id: 'demo-google-user',
      email: 'demonst1004@gmail.com',
      name: 'demonst',
      avatar: '/demon-mascot.png',
      role: 'demonst 메이커',
      bio: 'demonst 사이드 프로젝트 메이커 커뮤니티 빌더입니다.',
      buildingApp: 'demonst',
      tags: ['개발자', 'Next.js', 'AI', 'SaaS'],
      github: 'https://github.com',
      isLoggedIn: true,
    };
    setUser(demoUser);
    localStorage.setItem('demon_user', JSON.stringify(demoUser));
    syncUserToBuilders(demoUser);
    setIsLoginModalOpen(false);
  };

  const loginWithCustomEmail = (customUser: UserProfile) => {
    setUser(customUser);
    localStorage.setItem('demon_user', JSON.stringify(customUser));
    syncUserToBuilders(customUser);
    setIsLoginModalOpen(false);
  };

  const logout = async () => {
    await signOutUser();
    const guestUser: UserProfile = {
      id: '',
      email: '',
      name: '게스트',
      avatar: '/demon-mascot.png',
      isLoggedIn: false,
    };
    setUser(guestUser);
    localStorage.setItem('demon_user', JSON.stringify(guestUser));
    // DM privacy protection: wipe all DM threads from state and local storage on logout
    setDmMessages({});
    try {
      localStorage.removeItem('demon_dm_messages');
    } catch {}
    showToast('로그아웃되었습니다.');
  };

  // Update own user profile (Local + Supabase DB)
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('demon_user', JSON.stringify(updatedUser));
    syncUserToBuilders(updatedUser);
    pingSearchEngines().catch(() => {});
  };

  // Follow / Unfollow builder
  const toggleFollowBuilder = (builderId: string) => {
    requireAuth(() => {
      if (builderId === user.id) {
        showToast('자기 자신은 팔로우할 수 없습니다.');
        return;
      }

      setBuilders((prev) =>
        prev.map((b) => {
          if (b.id === builderId) {
            const nextFollowing = !b.isFollowing;
            showToast(nextFollowing ? `✨ ${b.name} 님을 팔로우했습니다!` : `${b.name} 님을 언팔로우했습니다.`);
            const updated = {
              ...b,
              isFollowing: nextFollowing,
              followersCount: nextFollowing ? b.followersCount + 1 : Math.max(0, b.followersCount - 1),
            };
            upsertBuilderToDB(updated).catch(() => {});
            return updated;
          }
          return b;
        })
      );
    }, '빌더를 팔로우하려면 먼저 로그인이 필요합니다.');
  };

  // Open DM with Builder (from builders list, author profile, or notifications)
  const openDmWithBuilder = useCallback(
    (builder: Builder) => {
      requireAuth(() => {
        setActiveDmBuilder(builder);
        setIsDmInboxOpen(true);
        markDmThreadAsRead(builder.id);
      }, `${builder.name}님에게 DM을 보내려면 먼저 Google 로그인이 필요합니다.`);
    },
    [requireAuth, markDmThreadAsRead]
  );

  // Send Direct Message (Real Person-to-Person via Supabase DB & Realtime)
  const sendDirectMessage = (builderId: string, text: string) => {
    requireAuth(() => {
      const myId = user.id || user.email;
      if (!myId) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const formattedHours = hours % 12 || 12;
      const timestamp = `${ampm} ${formattedHours}:${minutes}`;

      const newMsg: DirectMessage = {
        id: 'dm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        senderId: myId,
        receiverId: builderId,
        text: trimmed,
        timestamp,
        isMine: true,
        read: false,
      };

      // 1. Optimistic local update
      setDmMessages((prev) => {
        const next = {
          ...prev,
          [builderId]: [...(prev[builderId] || []), newMsg],
        };
        try {
          localStorage.setItem('demon_dm_messages', JSON.stringify(next));
        } catch {}
        return next;
      });

      // 2. Persist to Supabase Database (will broadcast to the recipient in real-time)
      sendDirectMessageToDB(newMsg).then((success) => {
        if (!success) {
          console.warn('DM could not be saved to Supabase');
        }
      });

      // 3. Notify recipient (strictly targeted to builderId only)
      addNotification({
        type: 'dm',
        userId: builderId,
        title: '1:1 메시지 도착',
        message: `${user.name}님이 회원님께 1:1 메시지를 보냈습니다: "${trimmed.slice(0, 30)}${trimmed.length > 30 ? '...' : ''}"`,
        builderId: user.id || user.email,
        senderName: user.name,
        senderAvatar: user.avatar,
      });

      // NOTE: Removed fake mock bot setTimeout! Real users will reply themselves!
    }, '메시지를 보내려면 먼저 Google 로그인이 필요합니다.');
  };

  // Add Feedback (Local + Supabase DB)
  const addFeedback = (productId: string, fb: Omit<Feedback, 'id' | 'createdAt'>) => {
    const newFb: Feedback = {
      ...fb,
      id: 'fb-' + Date.now(),
      author: user.name || fb.author || '익명 테스터',
      authorId: user.id || user.email || '',
      authorEmail: user.email || '',
      createdAt: '방금 전',
    };

    setFeedbacks((prev) => {
      const next: Record<string, Feedback[]> = {
        ...prev,
        [productId]: [newFb, ...(prev[productId] || [])],
      };
      const prod = products.find((p) => p.id === productId || p.slug === productId);
      if (prod) {
        if (prod.id && prod.id !== productId) {
          next[prod.id] = [newFb, ...(prev[prod.id] || [])];
        }
        if (prod.slug && prod.slug !== productId) {
          next[prod.slug] = [newFb, ...(prev[prod.slug] || [])];
        }
      }
      try {
        localStorage.setItem('demon_feedbacks', JSON.stringify(next));
      } catch {}
      return next;
    });

    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === productId || p.slug === productId) {
          return { ...p, feedbackCount: (p.feedbackCount || 0) + 1 };
        }
        return p;
      });
      try {
        localStorage.setItem('demon_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    setSelectedProduct((prev) => {
      if (prev && (prev.id === productId || prev.slug === productId)) {
        return { ...prev, feedbackCount: (prev.feedbackCount || 0) + 1 };
      }
      return prev;
    });

    // Save to Supabase DB in background
    insertFeedbackToDB(newFb).catch((err) => console.warn('Supabase feedback save error:', err));

    // Real-time activity & author notification
    const targetProd = products.find((p) => p.id === productId || p.slug === productId);
    if (targetProd) {
      const authorTarget = targetProd.authorId || targetProd.author;
      const isSelf = Boolean(
        authorTarget &&
          (authorTarget === user.id ||
            authorTarget === user.email ||
            authorTarget === user.name)
      );
      if (!isSelf && authorTarget) {
        addNotification({
          type: 'feedback',
          userId: authorTarget,
          title: '새로운 피드백 도착',
          message: `${newFb.author}님이 '${targetProd.title}'에 피드백을 남겼습니다: "${newFb.content.slice(0, 35)}..."`,
          senderName: newFb.author,
          senderAvatar: newFb.avatar,
          productId: targetProd.id,
          productTitle: targetProd.title,
        });
      }

      // Platform-wide live activity
      addNotification({
        type: 'feedback',
        userId: 'ALL',
        title: '새로운 피드백',
        message: `${newFb.author}님이 '${targetProd.title}' 프로젝트에 피드백을 남겼습니다.`,
        senderName: newFb.author,
        senderAvatar: newFb.avatar,
        productId: targetProd.id,
        productTitle: targetProd.title,
      });
    }

    setLeaderboard((prev) => {
      const authorId = user.id || user.email;
      const authorEmail = user.email ? user.email.toLowerCase() : '';
      const existing = prev.find(
        (u) =>
          (authorId && u.builderId === authorId) ||
          (authorEmail && u.email && u.email.toLowerCase() === authorEmail)
      );
      let updated: LeaderboardUser[];
      if (existing) {
        updated = prev.map((u) =>
          (authorId && u.builderId === authorId) ||
          (authorEmail && u.email && u.email.toLowerCase() === authorEmail)
            ? { ...u, feedbackCount: u.feedbackCount + 1 }
            : u
        );
      } else {
        updated = [
          ...prev,
          {
            rank: prev.length + 1,
            name: user.name || fb.author || '익명 테스터',
            email: user.email,
            builderId: user.id,
            avatar: fb.avatar || user.avatar || '/demon-mascot.png',
            feedbackCount: 1,
          },
        ];
      }
      updated.sort((a, b) => b.feedbackCount - a.feedbackCount);
      return updated.map((u, idx) => ({ ...u, rank: idx + 1 }));
    });

    showToast('🎉 메이커에게 피드백이 성공적으로 전달되었습니다!');
    pingSearchEngines().catch(() => {});
  };

  // Add Community Post (Local + Supabase DB)
  const addCommunityPost = (post: Omit<CommunityPost, 'id' | 'timeAgo' | 'likes' | 'comments'>) => {
    const newPost: CommunityPost = {
      ...post,
      id: 'c-' + Date.now(),
      author: user.name || post.author || '데몬메이커',
      authorId: user.id || user.email || '',
      authorEmail: user.email || '',
      timeAgo: '방금 전',
      likes: 0,
      comments: 0,
      userLiked: false,
    };
    setCommunityPosts((prev) => [newPost, ...prev]);

    // Save to Supabase DB in background
    insertCommunityPostToDB(newPost).catch((err) => console.warn('Supabase community save error:', err));
    pingSearchEngines().catch(() => {});

    // Live platform activity
    addNotification({
      type: 'community',
      userId: 'ALL',
      title: '커뮤니티 새 글 등록',
      message: `${newPost.author}님이 커뮤니티에 새 글을 올렸습니다: "${newPost.title}"`,
      senderName: newPost.author,
      senderAvatar: newPost.avatar,
    });

    showToast('🚀 커뮤니티에 새 글이 등록되었습니다!');
  };

  // Community Posts Upvote Tracking
  const [upvotedCommunityPostIds, setUpvotedCommunityPostIds] = useState<string[]>(() => {
    try {
      const savedUser = localStorage.getItem('demon_user');
      const uId = savedUser ? JSON.parse(savedUser)?.id : '';
      const key = uId ? `demon_community_upvotes_${uId}` : 'demon_community_upvotes';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isCommunityPostUpvoted = useCallback(
    (postId: string) => upvotedCommunityPostIds.includes(postId),
    [upvotedCommunityPostIds]
  );

  const toggleCommunityPostUpvote = useCallback(
    (postId: string) => {
      if (!user.isLoggedIn) {
        setLoginModalMessage('게시글을 추천하려면 먼저 로그인이 필요합니다.');
        setIsLoginModalOpen(true);
        showToast('로그인 후 추천할 수 있습니다.');
        return;
      }
      const uId = user.id || user.email;
      if (!uId) return;

      const key = `demon_community_upvotes_${uId}`;
      const isUpvoted = upvotedCommunityPostIds.includes(postId);
      const nextUpvoted = isUpvoted
        ? upvotedCommunityPostIds.filter((id) => id !== postId)
        : [...upvotedCommunityPostIds, postId];

      setUpvotedCommunityPostIds(nextUpvoted);
      try {
        localStorage.setItem(key, JSON.stringify(nextUpvoted));
      } catch {}

      const delta = isUpvoted ? -1 : 1;

      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes: Math.max(0, (p.likes || 0) + delta),
              userLiked: !isUpvoted,
            };
          }
          return p;
        })
      );

      updateCommunityPostLikesInDB(postId, delta).catch(() => {});

      if (isUpvoted) {
        showToast('게시글 추천을 취소했습니다.');
      } else {
        showToast('🔥 게시글을 추천(업보트)했습니다!');
      }
    },
    [upvotedCommunityPostIds, showToast, user]
  );

  const toggleLikePost = toggleCommunityPostUpvote;

  // Community Comments & Replies Management
  const addCommunityComment = useCallback(
    (postId: string, commentContent: string, parentId?: string, replyToAuthor?: string) => {
      if (!user.isLoggedIn) {
        setLoginModalMessage(parentId ? '답글을 작성하려면 먼저 로그인이 필요합니다.' : '댓글을 작성하려면 먼저 로그인이 필요합니다.');
        setIsLoginModalOpen(true);
        showToast(parentId ? '로그인 후 답글을 작성할 수 있습니다.' : '로그인 후 댓글을 작성할 수 있습니다.');
        return;
      }
      const trimmed = commentContent.trim();
      if (!trimmed) return;

      const newComment: CommunityComment = {
        id: 'cc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        postId,
        parentId: parentId || undefined,
        replyToAuthor: replyToAuthor || undefined,
        author: user.name || '인디 메이커',
        authorId: user.id || user.email,
        authorEmail: user.email,
        avatar: user.avatar || '/demon-mascot.png',
        content: trimmed,
        createdAt: '방금 전',
      };

      setCommunityComments((prev) => {
        const next = {
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        };
        try {
          localStorage.setItem('demon_community_comments', JSON.stringify(next));
        } catch {}
        return next;
      });

      setCommunityPosts((prev) => {
        const next = prev.map((p) => (p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));
        try {
          localStorage.setItem('demon_community', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Best-effort sync to Supabase community_comments table if created
      if (supabase) {
        supabase
          .from('community_comments')
          .insert([
            {
              id: newComment.id,
              post_id: newComment.postId,
              parent_id: newComment.parentId || null,
              reply_to_author: newComment.replyToAuthor || null,
              author: newComment.author,
              author_id: newComment.authorId,
              author_email: newComment.authorEmail,
              avatar: newComment.avatar,
              content: newComment.content,
            },
          ])
          .then(() => {}, () => {});
      }

      // Notify post author if not self
      const targetPost = communityPosts.find((p) => p.id === postId);
      if (targetPost) {
        const postAuthor = targetPost.authorId || targetPost.author;
        const isSelf = Boolean(
          postAuthor &&
            (postAuthor === user.id ||
              postAuthor === user.email ||
              postAuthor === user.name)
        );
        if (!isSelf && postAuthor) {
          addNotification({
            type: 'community',
            userId: postAuthor,
            title: parentId ? '게시글 답글 도착' : '게시글 댓글 도착',
            message: `${newComment.author}님이 회원님의 글 '${targetPost.title}'에 ${parentId ? '답글' : '댓글'}을 남겼습니다: "${trimmed.slice(0, 30)}..."`,
            senderName: newComment.author,
            senderAvatar: newComment.avatar,
          });
        }
      }

      showToast(parentId ? '↩️ 답글이 등록되었습니다!' : '💬 댓글이 성공적으로 등록되었습니다!');
    },
    [user, showToast]
  );

  const deleteCommunityComment = useCallback(
    (postId: string, commentId: string) => {
      let removedCount = 1;
      setCommunityComments((prev) => {
        const list = prev[postId] || [];
        const filtered = list.filter((c) => c.id !== commentId && c.parentId !== commentId);
        removedCount = Math.max(1, list.length - filtered.length);
        const next = {
          ...prev,
          [postId]: filtered,
        };
        try {
          localStorage.setItem('demon_community_comments', JSON.stringify(next));
        } catch {}
        return next;
      });

      setCommunityPosts((prev) => {
        const next = prev.map((p) =>
          p.id === postId ? { ...p, comments: Math.max(0, (p.comments || 0) - removedCount) } : p
        );
        try {
          localStorage.setItem('demon_community', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (supabase) {
        supabase.from('community_comments').delete().or(`id.eq.${commentId},parent_id.eq.${commentId}`).then(() => {}, () => {});
      }

      showToast('댓글을 삭제했습니다.');
    },
    [showToast]
  );

  // Product Feedback Replies Management (메이커/테스터 대댓글 답글)
  const addFeedbackReply = useCallback(
    (productId: string, feedbackId: string, replyContent: string) => {
      if (!user.isLoggedIn) {
        setLoginModalMessage('답글을 작성하려면 먼저 로그인이 필요합니다.');
        setIsLoginModalOpen(true);
        showToast('로그인 후 답글을 작성할 수 있습니다.');
        return;
      }
      const trimmed = replyContent.trim();
      if (!trimmed) return;

      const prod = products.find((p) => p.id === productId || p.slug === productId);
      const isMaker = Boolean(
        prod &&
          ((prod.authorId && user.id && prod.authorId === user.id) ||
            (prod.authorEmail && user.email && prod.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
            (user.email && prod.authorId && prod.authorId.toLowerCase() === user.email.toLowerCase()))
      );

      const newReply: FeedbackReply = {
        id: 'fr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        feedbackId,
        productId,
        author: user.name || '인디 메이커',
        authorId: user.id || user.email,
        authorEmail: user.email,
        avatar: user.avatar || '/demon-mascot.png',
        content: trimmed,
        createdAt: '방금 전',
        isMaker,
      };

      setFeedbackReplies((prev) => {
        const next = {
          ...prev,
          [feedbackId]: [...(prev[feedbackId] || []), newReply],
        };
        try {
          localStorage.setItem('demon_feedback_replies', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (supabase) {
        supabase
          .from('feedback_replies')
          .insert([
            {
              id: newReply.id,
              feedback_id: newReply.feedbackId,
              product_id: newReply.productId,
              author: newReply.author,
              author_id: newReply.authorId,
              author_email: newReply.authorEmail,
              avatar: newReply.avatar,
              content: newReply.content,
              is_maker: newReply.isMaker,
            },
          ])
          .then(() => {}, () => {});
      }

      // Notify original feedback author if not self
      const allFbs = Object.values(feedbacks).flat();
      const parentFb = allFbs.find((f) => f.id === feedbackId);
      if (parentFb) {
        const targetId = parentFb.authorId || parentFb.author;
        const isSelf = Boolean(
          targetId &&
            (targetId === user.id ||
              targetId === user.email ||
              targetId === user.name)
        );
        if (!isSelf && targetId) {
          addNotification({
            type: 'feedback',
            userId: targetId,
            title: '피드백 답글 도착',
            message: `${newReply.author}님이 회원님의 피드백에 답글을 남겼습니다: "${trimmed.slice(0, 35)}..."`,
            senderName: newReply.author,
            senderAvatar: newReply.avatar,
            productId: prod?.id,
            productTitle: prod?.title,
          });
        }
      }

      showToast('↩️ 피드백에 답글이 등록되었습니다!');
    },
    [user, products, showToast]
  );

  const deleteFeedbackReply = useCallback(
    (feedbackId: string, replyId: string) => {
      setFeedbackReplies((prev) => {
        const next = {
          ...prev,
          [feedbackId]: (prev[feedbackId] || []).filter((r) => r.id !== replyId),
        };
        try {
          localStorage.setItem('demon_feedback_replies', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (supabase) {
        supabase.from('feedback_replies').delete().eq('id', replyId).then(() => {}, () => {});
      }

      showToast('답글을 삭제했습니다.');
    },
    [showToast]
  );

  // Add Product (Local + Supabase DB!)
  const addProduct = (newApp: Omit<Product, 'id' | 'slug' | 'feedbackCount' | 'createdAt'>) => {
    const slug = newApp.title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').slice(0, 30);
    const created: Product = {
      ...newApp,
      id: 'app-' + Date.now(),
      slug: slug || 'app-' + Date.now(),
      author: newApp.author || user.name || '인디 메이커',
      authorId: newApp.authorId || user.id || user.email || '',
      authorEmail: newApp.authorEmail || user.email || '',
      feedbackCount: 0,
      createdAt: '방금 전',
      isNew: true,
    };

    // 1. Immediate UI update & local storage
    setProducts((prev) => {
      const next = [created, ...prev];
      try {
        localStorage.setItem('demon_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Permanent Supabase DB insert!
    insertProductToDB(created)
      .then((success) => {
        if (success) {
          console.log('✅ Supabase DB에 제품 영구 저장 완료:', created.title);
        } else {
          console.log('ℹ️ 로컬스토리지에 저장됨 (Supabase 테이블 생성 후 자동 동기화 가능)');
        }
      })
      .catch((err: any) => console.warn('Supabase insertProduct error:', err));

    // 3. Search Engine & Googlebot Auto-Crawl Ping
    pingSearchEngines().catch(() => {});

    // 4. Live platform activity
    addNotification({
      type: 'system',
      userId: 'ALL',
      title: '새 프로젝트 런칭',
      message: `🚀 ${created.author}님이 새로운 프로젝트 '${created.title}'을 등록했습니다!`,
      productId: created.id,
      productTitle: created.title,
      senderName: created.author,
      senderAvatar: created.icon,
    });

    showToast('✨ 제품이 성공적으로 등록되었습니다! (구글봇 크롤링 핑 발송됨)');
    return created;
  };

  // Update Product (Local + Supabase DB with strict author check)
  const updateProduct = (updated: Product) => {
    // Strict author verification
    const isOwner = Boolean(
      user.isLoggedIn && (
        (updated.authorId && user.id && updated.authorId === user.id) ||
        (updated.authorEmail && user.email && updated.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.email && updated.authorId && updated.authorId.toLowerCase() === user.email.toLowerCase())
      )
    );

    if (!isOwner) {
      showToast('❌ 자신이 등록한 제품만 수정할 수 있습니다.');
      return;
    }
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      try {
        localStorage.setItem('demon_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (selectedProduct && selectedProduct.id === updated.id) {
      setSelectedProduct(updated);
    }

    updateProductInDB(updated).catch((err: any) => console.warn('Supabase updateProduct error:', err));
    pingSearchEngines().catch(() => {});
    showToast('✨ 제품 정보가 성공적으로 수정되었습니다!');
  };

  // Bump / Boost Product to Top (3-day cooldown per product & strict author check)
  const bumpProduct = async (productId: string): Promise<boolean> => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return false;

    // Strict author verification: only the actual owner can bump their product!
    const isOwner = Boolean(
      user.isLoggedIn && (
        (targetProduct.authorId && user.id && targetProduct.authorId === user.id) ||
        (targetProduct.authorEmail && user.email && targetProduct.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.email && targetProduct.authorId && targetProduct.authorId.toLowerCase() === user.email.toLowerCase())
      )
    );

    if (!isOwner) {
      showToast('❌ 자신이 등록한 제품만 상단으로 끌어올릴 수 있습니다.');
      return false;
    }

    // Verify 3-day cooldown (3 days = 259,200,000 ms)
    const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
    const lastBumpTime = new Date(targetProduct.bumpedAt || targetProduct.createdAtRaw || targetProduct.createdAt).getTime();
    const diffMs = Date.now() - lastBumpTime;

    if (!isNaN(lastBumpTime) && diffMs < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - diffMs;
      const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const remainingMins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const timeStr = remainingDays > 0 ? `${remainingDays}일 ${remainingHours}시간` : `${remainingHours}시간 ${remainingMins}분`;
      showToast(`⏳ 3일 주기로 끌어올릴 수 있습니다. (다음 가능까지 ${timeStr} 남음)`);
      return false;
    }

    const nowIso = new Date().toISOString();
    const updatedProduct: Product = {
      ...targetProduct,
      bumpedAt: nowIso,
      createdAtRaw: nowIso,
      createdAt: '방금 전',
    };

    setProducts((prev) => {
      // Remove target and place at very top
      const others = prev.filter((p) => p.id !== productId);
      const next = [updatedProduct, ...others];
      try {
        localStorage.setItem('demon_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(updatedProduct);
    }

    bumpProductInDB(productId).catch((err: any) => console.warn('Supabase bumpProduct error:', err));
    pingSearchEngines().catch(() => {});
    showToast(`🚀 '${targetProduct.title}'이(가) 목록 최상단으로 끌어올려졌습니다! (다음 끌어올리기는 3일 후에 가능합니다)`);
    return true;
  };

  // Delete Product (Local + Supabase DB + Persistent Tombstone Blacklist with strict author check)
  const deleteProduct = (productId: string) => {
    // 1. Identify product and all its aliases (id + slug)
    const target = products.find((p) => p.id === productId || p.slug === productId);
    if (!target) return;

    // Strict author verification
    const isOwner = Boolean(
      user.isLoggedIn && (
        (target.authorId && user.id && target.authorId === user.id) ||
        (target.authorEmail && user.email && target.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
        (user.email && target.authorId && target.authorId.toLowerCase() === user.email.toLowerCase())
      )
    );

    if (!isOwner) {
      showToast('❌ 자신이 등록한 제품만 삭제할 수 있습니다.');
      return;
    }

    const idToDelete = target.id || productId;
    const slugToDelete = target.slug;

    // 2. Record to persistent deleted IDs blacklist so it NEVER resurrects!
    try {
      const saved = localStorage.getItem('demon_deleted_product_ids');
      const deletedList: string[] = saved ? JSON.parse(saved) : [];
      if (idToDelete && !deletedList.includes(idToDelete)) deletedList.push(idToDelete);
      if (slugToDelete && !deletedList.includes(slugToDelete)) deletedList.push(slugToDelete);
      localStorage.setItem('demon_deleted_product_ids', JSON.stringify(deletedList));
    } catch {}

    // 3. Remove immediately from local state & localStorage
    setProducts((prev) => {
      const next = prev.filter(
        (p) =>
          p.id !== idToDelete &&
          p.slug !== idToDelete &&
          (!slugToDelete || (p.id !== slugToDelete && p.slug !== slugToDelete))
      );
      try {
        localStorage.setItem('demon_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (
      selectedProduct &&
      (selectedProduct.id === idToDelete ||
        selectedProduct.slug === idToDelete ||
        (slugToDelete && (selectedProduct.id === slugToDelete || selectedProduct.slug === slugToDelete)))
    ) {
      setSelectedProduct(null);
    }

    // 4. Delete from Supabase & API sync
    deleteProductFromDB(idToDelete).catch((err: any) => console.warn('Supabase deleteProduct error:', err));
    pingSearchEngines().catch(() => {});
    showToast('🗑️ 제품이 성공적으로 삭제되었습니다.');
  };

  // Delete Community Post (Local + Supabase DB)
  const deleteCommunityPost = (postId: string) => {
    setCommunityPosts((prev) => {
      const next = prev.filter((p) => p.id !== postId);
      try {
        localStorage.setItem('demon_community', JSON.stringify(next));
      } catch {}
      return next;
    });
    deleteCommunityPostFromDB(postId).catch((err: any) => console.warn('Supabase deleteCommunityPost error:', err));
    showToast('게시글이 삭제되었습니다.');
  };

  // Delete Feedback (Local + Supabase DB)
  const deleteFeedback = (productId: string, feedbackId: string) => {
    setFeedbacks((prev) => {
      const productFeedbacks = (prev[productId] || []).filter((fb) => fb.id !== feedbackId);
      const next = { ...prev, [productId]: productFeedbacks };
      try {
        localStorage.setItem('demon_feedbacks', JSON.stringify(next));
      } catch {}
      return next;
    });

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p.slug === productId) {
          return { ...p, feedbackCount: Math.max(0, p.feedbackCount - 1) };
        }
        return p;
      })
    );

    deleteFeedbackFromDB(feedbackId).catch((err: any) => console.warn('Supabase deleteFeedback error:', err));
    showToast('피드백이 삭제되었습니다.');
  };

  // Upvoted Products State (Authoritative DB-synced per-account state — 1 upvote per account per project)
  const inFlightUpvotesRef = useRef<Set<string>>(new Set());

  const getAccountUpvoteIds = useCallback(() => {
    const emailNorm = user.email ? user.email.trim().toLowerCase() : '';
    const canonicalId = emailNorm || (user.id ? user.id.trim() : '');
    const allIds: string[] = [];
    if (canonicalId) allIds.push(canonicalId);
    if (user.id && user.id.trim()) allIds.push(user.id.trim());
    if (emailNorm) {
      allIds.push(emailNorm);
      // Include any legacy builder/auth UUIDs associated with this exact email address
      builders.forEach((b) => {
        if (b.email && b.email.trim().toLowerCase() === emailNorm && b.id) {
          allIds.push(b.id);
        }
      });
    }
    return {
      canonicalId,
      allIds: Array.from(new Set(allIds.filter(Boolean))),
    };
  }, [user.email, user.id, builders]);

  const [upvotedProductIds, setUpvotedProductIds] = useState<string[]>(() => {
    try {
      const savedUser = localStorage.getItem('demon_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.isLoggedIn) {
          const emailNorm = parsed.email ? String(parsed.email).trim().toLowerCase() : '';
          const uKey = emailNorm || parsed.id || '';
          if (uKey) {
            const saved = localStorage.getItem(`demon_upvotes_${uKey}`);
            return saved ? JSON.parse(saved) : [];
          }
        }
      }
    } catch {}
    return [];
  });

  // Sync authoritative account upvotes from Supabase on login, device switch, or email resolution
  useEffect(() => {
    if (!user.isLoggedIn) {
      setUpvotedProductIds([]);
      try {
        localStorage.removeItem('demon_guest_id');
        localStorage.removeItem('demon_upvoted_products');
      } catch {}
      return;
    }

    const { canonicalId, allIds } = getAccountUpvoteIds();
    if (!canonicalId || allIds.length === 0) return;

    const storageKey = `demon_upvotes_${canonicalId}`;
    let cancelled = false;

    // Load cached immediately for snappy UI, then strictly overwrite with authoritative DB truth
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setUpvotedProductIds(JSON.parse(saved));
      } catch {}
    }

    fetchUserUpvotesFromDB(allIds).then((remoteIds) => {
      if (cancelled || remoteIds === null) return;
      // Strictly replace with DB truth so logout/cancel on another device stays 100% synced!
      setUpvotedProductIds(remoteIds);
      try {
        localStorage.setItem(storageKey, JSON.stringify(remoteIds));
      } catch {}
    });

    // Real-time sync across devices when product_upvotes changes in Supabase
    if (!supabase) return () => { cancelled = true; };

    const channel = supabase
      .channel(`user_upvotes_${canonicalId.replace(/[^a-z0-9]/gi, '_')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_upvotes' },
        () => {
          fetchUserUpvotesFromDB(allIds).then((remoteIds) => {
            if (!cancelled && remoteIds !== null) {
              setUpvotedProductIds(remoteIds);
              try {
                localStorage.setItem(storageKey, JSON.stringify(remoteIds));
              } catch {}
            }
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase?.removeChannel(channel);
    };
  }, [user.isLoggedIn, getAccountUpvoteIds]);

  const isProductUpvoted = useCallback(
    (productId: string) => {
      if (upvotedProductIds.includes(productId)) return true;
      const target = products.find((p) => p.id === productId || p.slug === productId);
      if (target) {
        if (target.id && upvotedProductIds.includes(target.id)) return true;
        if (target.slug && upvotedProductIds.includes(target.slug)) return true;
      }
      return false;
    },
    [upvotedProductIds, products]
  );

  // Increment Product Views (deduplicated per browser session)
  const incrementProductViews = useCallback((productId: string) => {
    try {
      const key = `demon_viewed_${productId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      setProducts((prev) => {
        const next = prev.map((p) => {
          if (p.id === productId || p.slug === productId) {
            return { ...p, views: (p.views || 0) + 1 };
          }
          return p;
        });
        try {
          localStorage.setItem('demon_products', JSON.stringify(next));
        } catch {}
        return next;
      });

      setSelectedProduct((prev) => {
        if (prev && (prev.id === productId || prev.slug === productId)) {
          return { ...prev, views: (prev.views || 0) + 1 };
        }
        return prev;
      });

      incrementProductViewsInDB(productId).catch(() => {});
    } catch {}
  }, []);

  // Toggle Product Upvote (DB-Verified Atomic: Strictly 1 upvote per account per project across ALL devices!)
  const toggleProductUpvote = useCallback(
    async (productId: string) => {
      if (!user.isLoggedIn) {
        setLoginModalMessage('추천(업보트)은 로그인 후 이용하실 수 있습니다.');
        setIsLoginModalOpen(true);
        showToast('로그인 후 업보트(추천)할 수 있습니다.');
        return;
      }

      const { canonicalId, allIds } = getAccountUpvoteIds();
      if (!canonicalId || allIds.length === 0) return;

      // Prevent rapid double-click race conditions
      if (inFlightUpvotesRef.current.has(productId)) return;
      inFlightUpvotesRef.current.add(productId);

      const storageKey = `demon_upvotes_${canonicalId}`;

      // Resolve product & aliases (id + slug)
      const targetProd = products.find((p) => p.id === productId || p.slug === productId);
      const canonicalProdId = targetProd?.id || productId;
      const productAliases = Array.from(new Set([productId, canonicalProdId, targetProd?.slug].filter(Boolean) as string[]));

      const currentlyUpvoted = productAliases.some((alias) => upvotedProductIds.includes(alias));
      const wantUpvote = !currentlyUpvoted;

      const syncProductCount = (exactCount?: number, fallbackDelta?: number) => {
        setProducts((prev) => {
          const next = prev.map((p) => {
            if (p.id === productId || p.slug === productId || p.id === canonicalProdId) {
              const nextVal =
                typeof exactCount === 'number'
                  ? Math.max(0, exactCount)
                  : Math.max(0, (p.upvotes || 0) + (fallbackDelta || 0));
              return { ...p, upvotes: nextVal };
            }
            return p;
          });
          try {
            localStorage.setItem('demon_products', JSON.stringify(next));
          } catch {}
          return next;
        });

        setSelectedProduct((prev) => {
          if (prev && (prev.id === productId || prev.slug === productId || prev.id === canonicalProdId)) {
            const nextVal =
              typeof exactCount === 'number'
                ? Math.max(0, exactCount)
                : Math.max(0, (prev.upvotes || 0) + (fallbackDelta || 0));
            return { ...prev, upvotes: nextVal };
          }
          return prev;
        });
      };

      const updateUpvotedList = (shouldContain: boolean) => {
        setUpvotedProductIds((prev) => {
          const next = shouldContain
            ? Array.from(new Set([...prev, ...productAliases]))
            : prev.filter((id) => !productAliases.includes(id));
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {}
          return next;
        });
      };

      try {
        // Strictly verify & execute atomically against Supabase BEFORE changing counts!
        const res = await toggleProductUpvoteAtomicInDB(canonicalId, allIds, canonicalProdId, wantUpvote);

        if (res.status === 'added') {
          updateUpvotedList(true);
          syncProductCount(res.upvotes, 1);
          showToast('🔥 프로젝트를 추천(업보트)했습니다!');

          if (targetProd) {
            const authorTarget = targetProd.authorId || targetProd.author;
            const isSelf = Boolean(
              authorTarget &&
                (authorTarget === user.id ||
                  authorTarget === user.email ||
                  authorTarget === user.name)
            );
            if (!isSelf && authorTarget) {
              addNotification({
                type: 'upvote',
                userId: authorTarget,
                title: '프로젝트 추천(업보트)',
                message: `${user.name}님이 회원님의 프로젝트 '${targetProd.title}'을 추천(업보트)했습니다!`,
                senderName: user.name,
                senderAvatar: user.avatar,
                productId: targetProd.id,
                productTitle: targetProd.title,
              });
            }

            // Platform-wide live activity (누군가가 무엇을 했는지 알림)
            addNotification({
              type: 'upvote',
              userId: 'ALL',
              title: '프로젝트 추천',
              message: `${user.name}님이 '${targetProd.title}' 프로젝트를 추천했습니다.`,
              senderName: user.name,
              senderAvatar: user.avatar,
              productId: targetProd.id,
              productTitle: targetProd.title,
            });
          }
        } else if (res.status === 'already_upvoted') {
          updateUpvotedList(true);
          syncProductCount(res.upvotes);
          showToast('이미 이 계정으로 업보트한 프로젝트입니다. (계정당 프로젝트별 1회 제한)');
        } else if (res.status === 'removed') {
          updateUpvotedList(false);
          syncProductCount(res.upvotes, -1);
          showToast('추천을 취소했습니다.');
        } else if (res.status === 'not_upvoted') {
          updateUpvotedList(false);
          syncProductCount(res.upvotes);
          showToast('이미 추천이 취소된 프로젝트입니다.');
        } else {
          // Graceful fallback to guarantee smooth user experience without blocking
          if (wantUpvote) {
            updateUpvotedList(true);
            syncProductCount(undefined, 1);
            showToast('🔥 프로젝트를 추천(업보트)했습니다!');
          } else {
            updateUpvotedList(false);
            syncProductCount(undefined, -1);
            showToast('추천을 취소했습니다.');
          }
        }
      } finally {
        inFlightUpvotesRef.current.delete(productId);
      }
    },
    [upvotedProductIds, showToast, user.isLoggedIn, getAccountUpvoteIds, products]
  );

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % quotes.length);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        currentTab,
        setCurrentTab: handleSetCurrentTab,
        selectedProduct,
        setSelectedProduct,
        updateProduct,
        deleteProduct,
        bumpProduct,
        incrementProductViews,
        toggleProductUpvote,
        isProductUpvoted,
        feedbacks,
        addFeedback,
        deleteFeedback,
        feedbackReplies,
        addFeedbackReply,
        deleteFeedbackReply,
        user,
        loginAsDemoUser,
        loginWithCustomEmail,
        logout,
        requireAuth,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginModalMessage,
        isProfileEditOpen,
        setIsProfileEditOpen,
        updateUserProfile,
        communityPosts,
        addCommunityPost,
        deleteCommunityPost,
        toggleLikePost,
        toggleCommunityPostUpvote,
        isCommunityPostUpvoted,
        communityComments,
        addCommunityComment,
        deleteCommunityComment,
        addProduct,
        leaderboard,
        builders,
        refreshBuilders,
        isRefreshingBuilders,
        toggleFollowBuilder,
        activeDmBuilder,
        setActiveDmBuilder,
        dmMessages,
        sendDirectMessage,
        // Notifications & DM Inbox
        notifications,
        unreadNotificationCount,
        isNotificationOpen,
        setIsNotificationOpen,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        isDmInboxOpen,
        setIsDmInboxOpen,
        unreadDmCount,
        openDmWithBuilder,
        markDmThreadAsRead,
        currentQuote: quotes[quoteIdx],
        nextQuote,
        darkMode,
        toggleDarkMode,
        searchQuery,
        setSearchQuery,
        filterSort,
        setFilterSort,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
