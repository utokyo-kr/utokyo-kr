// ─── MAP — 도쿄대학 · 도쿄맛집 · 도쿄까페 · 추억핫플 · 건축물 ────
// 화면 파일은 OB/map.html · YB/map.html 로 따로 두고,
// 지도 내용은 이 파일 하나를 함께 씁니다. 양쪽에 같은 장소가 보입니다.
import { sb, currentUser, myProfile } from "/YB/auth/auth.js";

export const CATS = [
  ["utokyo", "도쿄대학"],
  ["food",   "도쿄맛집"],
  ["cafe",   "도쿄까페"],
  ["memory", "추억핫플"],
  ["arch",   "건축물"],
];
export const CAT_NAME = Object.fromEntries(CATS);

/** 분류별 지도 표시 모양과 안내 문구 */
export const CAT_INFO = {
  utokyo: { shape: "dot",  mark: "파란 동그라미",
    desc: "도쿄대학 <b>혼고 · 고마바 · 가시와</b> 세 캠퍼스입니다. 주소와 가는 길, 가까운 역을 확인하실 수 있습니다." },
  food:   { shape: "star", mark: "빨간 별",
    desc: "동문·재학생이 추천하는 <b>도쿄의 맛집</b>입니다. 표시를 누르면 주소와 그곳의 특징, 얽힌 추억이 열립니다." },
  cafe:   { shape: "star", mark: "노란 별",
    desc: "공부하기 좋은 곳, 이야기 나누기 좋은 곳 — <b>도쿄의 까페</b>를 모았습니다." },
  memory: { shape: "dot",  mark: "핫핑크 동그라미",
    desc: "유학 시절 자주 찾던 곳, 잊지 못할 일이 있었던 곳 — <b>추억의 장소</b>입니다." },
  arch:   { shape: "dot",  mark: "주황 동그라미",
    desc: "<b>유명 건축가가 지은 멋진 장소</b>를 찾아가 보세요. 설계자와 특징을 함께 적어주시면 좋습니다." },
};

/** 도쿄대학 분류에 기본으로 들어 있는 세 캠퍼스 */
export const CAMPUS = [
  { k: "hongo", name: "혼고 캠퍼스 (本郷)", tag: "본부",
    address: "일본 도쿄도 분쿄구 혼고 7-3-1",
    jp: "〒113-8654 東京都文京区本郷7-3-1",
    lat: 35.7128, lng: 139.7620,
    ways: ["도쿄메트로 남북선 <b>도다이마에(東大前)역</b> 도보 1분",
           "도쿄메트로 마루노우치선·도에이 오에도선 <b>혼고산초메(本郷三丁目)역</b> 도보 8분",
           "도쿄메트로 지요다선 <b>네즈(根津)역</b> 도보 8분",
           "아카몬(赤門) · 야스다강당 · 산시로연못이 이 캠퍼스에 있습니다"] },
  { k: "komaba", name: "고마바 캠퍼스 (駒場)", tag: "교양학부",
    address: "일본 도쿄도 메구로구 고마바 3-8-1",
    jp: "〒153-8902 東京都目黒区駒場3-8-1",
    lat: 35.6595, lng: 139.6849,
    ways: ["게이오 이노카시라선 <b>고마바토다이마에(駒場東大前)역</b> 바로 앞",
           "시부야역에서 이노카시라선으로 2정거장 (약 4분)",
           "1·2학년 전 학생이 다니는 교양학부 캠퍼스입니다"] },
  { k: "kashiwa", name: "가시와 캠퍼스 (柏)", tag: "대학원·연구",
    address: "일본 지바현 가시와시 가시와노하 5-1-5",
    jp: "〒277-8561 千葉県柏市柏の葉5-1-5",
    lat: 35.8988, lng: 139.9436,
    ways: ["쓰쿠바 익스프레스 <b>가시와노하캠퍼스역</b> 하차 후 버스 약 10분",
           "JR 조반선 <b>가시와(柏)역</b> 서쪽 출구에서 버스 약 25분",
           "신령역 연구·대학원 중심 캠퍼스입니다"] },
];

/** 바탕지도 — 열쇠(API key) 없이 쓸 수 있는 것들 */
export const BASEMAPS = [
  { k: "osm", n: "기본", sub: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    att: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  // 「부드러운 컬러」·「밝은 회색」·「어두운」은 원래 CARTO 지도였는데,
  //   CARTO 가 2026년 8월 말부터 열쇠(API key) 없이 부르면 「API KEY REQUIRED」를 덮어 보냅니다.
  //   그래서 열쇠 없이 쓰는 Esri 지도로 바꿨습니다. 이름(k)은 그대로라 고르신 것이 이어집니다.
  //   회색·어두운 지도는 바탕과 글씨(labels)가 따로 오고, 16단계보다 가까이는 키워서 보여줍니다.
  { k: "voyager", n: "부드러운 컬러", sub: "Esri World Street Map",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    sd: false, maxNative: 18, att: 'Tiles &copy; <a href="https://www.esri.com">Esri</a>' },
  { k: "positron", n: "밝은 회색", sub: "Esri Light Gray Canvas",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    sd: false, maxNative: 16, att: 'Tiles &copy; <a href="https://www.esri.com">Esri</a>' },
  { k: "dark", n: "어두운", sub: "Esri Dark Gray Canvas",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    sd: false, maxNative: 16, att: 'Tiles &copy; <a href="https://www.esri.com">Esri</a>' },
  { k: "topo", n: "지형", sub: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", maxZoom: 17,
    att: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)' },
  { k: "sat", n: "위성사진", sub: "Esri World Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    sd: false, att: 'Tiles &copy; Esri' },
];

/** OpenStreetMap 이 알려주는 장소 종류를 우리말 한 마디로 */
const KIND = {
  cafe:"카페", coffee_shop:"카페", restaurant:"음식점", fast_food:"간이음식점", bar:"바",
  pub:"펍", bakery:"빵집", confectionery:"과자점", ice_cream:"아이스크림", food_court:"푸드코트",
  museum:"박물관", gallery:"미술관", artwork:"예술작품", theatre:"극장", cinema:"영화관",
  library:"도서관", university:"대학", college:"단과대", school:"학교", research_institute:"연구소",
  park:"공원", garden:"정원", viewpoint:"전망대", attraction:"명소", memorial:"기념물",
  monument:"기념비", castle:"성", ruins:"유적", temple:"절", shrine:"신사", place_of_worship:"사찰·교회",
  station:"역", subway:"지하철역", bus_stop:"버스정류장", hotel:"호텔", hostel:"게스트하우스",
  department_store:"백화점", supermarket:"마트", convenience:"편의점", books:"서점",
  clothes:"옷가게", bank:"은행", hospital:"병원", pharmacy:"약국", sports_centre:"체육관",
  stadium:"경기장", zoo:"동물원", aquarium:"수족관", bridge:"다리", tower:"타워",
  apartments:"아파트", house:"주택", commercial:"상업건물", public:"공공건물",
};
const CUISINE = {
  ramen:"라멘", sushi:"스시", japanese:"일식", korean:"한식", chinese:"중식", italian:"이탈리안",
  french:"프렌치", curry:"카레", udon:"우동", soba:"소바", yakiniku:"야키니쿠", izakaya:"이자카야",
  tonkatsu:"돈카츠", coffee_shop:"커피", burger:"버거", pizza:"피자", thai:"태국식", indian:"인도식",
};

/** 장소 종류를 한 단어로 (주소는 따로 있으니 동네 이름은 넣지 않는다) */
function kindOf(h) {
  const t = (h.type || "").toLowerCase();
  const c = (h.class || "").toLowerCase();
  if (KIND[t]) return KIND[t];
  if (KIND[c]) return KIND[c];
  const ex = h.extratags || {};
  for (const x of (ex.cuisine || "").split(";")) {
    const k = CUISINE[x.trim().toLowerCase()];
    if (k) return k;
  }
  return "";
}

/** 위키백과에서 「무엇을 하는 곳인지」 한 문장을 찾아온다 */
async function describeFromWiki(name) {
  if (!name) return "";
  const get = (host, path) => fetch(`https://${host}/api/rest_v1/page/summary/${encodeURIComponent(path)}`)
                                .then(r => r.ok ? r.json() : null).catch(() => null);
  const find = async (host) => {
    try {
      const sr = await fetch(`https://${host}/w/api.php?origin=*&format=json&action=query&list=search`
                           + `&srlimit=1&srsearch=${encodeURIComponent(name)}`)
                       .then(r => r.json());
      const hit = sr && sr.query && sr.query.search && sr.query.search[0];
      return hit ? hit.title : null;
    } catch (e) { return null; }
  };
  for (const host of ["ko.wikipedia.org", "ja.wikipedia.org"]) {
    const title = await find(host);
    if (!title) continue;
    const sum = await get(host, title);
    const tx = sum && (sum.extract || "");
    if (!tx) continue;
    // 첫 문장만, 괄호 안 설명은 덜어낸다
    let one = tx.split(/(?<=[.。])\s/)[0] || tx;
    one = one.replace(/\([^)]*\)/g, "").replace(/（[^）]*）/g, "").replace(/\s{2,}/g, " ").trim();
    if (one.length > 90) one = one.slice(0, 88).trim() + "…";
    if (one.length >= 8) return one;
  }
  return "";
}

const esc = s => String(s == null ? "" : s)
  .replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const SHELL = `
  <div class="mapwrap">
    <div class="maprow">
      <div class="mapbox"><div id="cmap"></div></div>
      <aside class="mapside">
        <div class="layers" id="mlayers">
          <span class="lytitle">레이어 선택</span>
          <span class="lyboxes" id="lyBoxes"></span>
          <button type="button" class="lyall" id="lyAll">전체 켜기 / 끄기</button>
          <span class="lytitle lybase">바탕지도 선택</span>
          <select class="lysel" id="lyBase"></select>
        </div>
        <div class="plist" id="plist"></div>
      </aside>
    </div>
    <div class="maptip">
      <span>지도를 <b>끌어서 이동</b>, <b>마우스 휠 또는 + / −</b> 로 확대·축소.
        지도 위 <b>표시를 누르면</b> 그 장소 안내가 크게 열립니다.</span>
      <a class="down" id="mapDown" href="#addplace">▼ 아래에서 내가 아는 곳을 올려보세요</a>
    </div>
  </div>

  <div class="addplace" id="addplace">
    <div class="apttl">＋ 이 분류에 장소 추가</div>
    <div class="apcats" id="apCats"></div>
    <div class="apfields aprow">
      <div class="apcell">
        <input type="text" id="apName" maxlength="60" autocomplete="off"
               placeholder="장소 이름 * (예: 아카몬 앞 커피집) — 상호를 적으면 아래에 주소 후보가 뜹니다">
        <div class="apsug" id="apSug"></div>
      </div>
      <input type="text" id="apAddr" maxlength="160" placeholder="주소 * (예: 東京都文京区本郷5-25-16)">
      <button type="button" class="appin" id="apFind">🔎 주소로 찾기</button>
      <button type="button" class="appin" id="apPin">📍 지도에서 찍기</button>
    </div>
    <div class="apfields">
      <input type="text" id="apNote" maxlength="200"
             placeholder="이곳의 특징 — 주소를 고르면 자동으로 채워집니다 (고치셔도 됩니다)">
    </div>
    <div class="apfields">
      <textarea id="apMemo" maxlength="600" rows="1"
        placeholder="추천사유 및 추억공유&#10;예시) 첫사랑을 만난 장소 / 아르바이트하던 곳 / 논문 쓰며 밤새우던 자리 / 유학 첫날 밥 먹은 집  (안 적으셔도 됩니다)"></textarea>
    </div>
    <div class="apfields">
      <label class="apdrop" id="apDrop">
        <b>사진</b>
        <span id="apImgMsg">여기에 <b>붙여넣기(Ctrl+V)</b> 하거나, 사진을 <b>끌어다 놓으세요</b>. 눌러서 고르셔도 됩니다.</span>
        <input type="file" id="apImg" accept="image/*" hidden>
        <img id="apPrev" alt="" style="display:none;">
      </label>
      <button class="apbtn" id="apGo">지도에 올리기</button>
    </div>
    <div class="apmsg" id="apMsg">주소를 적으면 위치를 찾아 지도 위에 표시로 올려드립니다.</div>
  </div>

  <div class="movebar" id="moveBar">
    <b id="moveName"></b>
    <span>표시를 끌어서 옮긴 뒤 저장하세요.</span>
    <button type="button" class="mvok" id="moveOk">이 자리로 저장</button>
    <button type="button" class="mvno" id="moveNo">취소</button>
  </div>

  <div class="pmodal" id="pmodal">
    <div class="pbox">
      <button class="px" id="pClose">✕</button>
      <div class="pcatrow">
        <span class="pcat" id="pCat"></span>
        <select class="pcatsel" id="pCatSel" style="display:none;" title="분류 바꾸기"></select>
      </div>
      <h3 id="pName"></h3>
      <div class="paddr" id="pAddr"></div>
      <div class="pjp" id="pJp"></div>
      <img class="pimg" id="pImg" alt="" style="display:none;">
      <div class="pblock" id="pNoteBox" style="display:none;">
        <div class="plab">이곳의 특징</div>
        <div class="pnote" id="pNote"></div>
      </div>
      <div class="pblock" id="pMemoBox" style="display:none;">
        <div class="plab">추천사유 및 추억</div>
        <div class="pnote" id="pMemo"></div>
      </div>
      <ul class="mways" id="pWays"></ul>
      <div class="pfoot">
        <a class="pbtn" id="pMap" href="#" target="_blank" rel="noopener">구글 지도에서 보기</a>
        <a class="pbtn line" id="pDir" href="#" target="_blank" rel="noopener">길찾기 →</a>
        <a class="pbtn line" id="pPost" href="#" style="display:none;">관련 글 보기</a>
        <button class="pbtn move" id="pMove" style="display:none;">📍 위치 옮기기</button>
        <button class="pbtn del" id="pDel" style="display:none;">이 장소 지우기</button>
      </div>
      <div class="pwho" id="pWho"></div>
    </div>
  </div>`;

/**
 * MAP 화면을 그린다.
 * @param {string} org "OB" | "YB"  — 관련 글 링크가 그 단체 게시판으로 연결됩니다
 * @param {string} mountId 지도를 넣을 칸의 id
 */
export async function initMap(org = "OB", mountId = "mapapp") {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  mount.innerHTML = SHELL;
  const HOME = org === "YB" ? "/YB" : "/OB";

  let cur = new URLSearchParams(location.search).get("cat");
  if (!CAT_NAME[cur]) cur = "utokyo";

  const map = L.map("cmap", { scrollWheelZoom: true, zoomControl: true })
               .setView([35.6895, 139.7], 12);
  // ── 바탕지도 고르기 ──
  let baseLayer = null, labelLayer = null;
  function setBase(k) {
    const b = BASEMAPS.find(x => x.k === k) || BASEMAPS[0];
    if (baseLayer) map.removeLayer(baseLayer);
    if (labelLayer) { map.removeLayer(labelLayer); labelLayer = null; }
    const opt = {
      maxZoom: b.maxZoom || 19,
      maxNativeZoom: b.maxNative || b.maxZoom || 19,   // 그보다 가까이는 키워서
      subdomains: b.sd === false ? [] : ["a", "b", "c"],
    };
    baseLayer = L.tileLayer(b.url, { ...opt, attribution: b.att }).addTo(map);
    baseLayer.bringToBack();
    // 바탕과 글씨가 따로 오는 지도는 글씨를 바탕 위에 얹습니다
    if (b.labels) labelLayer = L.tileLayer(b.labels, opt).addTo(map);
    try { localStorage.setItem("utk-basemap", b.k); } catch (e) {}
  }
  const baseSel = document.getElementById("lyBase");
  baseSel.innerHTML = BASEMAPS.map(b => `<option value="${b.k}">${b.n}</option>`).join("");
  let saved = "osm";
  try { saved = localStorage.getItem("utk-basemap") || "osm"; } catch (e) {}
  baseSel.value = BASEMAPS.some(b => b.k === saved) ? saved : "osm";
  baseSel.addEventListener("change", () => setBase(baseSel.value));
  setBase(baseSel.value);

  // ── 로그인 상태 ──
  const user = await currentUser();
  const me = user ? await myProfile() : null;
  const canAdd = !!(me && (me.approved || me.is_admin));
  const isAdmin = !!(me && me.is_admin);
  document.getElementById("addplace").classList.toggle("on", canAdd);
  const down = document.getElementById("mapDown");
  down.classList.toggle("on", canAdd);
  down.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("addplace").scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("apName").focus({ preventScroll: true });
  });

  let places = [];                          // 지도에 그려진 장소들
  let markers = [];                         // 그 장소들의 지도 표시
  const shown = new Set(CATS.map(([k]) => k));   // 지도에 보이는 분류 (처음엔 모두)
  let layer = L.layerGroup().addTo(map);

  // ── 레이어 체크박스 ──
  const boxes = document.getElementById("lyBoxes");
  const LEG = CATS.filter(([k]) => k !== "utokyo").concat(CATS.filter(([k]) => k === "utokyo"));
  boxes.innerHTML = LEG.map(([k, v]) =>
    `<label class="ly c-${k}"><input type="checkbox" data-c="${k}" checked>` +
    `<span class="lydot ${(CAT_INFO[k] || {}).shape || "dot"}"><i></i></span>${v}</label>`).join("");
  boxes.querySelectorAll("input").forEach(c => c.addEventListener("change", () => {
    c.checked ? shown.add(c.dataset.c) : shown.delete(c.dataset.c);
    c.closest(".ly").classList.toggle("off", !c.checked);
    draw();
  }));
  document.getElementById("lyAll").addEventListener("click", () => {
    const on = shown.size < CATS.length;                 // 하나라도 꺼져 있으면 전체 켜기
    boxes.querySelectorAll("input").forEach(c => {
      c.checked = on;
      c.closest(".ly").classList.toggle("off", !on);
      on ? shown.add(c.dataset.c) : shown.delete(c.dataset.c);
    });
    draw();
  });

  function tabHtml() {
    const pick = document.getElementById("apCats");
    pick.innerHTML = CATS.map(([k, v]) =>
      `<button type="button" class="apcat c-${k}${k === cur ? " on" : ""}" data-c="${k}">` +
      `<span class="apdot ${(CAT_INFO[k] || {}).shape || "dot"}"><i></i></span>${v}</button>`).join("");
    pick.querySelectorAll(".apcat").forEach(b => b.addEventListener("click", () => {
      cur = b.dataset.c;
      history.replaceState(null, "", "?cat=" + cur);
      tabHtml(); draw();
    }));
  }

  async function load() {
    const list = [...shown];
    const base = shown.has("utokyo")
      ? CAMPUS.map(c => ({ id: "campus-" + c.k, builtin: true, category: "utokyo",
          name: c.name, address: c.address, jp: c.jp, note: "", ways: c.ways,
          lat: c.lat, lng: c.lng }))
      : [];
    let rows = [];
    if (list.length) {
      try {
        const r = await sb.from("map_places").select("*").in("category", list)
                          .order("created_at", { ascending: false });
        rows = r.data || [];
      } catch (e) { rows = []; }
    }
    places = base.concat(rows);
  }

  function draw() {
    layer.clearLayers();
    load().then(() => {
      layer.clearLayers();
      const pts = [];
      markers = [];
      places.forEach((p, i) => {
        pts.push([p.lat, p.lng]);
        markers[i] = L.marker([p.lat, p.lng], {
          icon: L.divIcon({ className: "", iconSize: [0, 0],
            html: `<div class="cmark c-${p.category} ${(CAT_INFO[p.category] || {}).shape || "dot"}" data-i="${i}">`
                + `<i></i><b>${esc(p.name.split(" (")[0])}</b></div>` }),
        }).addTo(layer).on("click", () => open(i));
      });
      drawList();
      if (!pts.length) map.setView([35.6895, 139.7], 12);          // 장소가 아직 없으면 도쿄 전경
      else if (pts.length === 1) map.setView(pts[0], 16);
      else map.fitBounds(pts, { padding: [50, 50], maxZoom: 15 });
      setTimeout(() => map.invalidateSize(), 100);
    });
  }

  /** 오른쪽 목록 — 분류별로 묶어서 보여준다 */
  function drawList() {
    const box = document.getElementById("plist");
    const listed = places.filter(p => !p.builtin);   // 기본 캠퍼스는 왼쪽 범례에서 봅니다
    const total = listed.length;
    if (!total) {
      box.innerHTML = '<div class="pltitle">회원이 올린 장소 0곳</div>' +
        '<div class="plempty">아직 없습니다.<br>아래에서 올려주세요.</div>';
      return;
    }
    const canAny = places.some(p => !p.builtin && ((user && p.created_by === user.id) || isAdmin));
    let html = '<div class="pltitle">회원이 올린 장소 ' + total + '곳'
             + '</div><div class="plbody">';
    for (const [k, v] of CATS) {
      const rows = places.map((p, i) => ({ p, i }))
                         .filter(x => !x.p.builtin && x.p.category === k);
      if (!rows.length) continue;
      html += `<div class="plcat c-${k}" data-c="${k}">
        <span class="lydot ${(CAT_INFO[k] || {}).shape || "dot"} c-${k}"><i></i></span>
        ${v}<em>${rows.length}</em></div>`;
      html += rows.map(({ p, i }) => {
        const mine = !p.builtin && user && p.created_by === user.id;
        const can = mine || (isAdmin && !p.builtin);
        const dot = `<span class="lydot ${(CAT_INFO[k] || {}).shape || "dot"} c-${k}"><i></i></span>`;
        return `<div class="plitem">
          <div class="plrow" data-i="${i}">
            ${can ? `<button class="plmark" data-i="${i}" title="분류 바꾸기">${dot}</button>` : dot}
            <button class="plname" data-i="${i}" title="${esc(p.name)}">${esc(p.name)}</button>
            ${can ? `<button class="pldel" data-i="${i}" title="이 장소 지우기">✕</button>` : ""}
          </div>
          ${can ? `<div class="plpick" data-i="${i}">` + CATS.map(([ck, cv]) =>
            `<button class="plchip c-${ck}${ck === k ? " on" : ""}" data-i="${i}" data-c="${ck}">` +
            `<span class="lydot ${(CAT_INFO[ck] || {}).shape || "dot"} c-${ck}"><i></i></span>${cv}</button>`
          ).join("") + `</div>` : ""}
        </div>`;
      }).join("");
    }
    box.innerHTML = html + '</div><button type="button" class="plmore" id="plMore">▼ 길게 보기</button>';
    const more = document.getElementById("plMore");
    const row = document.querySelector(".maprow");
    const sync = () => { more.textContent = row.classList.contains("tall") ? "▲ 접기" : "▼ 길게 보기"; };
    sync();
    more.addEventListener("click", () => {
      row.classList.toggle("tall");
      sync();
      setTimeout(() => map.invalidateSize(), 150);
    });

    box.querySelectorAll(".plname").forEach(b => b.addEventListener("click", () => {
      const p = places[+b.dataset.i];
      map.setView([p.lat, p.lng], 16);
      open(+b.dataset.i);
    }));
    // 앞의 표시를 누르면 분류 고르는 칸이 바로 열립니다
    box.querySelectorAll(".plmark").forEach(b => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const wrap = b.closest(".plitem");
      const open = wrap.classList.contains("picking");
      box.querySelectorAll(".plitem").forEach(x => x.classList.remove("picking"));
      if (!open) wrap.classList.add("picking");
    }));
    box.querySelectorAll(".plchip").forEach(b => b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const p = places[+b.dataset.i];
      const to = b.dataset.c;
      if (!p || p.category === to) { b.closest(".plitem").classList.remove("picking"); return; }
      b.disabled = true;
      const { error } = await sb.from("map_places").update({ category: to }).eq("id", p.id);
      b.disabled = false;
      if (error) { alert("옮기기 실패: " + error.message); return; }
      p.category = to;
      if (!shown.has(to)) {
        shown.add(to);
        const c = boxes.querySelector(`input[data-c="${to}"]`);
        if (c) { c.checked = true; c.closest(".ly").classList.remove("off"); }
      }
      draw();
    }));

    // 줄을 끌어다 분류 머리줄에 놓아도 됩니다
    let dragI = null;
    box.querySelectorAll(".plrow[data-i]").forEach(row => {
      row.addEventListener("dragstart", (e) => {
        dragI = +row.dataset.i;
        row.classList.add("dragging");
        try { e.dataTransfer.setData("text/plain", String(dragI)); } catch (err) {}
        e.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        box.querySelectorAll(".plcat").forEach(c => c.classList.remove("over"));
        dragI = null;
      });
    });
    box.querySelectorAll(".plcat").forEach(head => {
      head.addEventListener("dragover", (e) => {
        e.preventDefault(); e.dataTransfer.dropEffect = "move";
        head.classList.add("over");
      });
      head.addEventListener("dragleave", () => head.classList.remove("over"));
      head.addEventListener("drop", async (e) => {
        e.preventDefault();
        head.classList.remove("over");
        const i = dragI != null ? dragI : +(e.dataTransfer.getData("text/plain") || -1);
        const p = places[i];
        const to = head.dataset.c;
        if (!p || !to || p.category === to) return;
        const { error } = await sb.from("map_places").update({ category: to }).eq("id", p.id);
        if (error) { alert("옮기기 실패: " + error.message); return; }
        p.category = to;
        if (!shown.has(to)) {
          shown.add(to);
          const c = boxes.querySelector(`input[data-c="${to}"]`);
          if (c) { c.checked = true; c.closest(".ly").classList.remove("off"); }
        }
        draw();
      });
    });

    box.querySelectorAll(".pldel").forEach(b => b.addEventListener("click", async () => {
      const p = places[+b.dataset.i];
      if (!confirm(`「${p.name}」 을 지도에서 지울까요?`)) return;
      b.disabled = true;
      if (p.storage_path) await sb.storage.from("gallery").remove([p.storage_path]);
      const { error } = await sb.from("map_places").delete().eq("id", p.id);
      if (error) { alert("지우기 실패: " + error.message); b.disabled = false; return; }
      draw();
    }));
  }

  // ── 장소 안내 창 ──
  const modal = document.getElementById("pmodal");
  const close = () => modal.classList.remove("on");
  document.getElementById("pClose").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  function open(i) {
    const p = places[i];
    if (!p) return;
    document.getElementById("pCat").textContent = CAT_NAME[p.category] || "";
    document.getElementById("pName").textContent = p.name;
    document.getElementById("pAddr").textContent = p.address || "";
    document.getElementById("pJp").textContent = p.jp || "";
    const img = document.getElementById("pImg");
    if (p.image_url) { img.src = p.image_url; img.style.display = ""; } else img.style.display = "none";
    document.getElementById("pNote").textContent = p.note || "";
    document.getElementById("pNoteBox").style.display = p.note ? "" : "none";
    document.getElementById("pMemo").textContent = p.memory || "";
    document.getElementById("pMemoBox").style.display = p.memory ? "" : "none";
    document.getElementById("pWays").innerHTML =
      (p.ways || []).map(w => `<li>${w}</li>`).join("");
    // 이름으로 찾아야 구글 지도에 가게 정보·메뉴·사진·후기가 함께 나옵니다
    const gq = [p.name, (p.address || "").split(",").slice(0, 3).join(" ")]
                 .filter(Boolean).join(" ").trim();
    const gmap = gq
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gq)}`
      : `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
    document.getElementById("pMap").href = gmap;
    document.getElementById("pDir").href = gq
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(gq)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
    const post = document.getElementById("pPost");
    if (p.post_id) { post.style.display = ""; post.href = `${HOME}/post.html?id=${p.post_id}`; }
    else post.style.display = "none";
    const who = document.getElementById("pWho");
    const when = p.created_at ? String(p.created_at).slice(0, 10).replace(/-/g, ".") : "";
    who.innerHTML = p.builtin ? ""
      : p.owner_admin ? `<b>관리자</b>${when ? " · " + when : ""} 가 올린 장소입니다`
      : p.owner_name ? `<b>공유자(${esc(p.owner_name)})</b>${when ? " · " + when : ""} 가 올린 장소입니다`
      : (when ? when + " 에 올라온 장소입니다" : "");
    // 분류 바꾸기 — 바꾸면 지도 표시도 그 분류의 기호로 바뀝니다
    const sel = document.getElementById("pCatSel");
    const canCat = !p.builtin && ((user && p.created_by === user.id) || isAdmin);
    sel.style.display = canCat ? "" : "none";
    if (canCat) {
      sel.innerHTML = CATS.map(([k, v]) =>
        `<option value="${k}"${k === p.category ? " selected" : ""}>${v}</option>`).join("");
      sel.onchange = async () => {
        const to = sel.value;
        if (to === p.category) return;
        sel.disabled = true;
        const { error } = await sb.from("map_places").update({ category: to }).eq("id", p.id);
        sel.disabled = false;
        if (error) { alert("분류 바꾸기 실패: " + error.message); sel.value = p.category; return; }
        p.category = to;
        if (!shown.has(to)) {                       // 꺼둔 분류로 옮겼으면 켜 준다
          shown.add(to);
          const c = boxes.querySelector(`input[data-c="${to}"]`);
          if (c) { c.checked = true; c.closest(".ly").classList.remove("off"); }
        }
        close();
        draw();
      };
    }
    const mv = document.getElementById("pMove");
    const canEdit = !p.builtin && ((user && p.created_by === user.id) || isAdmin);
    mv.style.display = canEdit ? "" : "none";
    mv.onclick = () => startMove(i);
    const del = document.getElementById("pDel");
    const mine = !p.builtin && user && p.created_by === user.id;
    del.style.display = (mine || (isAdmin && !p.builtin)) ? "" : "none";
    del.onclick = async () => {
      if (!confirm(`「${p.name}」 을 지도에서 지울까요?`)) return;
      if (p.storage_path) await sb.storage.from("gallery").remove([p.storage_path]);
      const { error } = await sb.from("map_places").delete().eq("id", p.id);
      if (error) { alert("지우기 실패: " + error.message); return; }
      close(); draw();
    };
    modal.classList.add("on");
  }

  /** 일본 주소는 표기가 제각각이라, 여러 형태로 바꿔가며 찾아본다.
   *  구글 지도에서 복사한 주소는 이런 모양입니다 —
   *    일본 〒103-0022 Tokyo, Chuo City, Nihonbashimuromachi, 1 Chome−11−15 ＵＮＯビル
   *  나라 이름·우편번호·건물 이름이 섞여 있고 전각 글자와 특수한 붙임표(−)까지 들어 있어,
   *  그대로 넘기면 못 찾습니다. 아래에서 하나씩 걷어내며 찾아봅니다. */
  const normAddr = (raw) => String(raw || "")
    .normalize("NFKC")                              // ＵＮＯ → UNO, １ → 1
    .replace(/[\u2010-\u2015\u2212\uFF0D\u30FC]/g, "-")   // −–—ー－ → -
    .replace(/^\s*(일본|日本|Japan)\s*[,、]?\s*/i, "")     // 앞머리 나라 이름
    .replace(/\s*,\s*(일본|日本|Japan)\s*$/i, "")          // 뒤에 붙은 나라 이름
    .replace(/\s+/g, " ")
    .trim();

  // 〒103-0022 → 1030022
  const zipOf = (t) => {
    const m = t.match(/〒?\s*(\d{3})-?\s*(\d{4})/);
    return m ? m[1] + m[2] : "";
  };
  const dropZip = (t) => t.replace(/〒?\s*\d{3}-?\s*\d{4}/g, " ").replace(/\s+/g, " ").trim();

  // 「1 Chome-11-15」 「1丁目11-15」 → 「1-11-15」
  const banchi = (t) => {
    let m = t.match(/(\d+)\s*(?:Chome|丁目)\s*-?\s*(\d+)\s*(?:-\s*(\d+))?/i);
    if (m) return m[3] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[1]}-${m[2]}`;
    m = t.match(/(\d+(?:-\d+){1,2})\s*$/);
    return m ? m[1] : "";
  };

  // 건물 이름·층수를 떼어낸다 (OSM 에는 거의 없습니다)
  const dropBldg = (t) => t
    .replace(/\s*\d+\s*[FＦ]\b.*$/i, "")
    .replace(/\s*[^\s,]*(ビル|ﾋﾞﾙ|Building|Bldg\.?|Tower|Heights|Mansion)\s*$/i, "")
    .replace(/\s*,\s*$/, "")
    .trim();

  /** 우편번호로 일본어 주소를 알아낸다 (zipcloud · 무료) */
  async function byZip(zip) {
    try {
      const j = await fetch("https://zipcloud.ibsnet.co.jp/api/search?zipcode=" + zip)
        .then(r => r.json());
      const r = (j.results || [])[0];
      if (!r) return "";
      return (r.address1 || "") + (r.address2 || "") + (r.address3 || "");
    } catch (e) { return ""; }
  }

  /** 일본 국토지리원 주소검색 — 번지까지 정확히 찾아줍니다 (일본어 주소일 때) */
  async function gsi(q) {
    if (!q || q.length < 4) return null;
    try {
      const j = await fetch("https://msearch.gsi.go.jp/address-search/AddressSearch?q="
                            + encodeURIComponent(q)).then(r => r.json());
      const f = (j || [])[0];
      if (!f || !f.geometry) return null;
      const c = f.geometry.coordinates;
      return { lat: c[1], lon: c[0],
               display_name: (f.properties && f.properties.title) || q,
               extratags: {}, class: "", type: "", address: {} };
    } catch (e) { return null; }
  }

  async function geocode(raw) {
    const one = async (q, extra = "") => {
      if (!q || q.length < 3) return null;
      try {
        const u = "https://nominatim.openstreetmap.org/search?format=json&limit=1"
                + "&addressdetails=1&extratags=1&namedetails=1&accept-language=ko"
                + "&countrycodes=jp" + extra + "&q=" + encodeURIComponent(q);
        const j = await fetch(u, { headers: { Accept: "application/json" } }).then(r => r.json());
        return (j && j[0]) || null;
      } catch (e) { return null; }
    };

    const base = normAddr(raw);
    if (!base) return null;

    const zip = zipOf(base);
    const noZip = dropZip(base);
    const noBldg = dropBldg(noZip);
    const num = banchi(noZip);
    const hasLatin = /[A-Za-z]/.test(noBldg);

    const tries = [base, noZip, noBldg];

    // 우편번호가 있으면 일본어 주소로 바꿔서 (가장 잘 맞습니다)
    let ja = "";
    if (zip) {
      ja = await byZip(zip);
      if (ja) {
        if (num) tries.push(ja + num);
        tries.push(ja);
      }
    }

    // ── 일본어 주소가 손에 들어왔으면 국토지리원에서 먼저 찾는다 (번지까지 나옵니다) ──
    const jaTries = [];
    if (ja && num) jaTries.push(ja + num);
    if (ja) jaTries.push(ja);
    if (!hasLatin) jaTries.unshift(noBldg);          // 처음부터 일본어로 적어주신 경우
    for (const q of [...new Set(jaTries.filter(Boolean))]) {
      const hit = await gsi(q);
      if (hit) return hit;
    }

    // 일본어 주소는 띄어쓰기를 없앤 쪽이 잘 맞습니다 (영문 주소는 반대라 건드리지 않습니다)
    if (!hasLatin) {
      const nospace = noBldg.replace(/\s+/g, "");
      if (nospace !== noBldg) tries.push(nospace);
    }

    // 번지를 뒤에서부터 하나씩 덜어내며
    let cut = noBldg;
    for (let i = 0; i < 3; i++) {
      const m = cut.match(/^(.*?)[\s,]*-?\s*\d+\s*$/);
      if (!m || m[1].length < 5) break;
      cut = m[1].replace(/[\s,]+$/, "");
      tries.push(cut);
    }

    // 동네 이름까지만
    const town = noBldg.replace(/[,\s]*\d+.*$/, "").trim();
    if (town.length > 3) tries.push(town);

    for (const q of [...new Set(tries.filter(Boolean))]) {
      const hit = await one(q);
      if (hit) return hit;
    }

    // 그래도 없으면 자동완성 검색으로 한 번 더
    for (const q of [...new Set([noBldg, base].filter(Boolean))]) {
      try {
        const u = "https://photon.komoot.io/api/?limit=1&lang=en&lat=35.68&lon=139.76"
                + "&location_bias_scale=0.6&q=" + encodeURIComponent(q);
        const j = await fetch(u, { headers: { Accept: "application/json" } }).then(r => r.json());
        const ft = (j.features || [])[0];
        if (ft) {
          const c = ft.geometry.coordinates;
          return { lat: c[1], lon: c[0], display_name: base, extratags: {},
                   class: ft.properties.osm_key, type: ft.properties.osm_value, address: {} };
        }
      } catch (e) {}
    }
    return null;
  }

  // ── 지도를 눌러 위치를 직접 찍기 ──
  //    주소 검색이 잘 안 될 때 지도를 확대해 원하는 자리를 찍으시면 됩니다.
  let pinMode = false, pin = null;
  {
    const btn = document.getElementById("apPin");
    const msgEl = () => document.getElementById("apMsg");
    const setMode = (on) => {
      pinMode = on;
      btn.classList.toggle("on", on);
      btn.textContent = on ? "📍 지도를 누르세요 (끄기)" : "📍 지도에서 찍기";
      document.getElementById("cmap").style.cursor = on ? "crosshair" : "";
      if (on) {
        msgEl().textContent = "지도를 확대해서 원하는 자리를 누르세요. 표시를 끌어 옮길 수도 있습니다.";
        document.querySelector(".mapbox").scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    btn.addEventListener("click", () => setMode(!pinMode));

    // 적어 넣은 주소로 찾아 지도에 찍기
    document.getElementById("apFind").addEventListener("click", async () => {
      const addrEl = document.getElementById("apAddr");
      const q = addrEl.value.trim();
      if (!q) { msgEl().textContent = "먼저 주소를 적어주세요."; return; }
      const fb = document.getElementById("apFind");
      fb.disabled = true; msgEl().textContent = "주소로 위치를 찾는 중…";
      const hit = await geocode(q);
      fb.disabled = false;
      if (!hit) {
        msgEl().textContent = "그 주소를 찾지 못했습니다. ［📍 지도에서 찍기］ 로 직접 눌러주세요.";
        setMode(true);
        return;
      }
      const ll = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
      picked = { lat: ll.lat, lon: ll.lng };
      map.setView([ll.lat, ll.lng], 17);
      if (pin) pin.setLatLng(ll);
      else {
        pin = L.marker(ll, { draggable: true, zIndexOffset: 900,
          icon: L.divIcon({ className: "", iconSize: [0, 0],
            html: '<div class="cmark pinmark"><i></i><b>여기</b></div>' }) }).addTo(map);
        pin.on("dragend", () => {
          const p = pin.getLatLng();
          picked = { lat: p.lat, lon: p.lng };
          reverse(p.lat, p.lng);
        });
      }
      const noteEl = document.getElementById("apNote");
      const kind = kindOf(hit);
      if (kind && !noteEl.value.trim()) noteEl.value = `(${kind})`;
      msgEl().textContent = "지도에 찍었습니다. 자리가 다르면 표시를 끌어 옮기거나 ［📍 지도에서 찍기］ 로 다시 눌러주세요.";
      document.querySelector(".mapbox").scrollIntoView({ behavior: "smooth", block: "center" });
    });

    async function reverse(lat, lng) {
      const addrEl = document.getElementById("apAddr");
      const noteEl = document.getElementById("apNote");
      addrEl.value = "위치를 확인하는 중…";
      try {
        const u = "https://nominatim.openstreetmap.org/reverse?format=json&zoom=18"
                + "&addressdetails=1&extratags=1&namedetails=1&accept-language=ko"
                + `&lat=${lat}&lon=${lng}`;
        const h = await fetch(u, { headers: { Accept: "application/json" } }).then(r => r.json());
        addrEl.value = (h && h.display_name) || `위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`;
        const kind = h ? kindOf(h) : "";
        if (kind && !noteEl.value.trim()) noteEl.value = `(${kind})`;
      } catch (e) {
        addrEl.value = `위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`;
      }
      msgEl().textContent = "위치를 찍었습니다. 이름과 추천사유를 적고 ［지도에 올리기］ 를 눌러주세요.";
    }

    window.__utkSetPin = (ll) => {
      picked = { lat: ll.lat, lon: ll.lng };
      if (pin) pin.setLatLng(ll);
      else {
        pin = L.marker(ll, { draggable: true, zIndexOffset: 900,
          icon: L.divIcon({ className: "", iconSize: [0, 0],
            html: '<div class="cmark pinmark"><i></i><b>여기</b></div>' }) }).addTo(map);
        pin.on("dragend", () => {
          const p = pin.getLatLng();
          picked = { lat: p.lat, lon: p.lng };
          reverse(p.lat, p.lng);
        });
      }
      reverse(ll.lat, ll.lng);
    };
    window.__utkClearPin = () => {
      if (pin) { map.removeLayer(pin); pin = null; }
      setMode(false);
    };
    map.on("click", (e) => { if (pinMode) window.__utkSetPin(e.latlng); });
  }

  // ── 상호명을 적으면 주소 후보를 보여준다 ──
  let picked = null;                     // 후보에서 고른 위치 (있으면 다시 찾지 않습니다)
  {
    const nameEl = document.getElementById("apName");
    const addrEl = document.getElementById("apAddr");
    const sug = document.getElementById("apSug");
    const TOKYO = "&viewbox=138.90,36.25,140.55,35.15&bounded=1";
    let timer = null, lastQ = "";

    const hide = () => { sug.classList.remove("on"); sug.innerHTML = ""; };
    addrEl.addEventListener("input", () => { picked = null; });      // 직접 고치면 다시 찾습니다
    document.addEventListener("click", (e) => { if (!sug.contains(e.target) && e.target !== nameEl) hide(); });

    /** 한글 이름은 OpenStreetMap 에 거의 없다 → 위키백과로 일본어 이름을 찾아 다시 검색 */
    async function viaWiki(q) {
      const api = (host, p) => fetch(`https://${host}/w/api.php?origin=*&format=json&` + p)
                                 .then(r => r.json()).catch(() => null);
      const sr = await api("ko.wikipedia.org",
        "action=query&list=search&srlimit=3&srsearch=" + encodeURIComponent(q));
      const hits = (sr && sr.query && sr.query.search) || [];
      if (!hits.length) return [];
      const titles = hits.map(h => h.title);
      const info = await api("ko.wikipedia.org",
        "action=query&prop=coordinates|langlinks&lllang=ja&lllimit=1&titles="
        + encodeURIComponent(titles.join("|")));
      const pages = (info && info.query && info.query.pages) || {};
      const out = [];
      for (const key of Object.keys(pages)) {
        const p = pages[key];
        const ja = p.langlinks && p.langlinks[0] && p.langlinks[0]["*"];
        const co = p.coordinates && p.coordinates[0];
        out.push({ ko: p.title, ja, lat: co && co.lat, lon: co && co.lon });
      }
      return out.filter(x => x.ja || (x.lat && x.lon));
    }

    /** Photon — 일부만 쳐도 찾아주는 자동완성 검색 */
    async function photon(q) {
      try {
        const u = "https://photon.komoot.io/api/?limit=8&lang=en"
                + "&lat=35.68&lon=139.76&location_bias_scale=0.6"
                + "&q=" + encodeURIComponent(q);
        const j = await fetch(u, { headers: { Accept: "application/json" } }).then(r => r.json());
        return (j.features || []).map(ft => {
          const p = ft.properties || {};
          const c = (ft.geometry && ft.geometry.coordinates) || [];
          const line = [p.housenumber, p.street, p.district, p.city, p.state, p.country]
                         .filter(Boolean).join(", ");
          return {
            lat: c[1], lon: c[0],
            name: p.name || p.street || "",
            display_name: [p.name, line].filter(Boolean).join(", "),
            class: p.osm_key, type: p.osm_value,
            address: { suburb: p.district, city: p.city },
            namedetails: { name: p.name },
            extratags: {},
            _photon: true,
          };
        }).filter(x => x.lat && x.lon && x.display_name);
      } catch (e) { return []; }
    }

    async function nomi(q) {
      const u = "https://nominatim.openstreetmap.org/search?format=json&limit=6"
              + "&addressdetails=1&extratags=1&namedetails=1&accept-language=ko"
              + TOKYO + "&q=" + encodeURIComponent(q);
      try { return await fetch(u, { headers: { Accept: "application/json" } }).then(r => r.json()); }
      catch (e) { return []; }
    }

    async function look(q) {
      if (q.length < 2 || q === lastQ) return;
      lastQ = q;
      sug.innerHTML = '<div class="apsmsg">주소를 찾는 중…</div>';
      sug.classList.add("on");
      let list = await photon(q);            // 일부만 쳐도 찾아주는 검색
      if (!list.length) list = await nomi(q);  // 그래도 없으면 정밀 검색
      // 한글로 적으셨는데 못 찾으면 위키백과로 일본어 이름을 찾아 다시 검색합니다
      if ((!list || !list.length) && /[가-힣]/.test(q)) {
        sug.innerHTML = '<div class="apsmsg">한국어 이름으로 다시 찾는 중…</div>';
        const wk = await viaWiki(q);
        for (const w of wk) {
          if (w.ja) {
            const r = await nomi(w.ja);
            if (r && r.length) { list = r; break; }
          }
        }
        // 그래도 없으면 위키백과 좌표로 주소를 되찾습니다
        if ((!list || !list.length) && wk.length) {
          const w = wk.find(x => x.lat && x.lon);
          if (w) {
            try {
              const ru = "https://nominatim.openstreetmap.org/reverse?format=json&zoom=18"
                       + "&addressdetails=1&extratags=1&accept-language=ko"
                       + `&lat=${w.lat}&lon=${w.lon}`;
              const rv = await fetch(ru, { headers: { Accept: "application/json" } }).then(r => r.json());
              if (rv && rv.display_name) {
                rv.name = w.ko;
                list = [rv];
              }
            } catch (e) {}
          }
        }
      }
      if (!list || !list.length) {
        sug.innerHTML = '<div class="apsmsg">찾지 못했습니다.<br>' +
          '일본어나 영어 이름으로 적어보시거나(예: teamLab Planets), 주소를 직접 적어주세요.</div>';
        return;
      }
      sug.innerHTML = list.map((h, i) => {
        const head = (h.name || h.display_name.split(",")[0]).trim();
        return `<button type="button" class="apsitem" data-i="${i}">` +
               `<b>${esc(head)}</b><span>${esc(h.display_name)}</span></button>`;
      }).join("");
      sug.querySelectorAll(".apsitem").forEach(b => b.addEventListener("click", async () => {
        const h = list[+b.dataset.i];
        addrEl.value = h.display_name;
        picked = { lat: parseFloat(h.lat), lon: parseFloat(h.lon) };
        // 「이곳의 특징」을 채워드립니다 (고치셔도 됩니다)
        const noteEl = document.getElementById("apNote");
        let kind = kindOf(h);
        const already = noteEl.value.trim();
        let tags = h.extratags || {};
        if (h._photon) {                      // 자세한 정보를 한 번 더 확인
          try {
            const ru = "https://nominatim.openstreetmap.org/reverse?format=json&zoom=18"
                     + "&addressdetails=1&extratags=1&namedetails=1&accept-language=ko"
                     + `&lat=${h.lat}&lon=${h.lon}`;
            const rv = await fetch(ru, { headers: { Accept: "application/json" } }).then(r => r.json());
            if (rv && !rv.error) { tags = rv.extratags || {}; kind = kindOf(rv) || kind; }
          } catch (e) {}
        }
        const osmDesc = tags["description:ko"] || tags["description"] || "";
        if (!already) noteEl.value = osmDesc || (kind ? `(${kind})` : "");   // 우선 종류만이라도
        hide();
        msgSafe("주소를 넣었습니다. 어떤 곳인지 찾아보는 중…");
        if (!already && !osmDesc) {
          const nm = (h.namedetails && (h.namedetails["name:ko"] || h.namedetails.name))
                   || h.name || (h.display_name || "").split(",")[0];
          describeFromWiki(nm).then(d => {
            const now = noteEl.value.trim();
            if (d && (now === "" || now === kind || now === `(${kind})`)) {   // 손대지 않으셨을 때만
              noteEl.value = kind ? `(${kind}) ${d}` : d;
            }
            msgSafe("특징을 채웠습니다. 맞지 않으면 고쳐주세요. 추억은 원하실 때만 적으시면 됩니다.");
          });
        } else {
          msgSafe("주소를 넣었습니다. 추억은 원하실 때만 적으시면 됩니다.");
        }
      }));
    }
    const msgSafe = (t) => { const m = document.getElementById("apMsg"); if (m) m.textContent = t; };
    nameEl.addEventListener("input", () => {
      clearTimeout(timer);
      const q = nameEl.value.trim();
      if (q.length < 2) { hide(); return; }
      timer = setTimeout(() => look(q), 550);        // 타이핑이 멈추면 찾습니다
    });
  }

  // ── 사진 붙여넣기 · 끌어놓기 ──
  {
    const zone = document.getElementById("apDrop");
    const input = document.getElementById("apImg");
    const prev = document.getElementById("apPrev");
    const note = document.getElementById("apImgMsg");
    const setFile = (file) => {
      if (!file || !/^image\//.test(file.type)) return false;
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      prev.src = URL.createObjectURL(file);
      prev.style.display = "";
      note.innerHTML = "사진 1장이 준비됐습니다. <b>다시 붙여넣으면 바뀝니다.</b>";
      return true;
    };
    input.addEventListener("change", () => setFile(input.files[0]));
    // 끌어놓기
    ["dragenter", "dragover"].forEach(ev => zone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation(); zone.classList.add("on");
    }));
    ["dragleave", "drop"].forEach(ev => zone.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation(); zone.classList.remove("on");
    }));
    zone.addEventListener("drop", (e) => setFile((e.dataTransfer?.files || [])[0]));
    // 붙여넣기 (화면 어디서 눌러도 이 칸에 들어갑니다)
    window.addEventListener("paste", (e) => {
      const items = [...(e.clipboardData?.items || [])];
      const it = items.find(x => x.kind === "file" && /^image\//.test(x.type));
      if (!it) return;
      const f = it.getAsFile();
      if (f && setFile(f)) {
        e.preventDefault();
        zone.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ── 올린 장소의 위치를 마우스로 옮기기 ──
  let moving = null;                       // { i, marker, from }
  function startMove(i) {
    const p = places[i], mk = markers[i];
    if (!p || !mk) return;
    close();
    moving = { i, marker: mk, from: mk.getLatLng() };
    mk.dragging && mk.dragging.enable();
    mk.setZIndexOffset(1000);
    const el = mk.getElement && mk.getElement();
    if (el) el.querySelector(".cmark")?.classList.add("moving");
    document.getElementById("moveName").textContent = p.name;
    document.getElementById("moveBar").classList.add("on");
    map.setView(mk.getLatLng(), Math.max(map.getZoom(), 16));
  }
  function endMove(keep) {
    if (!moving) return;
    const { marker, from } = moving;
    marker.dragging && marker.dragging.disable();
    const el = marker.getElement && marker.getElement();
    if (el) el.querySelector(".cmark")?.classList.remove("moving");
    document.getElementById("moveBar").classList.remove("on");
    if (!keep) marker.setLatLng(from);
    moving = null;
  }
  document.getElementById("moveNo").addEventListener("click", () => endMove(false));
  document.getElementById("moveOk").addEventListener("click", async () => {
    if (!moving) return;
    const { i, marker } = moving;
    const p = places[i];
    const ll = marker.getLatLng();
    const btn = document.getElementById("moveOk");
    btn.disabled = true; btn.textContent = "저장 중…";
    const { error } = await sb.from("map_places")
      .update({ lat: ll.lat, lng: ll.lng }).eq("id", p.id);
    btn.disabled = false; btn.textContent = "이 자리로 저장";
    if (error) { alert("위치 저장 실패: " + error.message); return; }
    endMove(true);
    draw();
  });

  // ── 장소 추가 (주소 → 위치 찾기) ──
  const msg = document.getElementById("apMsg");
  document.getElementById("apGo").addEventListener("click", async () => {
    const name = document.getElementById("apName").value.trim();
    const addr = document.getElementById("apAddr").value.trim();
    const note = document.getElementById("apNote").value.trim();
    const memo = document.getElementById("apMemo").value.trim();
    const file = document.getElementById("apImg").files[0] || null;
    if (!name) { msg.textContent = "장소 이름을 적어주세요."; return; }
    if (!addr) { msg.textContent = "주소를 적어주세요."; return; }
    const btn = document.getElementById("apGo");
    btn.disabled = true;
    let hit = picked ? { lat: picked.lat, lon: picked.lon } : null;
    if (hit) msg.textContent = "올리는 중…";
    else {
      msg.textContent = "주소로 위치를 찾는 중…";
      hit = await geocode(addr);
    }
    if (!hit) {
      btn.disabled = false;
      msg.textContent = "그 주소를 찾지 못했습니다. 위 ［📍 지도에서 찍기］ 로 위치를 직접 눌러주세요.";
      return;
    }
    // 사진이 있으면 먼저 올린다
    let image_url = null, storage_path = null;
    if (file) {
      msg.textContent = "사진을 올리는 중…";
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      storage_path = `map/${cur}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const up = await sb.storage.from("gallery").upload(storage_path, file, { cacheControl: "3600" });
      if (up.error) {
        btn.disabled = false; msg.textContent = "사진 올리기 실패: " + up.error.message;
        return;
      }
      image_url = sb.storage.from("gallery").getPublicUrl(storage_path).data.publicUrl;
    }
    const { error } = await sb.from("map_places").insert({
      category: cur, name, address: addr, note: note || null,
      memory: memo || null, image_url, storage_path,
      lat: parseFloat(hit.lat), lng: parseFloat(hit.lon),
      owner_name: (me && me.is_admin) ? "" : ((me && me.name) || ""),
      owner_admin: !!(me && me.is_admin),
      created_by: user.id,
    });
    btn.disabled = false;
    if (error) {
      const m = error.message || "";
      msg.textContent =
        /schema cache|does not exist/i.test(m)
          ? "지도 기능이 아직 켜지지 않았습니다 — 운영진이 YB/board/sql/map_places.sql 을 한 번 실행해주세요."
        : /row-level security|policy/i.test(m)
          ? "승인된 회원만 올릴 수 있습니다. 운영진 승인 후 다시 시도해주세요."
        : "올리기 실패: " + m;
      return;
    }
    picked = null;
    if (window.__utkClearPin) window.__utkClearPin();
    document.getElementById("apName").value = "";
    document.getElementById("apAddr").value = "";
    document.getElementById("apNote").value = "";
    document.getElementById("apMemo").value = "";
    document.getElementById("apImg").value = "";
    document.getElementById("apPrev").style.display = "none";
    document.getElementById("apImgMsg").innerHTML =
      "여기에 <b>붙여넣기(Ctrl+V)</b> 하거나, 사진을 <b>끌어다 놓으세요</b>. 눌러서 고르셔도 됩니다.";
    msg.textContent = `「${name}」 을 지도에 올렸습니다.`;
    if (!shown.has(cur)) {                       // 꺼둔 분류에 올렸으면 켜서 보여준다
      shown.add(cur);
      const c = boxes.querySelector(`input[data-c="${cur}"]`);
      if (c) { c.checked = true; c.closest(".ly").classList.remove("off"); }
    }
    draw();
  });

  window.addEventListener("resize", () => setTimeout(() => map.invalidateSize(), 120));
  tabHtml();
  draw();
}
