-- ═══════════════════════════════════════════════════════════
--  학생회(YB) 게시판·갤러리를 정회원 전용으로 잠급니다.
--
--   YB 글        정회원(member)과 운영진만 봅니다.
--   YB 갤러리    정회원과 운영진만 봅니다.
--
--   예외 ①  장학·연구지원 (scholarship)  준회원까지 봅니다.
--   예외 ②  수험생 게시판 (exam)         누구나 봅니다. 로그인 없이도 보입니다.
--                                        준회원도 글·댓글을 씁니다.
--
--   그리고  구인·채용(jobs) 을 Guest 가 보지 못하게 합니다.
--           ※ 구인·채용은 OB/YB 공용이라, 이 한 줄로 동문회 쪽에서도 막힙니다.
--
--   한눈에 (YB 기준)
--                      보기                        쓰기
--     정회원           모두                        모두
--     준회원           장학·연구지원 · 수험생      수험생
--     Guest            수험생                      수험생
--     비로그인         수험생                      없음
--
--   먼저 실행되어 있어야 합니다
--     auth/org_wall.sql          (my_side 함수)
--     auth/grade_associate.sql   (is_member · is_associate 함수)
--
--   ⚠ 이 파일은 org_wall.sql · org_wall_shared.sql · guest_rules.sql 의 규칙을 다시 씁니다.
--     (그 파일들의 뜻은 모두 여기에 담겨 있습니다)
--     나중에 그 파일들을 다시 실행하시면 이 파일도 다시 실행하셔야 합니다.
--
--   실행 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
--   ※ 여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════


-- ── ① 정회원인가 (준회원 제외) ──
create or replace function public.is_full_member()
returns boolean language sql stable security definer set search_path = public as
$$
  select coalesce((select coalesce(is_admin, false)
                          or coalesce(grade, '') in ('member', 'admin')
                     from public.profiles where id = auth.uid()), false)
$$;
grant execute on function public.is_full_member() to anon, authenticated;


-- ── ② 열어 둘 게시판 (여기만 고치면 전부 따라옵니다) ──
create or replace function public.yb_open_cats()        -- 누구나
returns text[] language sql immutable as $$ select array['exam'] $$;
grant execute on function public.yb_open_cats() to anon, authenticated;

create or replace function public.yb_associate_cats()   -- 준회원까지
returns text[] language sql immutable as $$ select array['scholarship'] $$;
grant execute on function public.yb_associate_cats() to anon, authenticated;


-- ── ③ Guest 가 보는 게시판에서 구인·채용을 뺍니다 ──
create or replace function public.guest_cats()
returns text[] language sql immutable as $$ select array['forum', 'exam'] $$;
grant execute on function public.guest_cats() to anon, authenticated;


-- ── ④ 읽기 바탕 규칙 — 수험생 게시판을 누구에게나 엽니다 ──
--    덧대는 규칙(restrictive)은 빼기만 하므로, 여는 것은 여기서 합니다.
--
--    ⚠ 이 규칙은 auth/org_wall_shared.sql (2026-09-17) 과 같은 이름입니다.
--       그 파일의 내용(함께 쓰는 게시판 다섯 곳 · 제 글은 늘 보기)을 여기에 모두 담았으므로
--       이 파일을 돌리면 두 파일의 뜻이 모두 살아 있습니다.
--       반대로 org_wall_shared.sql 만 다시 돌리면 수험생 게시판 공개가 사라지니,
--       그 뒤에는 이 파일을 한 번 더 돌려 주세요.
drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select
  using (
    visibility = 'public'
    or (coalesce(posts.org, 'OB') = 'YB' and category = any(public.yb_open_cats()))   -- 수험생 게시판 : 누구나
    or public.is_admin()
    or author_id = auth.uid()                                                          -- 제 글은 늘 봅니다
    or (
      public.is_approved()
      and (
        category in ('mentoring', 'jobs', 'major', 'career', 'counsel')               -- 함께 쓰는 게시판(OB/YB)
        or case when coalesce(posts.org, 'OB') = 'YB' then 'YB' else 'OB' end = public.my_side()
      )
      and (category <> 'free' or public.is_member())                                  -- 자유게시판은 준회원 이상
    )
  );


-- ── ⑤ YB 담장 — 정회원이 아니면 YB 글이 보이지 않습니다 ──
drop policy if exists "yb member only read" on public.posts;
create policy "yb member only read" on public.posts as restrictive for select
  using (
    coalesce(posts.org, 'OB') <> 'YB'
    or public.is_admin()
    or category = any(public.yb_open_cats())
    or (category = any(public.yb_associate_cats()) and public.is_member())
    or public.is_full_member()
  );


-- ── ⑥ 준회원 글쓰기 — 수험생 게시판만 열어 줍니다 ──
drop policy if exists "associate no write" on public.posts;
create policy "associate no write" on public.posts as restrictive for insert
  with check (not public.is_associate() or category = any(public.yb_open_cats()));

drop policy if exists "associate no edit" on public.posts;
create policy "associate no edit" on public.posts as restrictive for update
  using      (not public.is_associate() or category = any(public.yb_open_cats()))
  with check (not public.is_associate() or category = any(public.yb_open_cats()));

drop policy if exists "associate no comment" on public.comments;
create policy "associate no comment" on public.comments as restrictive for insert
  with check (
    not public.is_associate()
    or exists (select 1 from public.posts p
                where p.id = comments.post_id
                  and p.category = any(public.yb_open_cats()))
  );


-- ── ⑦ 갤러리 — YB 갤러리는 정회원만 봅니다 ──
--    OB 갤러리는 지금 규칙 그대로입니다.
--
--    ⚠ 갤러리에는 바탕 규칙이 여럿 있습니다.
--       org_wall.sql        → "read gallery photos" / "read gallery albums"
--       gallery_member_only.sql → "gallery_photos_select" / "gallery_albums_select"
--       바탕 규칙은 OR 로 합쳐져서, 하나라도 통과시키면 보입니다.
--       그래서 여기서는 반드시 「덧대기(restrictive)」 로 얹습니다.
drop policy if exists "yb gallery photos member only" on public.gallery_photos;
create policy "yb gallery photos member only" on public.gallery_photos as restrictive for select
  using (
    coalesce(gallery_photos.org, 'OB') <> 'YB'
    or public.is_admin()
    or public.is_full_member()
  );

drop policy if exists "yb gallery albums member only" on public.gallery_albums;
create policy "yb gallery albums member only" on public.gallery_albums as restrictive for select
  using (
    coalesce(gallery_albums.org, 'OB') <> 'YB'
    or public.is_admin()
    or public.is_full_member()
  );


-- ── ⑧ 확인 ──

-- (1) 지금 걸려 있는 규칙
select polrelid::regclass::text as "표",
       polname                  as "규칙",
       case polcmd when 'r' then '보기' when 'a' then '쓰기'
                   when 'w' then '고치기' when 'd' then '지우기' else polcmd::text end as "무엇에",
       case when polpermissive then '바탕' else '덧대기' end as "종류"
  from pg_policy
 where polrelid in ('public.posts'::regclass, 'public.comments'::regclass,
                    'public.gallery_photos'::regclass, 'public.gallery_albums'::regclass)
 order by 1, 2;

-- (2) 열어 둔 게시판
select unnest(public.yb_open_cats())       as "누구나 보는 YB 게시판";
select unnest(public.yb_associate_cats())  as "준회원까지 보는 YB 게시판";
select unnest(public.guest_cats())         as "Guest 가 보는 게시판";

-- (3) ⚠ 아직 새는 글 — 여기 숫자가 0 이 아니면 ⑨ 를 보십시오
select category as "갈래", coalesce(org,'(없음)') as "소속", count(*) as "공개글"
  from public.posts
 where visibility = 'public'
 group by category, org
 order by count(*) desc;


-- ── ⑨ (필요할 때만) 공개글을 회원 전용으로 되돌리기 ──
--    visibility = 'public' 인 글은 위 규칙들보다 먼저 통과해서 누구에게나 보입니다.
--    ⑧-(3) 에 YB 글이 남아 있으면 아래 한 줄을 실행하십시오.
--    ※ 수험생 게시판은 열어 두어야 하므로 제외합니다.
--    ※ 되돌릴 수 없으니 ⑧-(3) 결과를 먼저 확인하고 실행하십시오.
--
-- update public.posts
--    set visibility = 'members'
--  where coalesce(org,'OB') = 'YB'
--    and visibility = 'public'
--    and category <> 'exam';
