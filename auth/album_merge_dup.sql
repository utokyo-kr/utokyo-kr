-- =========================================================
--  같은 이름으로 갈라진 앨범을 하나로 합칩니다.
--
--   지킴이가 여러 개 떠서 같은 폴더를 동시에 올리는 바람에
--   「성학도병풍」 같은 앨범이 여러 개로 갈라졌습니다.
--   (지킴이는 이제 하나만 돌도록 고쳤습니다)
--
--   가장 먼저 만들어진 것 하나만 남기고, 나머지 앨범의 사진을
--   그 앨범으로 옮긴 뒤 빈 껍데기를 지웁니다.
--   ※ 사진은 하나도 지워지지 않습니다.
--
--   【1부】를 드래그해 Run -> 무엇이 합쳐질지 보시고
--   괜찮으면 【2부】를 드래그해 Run 하십시오.
-- =========================================================


-- ═══ 【1부】 무엇이 합쳐질지 먼저 봅니다 ═══════════════

with dup as (
  select title, event_date, org, count(*) as n,
         min(album_key) as keep
    from public.gallery_albums
   where album_key like 'custom:%'
   group by title, event_date, org
  having count(*) > 1
)
select d.title as "앨범", d.event_date as "날짜",
       d.n as "갈라진 수", d.keep as "남길 것",
       (select count(*) from public.gallery_photos p
         where p.album_key in (select album_key from public.gallery_albums a
                                where a.title = d.title and a.event_date = d.event_date
                                  and a.org = d.org)) as "사진 수"
  from dup d
 order by d.event_date desc;


-- ═══ 【2부】 실제로 합칩니다 ═══════════════════════════

-- ① 사진을 남길 앨범으로 옮깁니다
with dup as (
  select title, event_date, org, min(album_key) as keep
    from public.gallery_albums
   where album_key like 'custom:%'
   group by title, event_date, org
  having count(*) > 1
)
update public.gallery_photos p
   set album_key = d.keep
  from public.gallery_albums a
  join dup d on d.title = a.title and d.event_date is not distinct from a.event_date
            and d.org is not distinct from a.org
 where p.album_key = a.album_key
   and a.album_key <> d.keep;

-- ② 사진이 하나도 없어진 앨범 껍데기를 지웁니다
delete from public.gallery_albums a
 where a.album_key like 'custom:%'
   and not exists (select 1 from public.gallery_photos p
                    where p.album_key = a.album_key);


-- ── 합친 뒤 모습 ──
select a.title as "앨범", a.event_date as "날짜",
       count(p.id) as "사진"
  from public.gallery_albums a
  left join public.gallery_photos p on p.album_key = a.album_key
 where a.org = 'OB'
 group by a.album_key, a.title, a.event_date
 order by a.event_date desc nulls last
 limit 20;
