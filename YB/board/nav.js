// ─── 게시판 화면의 상단 메뉴 (총동문회 OB · 학생회 YB 공용) ────
// 게시판·글보기·글쓰기 화면은 두 단체가 한 파일을 함께 씁니다.
// 예전에는 HTML 에 총동문회 메뉴를 적어 두고 학생회일 때만 바꿨는데,
// 그러면 잠깐 총동문회 메뉴가 스쳐 보이거나 그대로 남는 일이 있었습니다.
// 그래서 이제 어느 쪽이든 메뉴를 이 파일에서 새로 그립니다.

const NAV = {
  OB: `
      <div class="dd">
        <a href="/OB/index.html#greeting">동문회 소개</a>
        <div class="dd-menu">
          <a href="/OB/index.html#greeting">인사말</a>
          <a href="/OB/index.html#org">조직도</a>
          <a href="/OB/index.html#roster">임원진 명단</a>
          <a href="/OB/index.html#history">연혁</a>
          <a href="/OB/rules.html">정관</a>
        </div>
      </div>
      <div class="dd">
        <a href="/OB/index.html#join">참여마당</a>
        <div class="dd-menu">
          <a href="/OB/index.html#news">총회 안내</a>
          <a href="/OB/board.html?cat=club">소모임</a>
          <a href="/OB/board.html?cat=major">전공별모임(OB/YB)</a>
          <a href="/OB/board.html?cat=mentoring">멘토멘티(OB/YB)</a>
          <a href="/OB/board.html?cat=forum">포럼·세미나</a>
        </div>
      </div>
      <div class="dd">
        <a href="/OB/board.html">게시판</a>
        <div class="dd-menu">
          <a href="/OB/board.html?cat=notice">공지사항</a>
          <a href="/OB/board.html?cat=free">자유게시판</a>
          <a href="/OB/board.html?cat=jobs">구인·채용(OB/YB)</a>
          <a href="/OB/board.html?cat=condolence">경조사</a>
          <a href="/OB/board.html?cat=research">단행본 및 연구소개</a>
          <a href="/OB/board.html?cat=suggest">동문회에 바란다</a>
        </div>
      </div>
      <div class="dd">
        <a href="/OB/gallery.html">갤러리</a>
        <div class="dd-menu">
          <a href="/OB/gallery.html?cat=assembly">총회</a>
          <a href="/OB/gallery.html?cat=staff">운영진</a>
          <a href="/OB/gallery.html?cat=club">소모임</a>
          <a href="/OB/gallery.html?cat=faculty">전공별모임</a>
          <a href="/OB/gallery.html?cat=forum">포럼·세미나</a>
          <a href="/OB/gallery.html?cat=old">옛날사진</a>
          <a href="/OB/gallery.html?cat=daily">일상</a>
        </div>
      </div>
      <a href="/OB/map.html">MAP</a>
      <a href="/OB/index.html#sponsor">후원</a>`,

  YB: `
      <div class="dd">
        <a href="/YB/index.html#school">학교안내</a>
        <div class="dd-menu">
          <a href="/YB/index.html#introtx">학교 소개</a>
          <a href="/YB/index.html#access">오시는 길 · 캠퍼스 안내</a>
          <a href="/YB/index.html#faq">FAQ</a>
          <a href="/YB/index.html#usage">홈페이지 이용안내</a>
        </div>
      </div>
      <div class="dd">
        <a href="/YB/index.html#council">학생회</a>
        <div class="dd-menu">
          <a href="/YB/index.html#greeting">인사말</a>
          <a href="/YB/index.html#officers">임원진</a>
          <a href="/YB/index.html#past">역대 회장 및 임원진</a>
          <a href="/YB/board.html?cat=history">활동 이력</a>
          <a href="/YB/rules.html">회칙</a>
        </div>
      </div>
      <div class="dd">
        <a href="/YB/board.html?cat=mentoring">참여마당</a>
        <div class="dd-menu">
          <a href="/YB/board.html?cat=mentoring">멘토멘티(OB/YB)</a>
          <a href="/YB/board.html?cat=counsel">진로상담</a>
          <a href="/YB/board.html?cat=career">진학/취업 후기</a>
          <a href="/YB/board.html?cat=event">행사</a>
          <a href="/YB/board.html?cat=club">소모임</a>
          <a href="/YB/board.html?cat=major">전공별모임(OB/YB)</a>
          <a href="/YB/board.html?cat=suggest">학생회에 바란다</a>
        </div>
      </div>
      <div class="dd">
        <a href="/YB/board.html">게시판</a>
        <div class="dd-menu">
          <a href="/YB/board.html?cat=jobs">구인·채용(OB/YB)</a>
          <a href="/YB/board.html?cat=free">자유게시판</a>
          <a href="/YB/board.html?cat=qna">Q&amp;A</a>
          <a href="/YB/board.html?cat=scholarship">장학·연구지원 <small>준회원 열람</small></a>
          <a href="/YB/board.html?cat=market">벼룩시장</a>
          <a href="/YB/board.html?cat=exam">수험생 게시판 <small>누구나 열람</small></a>
          <a href="/YB/board.html?cat=notice">공지사항</a>
        </div>
      </div>
      <div class="dd">
        <a href="/YB/gallery.html">갤러리</a>
        <div class="dd-menu">
          <a href="/YB/gallery.html?cat=all">전체</a>
          <a href="/YB/gallery.html?cat=assembly">총회</a>
          <a href="/YB/gallery.html?cat=event">행사·소모임</a>
          <a href="/YB/gallery.html?cat=daily">일상</a>
          <a href="/YB/gallery.html?cat=etc">기타</a>
        </div>
      </div>
      <a href="/YB/map.html">MAP</a>
      <a href="/YB/index.html#sponsor">후원/협력요청</a>`,
};

const LOGO = {
  OB: { html: "재한 도쿄대학 총동문회<small>在韓東京大学総同門会 · EST. 2011</small>",
        href: "/OB/index.html", name: "재한 도쿄대학 총동문회" },
  YB: { html: "<span class=\"hmark\"></span><span class=\"hname\">도쿄대학 한국인학생회<span class=\"ksamark\" role=\"img\" aria-label=\"도쿄대학 한국인학생회 마크\"></span><small>東京大学韓国人学生会 · UT-KSA</small></span>",
        href: "/YB/index.html", name: "도쿄대학 한국인학생회" },
};

const PILLS = {
  OB: '<a class="band" href="https://www.band.us/band/58105635/post" target="_blank" rel="noopener">네이버 밴드 →</a>' +
      '<a class="fb" href="https://www.facebook.com/groups/286637871392457" target="_blank" rel="noopener">페이스북 그룹</a>',
  YB: '<a class="fb" href="https://www.facebook.com/tokyoksa" target="_blank" rel="noopener">Facebook</a>' +
      '<a class="ig" href="https://www.instagram.com/tokyoksa/" target="_blank" rel="noopener">Instagram</a>',
};

/**
 * 게시판 화면의 상단 메뉴를 그 단체 것으로 그린다.
 * @param {"OB"|"YB"} org
 * @param {string} [title] 브라우저 탭 제목
 */
/**
 * 상단 메뉴만 이 파일의 것으로 다시 그린다.
 * 첫 화면·갤러리·정관처럼 제 머리글을 따로 가진 화면에서 씁니다.
 * 메뉴 모양(css)은 그 화면 것을 그대로 쓰고 항목만 하나로 맞춥니다.
 * @param {"OB"|"YB"} org
 */
/** 이 쪽을 보신 것을 한 번 적어 둡니다.
 *  화면마다 따로 부르지 않아도 되도록 메뉴를 그릴 때 함께 부릅니다.
 *  (예전에는 지도처럼 몇몇 쪽에서만 불려, 게시판을 아무리 둘러보셔도
 *   기록이 남지 않았습니다) */
let visitNoted = false;
function noteThisPage(org) {
  if (visitNoted) return;                  // 한 쪽에서 두 번 세지 않도록
  visitNoted = true;
  import("/YB/auth/auth.js").then(m => m.noteVisit()).catch(() => {});
}

/** 비동문 준회원에게는 쓰실 수 있는 곳만 남깁니다.
 *  볼 수 있는 게시판  포럼·세미나 · 구인·채용 · 수험생
 *  글 쓰는 곳          구인·채용 · 수험생
 *  소개 · 인사말 · 후원 같은 안내 쪽은 그대로 두어 둘러보실 수 있게 합니다.
 *  (자료방에도 같은 규칙이 서 있으므로 이것은 헛걸음을 막는 안내입니다) */
const GUEST_CATS = ["forum", "jobs", "exam"];
let guestTrimmed = false;
async function guestTrim(org) {
  if (guestTrimmed) return;
  let me = null;
  try {
    const m = await import("/YB/auth/auth.js");
    me = await m.myProfile();
  } catch (e) { return; }
  if (!me || me.is_admin) return;
  if (me.grade !== "guest" && me.member_type !== "GUEST") return;
  guestTrimmed = true;
  document.documentElement.classList.add("is-guest");

  // 게시판 고리는 볼 수 있는 곳만
  document.querySelectorAll('.dd-menu a[href*="board.html"], nav a[href*="board.html"]')
    .forEach((a) => {
      const m = a.getAttribute("href").match(/cat=([a-z]+)/);
      if (!m || !GUEST_CATS.includes(m[1])) a.remove();
    });
  // 갤러리·명부는 회원만 봅니다
  document.querySelectorAll('a[href*="gallery.html"], a[href*="/members.html"]')
    .forEach((a) => a.remove());
  // 속이 빈 드롭다운은 통째로 치웁니다
  document.querySelectorAll(".dd").forEach((dd) => {
    const menu = dd.querySelector(".dd-menu");
    if (menu && !menu.querySelector("a")) dd.remove();
  });
}

export function applyMenu(org) {
  const key = org === "YB" ? "YB" : "OB";
  const nav = document.querySelector(".mhead nav") ||
              document.querySelector("header nav") ||
              document.querySelector("nav");
  if (!nav) return;
  nav.innerHTML = NAV[key];
  // 지금 보고 있는 화면을 가리키는 링크는 새로 열지 말고 자리만 옮기도록
  const here = location.pathname.replace(/index\.html$/, "");
  nav.querySelectorAll("a[href*='#']").forEach(a => {
    const u = new URL(a.getAttribute("href"), location.href);
    if (u.hash && u.pathname.replace(/index\.html$/, "") === here) a.setAttribute("href", u.hash);
  });
  mobileNav();
  noteThisPage(org);
  guestTrim(org);
}

export function applyNav(org, title) {
  const key = org === "YB" ? "YB" : "OB";
  document.body.classList.toggle("yb", key === "YB");
  if (title) document.title = title;

  const logo = document.querySelector(".mlogo");
  if (logo) {
    logo.innerHTML = LOGO[key].html;
    logo.setAttribute("href", LOGO[key].href);
  }
  const nav = document.querySelector(".mhead nav");
  if (nav) nav.innerHTML = NAV[key];

  const pills = document.querySelector(".mpills");
  if (pills) pills.innerHTML = PILLS[key];

  // (예전에는 여기서 윗줄 마지막 링크를 그 단체 홈으로 바꿔치기했습니다.
  //  그 탓에 「한국인학생회(기존)」 자리가 학생회 홈으로 바뀌어, 옛 홈페이지로 갈 수 없고
  //  같은 곳으로 가는 단추가 둘 생겼습니다. 이제 각 화면이 윗줄 네 개를 그대로 적습니다.)
  mobileNav();
  noteThisPage(org);
  guestTrim(org);
}

/** 상단 얇은 줄의 로그인 자리를 지금 상태에 맞게 그린다.
 *  게시판·갤러리는 저마다 그리고 있고, 지도 화면처럼 그렇지 않은 곳에서 씁니다. */
export async function applyAuthLinks(org) {
  const el = document.getElementById("authLinks");
  if (!el) return;
  const { sb, currentUser, myProfile } = await import("/YB/auth/auth.js");
  noteThisPage(org);                 // 이 쪽을 보신 것을 한 번 적어 둡니다
  let user = null, p = null;
  try {
    user = await currentUser();
    p = user ? await myProfile() : null;
  } catch (e) { return; }                 // 실패하면 원래 있던 로그인 링크를 그대로 둔다
  if (!user) return;

  el.innerHTML = "";
  const st = document.createElement("span");
  st.textContent = (p && p.name) ? `[${p.name}님 로그인중]` : "[로그인중]";
  st.style.color = "#7fc48a"; st.style.fontWeight = "700";
  const my = document.createElement("a");
  my.href = "/YB/auth/mypage.html";
  my.textContent = "내 정보";
  my.title = "내 정보 보기 · 고치기";
  const out = document.createElement("a");
  out.href = "#"; out.textContent = "로그아웃";
  out.addEventListener("click", async (e) => {
    e.preventDefault(); await sb.auth.signOut(); location.reload();
  });
  el.append(st, my, out);

  const mk = (href, text, gold) => {
    const a = document.createElement("a");
    a.href = href; a.textContent = text;
    a.style.color = gold ? "#e8c876" : "inherit";
    a.style.fontWeight = "600";
    return a;
  };
  // 승인된 회원이면 누구나 — 제 소속의 사용통계를 봅니다
  if (p && (p.approved || p.is_admin)) el.append(mk("/YB/stats.html", "사용통계"));
  // 로그인만 했으면 누구나 — 제 정보 고치기
  el.append(mk("/YB/auth/mypage.html", "[MyPage]"));

  if (p && p.is_admin) {
    el.append(mk("/YB/admin/members.html?org=" + org, "⚙ 회원관리", 1),
              mk("/YB/admin/gallery.html?org=" + org, "⚙ 갤러리 관리", 1),
              mk("/YB/admin/index.html", "⚙ 글 가져오기", 1));
  }
}

/** 예전 이름 (학생회 전용) — 남아 있는 호출을 위해 */
export const applyYB = (title) => applyNav("YB", title);

/* ─── 휴대전화에서 쓰는 메뉴 ──────────────────────────────────
   넓은 화면은 지금 그대로 둡니다. 900px 아래에서만 ☰ 단추가 나오고,
   누르면 메뉴가 아래로 펼쳐집니다.

   그동안 휴대전화에서는
     · 메뉴줄이 아예 숨겨져 있었고 (900px 아래에서 display:none)
     · 손가락으로는 마우스 올리기(:hover)가 되지 않아 드롭다운도 안 열렸고
     · 맨 윗줄 링크가 한 글자씩 세로로 쪼개져 보였습니다.

   머리글 모양이 두 가지라 둘 다 손봅니다.
     첫 화면        header.site > .container > nav.gnb
     그 밖의 화면   .mhead     > .inner     > nav                        */

const MNAV_HEADS = [
  { head: ".mhead", inner: ".inner", nav: "nav" },
  { head: "header.site", inner: ".container", nav: "nav.gnb" },
];

const MNAV_CSS = `
.mhead .burger,header.site .burger{display:none;margin-left:auto;background:transparent;
  border:1px solid rgba(255,255,255,.42);border-radius:9px;color:#fff;
  padding:7px 12px;font-size:19px;line-height:1;cursor:pointer;}
.mhead .burger:active,header.site .burger:active{background:rgba(255,255,255,.14);}
@media (max-width:900px){
  .mhead .burger,header.site .burger{display:block;}
  .mhead .inner{gap:10px;}
  header.site .container{gap:10px;height:64px;}
  .mhead,header.site{top:0 !important;}

  .mhead.mopen nav,header.site.mopen nav.gnb{
    display:flex !important;position:absolute;left:0;right:0;top:100%;
    flex-direction:column;align-items:stretch;gap:0;margin:0;
    background:#0d1830;border-top:1px solid rgba(255,255,255,.12);
    box-shadow:0 14px 26px rgba(0,0,0,.38);
    max-height:calc(100vh - 120px);overflow-y:auto;
    -webkit-overflow-scrolling:touch;padding:6px 0 12px;}
  .mhead.mopen nav .dd,header.site.mopen nav.gnb .dd{position:static;}
  .mhead.mopen nav > a,.mhead.mopen nav .dd > a,
  header.site.mopen nav.gnb > a,header.site.mopen nav.gnb .dd > a{
    display:block;padding:13px 22px;font-size:16px;font-weight:600;
    color:#fff;border-bottom:none;white-space:nowrap;}
  .mhead.mopen nav > a:active,.mhead.mopen nav .dd > a:active,
  header.site.mopen nav.gnb > a:active,header.site.mopen nav.gnb .dd > a:active{
    background:rgba(255,255,255,.09);}
  .mhead.mopen .dd-menu,header.site.mopen .dd-menu{
    position:static;display:flex !important;transform:none;min-width:0;
    padding:0 0 8px;gap:0;}
  .mhead.mopen .dd-menu a,header.site.mopen .dd-menu a{
    display:block;text-align:left;white-space:nowrap;padding:10px 22px 10px 40px;
    font-size:14px;font-weight:400;color:rgba(255,255,255,.72);
    background:transparent;border:none;border-radius:0;box-shadow:none;}
  .mhead.mopen .dd-menu a:active,header.site.mopen .dd-menu a:active{
    background:rgba(255,255,255,.1);color:#fff;transform:none;}
  .mpills.mpills-m{display:flex !important;flex-wrap:wrap;gap:7px;margin-top:6px;
    padding:12px 22px 2px;border-top:1px solid rgba(255,255,255,.1);}

  /* 맨 윗줄이 한 글자씩 세로로 쪼개지지 않게 */
  .topbar .inner,.utilbar .container{flex-wrap:wrap;row-gap:5px;gap:10px;}
  .topbar .links,.utilbar .links{flex-wrap:wrap;gap:7px 14px;min-width:0;}
  .topbar a,.utilbar a{white-space:nowrap;}
}
body.yb .mhead.mopen nav,body.yb header.site.mopen nav.gnb{background:#0f2a1c;}
`;

/** ☰ 단추를 달고, 눌렀을 때 메뉴가 펼쳐지게 한다. */
export function mobileNav() {
  if (!document.getElementById("mnav-style")) {
    const st = document.createElement("style");
    st.id = "mnav-style";
    st.textContent = MNAV_CSS;
    document.head.appendChild(st);
  }
  MNAV_HEADS.forEach((sel) => {
    const head = document.querySelector(sel.head);
    if (!head) return;
    const inner = head.querySelector(sel.inner);
    const nav = head.querySelector(sel.nav);
    if (!inner || !nav) return;

    const btnOf = () => head.querySelector(".burger");
    const close = () => {
      head.classList.remove("mopen");
      const b = btnOf();
      if (b) { b.textContent = "☰"; b.setAttribute("aria-label", "메뉴 열기");
               b.setAttribute("aria-expanded", "false"); }
    };
    const open = () => {
      // 밴드·페이스북 같은 단추도 메뉴 아래에 함께 넣어 드립니다
      const pills = head.querySelector(".mpills:not(.mpills-m)");
      if (pills && !nav.querySelector(".mpills-m")) {
        const m = document.createElement("div");
        m.className = "mpills mpills-m";
        m.innerHTML = pills.innerHTML;
        nav.appendChild(m);
      }
      head.classList.add("mopen");
      const b = btnOf();
      if (b) { b.textContent = "✕"; b.setAttribute("aria-label", "메뉴 닫기");
               b.setAttribute("aria-expanded", "true"); }
    };

    if (!btnOf()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "burger";
      btn.textContent = "☰";
      btn.setAttribute("aria-label", "메뉴 열기");
      btn.setAttribute("aria-expanded", "false");
      inner.insertBefore(btn, nav);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        head.classList.contains("mopen") ? close() : open();
      });
    }

    if (!head.dataset.mnav) {
      head.dataset.mnav = "1";
      nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
      document.addEventListener("click", (e) => {
        if (head.classList.contains("mopen") && !head.contains(e.target)) close();
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
      window.addEventListener("resize", () => { if (window.innerWidth > 900) close(); });
    }
  });
}
