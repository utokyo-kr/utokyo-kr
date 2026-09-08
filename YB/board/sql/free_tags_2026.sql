-- ═══════════════════════════════════════════════════════════
--   자유게시판 말머리 정리 (학생회 YB 쪽만)
--
--   남길 말머리 : 일상 · 질문 · 정보공유 · 공모전정보 · 후기 · 기타
--   그 밖의 말머리를 단 글은 「기타」로 모읍니다.
--
--   게시판 화면의 말머리 줄은 목록에 없는 말머리라도
--   글에 쓰였으면 칩을 세워 줍니다. 그래서 글 자체를 손봐야
--   말머리 줄이 깔끔해집니다.
--
--   실행 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
--   ※ 다시 돌려도 괜찮습니다.
-- ═══════════════════════════════════════════════════════════

-- ── ① 먼저 무엇이 바뀌는지 보십시오 (아무것도 바꾸지 않습니다) ──
select substring(title from '^\[([^\]]+)\]') as "지금 말머리",
       count(*) as "글수",
       string_agg(left(regexp_replace(title, '^\[[^\]]+\]\s*', ''), 24), ' · ') as "글 제목"
  from public.posts
 where org = 'YB' and category = 'free'
   and title ~ '^\['
   and substring(title from '^\[([^\]]+)\]')
       not in ('일상','질문','정보공유','공모전정보','후기','기타')
 group by 1
 order by 2 desc;

-- ── ② 위 목록이 「기타」로 가도 괜찮으면 아래를 돌리세요 ──
update public.posts
   set title = '[기타] ' || regexp_replace(title, '^\[[^\]]+\]\s*', '')
 where org = 'YB' and category = 'free'
   and title ~ '^\['
   and substring(title from '^\[([^\]]+)\]')
       not in ('일상','질문','정보공유','공모전정보','후기','기타');

-- ── ③ 말머리가 아예 없는 글에도 「기타」를 붙입니다 ──
update public.posts
   set title = '[기타] ' || title
 where org = 'YB' and category = 'free'
   and title !~ '^\[';

-- ── 확인 — 여섯 줄 안쪽으로 나오면 깔끔해진 것입니다 ──
select substring(title from '^\[([^\]]+)\]') as "말머리", count(*) as "글수"
  from public.posts
 where org = 'YB' and category = 'free'
 group by 1 order by 2 desc;
