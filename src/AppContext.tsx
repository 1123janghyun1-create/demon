import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import initialCommunity from './data/community_data.json';
import initialQuotes from './data/quotes_data.json';
import { Product, Feedback, CommunityPost, LeaderboardUser, Quote, NavTab, FilterSort, UserProfile, Builder, DirectMessage } from './types';
import { supabase, isSupabaseConfigured, signOutUser } from './lib/supabase';
import {
  fetchProductsFromDB,
  insertProductToDB,
  fetchFeedbacksFromDB,
  insertFeedbackToDB,
  fetchBuildersFromDB,
  upsertBuilderToDB,
  fetchCommunityPostsFromDB,
  insertCommunityPostToDB,
} from './lib/database';

interface AppContextType {
  products: Product[];
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  feedbacks: Record<string, Feedback[]>;
  addFeedback: (productId: string, feedback: Omit<Feedback, 'id' | 'createdAt'>) => void;
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
  toggleLikePost: (postId: string) => void;
  addProduct: (newApp: Omit<Product, 'id' | 'slug' | 'feedbackCount' | 'createdAt'>) => Product;
  leaderboard: LeaderboardUser[];
  builders: Builder[];
  toggleFollowBuilder: (builderId: string) => void;
  activeDmBuilder: Builder | null;
  setActiveDmBuilder: (b: Builder | null) => void;
  dmMessages: Record<string, DirectMessage[]>;
  sendDirectMessage: (builderId: string, text: string) => void;
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
    const saved = localStorage.getItem('demon_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('test');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>(() => {
    const saved = localStorage.getItem('demon_feedbacks');
    return saved ? JSON.parse(saved) : {};
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('demon_community');
    return saved ? JSON.parse(saved) : (initialCommunity as CommunityPost[]);
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => {
    const saved = localStorage.getItem('demon_leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  // Builders State
  const [builders, setBuilders] = useState<Builder[]>(() => {
    const saved = localStorage.getItem('demon_builders');
    return saved ? JSON.parse(saved) : [];
  });

  // Active DM Chat Modal
  const [activeDmBuilder, setActiveDmBuilder] = useState<Builder | null>(null);

  // Direct Messages History
  const [dmMessages, setDmMessages] = useState<Record<string, DirectMessage[]>>(() => {
    const saved = localStorage.getItem('demon_dm_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [quotes] = useState<Quote[]>(initialQuotes as Quote[]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('demon_theme') === 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState<FilterSort>('newest');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Supabase Database to Local State on App Startup
  useEffect(() => {
    if (isSupabaseConfigured) {
      // 1. Fetch products from Supabase
      fetchProductsFromDB().then((dbProducts) => {
        if (dbProducts !== null) {
          setProducts(dbProducts);
        }
      });

      // 2. Fetch feedbacks from Supabase
      fetchFeedbacksFromDB().then((dbFeedbacks) => {
        if (dbFeedbacks !== null) {
          setFeedbacks(dbFeedbacks);
        }
      });

      // 3. Fetch builders from Supabase
      fetchBuildersFromDB().then((dbBuilders) => {
        if (dbBuilders !== null && dbBuilders.length > 0) {
          setBuilders(dbBuilders);
        }
      });

      // 4. Fetch community posts from Supabase
      fetchCommunityPostsFromDB().then((dbPosts) => {
        if (dbPosts !== null && dbPosts.length > 0) {
          setCommunityPosts(dbPosts);
        }
      });
    }
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

  // Supabase Auth Listener
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          setUser((prev) => {
            const updated: UserProfile = {
              ...prev,
              id: u.id,
              email: u.email,
              name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || prev.name || '구글 사용자',
              avatar: u.user_metadata?.avatar_url || prev.avatar || '/demon-mascot.png',
              isLoggedIn: true,
            };
            syncUserToBuilders(updated);
            return updated;
          });

          if (window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          const u = session.user;
          setUser((prev) => {
            const updated: UserProfile = {
              ...prev,
              id: u.id,
              email: u.email,
              name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || prev.name || '구글 사용자',
              avatar: u.user_metadata?.avatar_url || prev.avatar || '/demon-mascot.png',
              isLoggedIn: true,
            };
            syncUserToBuilders(updated);
            return updated;
          });

          if (window.location.hash.includes('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser({
            id: '',
            email: '',
            name: '게스트',
            avatar: '/demon-mascot.png',
            role: '인디 메이커',
            bio: '새로운 사이드 프로젝트를 코딩하는 메이커입니다.',
            buildingApp: '',
            tags: ['개발자', 'SaaS', 'AI'],
            isLoggedIn: false,
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [syncUserToBuilders]);

  // Persist local state
  useEffect(() => {
    localStorage.setItem('demon_user', JSON.stringify(user));
    if (user.isLoggedIn) {
      syncUserToBuilders(user);
    }
  }, [user, syncUserToBuilders]);

  useEffect(() => {
    localStorage.setItem('demon_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('demon_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem('demon_community', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('demon_leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem('demon_builders', JSON.stringify(builders));
  }, [builders]);

  useEffect(() => {
    localStorage.setItem('demon_dm_messages', JSON.stringify(dmMessages));
  }, [dmMessages]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('demon_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('demon_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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

  // Send Direct Message
  const sendDirectMessage = (builderId: string, text: string) => {
    const newMsg: DirectMessage = {
      id: 'dm-' + Date.now(),
      senderId: user.id || 'me',
      receiverId: builderId,
      text: text.trim(),
      timestamp: '방금',
      isMine: true,
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
        };
        setDmMessages((prev) => ({
          ...prev,
          [builderId]: [...(prev[builderId] || []), replyMsg],
        }));
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
      feedbackCount: 0,
      createdAt: '방금 전',
      isNew: true,
    };

    // 1. Immediate UI update
    setProducts((prev) => [created, ...prev]);

    // 2. Permanent Supabase DB insert!
    insertProductToDB(created)
      .then((success) => {
        if (success) {
          console.log('✅ Supabase DB에 제품 영구 저장 완료:', created.title);
        } else {
          console.log('ℹ️ 로컬스토리지에 저장됨 (Supabase 테이블 생성 후 자동 동기화 가능)');
        }
      })
      .catch((err) => console.warn('Supabase insertProduct error:', err));

    showToast('✨ 제품이 성공적으로 등록되었습니다!');
    return created;
  };

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % quotes.length);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        currentTab,
        setCurrentTab,
        selectedProduct,
        setSelectedProduct,
        feedbacks,
        addFeedback,
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
        toggleLikePost,
        addProduct,
        leaderboard,
        builders,
        toggleFollowBuilder,
        activeDmBuilder,
        setActiveDmBuilder,
        dmMessages,
        sendDirectMessage,
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
