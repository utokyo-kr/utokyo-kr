-- ═══════════════════════════════════════════════════════════
--  「이달의 동문」 을 멘토멘티의 말머리에서 떼어 독립 게시판(alumni) 으로 만듭니다.
--
--  ① "read posts" 규칙의 함께 보는 게시판 목록에 alumni 를 더합니다.
--     (그 밖에는 지금 걸려 있는 규칙과 똑같습니다 — forum_shared.sql 과 같은 본문)
--  ② 멘토멘티에 [이달의 동문] 말머리로 올라간 글을 alumni 로 옮기고,
--     제목의 말머리는 [소개] 로 바꿉니다. 글 수는 그대로입니다.
--
--  쓰기 규칙은 바꾸지 않습니다. 총동문회(OB)·학생회(YB) 정회원이 저마다 제 소속으로 쓰고,
--  양쪽 화면에 함께 보입니다 (멘토멘티와 같은 방식).
--
--  실행 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run (여러 번 돌려도 됩니다)
-- ═══════════════════════════════════════════════════════════

-- ── ① 읽기 규칙 ──
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
        category in ('mentoring', 'alumni', 'jobs', 'major', 'career', 'counsel', 'forum', 'seminar')   -- 함께 보는 게시판
        or case when coalesce(posts.org, 'OB') = 'YB' then 'YB' else 'OB' end = public.my_side()
      )
      and (category <> 'free' or public.is_member())                                  -- 자유게시판은 준회원 이상
    )
  );

-- ── ② 글 옮기기 ──
-- 먼저 몇 건이 옮겨질지 봅니다
select count(*) as "옮길 글"
  from public.posts
 where category = 'mentoring'
   and title ~ '^\s*[\[【]\s*이달의\s*동문\s*[\]】]';

update public.posts
   set category = 'alumni',
       title    = regexp_replace(title, '^\s*[\[【]\s*이달의\s*동문\s*[\]】]\s*', '[소개] ')
 where category = 'mentoring'
   and title ~ '^\s*[\[【]\s*이달의\s*동문\s*[\]】]';

-- ── 확인 ──
select policyname as "규칙", position('alumni' in qual) > 0 as "alumni 포함"
  from pg_policies where tablename = 'posts' and policyname = 'read posts';

select coalesce(org, '(없음)') as "소속", count(*) as "이달의 동문 글"
  from public.posts where category = 'alumni' group by org;
