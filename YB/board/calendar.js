// ═══════════════════════════════════════════════════════════
//  일정 달력 — 게시판 글에서 날짜를 스스로 찾아 달력에 얹습니다
//
//   · 학생회 : 소모임 · 멘토멘티 · 활동 이력 · 총회 같은 공지 글
//   · 총동문회 : 포럼/세미나 · 멘토멘티 만 함께 (같이 참여하는 자리)
//   · 그 글의 제목이나 본문에 「2026년 3월 15일」, 「3월 15일(토) 18:30」,
//     「2026-03-15」 같은 날짜가 있으면 그날 일정으로 얹습니다.
//   · 글 하나는 하루만 차지합니다. 제목에 적힌 날을 가장 먼저 보되,
//     경조사는 상 당한 날(가장 이른 날)로 잡습니다.
//   · 따로 적어 넣는 곳은 없습니다. 글만 올리면 알아서 실립니다.
//
//   쓰는 법:  initCalendar("#calBox",  { mode: "mini", upcoming: false });
//             initCalendar("#calMini", { mode: "mini", link: "#join" });
// ═══════════════════════════════════════════════════════════
import { sb } from "/YB/auth/auth.js";

import { fixedEvents } from "/YB/board/calendar-fixed.js?v=318";

const ORG = "YB";

const FIXED_NAME = { academic: "도쿄대 학사일정", holkr: "한국 공휴일", holjp: "일본 공휴일" };
const CATNAME = {
  notice: "공지사항", free: "자유게시판", qna: "Q&A", jobs: "취업정보",
  parttime: "아르바이트", market: "벼룩시장", club: "소모임",
  history: "활동 이력", mentoring: "멘토멘티",
  // 총동문회에서 함께 보는 것
  forum: "포럼·세미나", condolence: "경조사", promo: "홍보·채용",
  assembly: "총회", major: "전공별모임", event: "행사", scholarship: "장학",
  exam: "수험생", research: "단행본·연구", suggest: "바란다",
};

// ── 달력에 실을 갈래 ──
//   학생회(YB) 는 우리 모임을 모두 싣고,
//   총동문회(OB) 것은 함께 참여할 수 있는 자리만 가져옵니다.
const MEET_CATS = ["club", "mentoring", "notice", "history",
                   "forum", "major", "event", "news", "condolence"];   // 학생회 것
const OB_SHARED = ["forum", "mentoring", "notice"];             // 총동문회에서 함께 보는 것
//   포럼·세미나 · 멘토멘티 · 총회 — 선후배가 같은 자리에 모이는 일정입니다.
//   (총동문회 공지는 총회 같은 모임 글만 골라 옵니다)

// 공지는 모임 아닌 글도 많으므로 아래 말이 제목에 있을 때만 봅니다
const MEET_WORDS = [
  "총회", "모임", "소모임", "세미나", "포럼", "심포지엄", "간담회", "강연", "특강",
  "워크숍", "워크샵", "설명회", "발표회", "오리엔테이션", "행사", "월례회", "정기회",
  "등산", "산행", "골프", "라운딩", "답사", "야유회", "체육대회",
  "송년회", "신년회", "환영회", "번개", "회식", "만찬", "오찬", "MT",
  "멘토", "멘티", "결혼", "혼례", "화혼", "부고", "발인", "장례", "빈소", "추도", "위로연",
];

// 이 말이 곁에 있으면 「행사 날짜」로 봅니다
const EVENT_WORDS = [
  "일시", "날짜", "일정", "때", "개최", "열립니다", "열린다", "진행",
  "모임", "세미나", "포럼", "총회", "행사", "강연", "특강", "심포지엄",
  "워크숍", "워크샵", "발표회", "간담회", "설명회", "오리엔테이션",
  "신청", "접수", "마감", "참가", "참석", "등록",
  "라운딩", "골프", "등산", "산행", "답사", "미팅", "회식", "만찬", "오찬",
  "환영", "송년", "신년", "정기", "월례", "번개", "MT",
  "모입니다", "모여", "뵙", "예정", "개최일", "출발", "집합",
  "발인", "빈소", "장례", "영결", "추도", "부고", "訃告",
  "결혼", "혼례", "화혼", "예식", "청첩",
];

// 날짜로 보면 안 되는 것들 (전화번호·금액·회차 등)
const NOT_DATE = /(원|명|회|기|호|번|%|℃)$/;

const two = (n) => (n < 10 ? "0" + n : "" + n);
const key = (d) => d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate());
const esc = (s) => (s || "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** 「18:30」「오후 6시 30분」「18시」를 찾아 "18:30" 꼴로 */
function findTime(tail) {
  let m = tail.match(/^[^\d]{0,12}?(\d{1,2})\s*:\s*(\d{2})/);
  if (m) return two(+m[1]) + ":" + m[2];
  m = tail.match(/^[^\d]{0,12}?(오전|오후|아침|점심|저녁|밤)?\s*(\d{1,2})\s*시\s*(\d{1,2})?\s*분?/);
  if (m) {
    let h = +m[2];
    const pm = m[1] === "오후" || m[1] === "저녁" || m[1] === "밤" || m[1] === "점심";
    if (pm && h < 12) h += 12;
    if ((m[1] === "오전" || m[1] === "아침") && h === 12) h = 0;
    return two(h) + ":" + two(+(m[3] || 0));
  }
  return "";
}

/**
 * 글 한 편에서 날짜를 찾습니다.
 * @param {string} title  제목 — 여기 있는 날짜는 무조건 일정으로 봅니다
 * @param {string} body   본문 — 행사 관련 말이 곁에 있을 때만 봅니다
 * @param {Date}   base   글을 쓴 날 (연도가 없는 「3월 15일」의 해를 정할 때 씁니다)
 * @param {object} opts   { earliest: true } 면 가장 이른 날을 고릅니다 (경조사)
 */
export function findDates(title, body, base, opts) {
  const out = [];
  const seen = new Set();
  const baseY = base.getFullYear();

  // 제목이 이미 모임을 알리는 글이면 본문 줄도 너그럽게 봅니다
  const titleHot = EVENT_WORDS.some((w) => (title || "").indexOf(w) > -1);

  const scan = (text, always) => {
    if (!text) return;
    // 한 줄씩 보아야 「일시:」 같은 말이 곁에 있는지 알 수 있습니다
    text.split(/\n+/).forEach((line) => {
      const hot = always || titleHot || EVENT_WORDS.some((w) => line.indexOf(w) > -1);
      if (!hot) return;

      // ① 2026년 3월 15일 / 2026-03-15 / 2026.3.15 / 2026/3/15
      const RE_FULL = /(20\d{2})\s*[년.\-\/]\s*(\d{1,2})\s*[월.\-\/]\s*(\d{1,2})\s*일?/g;
      // ② 3월 15일 / 3月15日
      //    「일」을 빼고 「3월 15(토)」 「3월 15 18:30」 처럼 적어도 알아봅니다
      const RE_MD = /(?:^|[^\d])(\d{1,2})\s*[월月]\s*(\d{1,2})\s*(?:[일日]|(?=\s*[(（[]?\s*[월화수목금토일][)）\]]?)|(?=\s*\d{1,2}\s*[:시]))/g;

      let m;
      while ((m = RE_FULL.exec(line))) {
        push(+m[1], +m[2], +m[3], line.slice(m.index + m[0].length), line);
      }
      while ((m = RE_MD.exec(line))) {
        let y = baseY;
        // 글 쓴 날보다 3달 넘게 앞선 날짜라면 이듬해로 봅니다
        const cand = new Date(y, +m[1] - 1, +m[2]);
        if (cand.getTime() < base.getTime() - 92 * 864e5) y += 1;
        push(y, +m[1], +m[2], line.slice(m.index + m[0].length), line);
      }
    });
  };

  function push(y, mo, d, tail, line) {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return;
    if (NOT_DATE.test(tail.trim().slice(0, 2))) return;
    const dt = new Date(y, mo - 1, d);
    if (dt.getMonth() !== mo - 1) return;              // 2월 30일 같은 것
    const k = key(dt);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ key: k, date: dt, time: findTime(tail), line: line.trim().slice(0, 90) });
  }

  // 글 하나는 달력에서 하루만 차지합니다.
  if (opts && opts.earliest) {
    // 경조사 — 상 당한 날(가장 이른 날)로 잡습니다.
    // 부고 글에는 별세일 · 조문일 · 발인일이 함께 적히기 때문입니다.
    scan(title, true);
    scan(body, true);
    out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    return out.slice(0, 1);
  }
  // 그 밖의 모임 — 제목에 적힌 날이 곧 모이는 날입니다.
  scan(title, true);
  if (out.length) return out.slice(0, 1);
  // 제목에 날짜가 없으면 본문을 봅니다.
  // 이미 모이는 게시판(소모임·멘토멘티 등)만 골라 왔으므로
  // 본문에 적힌 날짜는 그대로 모이는 날로 봅니다.
  scan(body, true);
  return out.slice(0, 1);
}

/** 게시판 글을 읽어 일정 목록을 만듭니다 */
export async function loadEvents() {
  const since = new Date(Date.now() - 400 * 864e5).toISOString();
  const { data, error } = await sb.from("posts")
    .select("id,title,category,content,created_at,org")
    .in("org", ["YB", "OB"]).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(400);
  if (error || !data) return { events: [], error };

  const lo = Date.now() - 400 * 864e5, hi = Date.now() + 730 * 864e5;
  const events = [];
  data.forEach((p) => {
    // 학생회 글은 우리 모임 갈래만, 총동문회 글은 함께 참여하는 갈래만
    const mine = (p.org || "YB") === "YB";
    if (mine) {
      if (MEET_CATS.indexOf(p.category) === -1) return;
      if (p.category === "notice" &&
          !MEET_WORDS.some((w) => (p.title || "").indexOf(w) > -1)) return;
    } else {
      if (OB_SHARED.indexOf(p.category) === -1) return;
      // 총동문회 공지는 총회처럼 모이는 글만
      if (p.category === "notice" &&
          !MEET_WORDS.some((w) => (p.title || "").indexOf(w) > -1)) return;
    }
    const base = new Date(p.created_at);
    findDates(p.title, p.content, base,
              { earliest: p.category === "condolence" }).forEach((h) => {
      if (h.date.getTime() < lo || h.date.getTime() > hi) return;
      events.push({
        key: h.key, date: h.date, time: h.time, org: p.org || "YB",
        title: p.title, cat: p.category, id: p.id, line: h.line,
      });
    });
  });
  // 학사일정·공휴일은 게시판과 상관없이 늘 들어갑니다
  fixedEvents().forEach((e) => {
    const t = e.date.getTime();
    if (t >= lo && t <= hi) events.push(e);
  });

  events.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) ||
                        (a.time < b.time ? -1 : 1));
  return { events, error: null };
}

/** 날짜별로 묶기 */
function byDay(events) {
  const m = new Map();
  events.forEach((e) => {
    if (!m.has(e.key)) m.set(e.key, []);
    m.get(e.key).push(e);
  });
  return m;
}

/**
 * 달력 칸에 넣을 짧은 이름.
 * 「[부고] 이학섭 동문 부친상 [08월 22일(토) 09시 00분 발인]」 처럼
 * 제목 뒤에 붙은 날짜·시각 묶음을 걷어내고 이름만 남깁니다.
 * (걷어낸 자세한 내용은 날짜를 누르면 그대로 보입니다)
 */
export function shortTitle(t) {
  let s = String(t || "");
  s = s.replace(/[（(]\s*[월화수목금토일]\s*[)）]/g, " ");        // (토) 같은 요일 표시
  const hasDate = (g) => /\d{1,2}\s*[월시:]|\d{1,2}\s*일/.test(g);
  for (let i = 0; i < 3; i++) {                                  // 안쪽 묶음부터 차례로
    s = s.replace(/[（(\[［][^（(\[［)）\]］]*[)）\]］]/g, (g) => (hasDate(g) ? " " : g));
  }
  s = s.replace(/\d{1,2}\s*월\s*\d{1,2}\s*일/g, " ")             // 홀로 남은 날짜·시각
       .replace(/\d{1,2}\s*:\s*\d{2}/g, " ")
       .replace(/(오전|오후|저녁|아침)\s*\d{1,2}\s*시(\s*\d{1,2}\s*분)?/g, " ");
  s = s.replace(/\s+/g, " ").replace(/[\s~!·,\-]+$/, "").trim();
  return s || String(t || "");
}

const WD = ["일", "월", "화", "수", "목", "금", "토"];

function monthGrid(year, month, map, todayKey, titles) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  let html = '<div class="cal-wd">' + WD.map((w, i) =>
    `<span class="${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</span>`).join("") + "</div>";
  // 주 단위로 딱 떨어지게 그립니다.
  // (남는 자리를 비워두면 격자 바탕이 드러나 진한 덩어리처럼 보입니다)
  const last = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((first.getDay() + last) / 7) * 7;
  html += '<div class="cal-days">';
  for (let i = 0; i < cells; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const k = key(d);
    const ev = map.get(k) || [];
    const cls = ["cd"];
    if (d.getMonth() !== month) cls.push("off");
    if (k === todayKey) cls.push("today");
    if (ev.length) cls.push("has");
    if (d.getDay() === 0) cls.push("sun");
    if (d.getDay() === 6) cls.push("sat");
    if (ev.some((e) => e.cat === "holkr" || e.cat === "holjp")) cls.push("hol");
    html += `<div class="${cls.join(" ")}" data-k="${k}"${ev.length ? ' role="button" tabindex="0"' : ""}>` +
            `<span class="n">${d.getDate()}</span>`;
    // 칸이 넉넉하면 행사명을 작게 얹고, 좁으면 점만 찍습니다
    if (ev.length) {
      html += titles
        ? ev.slice(0, 2).map((e) =>
            `<i class="chip c-${esc(e.cat)}${e.org === "OB" ? " c-ob" : ""}" ` +
            `data-id="${esc(String(e.id))}" ` +
            `title="${esc(e.title)}">${fromMark(e)}` +
            `${esc(shortTitle(e.title))}</i>`).join("") +
          (ev.length > 2 ? `<i class="chip more">＋${ev.length - 2}</i>` : "")
        : `<span class="dot">${ev.length > 1 ? ev.length : ""}</span>`;
    }
    html += "</div>";
  }
  return html + "</div>";
}

/** 총동문회에서 온 일정에 붙일 앞말.
 *  멘토멘티는 두 단체가 함께 쓰는 게시판이라 게시판 이름을 그대로 씁니다. */
function fromMark(e) {
  if (e.org !== "OB") return "";
  if (e.cat === "mentoring") return "(멘토멘티) ";
  if (e.cat === "notice")    return "(OB)총회 ";
  if (e.cat === "forum")     return "(OB)포럼·세미나 ";
  return "(OB) ";
}

/** 날짜를 눌렀을 때 — 제목과 함께 글 속의 그 줄을 그대로 보여줍니다 */
function evCard(e) {
  if (e.fixed) {
    return `<span class="cev cev-card cev-fix">
      <span class="cc-top"><b>${esc(e.title)}</b></span>
      <span class="cc-meta">${esc(FIXED_NAME[e.cat] || "")}</span></span>`;
  }
  return `<a class="cev cev-card" href="/YB/post.html?id=${e.id}">
    <span class="cc-top"><b>${esc(e.title)}</b></span>
    <span class="cc-meta">${e.time ? `<em>${e.time}</em> · ` : ""}` +
      `${e.org === "OB" && e.cat !== "mentoring" ? "(OB) " : ""}` +
      `${esc(CATNAME[e.cat] || e.cat)}</span>
    ${e.line ? `<span class="cc-line">${esc(e.line)}</span>` : ""}
    <span class="cc-go">글 열어보기 →</span></a>`;
}

function evLine(e) {
  if (e.fixed) {
    return `<span class="cev cev-fix">
      <span class="cev-d">${e.key.slice(5).replace("-", ".")}</span>
      <span class="cev-t">${esc(e.title)}</span>
      <span class="cev-c">${esc(FIXED_NAME[e.cat] || "")}</span></span>`;
  }
  return `<a class="cev" href="/YB/post.html?id=${e.id}">
    <span class="cev-d">${e.key.slice(5).replace("-", ".")}${e.time ? ` <b>${e.time}</b>` : ""}</span>
    <span class="cev-t">${esc(e.title)}</span>
    <span class="cev-c">${e.org === "OB" && e.cat !== "mentoring" ? "(OB) " : ""}` +
    `${esc(CATNAME[e.cat] || e.cat)}</span></a>`;
}

/**
 * 달력을 그립니다.
 * @param {string} sel    넣을 자리 (선택자)
 * @param {object} opts   { mode: "full" | "mini", link: 자세히 보기 주소 }
 */
export async function initCalendar(sel, opts) {
  const box = document.querySelector(sel);
  if (!box) return;
  const mode = (opts && opts.mode) || "full";
  // 달력 아래 「다가오는 일정」 목록을 붙일지 (날짜를 누르면 그날 일정은 늘 펼쳐집니다)
  const showUpcoming = !(opts && opts.upcoming === false);
  // 날짜칸 안에 행사명을 작게 보일지 (칸이 넓을 때만 쓸 만합니다)
  const showTitles = !!(opts && opts.titles);
  box.classList.add("cal", mode === "mini" ? "cal-mini" : "cal-full");
  if (opts && opts.titles) box.classList.add("cal-titles");
  box.innerHTML = '<div class="cal-loading">일정을 불러오는 중…</div>';

  const { events } = await loadEvents();
  const map = byDay(events);
  const today = new Date();
  const todayKey = key(today);
  let y = today.getFullYear(), mo = today.getMonth(), picked = "";

  // 이번 달에 아무것도 없으면 앞으로 가장 가까운 일정이 있는 달을 보여줍니다
  const ahead = events.filter((e) => e.key >= todayKey);
  if (ahead.length && !events.some((e) => e.key.slice(0, 7) === todayKey.slice(0, 7))) {
    y = ahead[0].date.getFullYear(); mo = ahead[0].date.getMonth();
  }

  function draw() {
    const monTitle = `${y}년 ${mo + 1}월`;
    const upcoming = events.filter((e) => e.key >= todayKey).slice(0, mode === "mini" ? 3 : 6);
    const dayList = picked ? (map.get(picked) || []) : [];

    box.innerHTML =
      `<div class="cal-head">
         <button class="cal-nav" data-d="-1" title="지난달">‹</button>
         <b class="cal-title">${monTitle}</b>
         <button class="cal-nav" data-d="1" title="다음달">›</button>
         <button class="cal-now" title="이번 달로">오늘</button>
         ${opts && opts.link ? `<a class="cal-more" href="${opts.link}">전체 일정 +</a>` : ""}
       </div>` +
      monthGrid(y, mo, map, todayKey, showTitles) +
      (picked
        ? `<div class="cal-list">
             <div class="cal-lh">${picked.replace(/-/g, ".")} 일정 ${dayList.length}건
               <button class="cal-x" title="닫기">✕</button></div>
             ${dayList.map(evCard).join("") || '<div class="cal-none">이 날은 일정이 없습니다.</div>'}
           </div>`
        : !showUpcoming ? ""
        : `<div class="cal-list">
             <div class="cal-lh">다가오는 일정</div>
             ${upcoming.map(evLine).join("") ||
               '<div class="cal-none">' + (events.length
                  ? "앞으로 잡힌 일정이 아직 없습니다."
                  : "게시판에서 찾은 모임 일정이 아직 없습니다.<br>" +
                    '<a href="/YB/auth/login.html">로그인</a>하시면 회원 전용 글의 일정까지 보실 수 있습니다.') + "</div>"}
           </div>`);

    box.querySelectorAll(".cal-nav").forEach((b) => b.addEventListener("click", () => {
      mo += +b.dataset.d;
      if (mo < 0) { mo = 11; y--; }
      if (mo > 11) { mo = 0; y++; }
      picked = ""; draw();
    }));
    const now = box.querySelector(".cal-now");
    if (now) now.addEventListener("click", () => {
      y = today.getFullYear(); mo = today.getMonth(); picked = ""; draw();
    });
    const x = box.querySelector(".cal-x");
    if (x) x.addEventListener("click", () => { picked = ""; draw(); });

    box.querySelectorAll(".cd.has").forEach((c) => {
      const go = () => {
        const ev = map.get(c.dataset.k) || [];
        // 한 건이면 그 글로 바로, 여러 건이면 아래에 펼쳐 고르게
        if (ev.length === 1) { location.href = "/YB/post.html?id=" + ev[0].id; return; }
        picked = c.dataset.k; draw();
      };
      /* 행사 이름표를 바로 누르시면 아래 목록을 거치지 않고 그 글로 갑니다.
         날짜칸의 빈 곳을 누르시면 예전처럼 그날 일정이 아래에 펼쳐집니다. */
      c.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip[data-id]");
        if (chip) { e.stopPropagation(); location.href = "/YB/post.html?id=" + chip.dataset.id; return; }
        go();
      });
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }
  /* 휴대전화 : 달력을 옆으로 쓸어 달을 넘깁니다.
     왼쪽으로 쓸면 다음 달, 오른쪽으로 쓸면 지난 달 —
     책장을 넘기듯 손가락을 따라 달이 움직입니다.
     세로로 그은 것은 화면 스크롤이니 그냥 둡니다. */
  if (!box.dataset.swipe) {
    box.dataset.swipe = "1";
    let sx = 0, sy = 0, on = false;
    box.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) { on = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true;
    }, { passive: true });
    box.addEventListener("touchend", (e) => {
      if (!on) return;
      on = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      mo += dx < 0 ? 1 : -1;
      if (mo < 0) { mo = 11; y--; }
      if (mo > 11) { mo = 0; y++; }
      picked = ""; draw();
    }, { passive: true });
  }

  draw();
}
