/* 上古图谱 web MVP —— 零依赖单页应用
 * 模式：时空图谱（滑块过滤+点击详情）/ 叙事线（story 播放器+分支互动）
 * 底图为经纬度点列示意画（与实体同一投影，保证相对位置自洽）
 */
"use strict";
const $ = s => document.querySelector(s);
const E = ATLAS.entities, R = ATLAS.relations, S = ATLAS.stories;
const byId = Object.fromEntries(E.map(e => [e.id, e]));
const CONF = { A: "#2f9e6e", B: "#8fce6b", C: "#f0a24a", D: "#e0564a", E: "#9d7bea" };

/* ---------- 投影：经纬度 → SVG (1000×708)，等距圆柱×cos(35°) ---------- */
const LON0 = 73, LON1 = 135.5, LAT0 = 17.8, LAT1 = 54.6;
const W = 1000, H = 708;
const sx = W / (LON1 - LON0), sy = (H / (LAT1 - LAT0)) / 0.82;
const px = lon => (lon - LON0) * sx;
const py = lat => H - (lat - LAT0) * sy;
const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ");

/* ---------- 示意底图（简化轮廓点列，顺时针） ---------- */
const LAND_PTS = [
  [73.5,39.4],[74.8,37.2],[76.2,36.4],[78,35.4],[78.8,34.6],[79.6,33.2],[80.5,32.4],[81.5,31.6],[82.5,30.6],
  [83.5,29.5],[84.5,28.7],[85.8,28.3],[87,28.1],[88.2,27.9],[89,27.4],[90.4,27.7],[91.2,27.8],[92.1,27.5],
  [93.5,28.4],[94.6,29.3],[96,29],[97.5,28.3],[98.4,27.5],[98.8,26],[98,25.4],[97.6,24],[98.7,23.9],
  [99.5,22.1],[100.2,21.2],[101.6,21.1],[102.1,22.4],[103.3,22.5],[104.8,22.8],[106.7,21.9],[108,21.5],
  [109.2,21.4],[109.8,20.2],[110.6,21.3],[111.8,21.6],[113.2,22.1],[114.3,22.5],[115.5,22.8],[116.5,23.2],
  [117.2,23.6],[118.5,24.7],[119.5,25.7],[120.5,26.8],[121.5,27.9],[121.9,29],[121.4,30.2],[121.9,31.1],
  [122.5,31.7],[121.9,32.6],[120.4,33.6],[120.2,34.6],[119.5,35.1],[119.8,36.1],[120.6,36.3],[121.6,36.8],
  [122.5,37.3],[121.5,37.6],[120.4,38],[119.4,38.8],[118.4,39.1],[117.7,39.2],[117.3,39.6],[117.6,40.1],
  [118.7,40.3],[119.7,40.9],[120.9,40.9],[121.9,41.1],[122.4,41.5],[121.7,42.3],[122,43.1],[121,43.9],
  [120.4,44.6],[119.9,45.6],[119.4,46.6],[118.8,47.5],[117.4,47.7],[116.4,48],[115.8,48.2],[116,48.8],
  [117,49.2],[117.8,49.5],[116.4,49.9],[115.4,49.9],[114,50.3],[112,50.6],[111,50.2],[110,50.1],[109.4,49.7],
  [108.9,49.4],[108,49.6],[107.4,49.3],[106.5,49.5],[105.4,49.8],[104.5,50.2],[103.4,50.5],[102.5,50.9],
  [101,51.6],[100,51.5],[98.9,52],[98,52.5],[97,52.8],[96,53],[95,53.3],[93.9,53.2],[92.8,53.3],[91.5,53.6],
  [90.4,53.4],[89,53.3],[87.9,53.5],[86.9,53.3],[85.8,53.2],[84.6,53.3],[83.4,53.3],[82.2,53.5],[81,53.2],
  [79.8,53.3],[78.6,53.5],[77.2,53.3],[76,53.4],[74.8,53.5],[73.6,53.5],[73.9,54.4],[74.9,53],[75.5,51.5],
  [76.6,49.2],[79,47],[80.3,45.5],[82.6,45.2],[84.5,45.2],[85.5,47],[87,48.6],[88,48.8],[90,47.9],[91,45.6],
  [92.1,45.2],[94,44.3],[95.6,44.2],[96.2,42.8],[97.5,42.5],[98.5,42.2],[99.8,42.7],[101,42.5],[102.2,42.2],
  [103.4,42.4],[104.6,41.7],[105.2,41.6],[106.2,41.4],[107.5,42.4],[108.9,42.5],[110.2,42.6],[111,43.8],
  [111.6,44],[112.3,45],[111.5,45.1],[110.4,44.4],[119,45],[119.2,46.2],[120.7,47],[122,47.8],[123.5,48.5],
  [125,48.2],[125.7,49.2],[126.5,49.5],[127.5,49.8],[129,49.4],[130.6,48.9],[131.8,47.7],[133.1,48.1],
  [133.9,48.5],[134.5,48.3],[133.5,47.2],[134.5,47],[135,46.2],[134,45.2],[133,44.4],[133.5,43.5],
  [132.5,43],[132.3,42.5],[131,42.8],[130.6,42.3],[131.3,43],[129.8,41.6],[128,41],[126.5,40.7],[125,39.9],
  [124.4,39.8],[122.5,39.6],[121.2,38.8],[121.7,39.5],[120.2,37.7],[119.2,37.2],[118.9,37.6],[118,37.4],
  [117.4,38.3],[116.5,38.1],[116.9,37.5],[116,37.6],[115,36.6],[114.5,36.1],[113.5,34.8],[112,34.7],
  [111,34.3],[110.5,33],[110.2,32],[110.5,31.2],[110,30.4],[109.5,29.5],[109.2,28.4],[108.8,27.5],
  [108.5,26.5],[108.2,25.5],[108.9,24.5],[108.5,23.5],[108.3,22.6],[109.5,21.5],[110.4,20.3],[110.9,21.5]
];
const HUANGHE = [[96.5,35.5],[98,36.1],[100,36.3],[101.5,35.7],[102.5,36.2],[103.8,36.2],[105,37],[106,37.8],
  [106.5,38.8],[107.5,39],[109,40.2],[111,40.4],[112,39.4],[111.4,38.4],[110.4,37],[110.4,35.8],[111.4,34.8],
  [113,34.8],[114.6,35.3],[116,35.9],[117.6,36.6],[118.8,37.1],[119.2,37.6]];
const CHANGJIANG = [[91,33.5],[92,32],[94,32.5],[97,32.4],[98.4,28.5],[100,26.5],[101.6,27.1],[102,28.3],
  [104,28.6],[105.6,28.8],[106.5,29.6],[108,30.6],[110,30.6],[112,30.7],[114,30.7],[116,30.6],[117.6,31.1],
  [119.6,31.9],[121.6,31.6],[122.1,31.5]];

function drawBase(svg) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.innerHTML =
    `<path class="land" d="${path(LAND_PTS)} Z"/>` +
    `<ellipse class="land" cx="${px(109.8)}" cy="${py(19.2)}" rx="${1.9 * sx}" ry="${1.4 * sy}"/>` +
    `<ellipse class="land" cx="${px(121.1)}" cy="${py(23.7)}" rx="${0.8 * sx}" ry="${1.8 * sy}"/>` +
    `<path class="river" d="${path(HUANGHE)}"/><text class="river-label" x="${px(112)}" y="${py(40.6)}">黄河</text>` +
    `<path class="river" d="${path(CHANGJIANG)}"/><text class="river-label" x="${px(99)}" y="${py(27)}">长江</text>` +
    `<text class="river-label" x="${px(80)}" y="${py(37)}" font-size="9">（示意底图）</text>`;
  svg.appendChild(g);
}

/* ---------- 实体渲染 ---------- */
const SHAPES = {
  site: c => `<circle class="shape" r="6" fill="${c}"/>`,
  culture: c => `<rect class="shape" x="-6" y="-6" width="12" height="12" rx="2" fill="${c}"/>`,
  population: c => `<path class="shape" d="M0,-7 L7,6 L-7,6 Z" fill="${c}"/>`,
  polity: c => `<path class="shape" d="M0,-7 L7,6 L-7,6 Z" fill="${c}"/>`,
  tech: c => `<path class="shape" d="M0,-7 L7,0 L0,7 L-7,0 Z" fill="${c}"/>`,
  climate_event: c => `<path class="shape" d="M0,-7 L7,0 L0,7 L-7,0 Z" fill="none" stroke="${c}" stroke-width="2.4"/>`,
  myth_person: c => `<circle class="shape" r="6.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-dasharray="3 2.4"/>`,
  myth_event: c => `<circle class="shape" r="6.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-dasharray="3 2.4"/>`,
};

function drawEntities(svg) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.id = "ent-layer";
  for (const e of E) {
    if (!e._lonlat) continue;
    const [lon, lat] = e._lonlat, x = px(lon), y = py(lat);
    const c = CONF[e.confidence];
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "ent");
    node.dataset.id = e.id;
    const left = x > W - 130, top = y < 34;
    node.innerHTML = (SHAPES[e.type] || SHAPES.site)(c) +
      `<text x="${left ? -10 : 10}" y="${top ? 20 : 4}" text-anchor="${left ? "end" : "start"}">${e.name}</text>`;
    node.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    node.addEventListener("click", () => showEntity(e.id));
    g.appendChild(node);
  }
  svg.appendChild(g);
}

/* ---------- 时间过滤 ---------- */
let tNow = 12000, actFilter = 0, showMyth = false;
const isMyth = e => e.type && e.type.startsWith("myth");
function inWindow(e) {
  if (isMyth(e)) return showMyth;
  const t = e.time;
  if (!t || t.from == null) return showMyth;
  const span = 1200;
  return t.from >= tNow - span && t.to <= tNow + span * 2;
}
function refreshMap() {
  for (const node of document.querySelectorAll(".ent")) {
    const e = byId[node.dataset.id];
    let vis;
    if (state.story) vis = state.story.thread.includes(e.id);
    else {
      vis = inWindow(e) && (!actFilter || e._act === actFilter);
      node.classList.toggle("ghost", vis && isMyth(e));
    }
    node.classList.toggle("dim", !vis);
  }
}
function fmtBP(t) {
  const bce = Math.round(1950 - t);
  return { nice: t >= 10000 ? Math.round(t / 500) * 500 : Math.round(t / 50) * 50, bce: bce > 0 ? `≈公元前${bce.toLocaleString()}年` : `公元${-bce}年` };
}

/* ---------- 时间轴 ---------- */
function drawTimeline() {
  const box = $("#tl-acts"); box.innerHTML = "";
  const total = 50000 - 3000;
  const colors = ["#6b5cae", "#3f7a55", "#4f7ea8", "#b0653a", "#a8564f", "#91803f", "#8c3f5e"];
  ATLAS.acts.forEach((a, i) => {
    const d = document.createElement("div");
    d.style.width = ((a.range[0] - a.range[1]) / total * 100) + "%";
    d.style.background = colors[i];
    d.textContent = `${a.act}·${a.title}`;
    d.title = a.desc;
    d.onclick = () => { $("#t-slider").value = a.range[1] + (a.range[0] - a.range[1]) * 0.6; onSlide(); };
    box.appendChild(d);
  });
  const ev = $("#tl-events"); ev.innerHTML = "";
  const CLIM = { "climate_event:lgm": "末次盛冰期", "climate_event:younger_dryas": "仙女木", "climate_event:8_2ka": "8.2ka", "climate_event:4_2ka": "4.2ka", "event:great_flood": "大洪水", "climate_event:late_shang_deterioration": "商末转冷" };
  for (const [id, name] of Object.entries(CLIM)) {
    const e = byId[id]; if (!e || !e.time || !e.time.from) continue;
    const sp = document.createElement("span");
    sp.textContent = "◆" + name;
    sp.style.left = ((50000 - e.time.from) / total * 100) + "%";
    sp.onclick = () => showEntity(id);
    ev.appendChild(sp);
  }
}
function onSlide() {
  tNow = +$("#t-slider").value;
  const f = fmtBP(tNow);
  $("#time-label").textContent = `${f.nice.toLocaleString()} BP`;
  $("#time-sub").textContent = f.bce;
  $("#tl-cursor").style.left = ((50000 - tNow) / (50000 - 3000) * 100) + "%";
  refreshMap();
}

/* ---------- 自动播放 ---------- */
let playing = null;
function togglePlay() {
  if (playing) { clearInterval(playing); playing = null; $("#play").textContent = "▶"; return; }
  $("#play").textContent = "⏸";
  playing = setInterval(() => {
    const v = +$("#t-slider").value;
    if (v >= 50000) { clearInterval(playing); playing = null; $("#play").textContent = "▶"; return; }
    $("#t-slider").value = v + 250; onSlide();
  }, 110);
}

/* ---------- 实体详情 ---------- */
const RELN = { derives_from: "承自", migrates_to: "迁往", admixed_with: "混合于", contemporary_with: "并存", located_at: "位于", corresponds_to: "对应", driven_by: "由…驱动", evidence_for: "证据支持" };
function srcLinks(list) {
  if (!list || !list.length) return `<span style="color:#6b7684">（出处待补）</span>`;
  return list.map(s => `<a href="${s.url}" target="_blank" title="${(s.note || "").replace(/"/g, "&quot;")}">${(s.title || "").slice(0, 40)}…</a>`).join("");
}
function showEntity(id) {
  const e = byId[id]; if (!e) return;
  if (state.story) exitStory();
  const t = e.time;
  const tstr = t && t.from != null ? `${t.from.toLocaleString()} – ${(t.to || t.from).toLocaleString()} BP` : "文献层（无年代）";
  let h = `<div class="e-title"><h2>${e.name}</h2><span class="badge ${e.confidence}">${e.confidence}</span><span class="badge act">第${e._act}幕</span></div>`;
  h += `<div class="e-meta">${tstr}${e.location && e.location.desc ? " · " + e.location.desc : ""}${(e.aliases || []).filter(Boolean).length ? " · 又名：" + e.aliases.filter(Boolean).join(" / ") : ""}</div>`;
  h += `<p class="e-sum">${e.summary || ""}</p>`;
  if (e.claims && e.claims.length) {
    h += `<div class="sec">论断（${e.claims.length}）</div>`;
    for (const c of e.claims) h += `<div class="claim" style="border-color:${CONF[c.confidence]}"><p><b style="color:${CONF[c.confidence]}">[${c.confidence}]</b> ${c.claim}</p><div class="srcs">${srcLinks(c._src)}</div>${c.note ? `<div class="note">※ ${c.note}</div>` : ""}</div>`;
  }
  const rels = R.filter(r => r.from === e.id || r.to === e.id);
  if (rels.length) {
    h += `<div class="sec">关系（${rels.length}）</div>`;
    for (const r of rels) {
      const fwd = r.from === e.id, other = fwd ? r.to : r.from, o = byId[other];
      h += `<div class="rel" data-id="${other}">${fwd ? `<b>${e.name}</b> —${RELN[r.type] || r.type}→ <b>${o ? o.name : other}</b>` : `<b>${o ? o.name : other}</b> —${RELN[r.type] || r.type}→ <b>${e.name}</b>`} <span style="color:${CONF[r.confidence]}">[${r.confidence}]</span>${r.note ? ` <span style="color:#7d8896">·${r.note.slice(0, 26)}</span>` : ""}</div>`;
    }
  }
  $("#panel-inner").innerHTML = h;
  $("#panel").scrollTop = 0;
  document.querySelectorAll(".rel").forEach(el => el.onclick = () => showEntity(el.dataset.id));
  document.querySelectorAll(".ent").forEach(n => n.classList.remove("hl"));
  const node = document.querySelector(`.ent[data-id="${CSS.escape(id)}"]`);
  if (node) node.classList.add("hl");
}

/* ---------- 叙事模式 ---------- */
const state = { story: null, step: 0, visited: new Set() };
function storyList() {
  let h = `<div class="sec" style="margin-top:0">选择一条叙事线（18 条 · 含分支互动点）</div><div class="story-pick">`;
  for (const st of S) h += `<button data-s="${st.id}"><div class="sp-t">${st.title}</div><div class="sp-a">第${st._act}幕 · ${st.thread.length} 站${(st.branch_points || []).length ? " · ✦分支点" : ""}</div></button>`;
  $("#panel-inner").innerHTML = h + `</div>`;
  document.querySelectorAll(".story-pick button").forEach(b => b.onclick = () => playStory(b.dataset.s));
}
function playStory(sid) {
  const st = S.find(x => x.id === sid); if (!st) return;
  state.story = st; state.step = 0; state.visited = new Set();
  renderStory();
}
function exitStory() { state.story = null; refreshMap(); storyList(); }
function renderStory() {
  const st = state.story;
  const id = st.thread[state.step], e = byId[id];
  if (e && e.time && e.time.from) {
    tNow = Math.min(50000, Math.round((e.time.from + (e.time.to || e.time.from)) / 2));
    $("#t-slider").value = tNow; onSlide();
  }
  state.visited.add(id);
  let h = `<div class="e-title"><span class="badge act">第${st._act}幕 叙事线</span></div>
    <h2 class="st-title">${st.title}</h2><p class="st-sum">${st.summary}</p>
    <div class="st-step"><span class="idx">第 ${state.step + 1} / ${st.thread.length} 站</span>
    <h3><span class="badge ${e.confidence}" style="margin-right:6px">${e.confidence}</span>${e.name}</h3>
    <p>${(e.summary || "").slice(0, 160)}…</p></div>`;
  const bp = (st.branch_points || []).find(b => b.at === id);
  if (bp) h += `<div class="branch"><div class="q">✦ 分支：${bp.question}</div><div class="opts"><button data-b="main">继续主线（${e.name}）</button><button data-b="alt">另一种可能 →《${bp.alt.replace("story:", "")}》</button></div></div>`;
  h += `<div class="st-nav"><button id="st-exit">退出</button><button id="st-prev" ${state.step === 0 ? "disabled" : ""}>← 上一站</button><button class="primary" id="st-next" ${state.step >= st.thread.length - 1 ? "disabled" : ""}>下一站 →</button></div>`;
  $("#panel-inner").innerHTML = h;
  $("#st-exit").onclick = exitStory;
  $("#st-prev").onclick = () => { if (state.step > 0) { state.step--; renderStory(); } };
  const goNext = () => { if (state.step < st.thread.length - 1) { state.step++; renderStory(); } };
  $("#st-next").onclick = goNext;
  const mainBtn = document.querySelector('[data-b="main"]'); if (mainBtn) mainBtn.onclick = goNext;
  const altBtn = document.querySelector('[data-b="alt"]');
  if (altBtn) altBtn.onclick = () => {
    const alt = S.find(x => x.id === bp.alt);
    if (alt) playStory(bp.alt);
    else {
      const box = document.createElement("div");
      box.className = "branch"; box.style.borderColor = "#f0a24a";
      box.innerHTML = `<div class="q">《${bp.alt.replace("story:", "")}》支线待展开（后续版本）——本次沿主线继续。</div>`;
      $(".st-step").after(box);
    }
  };
  for (const node of document.querySelectorAll(".ent")) {
    node.classList.toggle("dim", !st.thread.includes(node.dataset.id));
    node.classList.toggle("visited", state.visited.has(node.dataset.id));
    node.classList.toggle("current", node.dataset.id === id);
  }
}

/* ---------- 搜索 / 幕筛选 / 模式切换 ---------- */
$("#search").addEventListener("input", ev => {
  const q = ev.target.value.trim();
  if (!q) { refreshMap(); return; }
  for (const node of document.querySelectorAll(".ent")) {
    const e = byId[node.dataset.id];
    const hit = e.name.includes(q) || (e.aliases || []).some(a => a && a.includes(q));
    node.classList.toggle("dim", !hit);
    node.classList.remove("ghost");
  }
});
function drawActChips() {
  const box = $("#act-chips");
  box.innerHTML = `<button data-a="0" class="active">全部七幕</button>` + ATLAS.acts.map(a => `<button data-a="${a.act}">${a.act}·${a.title}</button>`).join("");
  box.querySelectorAll("button").forEach(b => b.onclick = () => {
    actFilter = +b.dataset.a;
    box.querySelectorAll("button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    if (!$("#mode-story").classList.contains("active")) refreshMap();
  });
}
function setMode(m) {
  $("#mode-map").classList.toggle("active", m === "map");
  $("#mode-story").classList.toggle("active", m === "story");
}
$("#mode-map").onclick = () => { exitStory(); setMode("map"); };
$("#mode-story").onclick = () => { setMode("story"); storyList(); };
$("#show-myth").onchange = ev => { showMyth = ev.target.checked; refreshMap(); };
$("#t-slider").addEventListener("input", onSlide);
$("#play").onclick = togglePlay;

/* ---------- 启动 ---------- */
const svg = $("#map");
drawBase(svg); drawEntities(svg); drawTimeline(); drawActChips(); onSlide();
setMode("map");
