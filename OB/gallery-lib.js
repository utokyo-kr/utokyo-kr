// ─── 갤러리 공용 모듈 ──────────────────────────────────────
// 기본 제공 사진(gallery-data.js) + 관리자가 올린 사진/수정 내역(Supabase)을 합쳐
// 연도별 앨범 목록을 만든다. gallery / album / admin 페이지가 함께 사용한다.
import { sb } from "/OB/auth/auth.js";

export const CATS = [
  ["assembly", "총회"],
  ["staff",    "운영진"],
  ["club",     "소모임"],
  ["faculty",  "전공별모임"],
  ["forum",    "포럼·세미나"],
  ["old",      "옛날사진"],
  ["daily",    "일상"],
];
export const CAT_NAME = Object.fromEntries(CATS);

// 없앤 갈래는 여기 적어 옛 사진이 갈 곳을 정한다.
// (자료방에 아직 'etc' 로 남아 있어도 화면에서는 「일상」으로 보입니다)
const FOLD = { etc: "daily" };
export const fold = (c) => FOLD[c] || c;

const ALBUM_NAME = {
  assembly: "{y}년도 정기총회", staff: "{y}년 운영진 모임",
  club: "{y}년 소모임", faculty: "{y}년 전공별모임",
  forum: "{y}년 포럼·세미나", old: "{y}년 동문회 행사", daily: "{y}년 동문회 활동",
};
const BASE = "../images/gallery/";
// 사진 파일명이 재편성될 때 브라우저가 예전 목록을 캐시해 빈 칸이 뜨는 것을 막는다
const V = window.GALLERY_V ? "?v=" + window.GALLERY_V : "";

const iso = (d) => (d || "").replace(/\./g, "-").slice(0, 10);

/** 기본 제공 사진을 평평한 목록으로 (어느 앨범 소속인지 함께) */
function staticPhotos() {
  const G = window.GALLERY || {};
  const out = [];
  for (const [cat, albums] of Object.entries(G)) {
    albums.forEach(alb => alb.p.forEach((p, i) => out.push({
      key: `${cat}/${p.k}`, kind: "static", cat: fold(cat),
      date: iso(p.d), cap: p.c || alb.t, sort: i,
      album: alb.i, albumTitle: alb.t, albumDate: iso(alb.d),
      thumb: `${BASE}${cat}/${p.k}_t.jpg${V}`, full: `${BASE}${cat}/${p.k}.jpg${V}`,
    })));
  }
  return out;
}

/**
 * 합쳐진 앨범 목록을 돌려준다.
 * @returns {{albums: Array, byCat: Object, photos: Array, ok: boolean}}
 */
export async function loadGallery() {
  let photos = staticPhotos();
  let albumTitles = {}, custom = [], ok = true;

  try {
    const [ph, ov, al] = await Promise.all([
      sb.from("gallery_photos").select("*").eq("org", "OB"),
      sb.from("gallery_overrides").select("*"),
      sb.from("gallery_albums").select("*").eq("org", "OB"),
    ]);
    // 기본 사진 수정 내역 적용
    const ovMap = new Map((ov.data || []).map(o => [o.photo_key, o]));
    photos = photos.filter(p => {
      const o = ovMap.get(p.key);
      if (!o) return true;
      if (o.hidden) return false;
      // 분류나 날짜를 바꾸면 원래 앨범에서 빼내 연도 앨범으로 보낸다
      if (o.category && fold(o.category) !== p.cat) { p.cat = fold(o.category); p.album = null; }
      if (o.taken_at) { p.date = iso(o.taken_at); p.album = null; }
      if (o.album_key) p.album = o.album_key;      // 다른 앨범으로 옮김(합치기)
      if (o.caption != null) p.cap = o.caption;
      if (o.sort != null) p.sort = o.sort;
      return true;
    });
    // 회원이 올린 사진
    (ph.data || []).forEach(r => photos.push({
      key: `db:${r.id}`, kind: "db", id: r.id, cat: fold(r.category),
      date: iso(r.taken_at), cap: r.caption || "", sort: r.sort || 0,
      album: r.album_key || null, owner: r.created_by, ownerName: r.owner_name || "", ownerAdmin: !!r.owner_admin,
      thumb: r.image_url, full: r.image_url, storage_path: r.storage_path,
    }));
    (al.data || []).forEach(a => {
      albumTitles[a.album_key] = a;
      if (String(a.album_key || "").startsWith("custom:")) custom.push(a);
    });
    if (ph.error || ov.error || al.error) ok = false;
  } catch (e) {
    ok = false;   // 접속 실패 시 기본 사진만 표시
  }

  const map = new Map();
  // 회원이 직접 만든 사진첩 (사진이 없어도 목록에 보이도록 먼저 등록)
  for (const a of custom) {
    map.set(a.album_key, {
      key: a.album_key, cat: fold(a.category) || "daily",
      year: (iso(a.event_date) || "").slice(0, 4) || "",
      title: a.title || "사진첩", note: a.note || "", custom: true, owner: a.created_by,
      ownerName: a.owner_name || "", ownerAdmin: !!a.owner_admin, coverKey: a.cover_key || "",
      sort: a.sort != null ? a.sort : 0,      // 순서는 행사 날짜로 정한다(위로 띄우지 않음)
      photos: [],
    });
  }
  // 기본 제공 앨범을 먼저 만들어 둔다 (사진이 다른 앨범으로 옮겨져도 이름이 유지되도록)
  const G0 = window.GALLERY || {};
  for (const [cat, albums0] of Object.entries(G0)) {
    albums0.forEach(alb => {
      const ov = albumTitles[alb.i] || {};
      map.set(alb.i, {
        key: alb.i, cat: fold(cat), year: (alb.d || "").slice(0, 4),
        title: ov.title || alb.t, fixedDate: iso(ov.event_date) || iso(alb.d),
        coverKey: ov.cover_key || "",
        sort: ov.sort != null ? ov.sort : 0, note: ov.note || "", photos: [],
      });
    });
  }

  // 사진을 제 앨범에 담는다
  for (const p of photos) {
    if (p.album && map.has(p.album)) { map.get(p.album).photos.push(p); continue; }
    const y = (p.date || "").slice(0, 4) || "기타";     // 회원이 올린 사진 · 옮겨진 사진
    const key = `${p.cat}|${y}`;
    if (!map.has(key)) {
      const ov = albumTitles[key] || {};
      map.set(key, {
        key, cat: p.cat, year: y,
        title: ov.title || (ALBUM_NAME[p.cat] || "{y}년").replace("{y}", y),
        coverKey: ov.cover_key || "",
        sort: ov.sort != null ? ov.sort : 0, note: ov.note || "", photos: [],
      });
    }
    map.get(key).photos.push(p);
  }
  for (const [k, a] of [...map]) if (!a.photos.length && !a.custom) map.delete(k);   // 빈 앨범 정리
  const albums = [...map.values()];
  albums.forEach(a => {
    // 올린 순서가 아니라 사진에 적힌 날짜(파일 이름의 연·월·일)를 기준으로 늘어놓는다
    /* 손으로 차례를 정한 사진첩(custom:)은 그 차례를 그대로 따릅니다.
       그 밖에는 예전처럼 사진에 적힌 날짜를 먼저 봅니다. */
    const byHand = String(a.key || "").startsWith("custom:");
    a.photos.sort((x, y) => (byHand
        ? (x.sort - y.sort) || (y.date || "").localeCompare(x.date || "")
        : (y.date || "").localeCompare(x.date || "") || (x.sort - y.sort))
      || (x.key || "").localeCompare(y.key || ""));
    const newest = a.photos.reduce((m, p) => (p.date > m ? p.date : m), "");
    if (a.custom) {
      const ov = albumTitles[a.key] || {};
      a.date = iso(ov.event_date) || newest;
    } else {
      a.date = a.fixedDate || newest;
    }
    a.year = (a.date || "").slice(0, 4);
    // 앨범 버튼에 쓸 대표사진 (올린 사람이 고른 것, 없으면 첫 사진)
    a.cover = a.photos.find(p => p.key === a.coverKey) || a.photos[0] || null;
  });
  // 앨범도 행사 날짜순(최신이 위). 날짜가 같을 때만 수동 배치순서를 따른다
  albums.sort((a, b) => (b.date || "").localeCompare(a.date || "")
                     || (a.sort - b.sort)
                     || (a.key || "").localeCompare(b.key || ""));

  const byCat = {};
  CATS.forEach(([c]) => byCat[c] = []);
  albums.forEach(a => (byCat[a.cat] = byCat[a.cat] || []).push(a));
  return { albums, byCat, photos, ok };
}
