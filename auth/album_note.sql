-- =========================================================
--  앨범에 「설명」을 적을 수 있게 합니다.
--
--   앨범을 만든 분(사진을 올린 분)과 운영진이,
--   그 행사가 어떤 자리였는지 몇 줄로 적어 둘 수 있습니다.
--   앨범을 열면 제목 아래에 그 글이 보입니다.
--
--   실행 : Supabase 대시보드 -> SQL Editor -> 붙여넣기 -> Run
--   ※ 여러 번 실행해도 안전합니다.
-- =========================================================

-- ── ① 설명 칸 ──
alter table public.gallery_albums add column if not exists note text;

comment on column public.gallery_albums.note is
  '앨범 설명 — 만든 분과 운영진이 적습니다';


-- ── ② 만든 분도 제 앨범을 고칠 수 있게 ──
--    지금까지는 운영진만 고칠 수 있었습니다.
drop policy if exists "own album edit" on public.gallery_albums;
create policy "own album edit" on public.gallery_albums for update
  using      (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());


-- ── ③ 확인 ──
select album_key as "앨범", title as "제목",
       coalesce(note, '(설명 없음)') as "설명"
  from public.gallery_albums
 where org = 'OB'
 order by event_date desc nulls last
 limit 20;
