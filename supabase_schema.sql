-- ========================================================
-- demonst (demonst.vercel.app) Supabase Database Schema
-- Supabase 대시보드 -> SQL Editor에 붙여넣고 "Run" 버튼을 누르면
-- 모든 구글 계정과 브라우저에서 실시간으로 데이터가 완벽 동기화됩니다.
-- ========================================================

-- 1. products 테이블 (등록된 사이드 프로젝트/앱)
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  title text not null,
  tagline text not null,
  category text not null default '생산성',
  icon text not null default '/demon-mascot.png',
  screenshot text,
  feedback_count integer default 0,
  views integer default 0,
  upvotes integer default 0,
  url text not null,
  author text not null default '인디 메이커',
  author_id text,
  instructions text,
  description text,
  gallery text[],
  demo_video text,
  tags text[],
  social_links jsonb,
  additional_links jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. feedbacks 테이블 (앱 테스트 피드백)
create table if not exists public.feedbacks (
  id text primary key,
  product_id text references public.products(id) on delete cascade,
  author text not null,
  author_id text,
  avatar text,
  rating integer default 5,
  content text not null,
  device_info text default 'Web',
  screenshot text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. builders 테이블 (로그인한 메이커/빌더 프로필)
create table if not exists public.builders (
  id text primary key,
  name text not null,
  email text,
  role text default '인디 메이커',
  bio text default '새로운 가치를 만드는 메이커입니다.',
  avatar text default '/demon-mascot.png',
  building_app text,
  tags text[] default array['개발자', 'SaaS', 'AI']::text[],
  followers_count integer default 0,
  following_count integer default 0,
  website text,
  github text,
  twitter text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- Google OAuth 및 Supabase 회원가입 시 builders 테이블 자동 등록 트리거
-- ========================================================
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.builders (id, name, email, avatar, role, bio, tags, updated_at)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), '인디 빌더'),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '/demon-mascot.png'),
    '인디 메이커',
    'demonst 사이드 프로젝트 메이커입니다.',
    array['개발자', 'SaaS', 'AI'],
    now()
  )
  on conflict (id) do update
  set
    name = coalesce(excluded.name, public.builders.name),
    avatar = coalesce(excluded.avatar, public.builders.avatar),
    email = coalesce(excluded.email, public.builders.email),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 바인딩 (회원가입 또는 로그인 시 자동 실행)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_auth_user();

-- 이미 가입된 기존 회원들을 public.builders로 즉시 일괄 동기화
insert into public.builders (id, name, email, avatar, role, bio, tags, updated_at)
select
  id::text,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1), '인디 빌더'),
  email,
  coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', '/demon-mascot.png'),
  '인디 메이커',
  'demonst 사이드 프로젝트 메이커입니다.',
  array['개발자', 'SaaS', 'AI'],
  now()
from auth.users
on conflict (id) do update
set
  name = coalesce(excluded.name, public.builders.name),
  avatar = coalesce(excluded.avatar, public.builders.avatar),
  email = coalesce(excluded.email, public.builders.email),
  updated_at = now();

-- 4. community_posts 테이블 (커뮤니티 게시글)
create table if not exists public.community_posts (
  id text primary key,
  author text not null,
  author_id text,
  avatar text,
  tag text default '런치',
  title text not null,
  content text not null,
  likes integer default 0,
  comments integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. direct_messages 테이블 (1:1 DM 메시지)
create table if not exists public.direct_messages (
  id text primary key,
  sender_id text not null,
  receiver_id text not null,
  text text not null,
  timestamp text default '방금',
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. notifications 테이블 (알림)
create table if not exists public.notifications (
  id text primary key,
  user_id text,
  type text not null,
  title text not null,
  message text not null,
  read boolean default false,
  sender_name text,
  sender_avatar text,
  product_id text,
  product_title text,
  builder_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. product_upvotes 테이블 (중복 업보트 원천 차단: 유저당 프로젝트 1회 한정)
create table if not exists public.product_upvotes (
  user_id text not null,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, product_id)
);

-- ========================================================
-- RLS (Row Level Security) 설정: 모든 사용자가 조회 및 쓰기 가능하도록 개방
-- ========================================================
alter table public.products enable row level security;
alter table public.feedbacks enable row level security;
alter table public.builders enable row level security;
alter table public.community_posts enable row level security;
alter table public.direct_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.product_upvotes enable row level security;

-- Product Upvotes RLS Policy
drop policy if exists "Allow public read product_upvotes" on public.product_upvotes;
create policy "Allow public read product_upvotes" on public.product_upvotes for select using (true);
drop policy if exists "Allow insert product_upvotes" on public.product_upvotes;
create policy "Allow insert product_upvotes" on public.product_upvotes for insert with check (true);
drop policy if exists "Allow delete product_upvotes" on public.product_upvotes;
create policy "Allow delete product_upvotes" on public.product_upvotes for delete using (true);

-- Products RLS Policy
drop policy if exists "Allow public read products" on public.products;
create policy "Allow public read products" on public.products for select using (true);
drop policy if exists "Allow insert products" on public.products;
create policy "Allow insert products" on public.products for insert with check (true);
drop policy if exists "Allow update products" on public.products;
create policy "Allow update products" on public.products for update using (true);
drop policy if exists "Allow delete products" on public.products;
create policy "Allow delete products" on public.products for delete using (true);

-- Feedbacks RLS Policy
drop policy if exists "Allow public read feedbacks" on public.feedbacks;
create policy "Allow public read feedbacks" on public.feedbacks for select using (true);
drop policy if exists "Allow insert feedbacks" on public.feedbacks;
create policy "Allow insert feedbacks" on public.feedbacks for insert with check (true);
drop policy if exists "Allow delete feedbacks" on public.feedbacks;
create policy "Allow delete feedbacks" on public.feedbacks for delete using (true);

-- Builders RLS Policy
drop policy if exists "Allow public read builders" on public.builders;
create policy "Allow public read builders" on public.builders for select using (true);
drop policy if exists "Allow upsert builders" on public.builders;
create policy "Allow upsert builders" on public.builders for all using (true) with check (true);

-- Community Posts RLS Policy
drop policy if exists "Allow public read community_posts" on public.community_posts;
create policy "Allow public read community_posts" on public.community_posts for select using (true);
drop policy if exists "Allow insert community_posts" on public.community_posts;
create policy "Allow insert community_posts" on public.community_posts for insert with check (true);
drop policy if exists "Allow update community_posts" on public.community_posts;
create policy "Allow update community_posts" on public.community_posts for update using (true);
drop policy if exists "Allow delete community_posts" on public.community_posts;
create policy "Allow delete community_posts" on public.community_posts for delete using (true);

-- Direct Messages RLS Policy
drop policy if exists "Allow public read direct_messages" on public.direct_messages;
create policy "Allow public read direct_messages" on public.direct_messages for select using (true);
drop policy if exists "Allow insert direct_messages" on public.direct_messages;
create policy "Allow insert direct_messages" on public.direct_messages for insert with check (true);
drop policy if exists "Allow update direct_messages" on public.direct_messages;
create policy "Allow update direct_messages" on public.direct_messages for update using (true);

-- Notifications RLS Policy
drop policy if exists "Allow public read notifications" on public.notifications;
create policy "Allow public read notifications" on public.notifications for select using (true);
drop policy if exists "Allow insert notifications" on public.notifications;
create policy "Allow insert notifications" on public.notifications for insert with check (true);
drop policy if exists "Allow update notifications" on public.notifications;
create policy "Allow update notifications" on public.notifications for update using (true);
drop policy if exists "Allow delete notifications" on public.notifications;
create policy "Allow delete notifications" on public.notifications for delete using (true);

-- ========================================================
-- 원자적 카운트 증가를 위한 RPC 함수들
-- ========================================================
create or replace function public.increment_product_views(product_id text)
returns void as $$
begin
  update public.products
  set views = coalesce(views, 0) + 1
  where id = product_id;
end;
$$ language plpgsql;

create or replace function public.increment_product_upvotes(product_id text)
returns void as $$
begin
  update public.products
  set upvotes = coalesce(upvotes, 0) + 1
  where id = product_id;
end;
$$ language plpgsql;

create or replace function public.increment_feedback(product_id text)
returns void as $$
begin
  update public.products
  set feedback_count = coalesce(feedback_count, 0) + 1
  where id = product_id;
end;
$$ language plpgsql;

-- ========================================================
-- 실시간 변경사항 브로드캐스트 (Supabase Realtime 활성화)
-- ========================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'builders'
  ) then
    alter publication supabase_realtime add table public.builders;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feedbacks'
  ) then
    alter publication supabase_realtime add table public.feedbacks;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_posts'
  ) then
    alter publication supabase_realtime add table public.community_posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_upvotes'
  ) then
    alter publication supabase_realtime add table public.product_upvotes;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_messages'
  ) then
    alter publication supabase_realtime add table public.direct_messages;
  end if;
end $$;

-- ========================================================
-- 필수 권한 부여: anon 및 authenticated 역할에게 테이블 권한 부여
-- 비로그인 사용자 및 신규 세션이 42501 (permission denied) 에러 없이 정상 조회할 수 있도록 필수 실행!
-- ========================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on routines to anon, authenticated;

