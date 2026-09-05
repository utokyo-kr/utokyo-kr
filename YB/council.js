// ─── 학생회 「역대 회장 및 임원진」 화면 ────────────────────────
// 위쪽에는 역대 회장 목록, 아래쪽에는 기존 홈페이지처럼 게시판 모양의
// 역대 임원진 자료 목록을 놓습니다. 명단은 회원께만 보여드립니다.
import { ROSTERS } from "/YB/council-data.js?v=318";
import { currentUser } from "/YB/auth/auth.js";

const esc = (t) => String(t == null ? "" : t)
  .replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** 명단 한 건을 표(또는 글)로 그린다 */
export function bodyHtml(r) {
  if (r.rows && r.rows.length) {
    const cols = (r.head || ["직책", "성명", "소속", "학년"]).map(h => `<th>${esc(h)}</th>`).join("");
    const rows = r.rows.map(cells => {
      const td = cells.map((c, i) =>
        `<td${i === 0 ? ' class="rl"' : (i === cells.length - 1 ? ' class="yr"' : "")}>${esc(c)}</td>`).join("");
      return `<tr>${td}</tr>`;
    }).join("");
    return `<div class="tscroll"><table class="otab" style="min-width:520px;">` +
           `<thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const img = (r.imgs || []).map(u =>
    `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(r.title)}" loading="lazy"></a>`).join("");
  return `<div class="rtext">${esc(r.text || "내용이 없습니다.")}</div>` +
         (img ? `<div class="pgal rimg">${img}</div>` : "");
}

export async function initCouncil() {
  const list = document.getElementById("rosterList");
  if (!list) return;
  const memo = document.getElementById("rostMsg");

  // ── 게시판 모양 목록 ──
  list.innerHTML =
    '<div class="bbs-head"><span class="c-no">번호</span><span class="c-ti">제목</span>' +
    '<span class="c-au">글쓴이</span><span class="c-dt">날짜</span></div>' +
    ROSTERS.map(r => `
      <div class="bbs-item" id="roster-${r.id}">
        <a class="bbs-row" href="#roster-${r.id}" data-roster="${r.id}">
          <span class="c-no">${r.no}</span>
          <span class="c-ti">${esc(r.title)}${r.president ? `<em>회장 ${esc(r.president)}</em>` : ""}</span>
          <span class="c-au">${esc(r.author)}</span>
          <span class="c-dt">${esc(r.date)}</span>
        </a>
        <div class="bbs-body" hidden></div>
      </div>`).join("");

  let user = null;
  try { user = await currentUser(); } catch (e) { user = null; }

  function askLogin() {
    if (!memo) return;
    memo.style.display = "block";
    memo.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** 한 건을 펼치거나 접는다 */
  function toggle(id, forceOpen) {
    const item = document.getElementById("roster-" + id);
    if (!item) return;
    const box = item.querySelector(".bbs-body");
    const open = !box.hidden;
    if (open && !forceOpen) { box.hidden = true; item.classList.remove("on"); return; }
    if (!user) { askLogin(); return; }
    if (!box.innerHTML) {
      const r = ROSTERS.find(x => String(x.id) === String(id));
      if (r) box.innerHTML = bodyHtml(r);
    }
    box.hidden = false;
    item.classList.add("on");
  }

  list.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-roster]");
    if (!a) return;
    e.preventDefault();
    toggle(a.dataset.roster);
  });

  // 위쪽 역대 회장 목록의 「명단보기」
  document.querySelectorAll("#past .rost[data-roster]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.roster;
      if (!user) { askLogin(); return; }
      toggle(id, true);
      document.getElementById("roster-" + id).scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}
