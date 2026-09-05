-- ─────────────────────────────────────────────────────────────
--  앨범 사진의 얼굴에 이름 달기 — 재한 도쿄대학 총동문회
--  (u-tokyo.kr · ojnukcciozchnsycxtfq) — OB · YB 공용
--
--  Supabase → SQL Editor 에 통째로 붙여넣고 한 번 실행하세요.
--  여러 번 돌려도 탈이 없습니다.
--
--  ■ 하는 일
--    앨범 사진 위 네모 자리와 그 자리에 있는 사람의 이름을 담습니다.
--    · 이름을 다는 것 — 운영진만
--    · 이름을 보는 것 — 승인된 회원 모두 (제 소속 것만)
--
--  ■ 잘린 얼굴 그림을 따로 저장하지 않습니다
--    원본 사진과 네모 자리(0~1 비율)만 둡니다.
--    회원 명단에서는 그 자리를 화면에서 잘라 보입니다.
--    그래서 사진이 두 벌로 늘지 않고, 이름을 고치면 어디서나 함께 바뀝니다.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.photo_faces (
  id          uuid primary key default gen_random_uuid(),
  -- 어느 사진인가. 사진이 지워지면 얼굴도 함께 사라집니다.
  photo_id    uuid not null references public.gallery_photos(id) on delete cascade,
  -- 적어 둔 이름. profiles 는 남의 줄이 안 보이므로 이름을 그대로 적어 둡니다
  -- (gallery_photos.owner_name 과 같은 까닭입니다).
  name        text not null,
  -- 짝지어진 회원. 못 찾았으면 비어 있습니다 — 이름만으로도 쓸모가 있습니다.
  profile_id  uuid references public.profiles(id) on delete set null,
  -- 네모 자리 — 원본 그림에 대한 0~1 비율 {x,y,w,h}
  box         jsonb not null,
  -- 소속 담장 (사진의 org 를 그대로 물려받습니다)
  org         text not null check (org in ('OB','YB')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index if not exists photo_faces_photo_idx   on public.photo_faces(photo_id);
create index if not exists photo_faces_profile_idx on public.photo_faces(profile_id);
create index if not exists photo_faces_org_idx     on public.photo_faces(org);

-- 같은 사진에 같은 사람을 두 번 달지 않게
create unique index if not exists photo_faces_one_per_person
  on public.photo_faces(photo_id, lower(btrim(name)));

alter table public.photo_faces enable row level security;

-- ── 보기 : 승인된 회원이 제 소속 것을 봅니다 (운영진은 양쪽 다) ──
drop policy if exists "faces read" on public.photo_faces;
create policy "faces read" on public.photo_faces
  for select using (
    public.is_approved()
    and (public.is_admin() or org = public.my_org())
  );

-- ── 달기·고치기·지우기 : 운영진만 ──
drop policy if exists "faces write" on public.photo_faces;
create policy "faces write" on public.photo_faces
  for all using (public.is_admin()) with check (public.is_admin());


-- ─────────────────────────────────────────────────────────────
--  이름 → 회원 짝짓기
--  profiles 는 RLS 로 남의 줄이 안 보이므로 security definer 로 넘어갑니다.
--  (public.in_roster 가 같은 문제를 같은 방법으로 풀어 두었습니다.)
--  운영진만 부를 수 있습니다 — 회원 이름을 캐는 데 쓰이지 않게.
-- ─────────────────────────────────────────────────────────────
create or replace function public.match_member(nm text, p_org text default null)
returns table (id uuid, name text, member_type text, faculty text, grad_year text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.member_type, p.faculty, p.grad_year::text
    from public.profiles p
   where public.is_admin()
     and p.approved
     and public.name_key(p.name) = public.name_key(nm)
     and (p_org is null or p.member_type = p_org)
   order by p.name
   limit 5;
$$;

revoke all on function public.match_member(text, text) from public, anon;
grant execute on function public.match_member(text, text) to authenticated;


-- ─────────────────────────────────────────────────────────────
--  회원의 얼굴 — 그 회원이 달린 가장 최근 얼굴 하나
--  회원 명단(운영진 전용)에서 씁니다.
--  잘린 그림이 아니라 「원본 주소 + 네모 자리」 를 돌려줍니다.
--  화면에서 그 자리만 잘라 보이면 됩니다.
-- ─────────────────────────────────────────────────────────────
create or replace function public.member_faces()
returns table (profile_id uuid, image_url text, box jsonb, photo_id uuid, at timestamptz)
language sql
security definer
set search_path = public
as $$
  select distinct on (f.profile_id)
         f.profile_id, g.image_url, f.box, f.photo_id, f.created_at
    from public.photo_faces f
    join public.gallery_photos g on g.id = f.photo_id
   where public.is_admin()
     and f.profile_id is not null
   order by f.profile_id, f.created_at desc;
$$;

revoke all on function public.member_faces() from public, anon;
grant execute on function public.member_faces() to authenticated;


-- ── 확인 ── (돌리면 0 줄이 나오는 게 정상입니다 — 아직 아무도 안 달았으니)
select count(*) as 달린얼굴수 from public.photo_faces;
