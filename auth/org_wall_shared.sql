-- ═══════════════════════════════════════════════════════════
--  소속 담장 ③ — 함께 쓰는 게시판(OB/YB)은 담장을 넘습니다
--
--  auth/org_wall.sql 의 읽기 규칙은 「제 쪽(OB/YB) 글만」 입니다.
--  그런데 멘토멘티 · 구인채용 · 전공별모임 · 진학/취업 후기 · 진로상담은
--  두 단체가 함께 쓰는 게시판입니다. 졸업생이 재학생 후기를 못 읽고,
--  재학생이 졸업생 후기를 못 읽으면 함께 쓰는 뜻이 없습니다.
--
--  이 파일은 그 다섯 게시판만 양쪽에 엽니다. 나머지 담장은 그대로입니다.
--
--  실행 : Supabase → SQL Editor → 붙여넣기 → Run   (여러 번 돌려도 됩니다)
-- ═══════════════════════════════════════════════════════════

drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select
  using (
    visibility = 'public'
    or public.is_admin()
    or author_id = auth.uid()                                   -- 제 글은 늘 봅니다
    or (
      public.is_approved()
      and (
        category in ('mentoring', 'jobs', 'major', 'career', 'counsel')   -- 함께 쓰는 게시판
        or case when coalesce(posts.org, 'OB') = 'YB' then 'YB' else 'OB' end
             = public.my_side()
      )
      and (category <> 'free' or public.is_member())          -- 자유게시판은 회원 이상만
    )
  );

-- 확인 — 규칙 하나가 나오면 됩니다
select policyname as "규칙", qual as "조건"
  from pg_policies where tablename = 'posts' and cmd = 'SELECT';
