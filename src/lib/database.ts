import { supabase } from './supabase';
import { Product, Feedback, Builder, CommunityPost } from '../types';

// ==========================================
// 1. Products (프로젝트)
// ==========================================
export async function fetchProductsFromDB(): Promise<Product[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchProducts warning (테이블 미생성 가능):', error.message);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      tagline: row.tagline,
      category: row.category,
      icon: row.icon,
      screenshot: row.screenshot,
      feedbackCount: row.feedback_count || 0,
      views: row.views || 0,
      upvotes: row.upvotes || 0,
      url: row.url,
      author: row.author,
      instructions: row.instructions || '',
      createdAt: new Date(row.created_at).toLocaleDateString('ko-KR'),
    }));
  } catch (err) {
    console.warn('Supabase DB error:', err);
    return null;
  }
}

export async function insertProductToDB(product: Product): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').insert([
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
        instructions: product.instructions,
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
  if (!supabase) return false;
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
      })
      .eq('id', product.id);

    if (error) {
      console.warn('Supabase updateProduct warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('updateProductInDB error:', err);
    return false;
  }
}

export async function incrementProductViewsInDB(productId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Attempt RPC increment first if created, otherwise fallback to fetch & update
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
  if (!supabase) return false;
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
  if (!supabase) return false;
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

export async function deleteProductFromDB(productId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Supabase deleteProduct warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteProductFromDB error:', err);
    return false;
  }
}

// ==========================================
// 2. Feedbacks (피드백)
// ==========================================
export async function fetchFeedbacksFromDB(): Promise<Record<string, Feedback[]> | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;

    const map: Record<string, Feedback[]> = {};
    (data || []).forEach((row: any) => {
      const fb: Feedback = {
        id: row.id,
        productId: row.product_id,
        author: row.author,
        avatar: row.avatar,
        rating: row.rating,
        content: row.content,
        deviceInfo: row.device_info,
        screenshot: row.screenshot,
        createdAt: new Date(row.created_at).toLocaleDateString('ko-KR'),
      };
      if (!map[row.product_id]) map[row.product_id] = [];
      map[row.product_id].push(fb);
    });

    return map;
  } catch {
    return null;
  }
}

export async function insertFeedbackToDB(feedback: Feedback): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('feedbacks').insert([
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

    return !error;
  } catch {
    return false;
  }
}

export async function deleteFeedbackFromDB(feedbackId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('feedbacks').delete().eq('id', feedbackId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 3. Builders (빌더 프로필)
// ==========================================
export async function fetchBuildersFromDB(): Promise<Builder[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('builders')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return null;

    return (data || []).map((row: any) => ({
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
  } catch {
    return null;
  }
}

export async function upsertBuilderToDB(builder: Builder): Promise<boolean> {
  if (!supabase) return false;
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
    return false;
  }
}

// ==========================================
// 4. Community Posts (커뮤니티)
// ==========================================
export async function fetchCommunityPostsFromDB(): Promise<CommunityPost[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;

    return (data || []).map((row: any) => ({
      id: row.id,
      author: row.author,
      avatar: row.avatar,
      tag: row.tag as any,
      title: row.title,
      content: row.content,
      likes: row.likes || 0,
      comments: row.comments || 0,
      timeAgo: new Date(row.created_at).toLocaleDateString('ko-KR'),
    }));
  } catch {
    return null;
  }
}

export async function insertCommunityPostToDB(post: CommunityPost): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('community_posts').insert([
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
    return false;
  }
}

export async function deleteCommunityPostFromDB(postId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    return !error;
  } catch {
    return false;
  }
}
