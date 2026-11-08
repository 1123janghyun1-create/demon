import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import initialProducts from './data/products.json';
import initialBuilders from './data/builders_data.json';
import initialFeedbacks from './data/feedbacks_data.json';
import initialCommunity from './data/community_data.json';
import initialQuotes from './data/quotes_data.json';
import { Product, Feedback, CommunityPost, LeaderboardUser, Quote, NavTab, FilterSort, UserProfile, Builder, DirectMessage, AppNotification } from './types';
import { supabase, isSupabaseConfigured, signOutUser } from './lib/supabase';
import {
  fetchProductsFromDB,
  insertProductToDB,
  updateProductInDB,
  deleteProductFromDB,
  incrementProductViewsInDB,
  incrementProductUpvoteInDB,
  decrementProductUpvoteInDB,
  fetchFeedbacksFromDB,
  insertFeedbackToDB,
  deleteFeedbackFromDB,
  fetchBuildersFromDB,
  upsertBuilderToDB,
  fetchCommunityPostsFromDB,
  insertCommunityPostToDB,
  deleteCommunityPostFromDB,
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
  incrementProductViews: (productId: string) => void;
  toggleProductUpvote: (productId: string) => void;
  isProductUpvoted: (productId: string) => boolean;
  feedbacks: Record<string, Feedback[]>;
  addFeedback: (productId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
  deleteFeedback: (productId: string, feedbackId: string) => void;
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
  addProduct: (newApp: Omit<Product, 'id' | 'slug' | 'feedbackCount' | 'createdAt'>) => Product;
  leaderboard: LeaderboardUser[];
  builders: Builder[];
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
    try {
      const saved = localStorage.getItem('demon_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialProducts as Product[]) || [];
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

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => {
    try {
      const saved = localStorage.getItem('demon_leaderboard');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Builders State
  const [builders, setBuilders] = useState<Builder[]>(() => {
    try {
      const saved = localStorage.getItem('demon_builders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialBuilders as Builder[]) || [];
  });

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

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('demon_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: 'notif-welcome',
        type: 'system',
        title: 'demonst에 오신 것을 환영합니다! 🎉',
        message: '새로운 프로젝트를 등록하고 동료 메이커들과 1:1 DM 및 테스트 피드백을 나눠보세요.',
        createdAt: '방금 전',
        read: false,
      },
    ];
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
        id: 'notif-' + Date.now(),
        createdAt: '방금 전',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markDmThreadAsRead = useCallback((builderId: string) => {
    setDmMessages((prev) => {
      const list = prev[builderId];
      if (!list) return prev;
      return {
        ...prev,
        [builderId]: list.map((m) => ({ ...m, read: true })),
      };
    });
    // Also mark DM notifications for this builder as read
    setNotifications((prev) =>
      prev.map((n) => (n.type === 'dm' && n.builderId === builderId ? { ...n, read: true } : n))
    );
  }, []);

  const [quotes] = useState<Quote[]>(initialQuotes as Quote[]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('demon_theme') === 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState<FilterSort>('newest');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Googlebot & Deep-linking URL Sync (Hash & Query Params)
  const handleSetCurrentTab = useCallback((tab: NavTab) => {
    setCurrentTab(tab);
    try {
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
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
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedProduct) {
        url.searchParams.set('product', selectedProduct.id);
      } else {
        url.searchParams.delete('product');
      }
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }, [selectedProduct]);

  // Sync Supabase Database / Server API to Local State on App Startup
  useEffect(() => {
    // 1. Fetch products from DB / API
    fetchProductsFromDB().then((dbProducts) => {
      if (dbProducts !== null && dbProducts.length > 0) {
        setProducts(dbProducts);
      }
    });

    // 2. Fetch feedbacks from DB / API
    fetchFeedbacksFromDB().then((dbFeedbacks) => {
      if (dbFeedbacks !== null && Object.keys(dbFeedbacks).length > 0) {
        setFeedbacks(dbFeedbacks);
      }
    });

    // 3. Fetch builders from DB / API
    fetchBuildersFromDB().then((dbBuilders) => {
      if (dbBuilders !== null && dbBuilders.length > 0) {
        setBuilders(dbBuilders);
      }
    });

    // 4. Fetch community posts from DB / API
    fetchCommunityPostsFromDB().then((dbPosts) => {
      if (dbPosts !== null && dbPosts.length > 0) {
        setCommunityPosts(dbPosts);
      }
    });
  }, []);

  // Sync Logged-in User into Builders list
  const syncUserToBuilders = useCallback((currentUser: UserProfile) => {
    if (!currentUser.isLoggedIn || !currentUser.id) return;

    setBuilders((prev) => {
      const idx = prev.findIndex((b) => b.id === currentUser.id || (currentUser.email && b.email === currentUser.email));
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
        return updated;
      });

      // Thoroughly clean URL tokens after capturing session
      cleanAuthUrl();
    },
    [syncUserToBuilders, cleanAuthUrl]
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

  // Send Direct Message
  const sendDirectMessage = (builderId: string, text: string) => {
    const newMsg: DirectMessage = {
      id: 'dm-' + Date.now(),
      senderId: user.id || 'me',
      receiverId: builderId,
      text: text.trim(),
      timestamp: '방금',
      isMine: true,
      read: true,
    };

    setDmMessages((prev) => ({
      ...prev,
      [builderId]: [...(prev[builderId] || []), newMsg],
    }));

    if (builderId !== user.id) {
      const targetBuilder = builders.find((b) => b.id === builderId);
      setTimeout(() => {
        const replyMsg: DirectMessage = {
          id: 'dm-reply-' + Date.now(),
          senderId: builderId,
          receiverId: user.id || 'me',
          text: `안녕하세요 ${user.name}님! 메시지 확인했습니다. ${targetBuilder?.buildingApp ? `'${targetBuilder.buildingApp}' 관련 이야기` : '프로덕트 피드백'} 편하게 나눠요 😊`,
          timestamp: '방금',
          isMine: false,
          read: false,
        };
        setDmMessages((prev) => ({
          ...prev,
          [builderId]: [...(prev[builderId] || []), replyMsg],
        }));

        // Trigger DM Notification for user!
        addNotification({
          type: 'dm',
          title: `${targetBuilder?.name || '빌더'}님의 새 1:1 메시지`,
          message: replyMsg.text,
          senderName: targetBuilder?.name || '빌더',
          senderAvatar: targetBuilder?.avatar || '/demon-mascot.png',
          builderId: builderId,
        });
        showToast(`💬 ${targetBuilder?.name || '빌더'}님으로부터 새로운 DM이 도착했습니다!`);
      }, 1200);
    }
  };

  // Add Feedback (Local + Supabase DB)
  const addFeedback = (productId: string, fb: Omit<Feedback, 'id' | 'createdAt'>) => {
    const newFb: Feedback = {
      ...fb,
      id: 'fb-' + Date.now(),
      createdAt: '방금 전',
    };

    setFeedbacks((prev) => ({
      ...prev,
      [productId]: [newFb, ...(prev[productId] || [])],
    }));

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p.slug === productId) {
          return { ...p, feedbackCount: p.feedbackCount + 1 };
        }
        return p;
      })
    );

    // Save to Supabase DB in background
    insertFeedbackToDB(newFb).catch((err) => console.warn('Supabase feedback save error:', err));

    // Trigger Notification for the author/user
    const targetProduct = products.find((p) => p.id === productId || p.slug === productId);
    addNotification({
      type: 'feedback',
      title: '새로운 테스트 피드백 도착 ⭐',
      message: `${fb.author || '익명 테스터'}님이 '${targetProduct?.title || '내 프로젝트'}'에 피드백을 남겼습니다: "${fb.content.slice(0, 45)}${fb.content.length > 45 ? '...' : ''}"`,
      senderName: fb.author || '익명 테스터',
      senderAvatar: fb.avatar || '/demon-mascot.png',
      productId: targetProduct?.id || productId,
      productTitle: targetProduct?.title || '프로젝트',
      commentText: fb.content,
    });

    setLeaderboard((prev) => {
      const authorName = fb.author || '익명 테스터';
      const existing = prev.find((u) => u.name === authorName);
      let updated: LeaderboardUser[];
      if (existing) {
        updated = prev.map((u) => (u.name === authorName ? { ...u, feedbackCount: u.feedbackCount + 1 } : u));
      } else {
        updated = [
          ...prev,
          {
            rank: prev.length + 1,
            name: authorName,
            avatar: fb.avatar || '/demon-mascot.png',
            feedbackCount: 1,
          },
        ];
      }
      updated.sort((a, b) => b.feedbackCount - a.feedbackCount);
      return updated.map((u, idx) => ({ ...u, rank: idx + 1 }));
    });

    showToast('🎉 메이커에게 피드백이 성공적으로 전달되었습니다!');
  };

  // Add Community Post (Local + Supabase DB)
  const addCommunityPost = (post: Omit<CommunityPost, 'id' | 'timeAgo' | 'likes' | 'comments'>) => {
    const newPost: CommunityPost = {
      ...post,
      id: 'c-' + Date.now(),
      timeAgo: '방금 전',
      likes: 0,
      comments: 0,
      userLiked: false,
    };
    setCommunityPosts((prev) => [newPost, ...prev]);

    // Save to Supabase DB in background
    insertCommunityPostToDB(newPost).catch((err) => console.warn('Supabase community save error:', err));

    showToast('🚀 커뮤니티에 새 글이 등록되었습니다!');
  };

  const toggleLikePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = p.userLiked;
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            userLiked: !isLiked,
          };
        }
        return p;
      })
    );
  };

  // Add Product (Local + Supabase DB!)
  const addProduct = (newApp: Omit<Product, 'id' | 'slug' | 'feedbackCount' | 'createdAt'>) => {
    const slug = newApp.title.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').slice(0, 30);
    const created: Product = {
      ...newApp,
      id: 'app-' + Date.now(),
      slug: slug || 'app-' + Date.now(),
      authorId: newApp.authorId || user.id || user.email || '',
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

    showToast('✨ 제품이 성공적으로 등록되었습니다! (구글봇 크롤링 핑 발송됨)');
    return created;
  };

  // Update Product (Local + Supabase DB)
  const updateProduct = (updated: Product) => {
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

  // Delete Product (Local + Supabase DB)
  const deleteProduct = (productId: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem('demon_products', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(null);
    }

    deleteProductFromDB(productId).catch((err: any) => console.warn('Supabase deleteProduct error:', err));
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

  // Upvoted Products State (LocalStorage)
  const [upvotedProductIds, setUpvotedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('demon_upvoted_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isProductUpvoted = useCallback(
    (productId: string) => upvotedProductIds.includes(productId),
    [upvotedProductIds]
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

  // Toggle Product Upvote (with requireAuth)
  const toggleProductUpvote = useCallback(
    (productId: string) => {
      requireAuth(() => {
        const isUpvoted = upvotedProductIds.includes(productId);
        const nextUpvoted = isUpvoted
          ? upvotedProductIds.filter((id) => id !== productId)
          : [...upvotedProductIds, productId];

        setUpvotedProductIds(nextUpvoted);
        try {
          localStorage.setItem('demon_upvoted_products', JSON.stringify(nextUpvoted));
        } catch {}

        const delta = isUpvoted ? -1 : 1;

        setProducts((prev) => {
          const next = prev.map((p) => {
            if (p.id === productId || p.slug === productId) {
              const currentUpvotes = p.upvotes || 0;
              return { ...p, upvotes: Math.max(0, currentUpvotes + delta) };
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
            const currentUpvotes = prev.upvotes || 0;
            return { ...prev, upvotes: Math.max(0, currentUpvotes + delta) };
          }
          return prev;
        });

        if (isUpvoted) {
          decrementProductUpvoteInDB(productId).catch(() => {});
          showToast('추천을 취소했습니다.');
        } else {
          incrementProductUpvoteInDB(productId).catch(() => {});
          showToast('🔥 프로젝트를 추천(업보트)했습니다!');

          // Trigger Notification for the author/user
          const targetProduct = products.find((p) => p.id === productId || p.slug === productId);
          const newCount = (targetProduct?.upvotes || 0) + 1;
          addNotification({
            type: 'upvote',
            title: '프로젝트 업보트 알림 🔥',
            message: `${user.name || '동료 메이커'}님이 '${targetProduct?.title || '내 프로젝트'}'에 업보트를 남겼습니다! (추천 ${newCount}개)`,
            senderName: user.name || '동료 메이커',
            senderAvatar: user.avatar || '/demon-mascot.png',
            productId: targetProduct?.id || productId,
            productTitle: targetProduct?.title || '프로젝트',
          });
        }
      }, '프로젝트를 추천(업보트)하려면 로그인이 필요합니다.');
    },
    [upvotedProductIds, requireAuth, showToast, products, user, addNotification]
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
        incrementProductViews,
        toggleProductUpvote,
        isProductUpvoted,
        feedbacks,
        addFeedback,
        deleteFeedback,
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
        addProduct,
        leaderboard,
        builders,
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
