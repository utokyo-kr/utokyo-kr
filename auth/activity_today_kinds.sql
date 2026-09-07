-- =========================================================
--  「오늘」 한 줄 — 사용통계 맨 위에 얹습니다.
--
--   오늘 로그인·방문·쪽 보기·글쓰기를 각각 몇 분이 하셨는지,
--   그리고 몇 번이었는지 한눈에 보여드립니다.
--
--   ※ 사람 수와 횟수만 나갑니다. 이름은 담기지 않습니다.
--   ※ 운영진 계정은 빼고 셉니다 (관리하느라 드나든 것은 참여가 아니므로).
--
--   실행 : Supabase 대시보드 -> SQL Editor -> 붙여넣기 -> Run
--   ※ 여러 번 실행해도 안전합니다.
-- =========================================================

drop view if exists public.activity_today;
create view public.activity_today as
select p.member_type                                                     as org,
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()))                         as today_people,
       count(*) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'view')     as today_views,
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) - interval '1 day'
           and e.at <  date_trunc('day', now()))                         as yesterday_people,
       count(distinct e.user_id) filter (
         where e.at >= now() - interval '7 days')                        as week_people,
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('month', now()))                       as month_people,
       -- 로그인
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'login')    as login_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'login'), 0)  as login_n,
       -- 방문
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'visit')    as visit_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'visit'), 0)  as visit_n,
       -- 쪽 보기
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'view')     as view_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'view'), 0)  as view_n,
       -- 글읽기
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'read')     as read_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'read'), 0)  as read_n,
       -- 댓글
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'comment')  as comment_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'comment'), 0)  as comment_n,
       -- 글쓰기
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'post')     as post_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'post'), 0)  as post_n,
       -- 사진
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'photo')    as photo_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'photo'), 0)  as photo_n,
       -- 좋아요 받음
       count(distinct e.user_id) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'liked')    as liked_people,
       coalesce(sum(e.amount) filter (
         where e.at >= date_trunc('day', now()) and e.kind = 'liked'), 0)  as liked_n
  from public.activity_events e
  join public.profiles p on p.id = e.user_id
 where p.is_admin = false
   and public.is_approved()
   and (public.is_admin() or p.member_type = public.my_org())
 group by p.member_type;

revoke all on public.activity_today from anon;
grant select on public.activity_today to authenticated;


-- ── 확인 ──
select * from public.activity_today;
