-- ═══════════════════════════════════════════════════════════
--  승인·등급을 「누가 · 언제」 바꿨는지 남깁니다. (총동문회·학생회 공통)
--
--   지금까지는 회원을 승인하거나 등급을 올려도 누가 했는지 남지 않았습니다.
--   이제 profiles 가 바뀔 때마다 트리거가 자동으로 적습니다.
--   화면(회원 관리)에서 개별로 누르든, 일괄로 하든, set_admin 을 쓰든 모두 남습니다.
--
--   ① profiles 에 칸 넷
--        approved_by · approved_at    승인/취소를 누가 · 언제
--        grade_set_by · grade_set_at  등급을 누가 · 언제
--      → 회원 관리 표에 「홍길동 · 09-18」 로 보입니다.
--
--   ② profile_grade_log 표
--        바뀔 때마다 한 줄씩 쌓입니다. (누가 · 언제 · 무엇을 · 무엇에서 → 무엇으로)
--      → 운영진만 봅니다. 아무도 직접 고치거나 지우지 못합니다.
--
--   ※ 본인이 「내 정보」를 고쳐도 이 칸들은 건드리지 못합니다 (트리거가 되돌립니다).
--   ※ SQL Editor 에서 직접 바꾼 것은 「누가」 가 비어 있습니다 (로그인이 없으므로).
--   ※ 지나간 일은 되살릴 수 없습니다. 오늘부터 쌓입니다.
--
--   실행 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
--   ※ 여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════


-- ── ① profiles 에 칸 넷 ──
alter table public.profiles add column if not exists approved_by  uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists approved_at  timestamptz;
alter table public.profiles add column if not exists grade_set_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists grade_set_at timestamptz;


-- ── ② 기록표 ──
create table if not exists public.profile_grade_log (
  id          bigserial primary key,
  profile_id  uuid        not null,
  changed_by  uuid,                          -- 바꾼 운영진 (SQL 로 바꾸면 비어 있음)
  changed_at  timestamptz not null default now(),
  field       text        not null check (field in ('approved', 'grade')),
  old_value   text,
  new_value   text
);

create index if not exists profile_grade_log_profile_idx on public.profile_grade_log (profile_id, changed_at desc);

alter table public.profile_grade_log enable row level security;

-- 운영진만 봅니다. 쓰기·고치기·지우기 규칙은 아예 두지 않습니다 (트리거만 씁니다).
drop policy if exists "log read admin" on public.profile_grade_log;
create policy "log read admin" on public.profile_grade_log for select
  using (public.is_admin());


-- ── ③ 트리거 함수 ──
--    security definer : 기록표에 쓰기 규칙이 없어도 트리거는 적을 수 있게.
--    auth.uid()       : 그래도 「누가」 는 실제로 누른 사람입니다.
create or replace function public.profiles_stamp_grade()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  who uuid := auth.uid();
begin
  -- 승인 여부가 바뀌었나
  if new.approved is distinct from old.approved then
    new.approved_by := who;
    new.approved_at := now();
    insert into public.profile_grade_log (profile_id, changed_by, field, old_value, new_value)
    values (new.id, who, 'approved', old.approved::text, new.approved::text);
  else
    -- 안 바뀌었으면 누가 손대도 원래 값으로 되돌립니다 (본인이 못 고치게)
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
  end if;

  -- 등급이 바뀌었나
  if new.grade is distinct from old.grade then
    new.grade_set_by := who;
    new.grade_set_at := now();
    insert into public.profile_grade_log (profile_id, changed_by, field, old_value, new_value)
    values (new.id, who, 'grade', old.grade, new.grade);
  else
    new.grade_set_by := old.grade_set_by;
    new.grade_set_at := old.grade_set_at;
  end if;

  return new;
end
$$;

drop trigger if exists profiles_stamp_grade on public.profiles;
create trigger profiles_stamp_grade
  before update on public.profiles
  for each row execute function public.profiles_stamp_grade();


-- ── ④ 확인 ──

-- 트리거가 걸렸는지
select tgname as "트리거", tgenabled as "켜짐"
  from pg_trigger
 where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_stamp_grade';

-- 최근 기록 20건 (지금은 비어 있는 게 정상입니다)
select l.changed_at  as "언제",
       a.name        as "누가",
       p.name        as "회원",
       l.field       as "무엇을",
       l.old_value   as "전",
       l.new_value   as "후"
  from public.profile_grade_log l
  left join public.profiles p on p.id = l.profile_id
  left join public.profiles a on a.id = l.changed_by
 order by l.changed_at desc
 limit 20;
