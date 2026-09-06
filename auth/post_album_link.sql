-- =========================================================
--  게시글과 사진첩(앨범)을 이어 줍니다.
--
--   글에 「사진첩 보기」 단추가 붙어, 누르면 그 앨범으로 갑니다.
--   글쓴이와 운영진이 어느 앨범과 이을지 고릅니다.
--
--   실행 : Supabase 대시보드 -> SQL Editor -> 붙여넣기 -> Run
--   ※ 여러 번 실행해도 안전합니다.
-- =========================================================

alter table public.posts add column if not exists album_key text;
alter table public.posts add column if not exists album_cat text;

comment on column public.posts.album_key is '이어진 사진첩의 열쇠';
comment on column public.posts.album_cat is '그 사진첩의 분류 (주소를 만들 때 씁니다)';


-- ── 확인 ──
select id, left(title, 40) as "글",
       coalesce(album_key, '(이어진 사진첩 없음)') as "사진첩"
  from public.posts
 where album_key is not null
 order by created_at desc
 limit 20;
