-- ═══════════════════════════════════════════════════════════
-- 회원 정보에 「직군」 칸을 더합니다  (u-tokyo.kr 의 Supabase — skyish 프로젝트가 아닙니다)
--
--   실행 방법 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
--   한 번만 하시면 되고, 두 번 눌러도 탈이 없습니다.
--   OB · YB 가 한 자료방을 함께 쓰므로 이 한 번으로 양쪽 다 됩니다.
--
--   직군은 직장명·직급을 보고 화면이 짐작하되(교수·연구 / 공무원·공공기관 / 기업 / 전문직·자영 /
--   학생·대학원 / 기타), 운영진이 회원 관리에서 골라 두면 그것이 우선합니다. 이 칸은 그 손댄 값입니다.
-- ═══════════════════════════════════════════════════════════

alter table public.profiles add column if not exists job_group text;   -- 직군 (운영진이 고른 것, 비면 짐작)

-- 잘 되었는지 눈으로 확인
select column_name as "새로 생긴 칸"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles' and column_name = 'job_group';

-- → job_group 한 줄이 나오면 끝입니다. 회원 관리 화면을 새로고침(Ctrl+Shift+R)하세요.
