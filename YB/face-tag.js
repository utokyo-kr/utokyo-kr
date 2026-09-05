// ─── 앨범 사진의 얼굴에 이름 달기 ───────────────────────────
//
//  · 회원 (승인된 분 모두)
//      사진을 크게 보았을 때, 얼굴에 커서를 얹으면 이름이 뜹니다.
//  · 운영진
//      「🙂 얼굴 이름」 을 켜고 얼굴을 네모로 두른 뒤 이름을 고릅니다.
//      그 이름이 회원 명단의 회원과 짝지어집니다.
//
//  ※ 잘린 얼굴 그림을 따로 저장하지 않습니다.
//     원본 사진과 네모 자리(0~1 비율)만 담고, 보일 때 그 자리를 잘라 씁니다.
//     그래서 사진이 두 벌로 늘지 않고, 이름을 고치면 어디서나 함께 바뀝니다.
//
//  자료방 : auth/photo_faces.sql 을 한 번 돌려 두셔야 합니다.
//
//  ※ OB 와 YB 에 같은 파일이 한 벌씩 있습니다 — 한쪽을 고치면 다른 쪽도 함께.

/* ── 셈 (화면이 없어 node 로 시험할 수 있습니다) ───────────── */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 화면에서 끈 두 점 → 그림 안 비율 네모. 너무 작으면 null */
export function boxFromDrag(a, b, w, h) {
  if (!a || !b || !(w > 0) || !(h > 0)) return null;
  const x1 = clamp01(Math.min(a.x, b.x) / w);
  const y1 = clamp01(Math.min(a.y, b.y) / h);
  const x2 = clamp01(Math.max(a.x, b.x) / w);
  const y2 = clamp01(Math.max(a.y, b.y) / h);
  const box = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  if (box.w < 0.02 || box.h < 0.02) return null;   // 손이 미끄러진 정도
  return box;
}

/** 이 자리에 있는 얼굴 — 겹치면 작은 것이 먼저 (뒤에 있는 사람도 고를 수 있게) */
export function hitAt(faces, px, py) {
  const list = (Array.isArray(faces) ? faces : []).filter((f) => f && f.box);
  const on = list.filter((f) => {
    const b = f.box;
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  });
  if (!on.length) return null;
  return on.sort((a, b) => (a.box.w * a.box.h) - (b.box.w * b.box.h))[0];
}

/** 네모 자리를 「배경 그림으로 그 자리만 보이게」 하는 값으로.
 *  회원 명단에서 잘린 얼굴을 보일 때 씁니다 — 그림을 새로 만들지 않습니다.
 *  얼굴만 딱 자르면 갑갑하므로 둘레를 조금 넉넉히 둡니다(pad).
 *  @returns {size:"400% 400%", pos:"25% 30%"} 꼴
 */
export function faceStyle(box, pad) {
  const p = pad == null ? 0.25 : pad;
  if (!box || !(box.w > 0) || !(box.h > 0)) return { size: "cover", pos: "50% 50%" };
  let x = box.x - box.w * p, y = box.y - box.h * p;
  let w = box.w * (1 + p * 2), h = box.h * (1 + p * 2);
  /* 그림 밖으로 나가지 않게 */
  if (x < 0) { w += x; x = 0; }
  if (y < 0) { h += y; y = 0; }
  if (x + w > 1) w = 1 - x;
  if (y + h > 1) h = 1 - y;
  w = Math.max(0.01, w); h = Math.max(0.01, h);
  /* 네모를 칸에 꽉 채우려면 그림을 1/w 배로 키웁니다 */
  const sx = 100 / w, sy = 100 / h;
  /* background-position 은 「남는 자리 가운데 어디」 라 나누기가 들어갑니다 */
  const px = w >= 1 ? 50 : (x / (1 - w)) * 100;
  const py = h >= 1 ? 50 : (y / (1 - h)) * 100;
  return {
    size: sx.toFixed(2) + "% " + sy.toFixed(2) + "%",
    pos: px.toFixed(2) + "% " + py.toFixed(2) + "%",
  };
}

/** 이름 후보 — 이미 이 사진에 달린 사람은 빼고, 치는 대로 좁힙니다 */
export function nameHints(members, taken, q) {
  const s = String(q || "").trim().toLowerCase();
  const used = new Set((Array.isArray(taken) ? taken : [])
    .map((t) => String((t && t.name) || "").replace(/\s+/g, "").toLowerCase()));
  return (Array.isArray(members) ? members : [])
    .filter((m) => m && m.name)
    .filter((m) => !used.has(m.name.replace(/\s+/g, "").toLowerCase()))
    .filter((m) => !s || m.name.toLowerCase().includes(s) ||
                   String(m.faculty || "").toLowerCase().includes(s))
    .slice(0, 24);
}

/** 「홍길동 · 공학계 2019」 처럼 곁들이 설명 */
export function memberLabel(m) {
  const bits = [String((m && m.faculty) || "").trim(),
                String((m && m.grad_year) || "").trim()].filter(Boolean);
  return bits.join(" ");
}


/* ── 화면에 붙이기 ────────────────────────────────────────── */

const esc = (s) => String(s == null ? "" : s)
  .replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/**
 * 크게 본 사진 위에 얼굴 네모를 얹습니다.
 * @param o.sb        Supabase 연결
 * @param o.stage     사진을 감싼 상자 (position:relative 여야 합니다)
 * @param o.img       그 안의 img
 * @param o.photoId   gallery_photos.id — 없으면 아무것도 하지 않습니다
 *                    (붙박이 사진은 자료방에 없어 이름을 달 수 없습니다)
 * @param o.org       OB | YB
 * @param o.isAdmin   운영진인가 — 이름을 달 수 있는지
 * @param o.members   이름 후보 [{id,name,faculty,grad_year}]
 * @param o.say       알림말을 적을 곳 (함수)
 */
export async function mountFaces(o) {
  const stage = o && o.stage, img = o && o.img;
  if (!stage || !img) return null;

  /* 앞서 붙인 것이 있으면 걷어냅니다 (사진을 넘길 때마다 다시 붙습니다) */
  if (stage.__ftOff) { stage.__ftOff(); stage.__ftOff = null; }
  stage.querySelectorAll(".ftlayer,.ftbar,.ftask").forEach((x) => x.remove());
  stage.classList.remove("ft-on");
  if (!o.photoId) return null;

  const layer = document.createElement("div");
  layer.className = "ftlayer";
  stage.appendChild(layer);

  let faces = [];
  let tagging = false;
  const say = (t) => { if (typeof o.say === "function") o.say(t); };

  const load = async () => {
    try {
      const r = await o.sb.from("photo_faces")
        .select("id,name,box,profile_id")
        .eq("photo_id", o.photoId);
      faces = (r.data || []).map((f) => ({
        id: f.id, name: f.name, profile_id: f.profile_id,
        box: typeof f.box === "string" ? JSON.parse(f.box) : f.box,
      })).filter((f) => f.box);
    } catch (e) { faces = []; }
    draw();
  };

  const draw = () => {
    const sel = layer.querySelector(".ftsel");
    layer.innerHTML = faces.map((f, i) =>
      '<span class="ftbox" data-i="' + i + '" ' +
      'style="left:' + (f.box.x * 100) + "%;top:" + (f.box.y * 100) +
      "%;width:" + (f.box.w * 100) + "%;height:" + (f.box.h * 100) + '%">' +
      '<b class="ftname">' + esc(f.name) + "</b>" +
      (tagging ? '<button type="button" class="ftdel" title="이 이름 떼기">x</button>' : "") +
      "</span>").join("");
    if (sel) layer.appendChild(sel);
    if (!tagging) return;
    layer.querySelectorAll(".ftdel").forEach((b) =>
      b.addEventListener("click", async (e) => {
        e.stopPropagation();
        const f = faces[+b.closest(".ftbox").dataset.i];
        if (!f) return;
        if (!confirm("「" + f.name + "」 를 뗄까요?")) return;
        try {
          const r = await o.sb.from("photo_faces").delete().eq("id", f.id);
          if (r.error) throw r.error;
          say(f.name + " — 뗐습니다.");
          await load();
        } catch (err) { say("떼지 못했습니다 — " + ((err && err.message) || "")); }
      }));
  };

  const off = [];

  /* ── 운영진 : 이름 달기 ── */
  if (o.isAdmin) {
    const bar = document.createElement("div");
    bar.className = "ftbar";
    bar.innerHTML = '<button type="button" class="ftgo">얼굴 이름 달기</button>';
    stage.appendChild(bar);
    const goBtn = bar.querySelector(".ftgo");

    const ask = document.createElement("div");
    ask.className = "ftask";
    ask.hidden = true;
    ask.innerHTML =
      '<input type="search" class="ftq" placeholder="회원 이름으로 찾기" autocomplete="off">' +
      '<div class="fthits"></div>' +
      '<button type="button" class="ftcancel">그만</button>';
    stage.appendChild(ask);
    const q = ask.querySelector(".ftq"), hits = ask.querySelector(".fthits");

    const sel = document.createElement("div");
    sel.className = "ftsel";
    sel.hidden = true;
    layer.appendChild(sel);

    let from = null, cur = null;
    const at = (e) => {
      const r = img.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const place = (el, b) => {
      el.style.left = (b.x * 100) + "%"; el.style.top = (b.y * 100) + "%";
      el.style.width = (b.w * 100) + "%"; el.style.height = (b.h * 100) + "%";
    };

    const onDown = (e) => {
      if (!tagging) return;
      e.preventDefault();
      from = at(e); cur = null; ask.hidden = true; sel.hidden = true;
      try { img.setPointerCapture(e.pointerId); } catch (x) {}
    };
    const onMove = (e) => {
      if (!tagging || !from) return;
      const r = img.getBoundingClientRect();
      const b = boxFromDrag(from, at(e), r.width, r.height);
      if (!b) return;
      cur = b; sel.hidden = false; place(sel, b);
    };
    const onUp = () => {
      if (!from) return;
      from = null;
      if (!cur) { sel.hidden = true; return; }
      ask.hidden = false; q.value = ""; showHits("");
      try { q.focus({ preventScroll: true }); } catch (x) {}
    };
    img.addEventListener("pointerdown", onDown);
    img.addEventListener("pointermove", onMove);
    img.addEventListener("pointerup", onUp);
    img.addEventListener("pointercancel", onUp);
    off.push(() => {
      img.removeEventListener("pointerdown", onDown);
      img.removeEventListener("pointermove", onMove);
      img.removeEventListener("pointerup", onUp);
      img.removeEventListener("pointercancel", onUp);
      bar.remove(); ask.remove();
    });

    function showHits(text) {
      const list = nameHints(o.members || [], faces, text);
      hits.innerHTML = list.length
        ? list.map((m, i) =>
            '<button type="button" class="fthit" data-i="' + i + '">' +
            esc(m.name) + "<em>" + esc(memberLabel(m)) + "</em></button>").join("")
        : '<span class="ftnone">회원 명단에 없는 이름은 그대로 적힙니다 — Enter</span>';
      hits.querySelectorAll(".fthit").forEach((b) =>
        b.addEventListener("click", () => take(list[+b.dataset.i])));
    }
    q.addEventListener("input", () => showHits(q.value));
    q.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const t = q.value.trim();
      if (t) take({ name: t, id: null });
    });
    ask.querySelector(".ftcancel").addEventListener("click", () => {
      ask.hidden = true; sel.hidden = true; cur = null;
    });

    async function take(m) {
      if (!cur || !m || !m.name) return;
      const box = cur;
      ask.hidden = true; sel.hidden = true; cur = null;
      say("담는 중…");
      try {
        /* 회원 명단에서 고르지 않았으면 이름으로 한 번 찾아봅니다 */
        let pid = m.id || null;
        if (!pid) {
          try {
            const r = await o.sb.rpc("match_member", { nm: m.name, p_org: o.org });
            if (r.data && r.data.length === 1) pid = r.data[0].id;
          } catch (e) {}
        }
        const ins = await o.sb.from("photo_faces").insert({
          photo_id: o.photoId, name: m.name, profile_id: pid,
          box: box, org: o.org,
        });
        if (ins.error) throw ins.error;
        say(m.name + (pid
          ? " — 회원 명단과 짝지었습니다."
          : " — 이름만 달았습니다 (회원 명단에서 못 찾았습니다)."));
        await load();
      } catch (e) {
        const msg = (e && e.message) || "";
        say(/duplicate|unique/i.test(msg)
          ? "이 사진에 이미 달린 이름입니다."
          : /photo_faces|relation|schema cache/i.test(msg)
            ? "자료방 준비가 안 됐습니다 — auth/photo_faces.sql 을 한 번 돌려 주세요."
            : "담지 못했습니다 — " + msg);
      }
    }

    goBtn.addEventListener("click", () => {
      tagging = !tagging;
      goBtn.textContent = tagging ? "다 했습니다" : "얼굴 이름 달기";
      stage.classList.toggle("ft-on", tagging);
      if (!tagging) { ask.hidden = true; sel.hidden = true; cur = null; }
      say(tagging ? "얼굴을 네모로 두르세요." : "");
      draw();
    });
  }

  stage.__ftOff = () => { off.forEach((f) => f()); layer.remove(); };
  await load();
  return { reload: load };
}
