import { supabase } from './supabase';
import { Product, Feedback, Builder, CommunityPost, DirectMessage, AppNotification } from '../types';

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
            createdAtRaw: row.created_at || new Date().toISOString(),
            bumpedAt: row.bumped_at || row.created_at || undefined,
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

export async function bumpProductInDB(productId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();
  syncApiPost('products', 'bump', { id: productId, bumpedAt: nowIso });

  if (!supabase) return true;

  try {
    // Update created_at to current timestamp so Supabase .order('created_at', { ascending: false }) moves it to #1
    const { error } = await supabase
      .from('products')
      .update({
        created_at: nowIso,
      })
      .eq('id', productId);

    if (error) {
      console.warn('Supabase bumpProduct warning:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('bumpProductInDB error:', err);
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

// User-specific Upvote Management (Strictly 1 upvote per account per project across ALL devices & logins)
export interface AtomicUpvoteResult {
  status: 'added' | 'removed' | 'already_upvoted' | 'not_upvoted' | 'error';
  upvotes?: number;
}

export async function fetchUserUpvotesFromDB(userIds: string | string[]): Promise<string[] | null> {
  if (!supabase) return null;
  const ids = (Array.isArray(userIds) ? userIds : [userIds])
    .map((s) => (s || '').trim())
    .filter(Boolean);
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('product_upvotes')
      .select('product_id')
      .in('user_id', uniqueIds);

    if (!error && Array.isArray(data)) {
      return Array.from(new Set(data.map((row: any) => row.product_id).filter(Boolean)));
    }
    if (error) {
      console.warn('fetchUserUpvotesFromDB warning:', error.message);
      return null;
    }
  } catch (err) {
    console.warn('fetchUserUpvotesFromDB warning:', err);
  }
  return null;
}

/**
 * DB-First Atomic Upvote Toggle:
 * Guarantees strictly 1 upvote per account per project even across logout/relogin,
 * multiple devices, multiple browsers, or simultaneous double-clicks!
 */
export async function toggleProductUpvoteAtomicInDB(
  canonicalUserId: string,
  allUserIds: string[],
  productId: string,
  wantUpvote: boolean
): Promise<AtomicUpvoteResult> {
  const uniqueIds = Array.from(new Set([canonicalUserId, ...allUserIds].map((s) => (s || '').trim()).filter(Boolean)));
  if (!canonicalUserId || !productId || uniqueIds.length === 0) {
    return { status: wantUpvote ? 'added' : 'removed' };
  }

  // Fallback when Supabase is not configured
  if (!supabase) {
    if (wantUpvote) {
      syncApiPost('products', 'increment_upvote', { id: productId });
      return { status: 'added' };
    } else {
      syncApiPost('products', 'decrement_upvote', { id: productId });
      return { status: 'removed' };
    }
  }

  const sb = supabase;
  try {
    // 0. Resolve canonical product ID & slug aliases
    let canonicalProductId = productId;
    const allProductIds = [productId];

    try {
      const { data: prodData } = await sb
        .from('products')
        .select('id, slug, upvotes')
        .or(`id.eq.${productId},slug.eq.${productId}`)
        .limit(1);
      if (Array.isArray(prodData) && prodData.length > 0 && prodData[0]) {
        if (prodData[0].id) {
          canonicalProductId = prodData[0].id;
          allProductIds.push(prodData[0].id);
        }
        if (prodData[0].slug) allProductIds.push(prodData[0].slug);
      }
    } catch {}

    const uniqueProductIds = Array.from(new Set(allProductIds.filter(Boolean)));

    // 1. Check authoritative DB state across ALL identifiers of this account and product
    const { data: existingRows } = await sb
      .from('product_upvotes')
      .select('user_id, product_id')
      .in('product_id', uniqueProductIds)
      .in('user_id', uniqueIds);

    const alreadyHasRow = Array.isArray(existingRows) && existingRows.length > 0;

    const getCurrentProductUpvotes = async (): Promise<number | undefined> => {
      try {
        const { data } = await sb
          .from('products')
          .select('upvotes')
          .or(`id.eq.${canonicalProductId},id.eq.${productId}`)
          .limit(1);
        return Array.isArray(data) && data[0] ? (data[0].upvotes || 0) : undefined;
      } catch {
        return undefined;
      }
    };

    if (wantUpvote) {
      // Strictly block duplicate upvote if already recorded in DB
      if (alreadyHasRow) {
        const currentUpvotes = await getCurrentProductUpvotes();
        return { status: 'already_upvoted', upvotes: currentUpvotes };
      }

      // Try inserting into DB with canonical product ID
      const { error: insertError } = await sb
        .from('product_upvotes')
        .insert([{ user_id: canonicalUserId, product_id: canonicalProductId }]);

      if (insertError) {
        // 23505 = duplicate key violation (race condition / already upvoted)
        if (insertError.code === '23505' || /duplicate key/i.test(insertError.message || '')) {
          const currentUpvotes = await getCurrentProductUpvotes();
          return { status: 'already_upvoted', upvotes: currentUpvotes };
        }

        // If foreign key violation (23503), retry with the raw productId
        if (insertError.code === '23503' && canonicalProductId !== productId) {
          const { error: retryError } = await sb
            .from('product_upvotes')
            .insert([{ user_id: canonicalUserId, product_id: productId }]);
          if (!retryError) {
            const cur = (await getCurrentProductUpvotes()) ?? 0;
            const nextUpvotes = cur + 1;
            await sb.from('products').update({ upvotes: nextUpvotes }).or(`id.eq.${canonicalProductId},id.eq.${productId}`);
            syncApiPost('products', 'increment_upvote', { id: canonicalProductId });
            return { status: 'added', upvotes: nextUpvotes };
          }
        }

        console.warn('Supabase product_upvotes insert notice:', insertError.message);
        // Graceful fallback: do NOT fail the user, still update products upvotes
        syncApiPost('products', 'increment_upvote', { id: canonicalProductId });
        return { status: 'added' };
      }

      // INSERT succeeded -> update products.upvotes
      const cur = (await getCurrentProductUpvotes()) ?? 0;
      const nextUpvotes = cur + 1;
      await sb.from('products').update({ upvotes: nextUpvotes }).or(`id.eq.${canonicalProductId},id.eq.${productId}`);
      syncApiPost('products', 'increment_upvote', { id: canonicalProductId });
      return { status: 'added', upvotes: nextUpvotes };
    } else {
      // Cancel upvote: delete ALL rows matching any identifier of this account and product
      await sb
        .from('product_upvotes')
        .delete()
        .in('product_id', uniqueProductIds)
        .in('user_id', uniqueIds);

      const cur = (await getCurrentProductUpvotes()) ?? 0;
      const nextUpvotes = Math.max(0, cur - 1);
      await sb.from('products').update({ upvotes: nextUpvotes }).or(`id.eq.${canonicalProductId},id.eq.${productId}`);
      syncApiPost('products', 'decrement_upvote', { id: canonicalProductId });
      return { status: 'removed', upvotes: nextUpvotes };
    }
  } catch (err) {
    console.warn('toggleProductUpvoteAtomicInDB handled error:', err);
    // Graceful fallback: never return error to break user experience
    if (wantUpvote) {
      syncApiPost('products', 'increment_upvote', { id: productId });
      return { status: 'added' };
    } else {
      syncApiPost('products', 'decrement_upvote', { id: productId });
      return { status: 'removed' };
    }
  }
}

export async function recordProductUpvoteInDB(userId: string, productId: string, isUpvoted: boolean): Promise<boolean> {
  if (!supabase || !userId || !productId) return true;
  try {
    if (isUpvoted) {
      const { error } = await supabase
        .from('product_upvotes')
        .insert([{ user_id: userId, product_id: productId }]);
      if (error && error.code !== '23505') {
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
    // 1. Resolve all possible identifiers (UUID, app-..., slug)
    const allIds = [productId];
    try {
      const { data } = await supabase
        .from('products')
        .select('id, slug')
        .or(`id.eq.${productId},slug.eq.${productId}`)
        .limit(1);
      if (Array.isArray(data) && data[0]) {
        if (data[0].id) allIds.push(data[0].id);
        if (data[0].slug) allIds.push(data[0].slug);
      }
    } catch {}

    const uniqueIds = Array.from(new Set(allIds.filter(Boolean)));

    // 2. Delete associated child records first to prevent foreign key errors
    await supabase.from('product_upvotes').delete().in('product_id', uniqueIds);
    await supabase.from('feedbacks').delete().in('product_id', uniqueIds);

    // 3. Delete the product itself from DB
    const { error } = await supabase.from('products').delete().in('id', uniqueIds);
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

export async function updateCommunityPostLikesInDB(postId: string, delta: number): Promise<boolean> {
  syncApiPost('community', delta > 0 ? 'increment_likes' : 'decrement_likes', { id: postId });

  if (!supabase) return true;
  try {
    const { data } = await supabase.from('community_posts').select('likes').eq('id', postId).single();
    if (data) {
      const nextLikes = Math.max(0, (data.likes || 0) + delta);
      await supabase.from('community_posts').update({ likes: nextLikes }).eq('id', postId);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('updateCommunityPostLikes warning:', err);
    return false;
  }
}

// ==========================================
// 6. Direct Messages (1:1 실제 사람 간 실시간 대화 - 당사자만 열람 보장)
// ==========================================
export async function fetchDirectMessagesFromDB(
  userId: string,
  userEmail?: string
): Promise<DirectMessage[]> {
  const cleanId = userId?.trim();
  const cleanEmail = userEmail?.trim().toLowerCase();

  // 엄격한 당사자 프라이버시 보호: 로그인 사용자 정보가 없으면 빈 배열 반환
  if (!cleanId && !cleanEmail) return [];

  if (supabase) {
    try {
      const orConditions: string[] = [];
      if (cleanId) {
        orConditions.push(`sender_id.eq.${cleanId}`, `receiver_id.eq.${cleanId}`);
      }
      if (cleanEmail && cleanEmail !== cleanId) {
        orConditions.push(`sender_id.eq.${cleanEmail}`, `receiver_id.eq.${cleanEmail}`);
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(orConditions.join(','))
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data
          .filter((row: any) => row.sender_id !== 'SYSTEM_AUTH' && row.sender_id !== 'DELETED')
          .map((row: any) => {
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

            const isMine =
              (cleanId && row.sender_id === cleanId) ||
              (cleanEmail && (row.sender_id || '').toLowerCase() === cleanEmail);

            return {
              id: row.id,
              senderId: row.sender_id,
              receiverId: row.receiver_id,
              text: row.text,
              timestamp: timestamp,
              isMine: Boolean(isMine),
              read: Boolean(row.read),
            };
          });
      } else if (error) {
        console.warn('Supabase fetchDirectMessages warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetchDirectMessages error:', err);
    }
  }

  // Multi-browser fallback sync API with strict requester isolation
  try {
    const params = new URLSearchParams();
    if (cleanId) params.append('userId', cleanId);
    if (cleanEmail) params.append('email', cleanEmail);
    const res = await fetch(`/api/sync?table=messages&${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data.map((m: any) => ({
          ...m,
          isMine:
            (cleanId && m.senderId === cleanId) ||
            (cleanEmail && (m.senderId || '').toLowerCase() === cleanEmail),
        }));
      }
    }
  } catch {}

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

// ==========================================
// 7. Notifications (원격 알림 & 플랫폼 활동 피드)
// ==========================================
export async function fetchNotificationsFromDB(
  userId?: string,
  userEmail?: string
): Promise<AppNotification[]> {
  const cleanId = userId?.trim();
  const cleanEmail = userEmail?.trim().toLowerCase();

  let supaNotifs: AppNotification[] | null = null;

  if (supabase) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

      // If user is logged in, fetch notifications targeted at them OR global platform activities
      if (cleanId || cleanEmail) {
        const orConditions = ['user_id.is.null', 'user_id.eq.ALL'];
        if (cleanId) orConditions.push(`user_id.eq.${cleanId}`);
        if (cleanEmail && cleanEmail !== cleanId) orConditions.push(`user_id.eq.${cleanEmail}`);
        query = query.or(orConditions.join(','));
      } else {
        query = query.or('user_id.is.null,user_id.eq.ALL');
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        supaNotifs = data.map((row: any) => {
          let timeAgo = '방금 전';
          if (row.created_at) {
            const d = new Date(row.created_at);
            const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
            if (diffMin < 1) timeAgo = '방금 전';
            else if (diffMin < 60) timeAgo = `${diffMin}분 전`;
            else if (diffMin < 1440) timeAgo = `${Math.floor(diffMin / 60)}시간 전`;
            else timeAgo = `${Math.floor(diffMin / 1440)}일 전`;
          }

          return {
            id: row.id,
            type: (row.type as any) || 'system',
            title: row.title,
            message: row.message,
            createdAt: timeAgo,
            read: Boolean(row.read),
            userId: row.user_id,
            senderName: row.sender_name,
            senderAvatar: row.sender_avatar,
            productId: row.product_id,
            productTitle: row.product_title,
            builderId: row.builder_id,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase fetchNotifications error:', err);
    }
  }

  if (supaNotifs && supaNotifs.length > 0) {
    return supaNotifs;
  }

  // Fallback to /api/sync
  try {
    const params = new URLSearchParams();
    if (cleanId) params.append('userId', cleanId);
    if (cleanEmail) params.append('email', cleanEmail);
    const res = await fetch(`/api/sync?table=notifications&${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch {}

  return supaNotifs || [];
}

export async function insertNotificationToDB(notif: AppNotification): Promise<boolean> {
  syncApiPost('notifications', 'insert', notif);

  if (!supabase) return true;

  try {
    const { error } = await supabase.from('notifications').insert([
      {
        id: notif.id,
        user_id: notif.userId || null,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: Boolean(notif.read),
        sender_name: notif.senderName || null,
        sender_avatar: notif.senderAvatar || null,
        product_id: notif.productId || null,
        product_title: notif.productTitle || null,
        builder_id: notif.builderId || null,
        created_at: new Date().toISOString(),
      },
    ]);
    return !error;
  } catch (err) {
    console.warn('insertNotificationToDB error:', err);
    return false;
  }
}

export async function markNotificationAsReadInDB(notifId: string): Promise<boolean> {
  syncApiPost('notifications', 'mark_read', { id: notifId });

  if (!supabase || !notifId) return true;
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId);
    return !error;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsReadInDB(
  userId?: string,
  userEmail?: string
): Promise<boolean> {
  syncApiPost('notifications', 'mark_all_read', { userId, email: userEmail });

  if (!supabase) return true;
  try {
    const cleanId = userId?.trim();
    const cleanEmail = userEmail?.trim().toLowerCase();
    let query = supabase.from('notifications').update({ read: true });

    if (cleanId || cleanEmail) {
      const orConditions = ['user_id.is.null', 'user_id.eq.ALL'];
      if (cleanId) orConditions.push(`user_id.eq.${cleanId}`);
      if (cleanEmail) orConditions.push(`user_id.eq.${cleanEmail}`);
      query = query.or(orConditions.join(','));
    } else {
      query = query.or('user_id.is.null,user_id.eq.ALL');
    }

    const { error } = await query;
    return !error;
  } catch {
    return false;
  }
}

export async function deleteNotificationFromDB(notifId: string): Promise<boolean> {
  syncApiPost('notifications', 'delete', { id: notifId });

  if (!supabase || !notifId) return true;
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', notifId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 8. Centralized Account Credential Sync & Remote Verification
// ==========================================
export interface AuthResult {
  success: boolean;
  error?: 'WRONG_PASSWORD' | 'NOT_FOUND' | 'ALREADY_EXISTS' | 'ERROR';
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: string;
  };
}

export async function verifyAccountInDB(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'NOT_FOUND', message: '이메일 주소를 입력해주세요.' };
  }

  // 1. Check Supabase centralized auth record
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('sender_id', 'SYSTEM_AUTH')
        .eq('receiver_id', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        try {
          const cred = JSON.parse(data[0].text);
          if (cred && cred.password) {
            if (cred.password !== password) {
              return {
                success: false,
                error: 'WRONG_PASSWORD',
                message: '비밀번호가 일치하지 않습니다. 해당 계정에 설정하셨던 실제 비밀번호를 다시 확인해주세요.',
              };
            }
            return {
              success: true,
              user: {
                id: cred.id || 'builder-' + Date.now(),
                email: cleanEmail,
                name: cred.name || cleanEmail.split('@')[0],
                avatar: cred.avatar || '/demon-mascot.png',
                role: cred.role || '인디 메이커',
              },
            };
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Supabase verify account warning:', err);
    }
  }

  // 2. Multi-browser API Sync backend (/api/sync)
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'accounts',
        action: 'verify',
        data: { email: cleanEmail, password },
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.user) {
        return { success: true, user: json.user };
      }
      if (json.wrongPassword) {
        return {
          success: false,
          error: 'WRONG_PASSWORD',
          message: '비밀번호가 일치하지 않습니다. 해당 계정에 설정하셨던 실제 비밀번호를 다시 확인해주세요.',
        };
      }
      if (json.notFound) {
        // Fall through to local cache before giving up
      }
    }
  } catch {}

  // 3. Fallback to browser local cache
  try {
    const saved = localStorage.getItem('demon_registered_accounts');
    if (saved) {
      const accounts = JSON.parse(saved);
      if (accounts[cleanEmail]) {
        if (accounts[cleanEmail].password !== password) {
          return {
            success: false,
            error: 'WRONG_PASSWORD',
            message: '비밀번호가 일치하지 않습니다. 해당 계정에 설정하셨던 실제 비밀번호를 다시 확인해주세요.',
          };
        }
        return { success: true, user: accounts[cleanEmail] };
      }
    }
  } catch {}

  return {
    success: false,
    error: 'NOT_FOUND',
    message: '등록되지 않은 이메일 계정입니다. [회원가입] 탭에서 먼저 비밀번호를 설정해주세요.',
  };
}

export async function registerAccountInDB(
  email: string,
  password: string,
  name?: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const userName = name?.trim() || cleanEmail.split('@')[0];

  // 1. Check if already exists in Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('id, text')
        .eq('sender_id', 'SYSTEM_AUTH')
        .eq('receiver_id', cleanEmail)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          success: false,
          error: 'ALREADY_EXISTS',
          message: '이미 가입된 이메일 계정입니다. 로그인 탭에서 설정하셨던 비밀번호로 로그인해주세요.',
        };
      }
    } catch {}
  }

  // 2. Check if already exists in /api/sync
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'accounts',
        action: 'get',
        data: { email: cleanEmail },
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.exists) {
        return {
          success: false,
          error: 'ALREADY_EXISTS',
          message: '이미 가입된 이메일 계정입니다. 로그인 탭에서 설정하셨던 비밀번호로 로그인해주세요.',
        };
      }
    }
  } catch {}

  const newUser = {
    id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    email: cleanEmail,
    name: userName,
    avatar: '/demon-mascot.png',
    role: '인디 메이커',
  };

  // 3. Persist credential to Supabase
  if (supabase) {
    try {
      await supabase.from('direct_messages').insert([
        {
          id: 'auth_cred_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          sender_id: 'SYSTEM_AUTH',
          receiver_id: cleanEmail,
          text: JSON.stringify({
            id: newUser.id,
            email: cleanEmail,
            password,
            name: newUser.name,
            avatar: newUser.avatar,
            role: newUser.role,
          }),
          timestamp: 'auth',
        },
      ]);
    } catch (err) {
      console.warn('Supabase store credential warning:', err);
    }

    // Also register profile in builders table
    try {
      await upsertBuilderToDB({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: 'demonst 사이드 프로젝트 메이커입니다.',
        avatar: newUser.avatar,
        buildingApp: '',
        tags: ['개발자', 'SaaS', 'AI'],
        followersCount: 0,
        followingCount: 0,
      });
    } catch {}
  }

  // 4. Persist to /api/sync
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'accounts',
        action: 'register',
        data: {
          id: newUser.id,
          email: cleanEmail,
          password,
          name: newUser.name,
          avatar: newUser.avatar,
          role: newUser.role,
        },
      }),
    });
  } catch {}

  // 5. Update localStorage
  try {
    const saved = localStorage.getItem('demon_registered_accounts');
    const accounts = saved ? JSON.parse(saved) : {};
    accounts[cleanEmail] = {
      ...newUser,
      password,
    };
    localStorage.setItem('demon_registered_accounts', JSON.stringify(accounts));
  } catch {}

  return {
    success: true,
    user: newUser,
  };
}
