-- ═══════════════════════════════════════════════════════════
--  게시판 글 · 댓글을 「익명」 으로 쓸 수 있게 합니다.
--
--  어떻게 숨기나
--    이름만 '익명' 으로 바꾸면 숨긴 것이 아닙니다.
--    글에 작성자 ID(author_id) 가 남아 있으면, 같은 분이 실명으로 쓴
--    다른 글과 ID 를 맞춰보는 것만으로 누군지 드러납니다.
--
--    그래서 익명 글 · 댓글은
--      · posts / comments 의 author_id 를 비우고 (null)
--      · author_name 은 '익명' (댓글은 '익명1' · '익명2' · '글쓴이')
--      · 실제 작성자는 anon_authors 표에 따로 적어 둡니다.
--
--  누가 실제 작성자를 보나
--    · 글쓴이 본인            — 제 글을 고치고 지울 수 있어야 하므로
--    · 같은 쪽(YB/OB) 운영진  — 신고 · 관리 때문에
--    · 주인(is_owner)
--    그 밖의 회원에게는 보이지 않습니다.
--
--  댓글 이름표
--    같은 글 안에서 같은 분은 늘 같은 이름표를 씁니다 (익명1 은 계속 익명1).
--    글쓴이가 제 글에 익명 댓글을 달면 「글쓴이」 로 보입니다.
--
--  기존 규칙은 건드리지 않습니다
--    insert/update/delete 규칙을 덮어쓰지 않고, 익명용 규칙을 「더」 얹습니다.
--    바탕 규칙(permissive)은 서로 OR 로 합쳐지므로 지금 규칙은 그대로 살아 있습니다.
--    준회원 · Guest 덧대기 규칙(restrictive)도 익명 글에 똑같이 걸립니다.
--
--  먼저 실행되어 있어야 합니다
--    auth/org_wall.sql        (my_side)
--    auth/org_wall_write.sql  (is_owner · post_side · updated_by)
--
--  ※ 지운 익명 글 · 댓글의 작성자 기록은 남겨 둡니다 (신고 처리용, 운영진만 봄).
--
--  실행 : Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다. 한 덩이라 중간에 어긋나면 되돌아갑니다.
-- ═══════════════════════════════════════════════════════════

begin;

-- ── ① 칸 하나씩 ──
alter table public.posts    add column if not exists is_anon boolean not null default false;
alter table public.comments add column if not exists is_anon boolean not null default false;


-- ── ② 실제 작성자 기록표 ──
create table if not exists public.anon_authors (
  kind        text        not null check (kind in ('post', 'comment')),
  row_id      uuid        not null,                 -- posts.id 또는 comments.id
  author_id   uuid        not null,
  author_name text        not null default '',      -- 쓸 때의 실명
  org         text,                                 -- 글의 소속 (운영진 담장용)
  created_at  timestamptz not null default now(),
  primary key (kind, row_id)
);
create index if not exists anon_authors_author_idx on public.anon_authors (author_id);

alter table public.anon_authors enable row level security;
revoke all on public.anon_authors from anon;
grant select on public.anon_authors to authenticated;   -- 쓰기는 트리거만 합니다

drop policy if exists "anon authors read" on public.anon_authors;
create policy "anon authors read" on public.anon_authors for select
  using (
    author_id = auth.uid()
    or public.is_owner()
    or (public.is_admin() and public.post_side(org) = public.my_side())
  );


-- ── ③ 이 익명 글(댓글)을 쓴 사람이 나인가 ──
create or replace function public.is_hidden_author(p_kind text, p_id uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.anon_authors
                   where kind = p_kind and row_id = p_id and author_id = auth.uid()) $$;

grant execute on function public.is_hidden_author(text, uuid) to authenticated;


-- ── ④ 글 — 익명이면 작성자를 감춥니다 ──
--    트리거 이름을 posts_zz_… 로 둔 까닭 : 같은 때(before) 도는 트리거는
--    이름 순서로 돕니다. posts_stamp_editor(고친 사람 적기) 다음에 돌아야
--    글쓴이 본인이 고쳤을 때 「고친 사람」 칸까지 지울 수 있습니다.
create or replace function public.posts_anon_mask()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  uid  uuid := auth.uid();
  writer uuid;
  nm   text;
begin
  if tg_op = 'INSERT' then
    if new.is_anon then
      writer := coalesce(uid, new.author_id);          -- 화면이 보낸 author_id 는 믿지 않습니다
      select name into nm from public.profiles where id = writer;
      insert into public.anon_authors (kind, row_id, author_id, author_name, org)
      values ('post', new.id, writer, coalesce(nm, new.author_name, ''), new.org)
      on conflict (kind, row_id) do update
        set author_id = excluded.author_id, author_name = excluded.author_name, org = excluded.org;
      new.author_id   := null;
      new.author_name := '익명';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.is_anon and not old.is_anon then                 -- 실명 → 익명
    if old.author_id is not null then
      insert into public.anon_authors (kind, row_id, author_id, author_name, org)
      values ('post', new.id, old.author_id, coalesce(old.author_name, ''), new.org)
      on conflict (kind, row_id) do update
        set author_id = excluded.author_id, author_name = excluded.author_name, org = excluded.org;
    end if;
    new.author_id   := null;
    new.author_name := '익명';

  elsif old.is_anon and not new.is_anon then              -- 익명 → 실명
    select author_id, author_name into writer, nm
      from public.anon_authors where kind = 'post' and row_id = new.id;
    if writer is null then
      raise exception '이 익명 글은 작성자 기록이 없어 실명으로 바꿀 수 없습니다';
    end if;
    if uid is not null and uid <> writer and not public.is_owner() then
      raise exception '익명 글을 실명으로 바꾸는 것은 글쓴이 본인만 할 수 있습니다';
    end if;
    new.author_id   := writer;
    new.author_name := coalesce((select name from public.profiles where id = writer), nm, '');
    delete from public.anon_authors where kind = 'post' and row_id = new.id;

  elsif new.is_anon then                                  -- 익명 그대로 (내용만 고침)
    new.author_id   := null;
    new.author_name := '익명';
    update public.anon_authors set org = new.org where kind = 'post' and row_id = new.id;
  end if;

  -- 글쓴이 본인이 고쳤다면 「고친 사람(updated_by)」 칸에서도 지웁니다
  if new.is_anon and (to_jsonb(new) ? 'updated_by') then
    if new.updated_by is not null and exists (
         select 1 from public.anon_authors
          where kind = 'post' and row_id = new.id and author_id = new.updated_by) then
      new.updated_by := null;
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists posts_zz_anon on public.posts;
create trigger posts_zz_anon
  before insert or update on public.posts
  for each row execute function public.posts_anon_mask();


-- ── ⑤ 댓글 — 익명이면 감추고 이름표를 붙입니다 ──
create or replace function public.comments_anon_mask()
returns trigger language plpgsql security definer set search_path = public as
$$
declare
  uid  uuid := auth.uid();
  writer uuid;
  nm   text;
  op   uuid;      -- 글의 실제 작성자
  porg text;
  lbl  text;
  n    int;
begin
  if tg_op = 'INSERT' then
    if not new.is_anon then return new; end if;
    writer := coalesce(uid, new.author_id);

  elsif new.is_anon and not old.is_anon then              -- 실명 → 익명
    writer := old.author_id;

  elsif old.is_anon and not new.is_anon then              -- 익명 → 실명
    select author_id, author_name into writer, nm
      from public.anon_authors where kind = 'comment' and row_id = new.id;
    if writer is null then
      raise exception '이 익명 댓글은 작성자 기록이 없어 실명으로 바꿀 수 없습니다';
    end if;
    if uid is not null and uid <> writer and not public.is_owner() then
      raise exception '익명 댓글을 실명으로 바꾸는 것은 쓴 사람 본인만 할 수 있습니다';
    end if;
    new.author_id   := writer;
    new.author_name := coalesce((select name from public.profiles where id = writer), nm, '');
    delete from public.anon_authors where kind = 'comment' and row_id = new.id;
    return new;

  elsif new.is_anon then                                  -- 익명 그대로 (내용만 고침)
    new.author_id   := null;
    new.author_name := old.author_name;                   -- 익명1 같은 이름표 그대로
    return new;

  else
    return new;
  end if;

  -- 여기부터는 새로 익명이 되는 댓글입니다 (새로 쓰거나, 실명 → 익명)
  select p.org,
         coalesce(p.author_id,
                  (select a.author_id from public.anon_authors a
                    where a.kind = 'post' and a.row_id = p.id))
    into porg, op
    from public.posts p where p.id = new.post_id;

  -- 이 글에 같은 분이 이미 익명 댓글을 달았으면 같은 이름표를 씁니다
  select c.author_name into lbl
    from public.comments c
    join public.anon_authors a on a.kind = 'comment' and a.row_id = c.id
   where c.post_id = new.post_id and c.is_anon and c.id <> new.id
     and a.author_id = writer
   order by c.created_at
   limit 1;

  if lbl is null then
    if writer is not null and writer = op then
      lbl := '글쓴이';
    else
      select count(distinct a.author_id) into n
        from public.comments c
        join public.anon_authors a on a.kind = 'comment' and a.row_id = c.id
       where c.post_id = new.post_id and c.is_anon
         and (op is null or a.author_id <> op);
      lbl := '익명' || (coalesce(n, 0) + 1);
    end if;
  end if;

  if writer is not null then
    select name into nm from public.profiles where id = writer;
    insert into public.anon_authors (kind, row_id, author_id, author_name, org)
    values ('comment', new.id, writer, coalesce(nm, new.author_name, ''), porg)
    on conflict (kind, row_id) do update
      set author_id = excluded.author_id, author_name = excluded.author_name, org = excluded.org;
  end if;

  new.author_id   := null;
  new.author_name := lbl;
  return new;
end
$$;

drop trigger if exists comments_zz_anon on public.comments;
create trigger comments_zz_anon
  before insert or update on public.comments
  for each row execute function public.comments_anon_mask();


-- ── ⑥ 익명용 규칙을 「더」 얹습니다 (기존 규칙은 그대로) ──
--    기존 「insert posts」 는 author_id = auth.uid() 를 요구합니다.
--    익명 글은 트리거가 author_id 를 비운 뒤에 검사받으므로 그 규칙을 못 넘습니다.
--    그래서 익명 글만을 위한 길을 하나 더 냅니다. 조건은 기존 규칙과 같습니다
--    (승인 회원 · 제 쪽 글 · 운영진/주인은 양쪽).
drop policy if exists "insert posts anon" on public.posts;
create policy "insert posts anon" on public.posts for insert
  with check (
    is_anon and author_id is null
    and public.is_approved()
    and (public.is_owner() or public.is_admin() or public.post_side(org) = public.my_side())
  );

drop policy if exists "update posts hidden author" on public.posts;
create policy "update posts hidden author" on public.posts for update
  using      (public.is_hidden_author('post', id))
  with check (public.is_hidden_author('post', id) or author_id = auth.uid());

drop policy if exists "delete posts hidden author" on public.posts;
create policy "delete posts hidden author" on public.posts for delete
  using (public.is_hidden_author('post', id));

drop policy if exists "insert comments anon" on public.comments;
create policy "insert comments anon" on public.comments for insert
  with check (is_anon and author_id is null and public.is_approved());

drop policy if exists "update comments hidden author" on public.comments;
create policy "update comments hidden author" on public.comments for update
  using      (public.is_hidden_author('comment', id))
  with check (public.is_hidden_author('comment', id) or author_id = auth.uid());

drop policy if exists "delete comments hidden author" on public.comments;
create policy "delete comments hidden author" on public.comments for delete
  using (public.is_hidden_author('comment', id));

commit;


-- ═══════════════════════════════════════════════════════════
--  ⑦ 확인
-- ═══════════════════════════════════════════════════════════

-- 트리거 둘이 걸렸는지
select tgrelid::regclass as "표", tgname as "트리거"
  from pg_trigger
 where tgname in ('posts_zz_anon', 'comments_zz_anon');

-- 익명용 규칙 여섯 개
select polrelid::regclass as "표", polname as "규칙"
  from pg_policy
 where polname like '%anon%' or polname like '%hidden author%'
 order by 1, 2;
