// ─── 게시판 글보기 화면 (총동문회 OB · 학생회 YB 공용 엔진) ────────
// 화면 파일은 OB/ · YB/ 폴더에 따로 두고, 동작은 이 파일 하나를 함께 씁니다.
import { sb, currentUser, myProfile, noteActivity, fixEnter } from "/OB/auth/auth.js";
import { loadLikes, toggleLike, heart } from "/OB/auth/likes.js";
import { applyNav } from "/OB/board/nav.js?v=318";
import { boardTags } from "/OB/board/board-info.js?v=318";
import { findDates } from "/OB/board/calendar.js?v=318";

/** 글자를 화면에 안전하게 넣기 위한 다듬기 */
function esc(t) {
  return String(t == null ? "" : t)
    .replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/** 붙인 파일이 사진인지 (열어보지 않아도 이름·종류로 알 수 있습니다) */
function isImageFile(f) {
  if (!f) return false;
  if (typeof f.type === "string" && f.type.indexOf("image/") === 0) return true;
  return /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i.test(f.name || f.path || "");
}

/** 붙인 사진은 내려받지 않아도 글 밑에서 바로 보이게 한다 */
function attachedImages(list) {
  if (!Array.isArray(list)) return "";
  const imgs = list.filter(isImageFile);
  if (!imgs.length) return "";
  const cells = imgs.map(f => {
    const { data } = sb.storage.from("board").getPublicUrl(f.path);
    return `<a href="${data.publicUrl}" target="_blank" rel="noopener">` +
           `<img src="${data.publicUrl}" alt="${esc(f.name)}" loading="lazy"></a>`;
  }).join("");
  return `<div class="pgal">${cells}</div>`;
}

/** 붙인 파일이 PDF 문서인지 */
function isPdfFile(f) {
  if (!f) return false;
  if (typeof f.type === "string" && f.type.indexOf("application/pdf") === 0) return true;
  return /\.pdf$/i.test(f.name || f.path || "");
}

/** 붙인 PDF 도 사진처럼 글 밑에서 바로 넘겨볼 수 있게 자리를 만든다.
 *  (실제 그림으로 바꾸는 일은 아래 showPdfs 에서 합니다) */
function attachedPdfs(list) {
  if (!Array.isArray(list)) return "";
  const pdfs = list.filter(isPdfFile);
  if (!pdfs.length) return "";
  return pdfs.map(f => {
    const { data } = sb.storage.from("board").getPublicUrl(f.path);
    return `<div class="ppdf" data-pdf="${esc(data.publicUrl)}">` +
           `<div class="ppdf-t"><span>📄</span>${esc(f.name)}` +
           `<a href="${esc(data.publicUrl)}" target="_blank" rel="noopener">새 창에서 보기 →</a></div>` +
           `<div class="ppdf-pages"><div class="ppdf-msg">문서를 여는 중…</div></div></div>`;
  }).join("");
}

/** 자리에 놓인 PDF 를 한 쪽씩 그림으로 그려 넣는다 */
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

export async function showPdfs() {
  const boxes = Array.prototype.slice.call(document.querySelectorAll(".ppdf"));
  if (!boxes.length) return;
  const MAX_PAGES = 30;              // 아주 긴 문서는 앞쪽까지만
  const V = "4.7.76";

  const asLink = (b, why) => {
    const url = b.dataset.pdf;
    b.querySelector(".ppdf-pages").innerHTML =
      `<div class="ppdf-msg">${why}<br><a href="${url}" target="_blank" rel="noopener">문서 열어보기 →</a></div>`;
  };

  // 브라우저는 화면에 보이지 않는 탭에서 그리기를 멈춥니다.
  // 그래서 「보이게 됐을 때」 · 「그 자리까지 내려왔을 때」를 기다렸다가 그립니다.
  const whenVisible = () => document.visibilityState === "visible" ? Promise.resolve()
    : new Promise(done => {
        const h = () => {
          if (document.visibilityState !== "visible") return;
          document.removeEventListener("visibilitychange", h);
          done();
        };
        document.addEventListener("visibilitychange", h);
      });
  const whenInView = (el) => new Promise(done => {
    if (typeof IntersectionObserver !== "function") return done();
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect(); done();
    }, { rootMargin: "600px" });
    io.observe(el);
  });

  let pdfjs;
  try {
    pdfjs = await import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${V}/build/pdf.min.mjs`);
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${V}/build/pdf.worker.min.mjs`;
  } catch (e) {
    boxes.forEach(b => asLink(b, "문서 보기 도구를 불러오지 못했습니다."));
    return;
  }

  for (const b of boxes) {
    const holder = b.querySelector(".ppdf-pages");
    try {
      await whenInView(b);
      await whenVisible();
      const doc = await pdfjs.getDocument({ url: b.dataset.pdf }).promise;
      const total = doc.numPages;
      const n = Math.min(total, MAX_PAGES);
      holder.innerHTML = "";
      const wide = Math.min(holder.clientWidth || 820, 900);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 1; i <= n; i++) {
        await whenVisible();
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: (wide / base.width) * dpr });
        const cv = document.createElement("canvas");
        cv.width = Math.floor(vp.width);
        cv.height = Math.floor(vp.height);
        cv.className = "ppdf-pg";
        await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
        // 쪽을 누르면 원본 PDF 가 새 창에서 그 쪽부터 열립니다 (거기서 확대해 보실 수 있습니다)
        const lnk = document.createElement("a");
        lnk.className = "ppdf-lnk";
        lnk.href = b.dataset.pdf + "#page=" + i;
        lnk.target = "_blank";
        lnk.rel = "noopener";
        lnk.title = `${i}쪽 — 눌러서 원본 크게 보기`;
        lnk.appendChild(cv);
        holder.appendChild(lnk);
      }
      if (total > n) {
        const more = document.createElement("div");
        more.className = "ppdf-msg";
        more.innerHTML = `모두 ${total}쪽 가운데 ${n}쪽까지 보여드립니다. ` +
          `<a href="${b.dataset.pdf}" target="_blank" rel="noopener">나머지 보기 →</a>`;
        holder.appendChild(more);
      }
    } catch (e) {
      asLink(b, "문서를 그림으로 바꾸지 못했습니다.");
    }
  }
}

/** 붙어 있는 파일 목록 */
function fileBox(list) {
  if (!Array.isArray(list) || !list.length) return "";
  const size = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + "MB"
                    : n >= 1024 ? Math.round(n / 1024) + "KB" : (n || 0) + "B";
  const rows = list.map(f => {
    // 저장된 이름은 영문·숫자뿐이라, 내려받을 때 원래 이름으로 돌려준다
    const { data } = sb.storage.from("board").getPublicUrl(f.path, { download: f.name });
    return `<a class="pfile" href="${data.publicUrl}" download="${esc(f.name)}" target="_blank" rel="noopener">` +
           `<span class="pfi">📎</span><span class="pfn">${esc(f.name)}</span>` +
           `<span class="pfs">${size(f.size)}</span></a>`;
  }).join("");
  return `<div class="pfiles"><div class="pft">첨부파일 ${list.length}개</div>${rows}</div>`;
}

export async function initPost(ORG) {
  const HOME = ORG === "YB" ? "/YB" : "/OB";


  const CAT = { notice:"공지", free:"자유", club:"소모임", mentoring:"멘토멘티",
                promo:"홍보·채용", condolence:"경조사", forum:"포럼·세미나",
                jobs:"구인", faculty:"단과대별", news:"소식", market:"장터" };
  const id = new URLSearchParams(location.search).get("id");
  const box = document.getElementById("postBox");
  const user = await currentUser();
  if (user) {
    const el = document.getElementById("authLinks");
    el.innerHTML = "";
    const st = document.createElement("span");
    st.textContent = "[로그인중]"; st.style.color = "#7fc48a"; st.style.fontWeight = "700";
    const my = document.createElement("a");
    my.href = "/OB/auth/mypage.html"; my.textContent = "내 정보";
    const out = document.createElement("a");
    out.href = "#"; out.textContent = "로그아웃";
    out.addEventListener("click", async (e) => { e.preventDefault(); await sb.auth.signOut(); location.reload(); });
    el.append(st, my, out);
    // 로그인한 회원에게 — 제 소속의 사용통계
    {
      const sa = document.createElement("a");
      sa.href = "/OB/stats.html";
      sa.textContent = "사용통계";
      el.append(sa);
    }
    // 로그인만 했으면 누구나 — 제 정보 고치기
    {
      const mp = document.createElement("a");
      mp.href = "/OB/auth/mypage.html";
      mp.textContent = "[MyPage]";
      mp.title = "내 정보 보기 · 고치기";
      el.append(mp);
    }
  }

    // ── 밴드·페이스북에 공유 ──
  function setupShare(p) {
    const box = document.getElementById("share");
    if (!box || !p) return;
    const url = location.origin + HOME + "/post.html?id=" + p.id;
    const plain = String(p.content || "")
      .replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 300);
    const body = `${p.title}

${plain}${plain.length >= 300 ? "…" : ""}

${url}`;
    const msg = document.getElementById("shMsg");

    /* 두 단체가 함께 쓰는 게시판에서는 밴드 · 페이스북 · 인스타그램을 모두 둡니다.
       화면마다 원래 있던 단추가 달라, 없는 것만 만들어 붙이고 차례를 맞춥니다. */
    {
      const SHARED = ["mentoring", "jobs", "major"];
      const want = SHARED.includes(p.category)
        ? [["shBand", "밴드에 공유", "band"],
           ["shFb", "페이스북에 공유", "fb"],
           ["shInsta", "인스타그램에 공유", "insta"]]
        : [];
      want.forEach(([id, label, cls]) => {
        if (document.getElementById(id)) return;
        const b = document.createElement("button");
        b.type = "button"; b.id = id; b.className = "btn sh " + cls; b.textContent = label;
        box.appendChild(b);
      });
      ["shBand", "shFb", "shInsta", "shCopy"].forEach((id) => {
        const b = document.getElementById(id);
        if (b) box.appendChild(b);
      });
      if (msg) box.appendChild(msg);
    }

    const on = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", fn);
    };

    on("shBand", () => {
      window.open("https://band.us/plugin/share?body=" + encodeURIComponent(body)
                  + "&route=" + encodeURIComponent(url),
                  "bandShare", "width=500,height=640");
    });
    on("shFb", () => {
      // 페이스북은 본문을 미리 채울 수 없어, 주소를 함께 복사해 드립니다
      navigator.clipboard && navigator.clipboard.writeText(body).catch(() => {});
      if (msg) msg.textContent = "글 내용을 복사했습니다. 페이스북 창에서 붙여넣기(Ctrl+V) 하세요.";
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
                  "fbShare", "width=600,height=640");
    });
    on("shInsta", () => {
      // 인스타그램도 글을 미리 채워 보낼 수 없어, 내용을 복사해 드립니다
      navigator.clipboard && navigator.clipboard.writeText(body).catch(() => {});
      if (msg) msg.textContent = "글 내용을 복사했습니다. 인스타그램에서 붙여넣기(Ctrl+V) 하세요.";
      window.open("https://www.instagram.com/", "instaShare", "noopener");
    });
    on("shCopy", () => {
      navigator.clipboard.writeText(url).then(
        () => { if (msg) msg.textContent = "주소를 복사했습니다."; },
        () => { if (msg) msg.textContent = "복사하지 못했습니다: " + url; });
    });
  }

function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
/** 글 안의 주소를 눌러서 갈 수 있게 바꾼다.
 *  글자는 먼저 안전하게 감싼 뒤에 주소만 골라 잇는다. */
function linkify(s) {
  const t = escapeHtml(s || "");
  return t.replace(
    /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w.+-]+@[\w-]+\.[\w.-]+)/g,
    (m) => {
      // 문장 끝의 마침표·괄호는 주소에서 뺀다
      let tail = "";
      const cut = m.match(/[.,;:)\]}>]+$/);
      if (cut) { tail = cut[0]; m = m.slice(0, -tail.length); }
      if (!m) return tail;
      if (m.indexOf("@") > -1 && m.indexOf("/") === -1)
        return `<a href="mailto:${m}">${m}</a>` + tail;
      const href = m.startsWith("http") ? m : "https://" + m;
      return `<a href="${href}" target="_blank" rel="noopener">${m}</a>` + tail;
    });
}

  const { data: p, error } = await sb.from("posts").select("*").eq("id", id).single();
  if (p && typeof p.images === "string") { try { p.images = JSON.parse(p.images); } catch (e) { p.images = null; } }
  if (p && typeof p.files === "string") { try { p.files = JSON.parse(p.files); } catch (e) { p.files = null; } }
  // 학생회 글이면 화면을 학생회 것으로 (초록 화면에 총동문회 메뉴가 남지 않도록)
  applyNav(ORG, ORG === "YB" ? "게시글 | 도쿄대학 한국인학생회"
                               : "게시글 | 재한 도쿄대학 총동문회");
  // 제 쪽 회원만 — 다른 단체 회원께는 누구나 보는 글만 보여드립니다
  const meP = user ? await myProfile() : null;
  const side = (meP && meP.member_type) === "YB" ? "YB" : "OB";
  const otherOrg = !!(meP && !meP.is_admin && side !== ORG);
  if (p && otherOrg && p.visibility !== "public") {
    box.innerHTML = '<div class="empty"><b>재한 도쿄대학 총동문회</b> 회원 전용 글입니다.<br>' +
      '도쿄대학 한국인학생회 회원께는 열려 있지 않습니다.<br><br>' +
      '<a class="btn dark" href="/YB/board.html">도쿄대학 한국인학생회 게시판으로</a></div>';
    return;
  }
  if (error || !p) {
    box.innerHTML = '<div class="empty">글을 찾을 수 없거나 열람 권한이 없습니다.<br><br><a class="btn line" href="' + HOME + '/board.html">목록으로</a>' +
      (user ? "" : ' <a class="btn dark" href="/OB/auth/login.html">로그인</a>') + '</div>';
  } else {
    box.innerHTML = `
      <div>
        <span class="chip org-${p.org}">${p.org === "ALL" ? "공통" : p.org}</span>
        <span class="chip ${p.category}">${CAT[p.category] || p.category}</span>
      </div>
      <h2>${escapeHtml(p.title)}</h2>
      <div class="pmeta"><span title="${escapeHtml(p.author_name || "")}">${escapeHtml(shortName(p.author_name))}</span> · ${p.created_at.slice(0,16).replace("T"," ")}</div>
      <div class="body">${linkify(p.content)}</div>
      ${(p.images && p.images.length)
          ? `<div class="pgal">${p.images.map(s => `<a href="${s}" target="_blank"><img src="${s}" alt=""></a>`).join("")}</div>`
          : (p.image_url ? `<div class="pgal"><a href="${p.image_url}" target="_blank"><img src="${p.image_url}" alt=""></a></div>` : "")}
      ${attachedImages(p.files)}
      ${attachedPdfs(p.files)}
      ${fileBox(p.files)}
      <div id="galShare"></div>
      ${p.source_url ? `<div class="src"><a href="${p.source_url}" target="_blank" rel="noopener">원문 보기 →</a></div>` : ""}
      ${p.source === "facebook" ? '<div class="src">※ 페이스북 그룹에서 옮겨온 글입니다.</div>' :
        p.source === "band" ? '<div class="src">※ 네이버 밴드에서 옮겨온 글입니다.</div>' :
        p.source === "legacy" ? '<div class="src">※ (구)홈페이지 게시판에서 옮겨온 글입니다.</div>' : ""}
    `;
    showPdfs();                       // PDF 는 시간이 걸리므로 글을 먼저 보여주고 이어서 그린다
    setupShare(p);
    const meProfile = user ? await myProfile() : null;
    const canEdit = !!(user && (p.author_id === user.id || (meProfile && meProfile.is_admin)));
    if (canEdit) {
      document.getElementById("actions").style.display = "flex";
      // 운영진 : 이 글을 목록 맨 위 「알림」 으로 고정
      if (meProfile && meProfile.is_admin) {
        // 운영진 : 이 글을 다른 게시판으로 옮기기
        const mv = document.createElement("select");
        mv.className = "btn movecat";
        mv.title = "다른 게시판으로 옮기기";
        // 위 메뉴를 그대로 읽어와 [참여마당/전공별모임] 처럼 보여줍니다
        const groups = [...document.querySelectorAll(".mhead .dd")].map(dd => {
          const top = dd.querySelector("a");
          return {
            name: top ? (top.textContent || "").trim() : "",
            items: [...dd.querySelectorAll(".dd-menu a[href*='board.html?cat=']")].map(a => ({
              cat: (a.getAttribute("href").match(/cat=([\w-]+)/) || [])[1],
              label: (a.textContent || "").trim(),
            })).filter(x => x.cat),
          };
        }).filter(g => g.items.length);

        const seen = new Set();
        let opts = "";
        groups.forEach(g => {
          g.items.forEach(it => {
            if (seen.has(it.cat)) return;
            seen.add(it.cat);
            opts += `<option value="${it.cat}"${it.cat === p.category ? " selected" : ""}>` +
                    `[${g.name}/${it.label}]</option>`;
          });
        });
        if (!seen.has(p.category)) {          // 메뉴에 없는 갈래에 있던 글
          opts = `<option value="${p.category}" selected>[${CAT[p.category] || p.category}]</option>` + opts;
        }
        mv.innerHTML = '<option value="">↔ 이 글을 다른 게시판으로…</option>' + opts;
        mv.addEventListener("change", async () => {
          const to = mv.value;
          if (!to || to === p.category) return;
          const nm = (mv.options[mv.selectedIndex] || {}).text || CAT[to] || to;
          if (!confirm(`이 글을 ${nm} 으로 옮길까요?`)) { mv.value = p.category; return; }
          mv.disabled = true;
          const { error } = await sb.from("posts").update({ category: to }).eq("id", p.id);
          mv.disabled = false;
          if (error) { alert("옮기지 못했습니다: " + error.message); mv.value = p.category; return; }
          location.href = "post.html?id=" + p.id;
        });
        document.getElementById("actions").appendChild(mv);

        // 운영진 : 이 글의 말머리 바꾸기
        const headOf = (t) => {
          const m = String(t || "").match(/^\s*[\[【]([^\]】]{1,20})[\]】]/);
          return m ? m[1].trim() : "";
        };
        const tg = document.createElement("select");
        tg.className = "btn movetag";
        tg.title = "말머리 바꾸기";
        const drawTags = () => {
          const now = headOf(p.title);
          const list = boardTags(p.category);
          tg.innerHTML = '<option value="">↔ 말머리…</option>' +
            '<option value="__none">말머리 없음</option>' +
            list.map(t => `<option value="${t}"${t === now ? " selected" : ""}>${t}</option>`).join("");
          if (now && list.includes(now)) tg.value = now;
        };
        drawTags();
        tg.addEventListener("change", async () => {
          const to = tg.value;
          if (!to) return;
          const body = (p.title || "").replace(/^\s*[\[【][^\]】]*[\]】]\s*/, "");
          const title = to === "__none" ? body : "[" + to + "] " + body;
          if (title === p.title) { drawTags(); return; }
          tg.disabled = true;
          const { error } = await sb.from("posts").update({ title }).eq("id", p.id);
          tg.disabled = false;
          if (error) { alert("바꾸지 못했습니다: " + error.message); drawTags(); return; }
          location.href = "post.html?id=" + p.id;
        });
        document.getElementById("actions").appendChild(tg);

        const pin = document.createElement("button");
        pin.className = "btn pin" + (p.pinned ? " on" : "");
        pin.textContent = p.pinned ? "알림 고정 해제" : "알림으로 고정";
        pin.addEventListener("click", async () => {
          pin.disabled = true;
          const next = !p.pinned;
          const { error } = await sb.from("posts")
            .update({ pinned: next, pinned_at: next ? new Date().toISOString() : null })
            .eq("id", p.id);
          pin.disabled = false;
          if (error) {
            alert(/pinned/.test(error.message)
              ? "OB/board/sql/pinned_setup.sql 을 먼저 실행해주세요."
              : "바꾸지 못했습니다: " + error.message);
            return;
          }
          p.pinned = next;
          pin.textContent = next ? "알림 고정 해제" : "알림으로 고정";
          pin.classList.toggle("on", next);
        });
        document.getElementById("actions").appendChild(pin);

        /* 운영진 : 글 날짜 고치기 —
           옮겨 온 글이 「담은 날」로 들어가 있을 때 원래 올라간 날로 되돌립니다.
           시각은 원래 것을 그대로 두어 같은 날 글의 차례가 흐트러지지 않습니다. */
        {
          const lab = document.createElement("label");
          lab.className = "btn dateedit";
          /* 처음 보이는 날은 「행사하는 날」입니다.
             글에 적힌 날짜(달력이 읽는 것과 같은 방식)를 먼저 찾아 넣고,
             날짜가 안 적힌 글이면 글 올린 날을 그대로 둡니다. */
          let eventDay = "";
          try {
            const hit = findDates(p.title, p.content, new Date(p.created_at || Date.now()),
                                  { earliest: p.category === "condolence" });
            if (hit && hit.length) eventDay = hit[0].key;
          } catch (e) { /* 못 찾으면 글 올린 날로 */ }
          lab.title = eventDay
            ? "행사하는 날로 맞춰 두었습니다 — 고치시면 그날로 옮겨집니다"
            : "이 글이 원래 올라간 날로 고칩니다";
          const ico = document.createElement("span");
          ico.textContent = "📅";
          const inp = document.createElement("input");
          inp.type = "date";
          inp.value = eventDay || String(p.created_at || "").slice(0, 10);
          if (eventDay && eventDay !== String(p.created_at || "").slice(0, 10))
            lab.classList.add("guess");
          lab.append(ico, inp);
          inp.addEventListener("change", async () => {
            const v = inp.value;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
            const old = String(p.created_at || "");
            const time = old.slice(10) || "T12:00:00+00:00";   // 시각은 그대로
            const at = new Date(v + time);
            if (isNaN(at.getTime())) { alert("날짜를 읽지 못했습니다."); return; }
            inp.disabled = true;
            const { error } = await sb.from("posts")
              .update({ created_at: at.toISOString() }).eq("id", p.id);
            inp.disabled = false;
            if (error) { alert("고치지 못했습니다: " + error.message);
                         inp.value = old.slice(0, 10); return; }
            p.created_at = at.toISOString();
            const meta = document.querySelector(".pmeta");
            if (meta) {
              const t = meta.lastChild;
              if (t && t.nodeType === 3) t.textContent = " · " + p.created_at.slice(0, 16).replace("T", " ");
            }
            lab.classList.add("done");
            setTimeout(() => lab.classList.remove("done"), 1200);
          });
          document.getElementById("actions").appendChild(lab);
        }

        /* 운영진 : 전공별모임 ↔ 포럼·세미나 에 같은 글을 함께 걸어 둡니다.
           글을 옮기는 것이 아니라, 두 게시판에서 같은 글이 함께 보입니다. */
        {
          /* 한쪽으로만 겁니다 — 전공별모임 글을 포럼·세미나에도 걸 수 있고,
             그 반대는 두지 않습니다. */
          const PAIR = { major: ["forum", "포럼·세미나"] };
          const pair = PAIR[p.category];
          if (pair) {
            const lab = document.createElement("label");
            lab.className = "btn alsobox";
            lab.title = pair[1] + " 게시판에도 같은 글이 함께 보입니다";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = p.also_cat === pair[0];
            lab.append(cb, document.createTextNode(pair[1] + "에도 함께"));
            cb.addEventListener("change", async () => {
              cb.disabled = true;
              const { error } = await sb.from("posts")
                .update({ also_cat: cb.checked ? pair[0] : null }).eq("id", p.id);
              cb.disabled = false;
              if (error) {
                alert(/also_cat|schema cache|column/i.test(error.message || "")
                  ? "아직 준비 전입니다 — auth/cross_post.sql 을 한 번 실행해주세요."
                  : "바꾸지 못했습니다: " + error.message);
                cb.checked = !cb.checked;
                return;
              }
              p.also_cat = cb.checked ? pair[0] : null;
            });
            document.getElementById("actions").appendChild(lab);
          }
        }
      }
      document.getElementById("editBtn").addEventListener("click", () => location.href = HOME + "/write.html?edit=" + p.id);
      document.getElementById("delBtn").addEventListener("click", async () => {
        if (!confirm("이 글을 삭제할까요?")) return;
        const { error: e } = await sb.from("posts").delete().eq("id", p.id);
        if (e) alert("삭제 실패: " + e.message); else location.href = HOME + "/board.html";
      });
    }

    // ─── 좋아요 ───
    {
      const bar = document.getElementById("share") || document.getElementById("actions");
      const btn = document.createElement("button");
      btn.className = "likebtn";
      btn.type = "button";
      let on = false, n = 0;
      const paint = () => {
        btn.innerHTML = heart(on) + "<span>좋아요</span>" +
                        (n ? `<span class="n">${n}</span>` : "");
        btn.classList.toggle("on", on);
      };
      paint();
      if (bar) bar.appendChild(btn);          // 공유 줄 오른쪽 끝에
      loadLikes("post", [p.id]).then(r => {
        n = r.n[String(p.id)] || 0;
        on = r.mine.has(String(p.id));
        paint();
      });
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const r = await toggleLike("post", p.id, on);
        btn.disabled = false;
        if (!r) return;
        on = r.on; n = r.n; paint();
      });
    }


    /* 운영진 : 이 글에 붙은 사진을 갤러리 앨범으로 보냅니다.
       사진을 다시 올리지 않고 같은 파일을 가리키게 하므로 빠르고 자리도 안 먹습니다. */
    if (meProfile && meProfile.is_admin) {
      const imgs = (Array.isArray(p.files) ? p.files : []).filter(f =>
        /^image\//.test(f.type || "") || /\.(png|jpe?g|gif|webp)$/i.test(f.name || ""));
      const slot = document.getElementById("galShare");
      if (slot && imgs.length) {
        slot.className = "galshare";
        slot.innerHTML =
          '<span class="gs-t">사진 ' + imgs.length + '장을 갤러리에도</span>' +
          '<select class="gs-alb"><option value="">앨범 불러오는 중…</option></select>' +
          '<span class="gs-msg"></span>' +
          '<button type="button" class="gs-go">갤러리에 공유</button>';

        const selA = slot.querySelector(".gs-alb");
        const btn = slot.querySelector(".gs-go");
        const msg = slot.querySelector(".gs-msg");
        btn.disabled = true;

        // 만들어 둔 앨범만 보여드립니다 (앨범이 제 분류를 가지고 있습니다)
        sb.from("gallery_albums").select("album_key,title,category").eq("org", ORG)
          .then(({ data }) => {
            const list = (data || []).filter(a => a.album_key);
            if (!list.length) {
              selA.innerHTML = '<option value="">만들어 둔 앨범이 없습니다</option>';
              msg.className = "gs-msg";
              msg.textContent = "갤러리 관리에서 앨범을 먼저 만들어 주세요.";
              return;
            }
            list.sort((a, b) => String(a.category || "").localeCompare(String(b.category || "")) ||
                                String(a.title || "").localeCompare(String(b.title || ""), "ko"));
            selA.innerHTML = list.map(a =>
              '<option value="' + escapeHtml(a.album_key) + '" data-cat="' + escapeHtml(a.category || "") + '">' +
              escapeHtml(a.title || a.album_key) + '</option>').join("");
            btn.disabled = false;
          });

        btn.addEventListener("click", async () => {
          const opt = selA.selectedOptions[0];
          if (!opt || !opt.value) return;
          btn.disabled = true;
          msg.className = "gs-msg";
          msg.textContent = "보내는 중…";
          const when = (p.created_at || "").slice(0, 10);
          const rows = imgs.map((f, i) => ({
            org: ORG,
            category: opt.dataset.cat || "daily",
            album_key: opt.value,
            image_url: sb.storage.from("board").getPublicUrl(f.path).data.publicUrl,
            storage_path: f.path,
            caption: String(p.title || "").replace(/^\s*[\[【][^\]】]*[\]】]\s*/, ""),
            taken_at: when || null,
            sort: i,
            created_by: user.id,
          }));
          const { error } = await sb.from("gallery_photos").insert(rows);
          btn.disabled = false;
          if (error) {
            msg.className = "gs-msg err";
            msg.textContent = "보내지 못했습니다: " + error.message;
            return;
          }
          msg.className = "gs-msg ok";
          msg.textContent = "「" + (opt.textContent || "") + "」 앨범에 올렸습니다.";
        });
      }
    }


    /* 돌아가기 — 보고 계시던 글 모음으로 그대로 (말머리·검색어까지 살려서).
       바로 주소로 들어오셨다면 이 글이 있는 게시판으로 갑니다. */
    {
      const acts = document.getElementById("actions");
      if (acts && !document.getElementById("backToList")) {
        acts.style.display = "flex";
        const b = document.createElement("button");
        b.type = "button";
        b.id = "backToList";
        b.className = "btn line back";
        b.textContent = "← 돌아가기";
        b.addEventListener("click", () => {
          const ref = document.referrer || "";
          // 목록에서 눌러 들어오셨으면 브라우저의 「뒤로」 를 씁니다.
          //   그래야 보시던 자리·스크롤·더 보기로 펼친 글까지 그대로 돌아갑니다.
          if (ref.indexOf(location.origin) === 0 && /board\.html/.test(ref) && history.length > 1) {
            history.back();
            return;
          }
          location.href = HOME + "/board.html" + (p.category ? "?cat=" + p.category : "");
        });
        acts.insertBefore(b, acts.firstChild);
      }
    }

    noteActivity("read", 1, p.id);      // 이 글을 읽은 것으로 (같은 글은 하루 한 번)

    // ─── 댓글 ───
    const wrap = document.getElementById("cmtWrap");
    const listEl = document.getElementById("cmtList");
    const formBox = document.getElementById("cmtFormBox");
    fixEnter(document.getElementById("cmtInput"));   // 한글 엔터 바로잡기
    wrap.style.display = "block";

    const profile = meProfile;
    /* 준회원은 다 보시되 댓글은 쓰지 않습니다.
       Guest 는 구인·채용 · 수험생 두 곳에서만 씁니다.
       (자료방에도 같은 규칙이 서 있으니 여기서는 미리 알려드리는 것입니다) */
    const isAssoc = !!(profile && !profile.is_admin && profile.grade === "associate");
    const isGuest = !!(profile && !profile.is_admin &&
                       (profile.grade === "guest" ||
                        (profile.member_type === "GUEST" && profile.grade !== "member")));
    const guestOK = ["jobs", "exam"].includes(p.category);
    const canWrite = !!(profile && profile.approved) && !isAssoc && !(isGuest && !guestOK);

    if (!canWrite) {
      formBox.innerHTML = isAssoc
        ? '<div class="cmt-login">준회원은 댓글을 쓰지 않습니다 — 읽기는 모두 열려 있습니다.</div>'
        : isGuest
        ? '<div class="cmt-login">Guest 는 구인·채용 · 수험생 게시판에서만 댓글을 쓰실 수 있습니다.</div>'
        : user
        ? '<div class="cmt-login">댓글 작성은 운영진 승인이 완료된 회원만 가능합니다. (현재: 승인 대기중)</div>'
        : '<div class="cmt-login">댓글을 작성하려면 로그인이 필요합니다. <a href="/OB/auth/login.html">로그인</a> · <a href="/OB/auth/signup.html">회원가입</a></div>';
    }

    async function loadComments() {
      const { data, error } = await sb.from("comments")
        .select("id,author_id,author_name,content,created_at")
        .eq("post_id", p.id).order("created_at", { ascending: true });
      if (error) {
        // 표가 아직 없으면 원인을 정확히 알려준다 (로그인 문제로 오해하지 않도록)
        const noTable = /schema cache|does not exist|relation .* does not exist/i.test(error.message || "");
        listEl.innerHTML = '<div class="cmt-empty">' + (noTable
          ? '댓글 기능이 아직 켜지지 않았습니다.<br>운영진이 <b>OB/board/sql/comments_setup.sql</b> 을 한 번 실행하면 바로 쓰실 수 있습니다.'
          : '댓글을 불러올 수 없습니다. 로그인 후 확인해주세요.') + '</div>';
        return;
      }
      document.getElementById("cmtCount").textContent = data.length;
      if (!data.length) { listEl.innerHTML = '<div class="cmt-empty">첫 댓글을 남겨보세요.</div>'; return; }
      const isMine  = (c) => !!(user && c.author_id === user.id);
      const isAdmin = () => !!(user && meProfile && meProfile.is_admin);
      // 제 댓글은 스스로 고치고, 운영진은 어느 댓글이든 고치고 지울 수 있습니다
      const canEditC = (c) => isMine(c) || isAdmin();
      const canDrop  = (c) => isMine(c) || isAdmin();
      listEl.innerHTML = data.map(c => `
        <div class="cmt" data-id="${c.id}">
          ${canDrop(c) ? `<button class="del" data-id="${c.id}">삭제</button>` : ""}
          ${canEditC(c) ? `<button class="edit" data-id="${c.id}">수정</button>` : ""}
          <div class="who" title="${escapeHtml(c.author_name || "")}">${escapeHtml(shortName(c.author_name) || "회원")}<span class="when">${c.created_at.slice(0,16).replace("T"," ")}</span></div>
          <div class="body">${linkify(c.content)}</div>
        </div>`).join("");

      // 댓글마다 좋아요 — 글에 붙은 것과 같은 자리를 씁니다 (kind = "comment")
      {
        const ids = data.map(c => String(c.id));
        const made = {};
        data.forEach(c => {
          const box = listEl.querySelector('.cmt[data-id="' + c.id + '"]');
          if (!box) return;
          const b = document.createElement("button");
          b.type = "button";
          b.className = "likebtn sm";
          let on = false, n = 0;
          const paint = () => {
            b.innerHTML = heart(on) + "<span>좋아요</span>" +
                          (n ? '<span class="n">' + n + "</span>" : "");
            b.classList.toggle("on", on);
          };
          paint();
          b.addEventListener("click", async () => {
            b.disabled = true;
            const r = await toggleLike("comment", c.id, on);
            b.disabled = false;
            if (!r) return;
            on = r.on; n = r.n; paint();
          });
          made[String(c.id)] = (o, k) => { on = o; n = k; paint(); };
          const foot = document.createElement("div");
          foot.className = "cmt-foot";
          foot.appendChild(b);
          box.appendChild(foot);
        });
        loadLikes("comment", ids).then(r => {
          ids.forEach(id => { if (made[id]) made[id](r.mine.has(id), r.n[id] || 0); });
        });
      }

      listEl.querySelectorAll(".del").forEach(b => b.addEventListener("click", async () => {
        if (!confirm("댓글을 삭제할까요?")) return;
        await sb.from("comments").delete().eq("id", b.dataset.id);
        loadComments();
      }));

      // 내가 쓴 댓글 고치기 — 그 자리에서 바로
      listEl.querySelectorAll(".edit").forEach(b => b.addEventListener("click", () => {
        const box = b.closest(".cmt");
        if (box.querySelector(".cmt-edit")) return;          // 이미 열려 있으면 그대로
        const c = data.find(x => String(x.id) === String(b.dataset.id));
        const body = box.querySelector(".body");
        body.style.display = "none";
        const wrapEd = document.createElement("div");
        wrapEd.className = "cmt-edit";
        const ta = document.createElement("textarea");
        ta.value = c.content;
        fixEnter(ta);
        const row = document.createElement("div");
        row.className = "cmt-edit-row";
        const save = document.createElement("button");
        save.className = "btn dark sm"; save.textContent = "저장";
        const cancel = document.createElement("button");
        cancel.className = "btn sm"; cancel.textContent = "취소";
        row.append(save, cancel);
        wrapEd.append(ta, row);
        body.after(wrapEd);
        ta.focus();

        const close = () => { wrapEd.remove(); body.style.display = ""; };
        cancel.addEventListener("click", close);
        save.addEventListener("click", async () => {
          const text = ta.value.trim();
          if (!text) { alert("내용을 입력해주세요."); return; }
          if (text === c.content) { close(); return; }
          save.disabled = true;
          const { error } = await sb.from("comments").update({ content: text }).eq("id", c.id);
          save.disabled = false;
          if (error) { alert("고치지 못했습니다: " + error.message); return; }
          loadComments();
        });
      }));
    }
    loadComments();

    if (canWrite) {
      document.getElementById("cmtSubmit").addEventListener("click", async () => {
        const input = document.getElementById("cmtInput");
        const msg = document.getElementById("cmtMsg");
        const text = input.value.trim();
        if (!text) return;
        const btn = document.getElementById("cmtSubmit");
        btn.disabled = true;
        const { error } = await sb.from("comments").insert({
          post_id: p.id, author_id: user.id, author_name: profile.name || "", content: text
        });
        btn.disabled = false;
        if (error) {
          msg.className = "msg err";
          msg.textContent = /schema cache|does not exist/i.test(error.message || "")
            ? "댓글 기능이 아직 켜지지 않았습니다 — 운영진이 OB/board/sql/comments_setup.sql 을 한 번 실행해주세요."
            : "등록 실패: " + error.message;
        }
        else { input.value = ""; msg.className = "msg"; msg.textContent = ""; noteActivity("comment", 1, p.id);
        loadComments(); }
      });
    }
  }
}
