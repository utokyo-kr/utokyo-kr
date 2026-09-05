-- =========================================================
--  보안 점검에서 찾은 구멍을 막습니다. (2026-09-06)
--
--   ① 회원이 제 등급을 스스로 올릴 수 있었습니다.
--      「내 정보」 저장 규칙이 승인·운영진 칸만 잠그고 등급(grade)은
--      풀어 두어, Guest 가 스스로 '회원' 이 되어 회원 전용 게시판과
--      회원 명부(이름·전공·연도)를 볼 수 있었습니다.
--      → 등급과 명부 대조 기록도 함께 잠급니다.
--
--   ② 소속을 스스로 바꿔 다른 단체 글을 볼 수 있었습니다.
--      member_type 을 YB->OB 로 바꾸면 담장을 넘습니다.
--      → 운영진만 바꿀 수 있게 합니다.
--        (비동문 GUEST 가 동문임을 밝히실 때는 운영진께 말씀하시면 됩니다)
--
--   ※ 전화번호·이메일은 원래부터 본인과 운영진만 봅니다. 그대로 둡니다.
--   ※ 이름·전공·연도만 나가는 회원 명부도 그대로 둡니다.
--
--   실행 : Supabase 대시보드 -> SQL Editor -> 붙여넣기 -> Run
--   ※ 여러 번 실행해도 안전합니다.
-- =========================================================


-- ── ① 내 정보 저장 — 바꿀 수 없는 칸을 늘립니다 ──
--    이름 · 전공 · 졸업연도 · 직장 · 직급 · 전화번호는 그대로 고치실 수 있습니다.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and approved    is not distinct from (select approved    from public.profiles where id = auth.uid())
    and is_admin    is not distinct from (select is_admin    from public.profiles where id = auth.uid())
    and grade       is not distinct from (select grade       from public.profiles where id = auth.uid())
    and member_type is not distinct from (select member_type from public.profiles where id = auth.uid())
    and grade_manual_at  is not distinct from (select grade_manual_at  from public.profiles where id = auth.uid())
    and grade_checked_at is not distinct from (select grade_checked_at from public.profiles where id = auth.uid())
  );


-- ── ② 확인 ──
--    아래가 비어 있어야 합니다 (스스로 올린 흔적이 없어야 합니다).
select id, name, member_type, grade, approved, is_admin
  from public.profiles
 where grade = 'member' and grade_manual_at is null and grade_checked_at is null
 order by created_at desc
 limit 20;

select coalesce(grade,'(없음)') as "등급", count(*) as "인원"
  from public.profiles group by grade order by count(*) desc;
