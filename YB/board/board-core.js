import { sb, currentUser, myProfile } from "/YB/auth/auth.js";
// ─── 게시판 목록 화면 (총동문회 OB · 학생회 YB 공용 엔진) ────────
// 화면 파일은 OB/ · YB/ 폴더에 따로 두고, 동작은 이 파일 하나를 함께 씁니다.
// 그래서 한쪽만 고쳐져 서로 어긋나는 일이 생기지 않습니다.
import { applyNav } from "/YB/board/nav.js?v=318";
import { boardInfo, boardTags, tagInfo } from "/YB/board/board-info.js?v=318";
import { loadLikes, toggleLike, heart } from "/YB/auth/likes.js?v=318";

/* 옮겨온 글의 지은이에는 소속·직함이 함께 붙어 있는 경우가 많습니다.
   («학98.석02.박04.남지현 도시 Ph.D», «경희대 화공과 이용택» 처럼)
   보기 좋게 이름만 남깁니다. 원래 적힌 말은 마우스를 올리면 그대로 보입니다. */
function shortName(s) {
  let t = String(s == null ? "" : s).trim();
  if (!t) return "";
  t = t.replace(/^(?:[가-힣]\s*\d{2}\s*\.)+/g, "");     // 학98.석02.박04.
  t = t.replace(/\s*\([^)]*\)\s*/g, " ").trim();       // (주) 같은 괄호
  const parts = t.split(/[\s,·]+/).filter(Boolean);
  if (parts.length <= 1) return t;
  const isName = (w) => /^[가-힣]{2,4}$/.test(w) && !/[대과원회부팀실국소사점처장]$/.test(w);
  const found = parts.find(isName);
  if (found) return found;
  if (!/[가-힣]/.test(t)) return parts.slice(0, 2).join(" ");   // 영문 이름
  return parts[0];
}

/* 전공별모임 — 동경대 공식 학부·연구과와 우리 말머리를 견주어 보여줍니다.
   (출처: u-tokyo.ac.jp 학부·대학원등) 접었다 펼 수 있게 두어 목록을 가리지 않습니다. */
const MAJOR_GUIDE = [
  ["농학부 · 농학생명과학연구과", "농학부"],
  ["공학부 건축학과 · 공학계연구과 건축학전공", "건축학"],
  ["사회기반학과 · 도시공학과 · 환경계 · 신영역창성과학연구과", "도시환경토목(C.U.E)"],
  ["전기전자공학 · 기계공학 · 기계정보공학 · 계측공학 · 시스템창성", "전기·기계"],
  ["공학부 항공우주공학과 · 공학계연구과 항공우주공학전공", "항공우주"],
  ["정보이공학계연구과 · 정보학환·학제정보학부", "정보이공"],
  ["의학부(의학과·건강총합과학과) · 약학부 · 의학계 · 약학계연구과 · 의과학연구소", "의학·약학·간호학"],
  ["이학부 · 이학계연구과 · 수리과학연구과", "이학부"],
  ["응용화학 · 화학시스템공학 · 화학생명공학 · 머티리얼공학", "화학·응용화학·재료"],
  ["생산기술연구소 · 선단과학기술연구센터 · 물성 · 우주선(宇宙線) · 지진 · 대기해양연구소", "생산·선단과학·기술기타"],
  ["법학부 · 법학정치학연구과(정치학·국제정치) · 공공정책대학원", "법학·정치·공공정책"],
  ["경제학부(경제학과·경영학과·금융학과) · 경제학연구과", "경제·경영학"],
  ["문학부 · 교육학부 · 인문사회계연구과 · 교육학연구과 · 동양문화·사회과학연구소", "인문·사회·교육"],
  ["교양학부(국제관계론) · 총합문화연구과(국제사회과학·상관사회과학) · 코마바", "교양·총합문화"],
  ["위에 없는 소속 · 알 수 없는 경우", "기타"],
];

/** 대조표에서 쓸 글자 감싸기 (initBoard 안의 것과는 따로 둡니다) */
const mgEsc = (s) => String(s == null ? "" : s)
  .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;",
                                 '"': "&quot;", "'": "&#39;" }[c]));

function drawMajorGuide(cat) {
  const old = document.getElementById("majorGuide");
  if (old) old.remove();
  if (cat !== "major") return;
  const anchor = document.getElementById("tagTabs");
  if (!anchor || !anchor.parentNode) return;
  const d = document.createElement("details");
  d.id = "majorGuide";
  d.className = "mguide";
  d.innerHTML =
    "<summary>내 전공은 어느 말머리? — 동경대 학부·연구과 대조표</summary>" +
    "<table><thead><tr><th>동경대 공식 이름</th><th>이 게시판 말머리</th></tr></thead><tbody>" +
    MAJOR_GUIDE.map((r) =>
      "<tr><td>" + mgEsc(r[0]) + "</td><td><b>" + mgEsc(r[1]) + "</b></td></tr>").join("") +
    "</tbody></table>" +
    '<p class="src">동경대학교 공식 조직 기준 · 소속이 여럿이면 학위를 받은 곳으로 골라 주세요.</p>';
  anchor.parentNode.insertBefore(d, anchor.nextSibling);
}

export async function initBoard(ORG) {
  const HOME = ORG === "YB" ? "/YB" : "/OB";


  // ── 조직별 게시판 구성 ──
  const CAT_OB = { assembly:"총회", notice:"공지사항", free:"자유게시판", club:"소모임", major:"전공별모임(OB/YB)", mentoring:"멘토멘티(OB/YB)", condolence:"경조사",
                   forum:"포럼·세미나", seminar:"포럼·세미나",
                   jobs:"구인·채용(OB/YB)", faculty:"단과대별", news:"소식", market:"장터",
                   research:"단행본 및 연구소개",
                   suggest:"동문회에 바란다" };
  const CAT_YB = { notice:"공지사항", free:"자유게시판", qna:"Q&A", jobs:"구인·채용(OB/YB)", market:"벼룩시장",
                   club:"소모임", major:"전공별모임(OB/YB)", event:"행사", history:"활동 이력", mentoring:"멘토멘티(OB/YB)",
                   suggest:"학생회에 바란다", exam:"수험생 게시판",
                   career:"진학/취업 후기", counsel:"진로상담", scholarship:"장학·연구지원" };
  const TABS_OB = ["notice","free","jobs","condolence","research","suggest"];   // 참여마당 식구는 위 메뉴에서 들어옵니다
  const TABS_YB = ["jobs","free","qna","scholarship","market","exam","notice"];   // 소모임·행사·멘토멘티·바란다는 참여마당에서 들어옵니다
  const CAT = ORG === "YB" ? CAT_YB : CAT_OB;
  // 총동문회와 학생회가 함께 쓰는 게시판 — 이 분류에서는 양쪽 글을 모두 보여준다
  // 두 단체가 함께 쓰는 게시판은 이 둘뿐입니다.
  //   그 밖에는 총동문회와 학생회가 저마다 제 게시판을 씁니다.
  const SHARED = ["mentoring", "jobs", "major"];
  const TABS = ORG === "YB" ? TABS_YB : TABS_OB;

  applyNav(ORG, ORG === "YB" ? "게시판 | 도쿄대학 한국인학생회"
                            : "게시판 | 재한 도쿄대학 총동문회");
  // 참여마당 식구 — 위 메뉴의 참여마당 드롭다운과 같은 차례입니다
  const JOIN_OB = ["assembly", "club", "major", "mentoring", "forum"];
  const JOIN_YB = ["mentoring", "counsel", "career", "event", "club", "major", "suggest"];
  const JOIN = ORG === "YB" ? JOIN_YB : JOIN_OB;

  // 운영진이 줄에서 바로 옮길 수 있는 게시판 (게시판 줄 + 참여마당)
  const MOVE = TABS.concat(JOIN.filter(c => !TABS.includes(c)));
  /** 제목 앞의 [말머리] 만 남깁니다 */
  const bodyOf = (t) => String(t || "").replace(/^\s*[\[【][^\]】]*[\]】]\s*/, "");
  /** 제목 앞의 [말머리] 를 떼어냅니다 */
  const headOf = (t) => {
    const m = String(t || "").match(/^\s*[\[【]([^\]】]{1,20})[\]】]/);
    return m ? m[1].trim() : "";
  };

  // 분류 탭 다시 그리기
  //   위 메뉴(드롭다운)를 그대로 읽어와 아래 단추를 만듭니다.
  //   목록을 두 곳에 적어두면 언젠가 어긋나므로 한 곳만 봅니다.
  /* 「전체」를 눌렀을 때 보여줄 범위 — 지금 보고 계신 메뉴 묶음의 게시판들.
     이게 비어 있으면 홈페이지의 모든 글이 섞여 나옵니다. */
  let GROUP = [];
  {
    const q0 = new URLSearchParams(location.search);
    const cur = q0.get("cat") || "";
    const grp = q0.get("g") || "";       // 이 갈래가 든 묶음을 「전체」로 봅니다

    /** 위 메뉴의 드롭다운마다 그 안의 갈래를 뽑아옵니다 */
    const groups = [...document.querySelectorAll(".mhead .dd")].map(dd => ({
      top: (dd.querySelector("a") || {}).getAttribute
             ? (dd.querySelector("a").getAttribute("href") || "") : "",
      cats: [...dd.querySelectorAll(".dd-menu a[href*='board.html?cat=']")]
              .map(a => (a.getAttribute("href").match(/cat=([\w-]+)/) || [])[1])
              .filter(c => c && CAT[c]),
    })).filter(g => g.cats.length);

    let tabs = null;
    if (cur) {
      const g = groups.find(x => x.cats.includes(cur));       // 지금 글이 속한 메뉴
      if (g) tabs = g.cats;
    }
    if (!tabs && grp) {                                      // ?g= 로 들어온 묶음
      const g = groups.find(x => x.cats.includes(grp));
      if (g) tabs = g.cats;
    }
    if (!tabs) {                                             // 「전체」이거나 못 찾았을 때
      const g = groups.find(x => /board\.html$/.test(x.top || ""));   // 게시판 메뉴
      tabs = g ? g.cats : TABS;
    }
    if (cur && !tabs.includes(cur) && CAT[cur]) tabs = [cur].concat(tabs);

    GROUP = tabs.slice();
    document.getElementById("catTabs").innerHTML =
      '<a href="#" data-cat="">전체</a>' + tabs.map(c => `<a href="#" data-cat="${c}">${CAT[c]}</a>`).join("");
  }
  // ── 큰 제목 : 지금 보고 있는 게시판 이름으로 (참여마당에서 들어와도 「소모임 게시판」임이 한눈에) ──
  const bannerH1 = document.querySelector(".banner h1");
  const baseTitle = ORG === "YB" ? " | 도쿄대학 한국인학생회" : " | 재한 도쿄대학 총동문회";
  // 큰 제목은 갈래 이름 그대로 (위 메뉴와 같은 말이 보이도록)
  const boardName = (c) => CAT[c] || "게시판";
  const purposeEl = document.getElementById("boardPurpose");
  /** 설명 줄 — 말머리를 고르면 게시판이 아니라 그 말머리를 설명합니다 */
  function sayPurpose() {
    if (!purposeEl) return;
    if (!cat) {
      purposeEl.textContent = GROUP.length
        ? "이 묶음의 게시판 글을 한자리에서 봅니다. 위에서 하나를 고르시면 그곳 글만 보입니다."
        : "모든 게시판의 글을 한자리에서 봅니다. 위의 게시판을 고르시면 그곳 글만 보입니다.";
      return;
    }
    if (tag) {
      const t = tagInfo(cat, tag);
      purposeEl.innerHTML = `<b>[${CAT[cat] || cat}/${tag}]</b>` + (t ? ` — ${t}` : "");
      return;
    }
    const info = boardInfo(cat);
    purposeEl.innerHTML = info ? `<b>${boardName(cat)}</b> — ${info}` : "";
  }

  function setBoardTitle(c) {
    if (bannerH1) bannerH1.textContent = boardName(c);
    document.title = boardName(c) + baseTitle;
    sayPurpose();
  }

  const SRC = {
    band: '<span class="src-tag band">네이버밴드</span>',
    facebook: '<span class="src-tag fb">페이스북</span>',
    legacy: '<span class="src-tag legacy">(구)게시판</span>'
  };
  const onlyMyOrg = (q) => SHARED.includes(cat) ? q : q.eq("org", ORG);
  /* 다른 게시판에서 「여기에도 함께」 로 걸어 둔 글도 이 게시판 글과 나란히 봅니다.
     자리(also_cat)가 아직 없는 데이터베이스에서는 CROSS 를 내리고 예전처럼 봅니다. */
  let CROSS = true;
  /* 「전체」는 이 묶음 안에서만 봅니다.
     다만 검색할 때는 홈페이지 전체를 뒤집니다 —
     메뉴에서 빠진 게시판의 글도 찾을 수 있어야 하니까요. */
  const byCat = (q) => !cat
    ? ((GROUP.length && !kw) ? q.in("category", GROUP) : q)
    : CROSS ? q.or("category.eq." + cat + ",also_cat.eq." + cat)
            : q.eq("category", cat);
  const params = new URLSearchParams(location.search);
  const org = ORG;
  // 합쳐지며 없어진 옛 갈래는 새 자리로 돌립니다 (빈 껍데기 탭이 뜨지 않도록)
  const MOVED = { promo: "jobs", parttime: "jobs" };
  let cat = params.get("cat") || "";
  if (MOVED[cat]) {
    cat = MOVED[cat];
    params.set("cat", cat);
    history.replaceState(null, "", location.pathname + "?" + params.toString());
  }
  if (!CAT[cat]) cat = "";
  let kw = (params.get("q") || "").trim();          // 키워드 검색어
  let tag = (params.get("tag") || "").trim();      // 말머리로 좁혀 보기

  /** 말머리로 좁힌다 — 제목이 [말머리] 로 시작하는 글만 */
  /* 말머리로 거르기.
     옮겨온 옛 글은 【 】(전각) 을, 새 글은 [ ] (반각) 을 씁니다. 둘 다 찾습니다.
     말머리에 괄호가 든 것(도시환경토목(C.U.E))도 있어 값을 따옴표로 감쌉니다. */
  function applyTag(q) {
    if (!tag) return q;
    const t = tag.replace(/"/g, '\\"');
    return q.or('title.ilike."[' + t + ']%",title.ilike."【' + t + '】%"');
  }

  /* 글에 실제로 쓰였는데 이름표 목록(board-info.js)에는 없는 말머리.
     목록에서 말머리를 빼면 그 말머리를 단 옛 글을 걸러 볼 길이 사라집니다.
     그래서 불러온 글에서 본 말머리는 목록에 없어도 칩을 세워 둡니다. */
  const seenTags = new Set();

  /** 지금 게시판의 말머리 줄을 다시 그린다 */
  function drawTagTabs() {
    drawMajorGuide(cat);
    const box = document.getElementById("tagTabs");
    if (!box) return;
    const known = cat ? boardTags(cat) : [];
    const extra = cat ? [...seenTags].filter((t) => t && !known.includes(t)).sort() : [];
    const list = known.concat(extra);
    if (!list.length) { box.className = "tagtabs"; box.innerHTML = ""; return; }
    box.className = "tagtabs on";
    box.innerHTML = '<span class="lb">말머리</span>' +
      `<a data-t=""${tag ? "" : ' class="on"'}>전체</a>` +
      list.map(t => `<a data-t="${t}"${t === tag ? ' class="on"' : ""}>${t}</a>`).join("");
    box.querySelectorAll("a[data-t]").forEach(a => a.addEventListener("click", () => {
      tag = a.dataset.t || "";
      drawTagTabs();
      sayPurpose();
      keepUrl();
      load();
    }));
  }

  /** 주소에도 남겨두어 새로고침해도 그대로 보이게 */
  function keepUrl() {
    const u = new URLSearchParams(location.search);
    if (cat) u.set("cat", cat); else u.delete("cat");
    if (tag) u.set("tag", tag); else u.delete("tag");
    history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
  }

  /** 검색어를 PostgREST 조건문에 넣을 수 있는 형태로 다듬는다 */
  function likeOf(s) {
    return "%" + String(s).replace(/[,()%]/g, " ").trim() + "%";
  }
  function applySearch(q) {
    if (!kw) return q;
    const L = likeOf(kw);
    return q.or(`title.ilike.${L},content.ilike.${L},author_name.ilike.${L}`);
  }
  function showSearchState() {
    const box = document.getElementById("q");
    const clr = document.getElementById("qClr");
    const msg = document.getElementById("qMsg");
    if (box) box.value = kw;
    clr.classList.toggle("on", !!kw);
    msg.innerHTML = kw ? `<b>‘${kw}’</b> 로 찾은 글입니다.` : "";
  }
  function runSearch(word) {
    kw = (word || "").trim();
    showSearchState();
    if (typeof memberOnlyBlocked !== "undefined") memberOnlyBlocked = null;
    load();
  }
  document.getElementById("qGo").addEventListener("click",
    () => runSearch(document.getElementById("q").value));
  document.getElementById("qClr").addEventListener("click", () => runSearch(""));
  document.getElementById("q").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); runSearch(e.target.value); }
  });
  document.getElementById("q").addEventListener("search", (e) => {   // ✕ 눌러 비웠을 때
    if (!e.target.value.trim() && kw) runSearch("");
  });
  showSearchState();

  document.querySelectorAll("#catTabs a[data-cat]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      cat = a.dataset.cat || "";
      tag = "";                                   // 게시판을 바꾸면 말머리는 푼다
      seenTags.clear();                           // 앞 게시판의 말머리를 물고 가지 않게
      setBoardTitle(cat);
      drawTagTabs();
      keepUrl();
      if (typeof memberOnlyBlocked !== "undefined") memberOnlyBlocked = null;
      document.querySelectorAll("#catTabs a[data-cat]").forEach(x => x.classList.remove("on"));
      a.classList.add("on");
      load();
    });
  });
  (document.querySelector('#catTabs a[data-cat="' + cat + '"]') || document.querySelector('#catTabs a[data-cat=""]')).classList.add("on");

  setBoardTitle(cat);   // 주소로 들어온 분류 기준 (비회원 안내로 바뀌기 전의 값)
  drawTagTabs();
  sayPurpose();

  const HOME_NAME  = "도쿄대학 한국인학생회";
  const OTHER_NAME = "재한 도쿄대학 총동문회";
  const OTHER_HOME = "/OB";

  // 로그인 상태 표시 + 비로그인 시 공개 게시판만 노출
  // 수험생 게시판은 진학을 알아보는 분이 로그인 없이 읽을 수 있어야 뜻이 있습니다.
  // 다만 글쓰기는 로그인·승인을 거쳐야 하므로 읽기만 열립니다.
  const PUBLIC_CATS = ["notice", "exam"];                    // 로그인 없이 볼 수 있는 곳
  const GUEST_CATS  = ["notice", "exam", "scholarship"];     // 비동문 준회원께도 열어드리는 곳
  let openCats = PUBLIC_CATS;                 // 지금 보시는 분께 열려 있는 곳
  let memberOnlyBlocked = null;
  let otherOrg = false;              // 다른 쪽 단체 회원이신가
  let isGuest = false;               // 비동문 준회원이신가
  let isAdmin = false;               // 운영진이면 글을 지울 수 있습니다
  const user = await currentUser();
  if (user) {
    const p = await myProfile();
    // 제 쪽 사람만 회원 전용 게시판을 봅니다 (운영진은 양쪽 모두)
    const mtype = (p && p.member_type) || "";
    isGuest = mtype === "GUEST";                // 도쿄대 출신이 아닌 준회원
    const side = mtype === "YB" ? "YB" : "OB";
    otherOrg = !!(p && !p.is_admin && (isGuest || side !== ORG));
    if (isGuest) openCats = GUEST_CATS;         // 준회원은 공지사항과 수험생 게시판까지
    isAdmin = !!(p && p.is_admin);
    const el = document.getElementById("authLinks");
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
    out.addEventListener("click", async (e) => { e.preventDefault(); await sb.auth.signOut(); location.reload(); });
    el.append(st, my, out);
    // 로그인한 회원에게 — 제 소속의 사용통계
    {
      const sa = document.createElement("a");
      sa.href = "/YB/stats.html";
      sa.textContent = "사용통계";
      el.append(sa);
    }
    // 로그인만 했으면 누구나 — 제 정보 고치기
    {
      const mp = document.createElement("a");
      mp.href = "/YB/auth/mypage.html";
      mp.textContent = "[MyPage]";
      mp.title = "내 정보 보기 · 고치기";
      el.append(mp);
    }
    if (p && p.is_admin) {                      // 운영진 관리 메뉴
      const mk = (href, text) => { const a = document.createElement("a");
        a.href = href; a.textContent = text; a.style.color = "#e8c876"; a.style.fontWeight = "600"; return a; };
      el.append(mk("/YB/admin/members.html", "⚙ 회원관리"),
                mk("/YB/admin/gallery.html", "⚙ 갤러리 관리"));
      el.append(mk("/YB/admin/index.html", "⚙ 글 가져오기"));
    }
  }

  if (!user || otherOrg) {
    const ln = document.getElementById("loginNotice");
    ln.className = "on";
    document.getElementById("catTabs").appendChild(ln);
    ln.innerHTML = isGuest
      ? `<b>비동문 준회원이십니다.</b> 공지사항과 수험생 게시판을 보실 수 있습니다. ` +
        `그 밖의 게시판은 ${HOME_NAME} 회원 전용입니다.`
      : otherOrg
      ? `<b>${HOME_NAME} 회원 전용 게시판입니다.</b> ` +
        `${OTHER_NAME} 회원께는 누구나 보실 수 있는 게시판만 보여드립니다.`
      : `<b>회원으로 가입하셔야 나머지 게시판 정보를 보실 수 있습니다.</b> ` +
      '<a href="/YB/auth/login.html">로그인</a> · <a href="/YB/auth/signup.html">회원가입</a>';
    // 회원 전용 탭과 「전체」 탭 숨기기
    document.querySelectorAll("#catTabs a[data-cat]").forEach(a => {
      const c = a.dataset.cat || "";
      if (!c || !openCats.includes(c)) a.style.display = "none";
    });
    if (!cat) cat = openCats[0];               // 비회원은 「전체」 대신 공개 게시판부터
    if (cat && !openCats.includes(cat)) {      // 회원 전용 게시판으로 바로 들어온 경우
      memberOnlyBlocked = CAT[cat] || cat;
    }
  }

  /* 비동문 준회원은 구인·채용에만 글을 쓰실 수 있습니다.
     자료방에도 같은 규칙이 서 있으니 이 단추는 헛걸음을 막는 안내입니다. */
  (async () => {
    const btn = document.getElementById("writeBtn");
    if (!btn) return;
    let mine = null;
    try { mine = await myProfile(); } catch (e) { return; }
    if (!mine || mine.is_admin) return;
    if (mine.grade === "associate") {              // 준회원 — 다 보시되 쓰지는 않습니다
      btn.classList.add("locked");
      btn.dataset.why = "assoc";
      btn.title = "준회원은 글을 올리실 수 없습니다 — 읽기는 모두 열려 있습니다";
      return;
    }
    const guest = (mine.grade === "guest") ||
                  (mine.member_type === "GUEST" && mine.grade !== "member");
    if (!guest) return;
    if (cat === "jobs" || cat === "exam") return;   // 이 두 곳은 그대로 쓰십니다
    btn.classList.add("locked");
    btn.dataset.why = "guest";
    btn.title = "Guest 는 구인·채용과 수험생 게시판에만 글을 올리실 수 있습니다";
  })();

  document.getElementById("writeBtn").addEventListener("click", async (ev) => {
    if (!user) { location.href = "/YB/auth/login.html"; return; }
    const btn = ev.currentTarget;
    if (btn.classList.contains("locked")) {
      const NL2 = String.fromCharCode(10);
      alert(btn.dataset.why === "assoc"
        ? "준회원은 글을 올리실 수 없습니다." + NL2 + NL2 +
          "게시판과 갤러리는 모두 보실 수 있습니다." + NL2 +
          "글을 쓰셔야 한다면 운영진에게 알려 주세요."
        : "Guest 는 구인·채용과 수험생 게시판에만 글을 올리실 수 있습니다." + NL2 + NL2 +
          "동문이신데 Guest 로 되어 있다면 운영진에게 알려 주세요.");
      return;
    }
    const qs = [];
    if (cat) qs.push("cat=" + cat);
    location.href = HOME + "/write.html" + (qs.length ? "?" + qs.join("&") : "");
  });

  const PAGE = 100;
  const PAGED = ORG === "YB";   // 학생회 게시판은 「더 보기」 대신 쪽번호로 넘긴다
  let loaded = [];          // 지금까지 불러온 글
  let total = 0;            // 전체 건수
  let pageNo = 1;           // 지금 보고 있는 쪽
  const listEl = document.getElementById("list");
  const moreBox = document.getElementById("moreBox");
  const moreBtn = document.getElementById("moreBtn");
  const countInfo = document.getElementById("countInfo");

  moreBtn.addEventListener("click", () => load(true));

  async function load(append = false, keepTotal = false) {
    if (memberOnlyBlocked) {   // 비로그인 상태에서 회원 전용 게시판 요청
      if (otherOrg) {
        listEl.innerHTML = `<div class="empty"><b>${memberOnlyBlocked}</b> 게시판은 ` +
          `${HOME_NAME} 회원 전용입니다.<br>` +
          `${OTHER_NAME} 회원께는 열려 있지 않습니다.<br><br>` +
          `<a class="btn dark" href="${OTHER_HOME}/board.html">${OTHER_NAME} 게시판으로</a></div>`;
        moreBox.style.display = "none";
        document.getElementById("statBox").innerHTML = "";
        return;
      }
      listEl.innerHTML = `<div class="empty"><b>${memberOnlyBlocked}</b> 게시판은 회원 전용입니다.<br><br>` +
        '<a class="btn dark" href="/YB/auth/login.html">로그인</a> ' +
        '<a class="btn line" href="/YB/auth/signup.html">회원가입</a></div>';
      moreBox.style.display = "none";
      document.getElementById("statBox").innerHTML = "";
      return;
    }
    if (!append) { loaded = []; listEl.innerHTML = '<div class="empty">불러오는 중…</div>'; moreBox.style.display = "none"; }
    else { moreBtn.disabled = true; moreBtn.textContent = "불러오는 중…"; }

    // 전체 건수 (첫 로드 때만 · 쪽만 넘길 때는 그대로 둔다)
    if (!append && !keepTotal) {
      pageNo = 1;
      let cq = onlyMyOrg(sb.from("posts").select("id", { count: "exact", head: true }));
      cq = byCat(cq);
      cq = applyTag(cq);
      cq = applySearch(cq);
      const { count } = await cq;
      total = count || 0;
    }

    // 알림으로 고정된 글은 늘 맨 위에 (검색 중에는 빼고 결과만 보여준다)
    let pins = [];
    if (!append && !kw && (!PAGED || pageNo === 1)) {
      let pq = onlyMyOrg(sb.from("posts")
        .select("id,title,org,category,author_name,visibility,source,image_url,created_at,pinned")
        .eq("pinned", true))
        .order("pinned_at", { ascending: false });
      pq = byCat(pq);
      pq = applyTag(pq);
      const pr = await pq;
      pins = pr.data || [];          // 표에 pinned 칸이 없으면 조용히 넘어간다
    }

    let q = onlyMyOrg(sb.from("posts")
      .select("id,title,org,category,author_name,visibility,source,image_url,created_at,pinned"))
      .order("created_at", { ascending: false })
      .range(PAGED ? (pageNo - 1) * PAGE : loaded.length,
             (PAGED ? (pageNo - 1) * PAGE : loaded.length) + PAGE - 1);
    q = byCat(q);
    q = applyTag(q);
    q = applySearch(q);
    const { data, error } = await q;

    moreBtn.disabled = false;
    moreBtn.textContent = "더 보기";

    if (error && CROSS && /also_cat|column|schema cache/i.test(error.message || "")) {
      CROSS = false;                       // 자리가 아직 없으면 예전 방식으로 한 번 더
      return load(append);
    }
    if (error) { listEl.innerHTML = '<div class="empty">게시판을 불러오지 못했습니다. (' + error.message + ')</div>'; drawStat([]); return; }
    // 이 게시판이 제집이 아닌 글은 「함께」 로 표시합니다
    if (cat) (data || []).forEach(x => { x.__also = x.category !== cat; });
    if ((!data || data.length === 0) && !append) {
      listEl.innerHTML = kw
        ? `<div class="empty"><b>‘${kw}’</b> 에 해당하는 글이 없습니다.<br><br>` +
          '다른 낱말로 찾아보시거나, 위의 ✕ 검색 해제를 눌러주세요.</div>'
        : tag
          ? `<div class="empty"><b>[${tag}]</b> 로 쓴 글이 아직 없습니다.<br><br>` +
            '위의 <b>전체</b> 를 누르면 이 게시판의 글을 모두 보실 수 있습니다.</div>'
          : '<div class="empty">아직 게시글이 없습니다.</div>';
      drawStat([]); return;
    }

    loaded = PAGED ? (data || []) : loaded.concat(data || []);
    /* 불러온 글에서 본 말머리를 적어 둡니다 —
       이름표 목록에 없는 것이 있으면 말머리 줄에 칩을 세워 줍니다. */
    if (cat) {
      const before = seenTags.size;
      loaded.forEach((p) => { const h = headOf(p.title); if (h) seenTags.add(h); });
      if (seenTags.size !== before) drawTagTabs();
    }
    drawStat(loaded);
    const pinIds = new Set(pins.map(p => p.id));
    render(pins.concat(loaded.filter(p => !pinIds.has(p.id))));

    if (PAGED) { drawPager(); }
    else if (loaded.length < total) {
      moreBox.style.display = "block";
      moreBtn.style.display = "inline-block";
      countInfo.textContent = `${loaded.length} / ${total}건`;
    } else {
      moreBox.style.display = total > PAGE ? "block" : "none";
      moreBtn.style.display = "none";
      countInfo.textContent = `전체 ${total}건을 모두 불러왔습니다.`;
    }
  }

  /** 쪽번호 줄 그리기 (학생회 게시판) */
  function drawPager() {
    moreBtn.style.display = "none";
    const pages = Math.max(1, Math.ceil(total / PAGE));
    let box = document.getElementById("pager");
    if (!box) {
      box = document.createElement("div");
      box.id = "pager"; box.className = "pager";
      moreBox.insertBefore(box, countInfo);
    }
    if (pages <= 1) {
      box.innerHTML = "";
      moreBox.style.display = total ? "block" : "none";
      countInfo.textContent = total ? `전체 ${total}건` : "";
      return;
    }
    const WIN = 10;
    let a = Math.max(1, pageNo - Math.floor(WIN / 2));
    let b = Math.min(pages, a + WIN - 1);
    a = Math.max(1, b - WIN + 1);
    const link = (n, t, off) =>
      `<a href="#" data-p="${n}" class="${off ? "off" : ""}">${t}</a>`;
    let h = link(1, "« 처음", pageNo === 1) + link(Math.max(1, pageNo - 1), "‹ 이전", pageNo === 1);
    for (let i = a; i <= b; i++) h += `<a href="#" data-p="${i}" class="${i === pageNo ? "on" : ""}">${i}</a>`;
    h += link(Math.min(pages, pageNo + 1), "다음 ›", pageNo === pages) +
         link(pages, "끝 »", pageNo === pages);
    box.innerHTML = h;
    box.querySelectorAll("a").forEach(el => el.addEventListener("click", (e) => {
      e.preventDefault();
      const n = Number(el.dataset.p);
      if (!n || n === pageNo) return;
      pageNo = n;
      load(false, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    moreBox.style.display = "block";
    const from = (pageNo - 1) * PAGE + 1, to = Math.min(pageNo * PAGE, total);
    countInfo.textContent = `${from}–${to} / 전체 ${total}건 · ${pageNo} / ${pages} 쪽`;
  }

  /** 목록에 좋아요 수를 채우고, 눌렀을 때를 잇습니다.
   *  좋아요 자리(테이블)가 아직 없으면 단추를 감춰 아무 일도 없던 것처럼 둡니다. */
  async function paintLikes(data) {
    const btns = [...listEl.querySelectorAll("button[data-like]")];
    if (!btns.length) return;
    const got = await loadLikes("post", data.map(p => p.id));
    const ready = !!(got && got.n && Object.keys(got.n).length) || !!(got && got.mine && got.mine.size);
    btns.forEach(b => {
      const id = b.dataset.like;
      const n = (got.n || {})[String(id)] || 0;
      const on = !!(got.mine && got.mine.has(String(id)));
      b.classList.toggle("on", on);
      b.innerHTML = heart(on) + `<span class="n">${n || ""}</span>`;
      b.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();      // 줄을 누른 것으로 새지 않게
        if (b.disabled) return;
        b.disabled = true;
        const r = await toggleLike("post", id, b.classList.contains("on"));
        b.disabled = false;
        if (!r) return;
        b.classList.toggle("on", r.on);
        b.innerHTML = heart(r.on) + `<span class="n">${r.n || ""}</span>`;
      });
    });
  }

  function render(data) {
    listEl.innerHTML = data.map(p => `
      <a class="row${p.pinned ? " pinned" : ""}" href="${HOME}/post.html?id=${p.id}">
        <span class="chip ${p.pinned ? "notice-pin" : p.category}">${p.pinned ? "알림" : (CAT[p.category] || p.category)}</span>
        ${p.__also ? '<span class="alsochip" title="다른 게시판에 올린 글을 여기에도 함께 걸어 두었습니다">함께</span>' : ""}
        ${headOf(p.title) ? `<span class="tagchip">${escapeHtml(headOf(p.title))}</span>` : ""}
        <span class="t">${escapeHtml(bodyOf(p.title))}${p.visibility === "members" ? '<span class="lock">회원전용</span>' : ""}</span>
        ${p.image_url ? `<img class="thumb" src="${p.image_url}" alt="">` : ""}
        <span class="meta">
          <span class="mrow">${SRC[p.source] || ""}<span class="who" title="${escapeHtml(p.author_name || "")}">${escapeHtml(shortName(p.author_name))}</span><span class="chip org-${p.org}">${p.org === "ALL" ? "공통" : p.org}</span></span>
          <span class="dt">${p.created_at.slice(0,10)}</span>
          <button class="rowlike" type="button" data-like="${p.id}" title="좋아요">${heart(false)}<span class="n"></span></button>
        </span>
        ${isAdmin ? `<span class="mv">
            <select class="mvc" data-id="${p.id}" title="다른 게시판으로 옮기기">${
              MOVE.concat(MOVE.includes(p.category) ? [] : [p.category]).map(c =>
                `<option value="${c}"${c === p.category ? " selected" : ""}>${CAT[c] || c}</option>`).join("")
            }</select>
            <select class="mvt" data-id="${p.id}" title="말머리 바꾸기">${
              /* 이 글이 단 말머리가 목록에 없어도 한 자리를 내어 줍니다 —
                 안 그러면 맞는 option 이 없어 「말머리 없음」 으로 보이고,
                 무심코 건드리면 말머리가 지워집니다. */
              ((h) => ["", ...boardTags(p.category)]
                .concat(h && !boardTags(p.category).includes(h) ? [h] : []))(headOf(p.title))
              .map(t =>
                `<option value="${t}"${t === headOf(p.title) ? " selected" : ""}>${t || "말머리 없음"}</option>`).join("")
            }</select>
          </span>` : ""}
        ${isAdmin ? `<button class="del" type="button" data-del="${p.id}" title="이 글 지우기">✕</button>` : ""}
      </a>`).join("");

    paintLikes(data);

    // ── 운영진 : 줄에서 바로 게시판·말머리 바꾸기 ──
    listEl.querySelectorAll(".mv select").forEach(sel => {
      sel.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
      sel.addEventListener("change", async (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = sel.dataset.id;
        const row = loaded.find(x => String(x.id) === String(id));
        if (!row) return;
        sel.disabled = true;

        let patch = null;
        if (sel.classList.contains("mvc")) {
          patch = { category: sel.value };
        } else {
          const body = (row.title || "").replace(/^\s*[\[【][^\]】]*[\]】]\s*/, "");
          patch = { title: sel.value ? "[" + sel.value + "] " + body : body };
        }
        const { error } = await sb.from("posts").update(patch).eq("id", id);
        sel.disabled = false;
        if (error) {
          alert(/posts_category_check/.test(error.message || "")
            ? "아직 준비 전인 게시판입니다 — 해당 SQL 을 먼저 실행해주세요."
            : "바꾸지 못했습니다: " + error.message);
          return;
        }
        Object.assign(row, patch);
        load(false, true);          // 목록을 다시 그립니다
      });
    });

    // ── 운영진 : 글 지우기 ──
    listEl.querySelectorAll("button[data-del]").forEach(b => b.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();          // 글로 넘어가지 않도록
      const id = b.dataset.del;
      const row = b.closest(".row");
      const title = row.querySelector(".t") ? row.querySelector(".t").textContent.trim() : "";
      if (!confirm("이 글을 지웁니다. 되돌릴 수 없습니다.\n\n" + title.slice(0, 60))) return;
      b.disabled = true;
      const { error } = await sb.from("posts").delete().eq("id", id);
      if (error) { alert("지우지 못했습니다: " + error.message); b.disabled = false; return; }
      loaded = loaded.filter(x => String(x.id) !== String(id));
      total = Math.max(0, total - 1);
      row.remove();
    }));
  }

  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // ─── 말머리(분류 또는 [말머리]) 비율 파이차트 ───
  const PIE_COLORS = ["#c9a24b","#2e6a8f","#3f6a3a","#9a5a2b","#7a5494","#8a6d2b","#4a6a6a","#a05252","#556b8d","#7d8a5a"];
  function drawStat(rows) {
    const box = document.getElementById("statBox");
    if (!rows.length) { box.innerHTML = ""; return; }
    const counts = {};
    rows.forEach(p => {
      let key;
      if (cat) { // 특정 게시판: 제목 앞 [말머리] 기준
        const m = (p.title || "").match(/^\s*[\[【]([^\]】]{1,12})[\]】]/);
        key = m ? m[1].trim() : "일반";
      } else {  // 전체: 게시판 분류 기준
        key = CAT[p.category] || p.category;
      }
      counts[key] = (counts[key] || 0) + 1;
    });
    const items = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);
    const total = items.reduce((s,[,v]) => s+v, 0);
    if (items.length < 2) { box.innerHTML = ""; return; }

    const R = 42, C = 50;
    let acc = 0;
    const paths = items.map(([k,v], i) => {
      const frac = v/total, a0 = acc*2*Math.PI - Math.PI/2;
      acc += frac;
      const a1 = acc*2*Math.PI - Math.PI/2;
      const x0 = C+R*Math.cos(a0), y0 = C+R*Math.sin(a0);
      const x1 = C+R*Math.cos(a1), y1 = C+R*Math.sin(a1);
      const large = frac > 0.5 ? 1 : 0;
      const d = frac >= 0.999
        ? `M ${C} ${C-R} A ${R} ${R} 0 1 1 ${C-0.01} ${C-R} Z`
        : `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
      return `<path d="${d}" fill="${PIE_COLORS[i % PIE_COLORS.length]}" stroke="#fff" stroke-width="1"/>`;
    }).join("");

    const legend = items.map(([k,v], i) =>
      `<span class="pieitem" data-k="${escapeHtml(k)}"><i style="background:${PIE_COLORS[i % PIE_COLORS.length]}"></i>${escapeHtml(k)} <b>${Math.round(v/total*100)}%</b> <span style="color:#a8a291;">(${v})</span></span>`
    ).join("");

    box.innerHTML = `<div class="stat">
        <svg class="pie" width="100" height="100" viewBox="0 0 100 100">${paths}</svg>
        <div>
          <div class="stitle">${cat ? "말머리 비율" : "게시판 분류 비율"} · 총 ${total}건</div>
          <div class="legend">${legend}</div>
        </div>
      </div>`;

    /* 이름을 누르면 그 말머리(또는 그 게시판)만 봅니다. 다시 누르면 풀립니다. */
    box.querySelectorAll(".pieitem").forEach(el => el.addEventListener("click", () => {
      const k = el.dataset.k;
      if (cat) {                                  // 말머리 비율일 때
        tag = (tag === k) ? "" : k;
        drawTagTabs();
        document.querySelectorAll("#tagTabs a[data-t]").forEach(a =>
          a.classList.toggle("on", (a.dataset.t || "") === tag));
      } else {                                    // 게시판 분류 비율일 때
        const hit = Object.keys(CAT).find(c => CAT[c] === k);
        if (!hit) return;
        cat = hit; tag = ""; seenTags.clear();
        setBoardTitle(cat); drawTagTabs();
        document.querySelectorAll("#catTabs a[data-cat]").forEach(a =>
          a.classList.toggle("on", (a.dataset.cat || "") === cat));
      }
      keepUrl();
      load();
    }));
  }

  load();
}
