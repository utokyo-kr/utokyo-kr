-- ═══════════════════════════════════════════════════════════
--  총동문회(OB) 「포럼·세미나」 를 학생회(YB) 회원도 읽게 합니다.
--
--  함께 쓰는 게시판 목록에 forum · seminar 를 더한 것 말고는
--  지금 걸려 있는 "read posts" 규칙과 똑같습니다.
--  (수험생 게시판 공개 · 제 글은 늘 보기 · 자유게시판 준회원 이상 — 모두 그대로)
--
--  쓰기는 바꾸지 않습니다. 포럼·세미나 글은 지금처럼 동문회 쪽에서만 씁니다.
--
--  실행 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run (여러 번 돌려도 됩니다)
-- ═══════════════════════════════════════════════════════════

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
        category in ('mentoring', 'jobs', 'major', 'career', 'counsel', 'forum', 'seminar')   -- 함께 보는 게시판
        or case when coalesce(posts.org, 'OB') = 'YB' then 'YB' else 'OB' end = public.my_side()
      )
      and (category <> 'free' or public.is_member())                                  -- 자유게시판은 준회원 이상
    )
  );

-- 확인 — 조건에 forum 이 들어 있으면 됩니다
select policyname as "규칙", position('forum' in qual) > 0 as "포럼 포함"
  from pg_policies where tablename = 'posts' and policyname = 'read posts';
