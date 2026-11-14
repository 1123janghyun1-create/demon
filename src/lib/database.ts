import { supabase } from './supabase';
import { Product, Feedback, Builder, CommunityPost, DirectMessage } from '../types';

// ==========================================
// Helper functions for Multi-Browser API Sync
// ==========================================
async function syncApiGet(table: string): Promise<any> {
  try {
    const res = await fetch(`/api/sync?table=${table}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data;
      }
    }
  } catch {}
  return null;
}

async function syncApiPost(table: string, action: string, data: any): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, action, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==========================================
// 1. Products (프로젝트)
// ==========================================
export async function fetchProductsFromDB(): Promise<Product[] | null> {
  let supaProducts: Product[] | null = null;
  let supaQuerySucceeded = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        supaQuerySucceeded = true;
        supaProducts = data.map((row: any) => {
          let createdDate = '방금 전';
          if (row.created_at) {
            const d = new Date(row.created_at);
            if (!isNaN(d.getTime())) {
              createdDate = d.toLocaleDateString('ko-KR');
            }
          }

          return {
            id: row.id,
            slug: row.slug || row.id,
            title: row.title || '',
            tagline: row.tagline || '',
            category: row.category || '생산성',
            icon: row.icon || '/demon-mascot.png',
            screenshot: row.screenshot || '',
            feedbackCount: row.feedback_count || 0,
            views: row.views || 0,
            upvotes: row.upvotes || 0,
            url: row.url || '',
            author: row.author || '인디 메이커',
            authorId: row.author_id || '',
            instructions: row.instructions || '',
            description: row.description || row.instructions || '',
            gallery: Array.isArray(row.gallery) ? row.gallery : (row.screenshot ? [row.screenshot] : []),
            demoVideo: row.demo_video || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            createdAt: createdDate,
          };
        });
      } else if (error) {
        console.warn('Supabase fetchProducts warning (테이블 미생성 가능):', error.message);
      }
    } catch (err) {
      console.warn('Supabase DB error:', err);
    }
  }

  // 1. If Supabase returned products, return them
  if (supaProducts && supaProducts.length > 0) {
    return supaProducts;
  }

  // 2. Multi-account / Multi-browser fallback via /api/sync
  const apiProducts = await syncApiGet('products');
  if (Array.isArray(apiProducts) && apiProducts.length > 0) {
    return apiProducts;
  }

  // 3. If Supabase query succeeded and genuinely returned 0 rows:
  if (supaQuerySucceeded && supaProducts) {
    return supaProducts;
  }

  // 4. Remote DB was unavailable or errored: return null so local state is NEVER wiped!
  return null;
}

export async function insertProductToDB(product: Product): Promise<boolean> {
  // 1. Immediately persist to server-side sync API for cross-browser synchronization
  syncApiPost('products', 'insert', product);

  if (!supabase) return true;

  try {
    const { error } = await supabase.from('products').upsert([
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        tagline: product.tagline,
        category: product.category,
        icon: product.icon,
        screenshot: product.screenshot,
        feedback_count: product.feedbackCount || 0,
        views: product.views || 0,
        upvotes: product.upvotes || 0,
        url: product.url,
        author: product.author,
        author_id: product.authorId,
        instructions: product.instructions,
        description: product.description,
        gallery: product.gallery,
        demo_video: product.demoVideo,
        tags: product.tags,
      },
    ]);

    if (error) {
      console.warn('Supabase insertProduct warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('insertProductToDB error:', err);
    return false;
  }
}

export async function updateProductInDB(product: Product): Promise<boolean> {
  syncApiPost('products', 'update', product);

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('products')
      .update({
        title: product.title,
        tagline: product.tagline,
        category: product.category,
        icon: product.icon,
        screenshot: product.screenshot,
        views: product.views || 0,
        upvotes: product.upvotes || 0,
        url: product.url,
        instructions: product.instructions,
        description: product.description,
        gallery: product.gallery,
        demo_video: product.demoVideo,
        tags: product.tags,
      })
      .eq('id', product.id);

    if (error) {
      console.warn('Supabase updateProduct warning:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('updateProductInDB error:', err);
    return true;
  }
}

export async function incrementProductViewsInDB(productId: string): Promise<boolean> {
  syncApiPost('products', 'increment_view', { id: productId });

  if (!supabase) return true;
  try {
    const { error: rpcError } = await supabase.rpc('increment_product_views', { product_id: productId });
    if (!rpcError) return true;

    const { data } = await supabase.from('products').select('views').eq('id', productId).single();
    if (data) {
      const nextViews = (data.views || 0) + 1;
      await supabase.from('products').update({ views: nextViews }).eq('id', productId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function incrementProductUpvoteInDB(productId: string): Promise<boolean> {
  syncApiPost('products', 'increment_upvote', { id: productId });

  if (!supabase) return true;
  try {
    const { error: rpcError } = await supabase.rpc('increment_product_upvotes', { product_id: productId });
    if (!rpcError) return true;

    const { data } = await supabase.from('products').select('upvotes').eq('id', productId).single();
    if (data) {
      const nextUpvotes = (data.upvotes || 0) + 1;
      await supabase.from('products').update({ upvotes: nextUpvotes }).eq('id', productId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function decrementProductUpvoteInDB(productId: string): Promise<boolean> {
  syncApiPost('products', 'decrement_upvote', { id: productId });

  if (!supabase) return true;
  try {
    const { data } = await supabase.from('products').select('upvotes').eq('id', productId).single();
    if (data) {
      const nextUpvotes = Math.max(0, (data.upvotes || 0) - 1);
      await supabase.from('products').update({ upvotes: nextUpvotes }).eq('id', productId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// User-specific Upvote Management (Prevents multiple upvoting across logins/devices)
export async function fetchUserUpvotesFromDB(userId: string): Promise<string[]> {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('product_upvotes')
      .select('product_id')
      .eq('user_id', userId);
    if (!error && Array.isArray(data)) {
      return data.map((row: any) => row.product_id).filter(Boolean);
    }
  } catch (err) {
    console.warn('fetchUserUpvotesFromDB warning:', err);
  }
  return [];
}

export async function recordProductUpvoteInDB(userId: string, productId: string, isUpvoted: boolean): Promise<boolean> {
  if (!supabase || !userId || !productId) return true;
  try {
    if (isUpvoted) {
      const { error } = await supabase
        .from('product_upvotes')
        .upsert([{ user_id: userId, product_id: productId }]);
      if (error) {
        console.warn('recordProductUpvoteInDB insert warning:', error.message);
      }
    } else {
      const { error } = await supabase
        .from('product_upvotes')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) {
        console.warn('recordProductUpvoteInDB delete warning:', error.message);
      }
    }
    return true;
  } catch (err) {
    console.warn('recordProductUpvoteInDB warning:', err);
    return false;
  }
}

export async function deleteProductFromDB(productId: string): Promise<boolean> {
  syncApiPost('products', 'delete', { id: productId });

  if (!supabase) return true;
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Supabase deleteProduct warning:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('deleteProductFromDB error:', err);
    return true;
  }
}

// ==========================================
// 2. Feedbacks (피드백)
// ==========================================
export async function fetchFeedbacksFromDB(): Promise<Record<string, Feedback[]> | null> {
  let supaMap: Record<string, Feedback[]> | null = null;
  let supaQuerySucceeded = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        supaQuerySucceeded = true;
        supaMap = {};
        data.forEach((row: any) => {
          let createdDate = '방금 전';
          if (row.created_at) {
            const d = new Date(row.created_at);
            if (!isNaN(d.getTime())) {
              createdDate = d.toLocaleDateString('ko-KR');
            }
          }

          const fb: Feedback = {
            id: row.id,
            productId: row.product_id,
            author: row.author,
            avatar: row.avatar,
            rating: row.rating,
            content: row.content,
            deviceInfo: row.device_info,
            screenshot: row.screenshot,
            createdAt: createdDate,
          };
          if (!supaMap![row.product_id]) supaMap![row.product_id] = [];
          supaMap![row.product_id].push(fb);
        });
      }
    } catch {}
  }

  if (supaMap && Object.keys(supaMap).length > 0) {
    return supaMap;
  }

  const apiFeedbacks = await syncApiGet('feedbacks');
  if (apiFeedbacks && typeof apiFeedbacks === 'object' && Object.keys(apiFeedbacks).length > 0) {
    return apiFeedbacks;
  }

  if (supaQuerySucceeded && supaMap) {
    return supaMap;
  }

  return null;
}

export async function insertFeedbackToDB(feedback: Feedback): Promise<boolean> {
  syncApiPost('feedbacks', 'insert', feedback);

  if (!supabase) return true;
  try {
    const { error } = await supabase.from('feedbacks').upsert([
      {
        id: feedback.id,
        product_id: feedback.productId,
        author: feedback.author,
        avatar: feedback.avatar,
        rating: feedback.rating,
        content: feedback.content,
        device_info: feedback.deviceInfo,
        screenshot: feedback.screenshot,
      },
    ]);

    if (!error) {
      try {
        await supabase.rpc('increment_feedback', { product_id: feedback.productId });
      } catch {}
    }

    return true;
  } catch {
    return true;
  }
}

export async function deleteFeedbackFromDB(feedbackId: string, productId?: string): Promise<boolean> {
  syncApiPost('feedbacks', 'delete', { id: feedbackId, productId });

  if (!supabase) return true;
  try {
    const { error } = await supabase.from('feedbacks').delete().eq('id', feedbackId);
    return !error;
  } catch {
    return true;
  }
}

// ==========================================
// 3. Builders (빌더 프로필)
// ==========================================
export async function fetchBuildersFromDB(): Promise<Builder[] | null> {
  let supaBuilders: Builder[] | null = null;
  let supaQuerySucceeded = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('builders')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        supaQuerySucceeded = true;
        supaBuilders = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role || '인디 메이커',
          bio: row.bio || '',
          avatar: row.avatar || '/demon-mascot.png',
          buildingApp: row.building_app || '',
          tags: row.tags || ['개발자'],
          followersCount: row.followers_count || 0,
          followingCount: row.following_count || 0,
          website: row.website,
          github: row.github,
          twitter: row.twitter,
          online: true,
        }));
      }
    } catch {}
  }

  if (supaBuilders && supaBuilders.length > 0) {
    return supaBuilders;
  }

  const apiBuilders = await syncApiGet('builders');
  if (Array.isArray(apiBuilders) && apiBuilders.length > 0) {
    return apiBuilders;
  }

  if (supaQuerySucceeded && supaBuilders) {
    return supaBuilders;
  }

  return null;
}

export async function upsertBuilderToDB(builder: Builder): Promise<boolean> {
  syncApiPost('builders', 'upsert', builder);

  if (!supabase) return true;
  try {
    const { error } = await supabase.from('builders').upsert([
      {
        id: builder.id,
        name: builder.name,
        email: builder.email,
        role: builder.role,
        bio: builder.bio,
        avatar: builder.avatar,
        building_app: builder.buildingApp,
        tags: builder.tags,
        followers_count: builder.followersCount || 0,
        following_count: builder.followingCount || 0,
        website: builder.website,
        github: builder.github,
        twitter: builder.twitter,
        updated_at: new Date().toISOString(),
      },
    ]);
    return !error;
  } catch {
    return true;
  }
}

// ==========================================
// 4. Community Posts (커뮤니티)
// ==========================================
export async function fetchCommunityPostsFromDB(): Promise<CommunityPost[] | null> {
  let supaPosts: CommunityPost[] | null = null;
  let supaQuerySucceeded = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        supaQuerySucceeded = true;
        supaPosts = data.map((row: any) => {
          let createdDate = '방금 전';
          if (row.created_at) {
            const d = new Date(row.created_at);
            if (!isNaN(d.getTime())) {
              createdDate = d.toLocaleDateString('ko-KR');
            }
          }

          return {
            id: row.id,
            author: row.author,
            avatar: row.avatar,
            tag: row.tag as any,
            title: row.title,
            content: row.content,
            likes: row.likes || 0,
            comments: row.comments || 0,
            timeAgo: createdDate,
          };
        });
      }
    } catch {}
  }

  if (supaPosts && supaPosts.length > 0) {
    return supaPosts;
  }

  const apiPosts = await syncApiGet('community');
  if (Array.isArray(apiPosts) && apiPosts.length > 0) {
    return apiPosts;
  }

  if (supaQuerySucceeded && supaPosts) {
    return supaPosts;
  }

  return null;
}

export async function insertCommunityPostToDB(post: CommunityPost): Promise<boolean> {
  syncApiPost('community', 'insert', post);

  if (!supabase) return true;
  try {
    const { error } = await supabase.from('community_posts').upsert([
      {
        id: post.id,
        author: post.author,
        avatar: post.avatar,
        tag: post.tag,
        title: post.title,
        content: post.content,
        likes: post.likes || 0,
        comments: post.comments || 0,
      },
    ]);
    return !error;
  } catch {
    return true;
  }
}

export async function deleteCommunityPostFromDB(postId: string): Promise<boolean> {
  syncApiPost('community', 'delete', { id: postId });

  if (!supabase) return true;
  try {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    return !error;
  } catch {
    return true;
  }
}

// ==========================================
// 6. Direct Messages (1:1 실제 사람 간 실시간 대화)
// ==========================================
export async function fetchDirectMessagesFromDB(userId: string): Promise<DirectMessage[]> {
  if (!supabase || !userId) return [];

  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      return data.map((row: any) => {
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

        return {
          id: row.id,
          senderId: row.sender_id,
          receiverId: row.receiver_id,
          text: row.text,
          timestamp: timestamp,
          isMine: row.sender_id === userId,
          read: Boolean(row.read),
        };
      });
    } else if (error) {
      console.warn('Supabase fetchDirectMessages warning:', error.message);
    }
  } catch (err) {
    console.warn('Supabase fetchDirectMessages error:', err);
  }

  return [];
}

export async function sendDirectMessageToDB(msg: {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
}): Promise<boolean> {
  // 1. Multi-browser fallback sync API
  syncApiPost('messages', 'insert', msg);

  if (!supabase) return true;

  try {
    const { error } = await supabase.from('direct_messages').insert([
      {
        id: msg.id,
        sender_id: msg.senderId,
        receiver_id: msg.receiverId,
        text: msg.text,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.warn('Supabase sendDirectMessage warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sendDirectMessage error:', err);
    return false;
  }
}

export async function markDirectMessagesAsReadInDB(
  myUserId: string,
  partnerId: string
): Promise<boolean> {
  if (!supabase || !myUserId || !partnerId) return true;

  try {
    const { error } = await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', myUserId)
      .eq('read', false);

    return !error;
  } catch {
    return false;
  }
}
