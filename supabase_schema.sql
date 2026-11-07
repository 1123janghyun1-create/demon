-- ========================================================
-- demonst (demonst.vercel.app) Supabase Database Schema
-- Supabase 대시보드 -> SQL Editor에 붙여넣고 "Run" 버튼을 누르세요.
-- ========================================================

-- 1. products 테이블 (등록된 사이드 프로젝트/앱)
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  title text not null,
  tagline text not null,
  category text not null default '생산성 / SaaS',
  icon text not null default 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  screenshot text,
  feedback_count integer default 0,
  url text not null,
  author text not null default '익명 메이커',
  instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. feedbacks 테이블 (앱 테스트 피드백)
create table if not exists public.feedbacks (
  id text primary key,
  product_id text references public.products(id) on delete cascade,
  author text not null,
  avatar text,
  rating integer default 5,
  content text not null,
  device_info text default 'Windows Chrome',
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
  tags text[] default array['개발자', 'SaaS']::text[],
  followers_count integer default 0,
  following_count integer default 0,
  website text,
  github text,
  twitter text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. community_posts 테이블 (커뮤니티 게시글)
create table if not exists public.community_posts (
  id text primary key,
  author text not null,
  avatar text,
  tag text default '런치',
  title text not null,
  content text not null,
  likes integer default 0,
  comments integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- RLS (Row Level Security) 설정: 누구나 조회 및 등록 가능하도록 개방
-- ========================================================
alter table public.products enable row level security;
alter table public.feedbacks enable row level security;
alter table public.builders enable row level security;
alter table public.community_posts enable row level security;

-- Products RLS Policy
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow insert products" on public.products for insert with check (true);
create policy "Allow update products" on public.products for update using (true);
create policy "Allow delete products" on public.products for delete using (true);

-- Feedbacks RLS Policy
create policy "Allow public read feedbacks" on public.feedbacks for select using (true);
create policy "Allow insert feedbacks" on public.feedbacks for insert with check (true);

-- Builders RLS Policy
create policy "Allow public read builders" on public.builders for select using (true);
create policy "Allow upsert builders" on public.builders for all using (true) with check (true);

-- Community Posts RLS Policy
create policy "Allow public read community_posts" on public.community_posts for select using (true);
create policy "Allow insert community_posts" on public.community_posts for insert with check (true);
create policy "Allow update community_posts" on public.community_posts for update using (true);
