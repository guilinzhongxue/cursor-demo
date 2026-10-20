/* =========================================================
   灵瞰 SkyLens · 看板逻辑
   分区：① 工具函数  ② 模拟数据  ③ 渲染函数  ④ 交互  ⑤ 启动
   ========================================================= */

/* ① 工具函数 -------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (n) => Math.round(n).toLocaleString("zh-CN");
const lerp = (a, b, t) => a + (b - a) * t;

/** 多段色带插值 */
const RAMP = [
  [-0.2, [124, 58, 237]],
  [0.05, [14, 165, 233]],
  [0.35, [250, 204, 21]],
  [0.6, [132, 204, 22]],
  [0.9, [21, 128, 61]],
];
function rampColor(v) {
  if (v <= RAMP[0][0]) return rgb(RAMP[0][1]);
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [x0, c0] = RAMP[i];
    const [x1, c1] = RAMP[i + 1];
    if (v <= x1) {
      const t = (v - x0) / (x1 - x0);
      return rgb(c0.map((c, k) => Math.round(lerp(c, c1[k], t))));
    }
  }
  return rgb(RAMP[RAMP.length - 1][1]);
}
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

/* ② 模拟数据 -------------------------------------------- */
const ICONS = {
  image:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>',
  globe:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></svg>',
  layers:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  cloud:
    '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.6 1.6A3.5 3.5 0 006.5 19h11z"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  queue:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  alert:
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/></svg>',
};

const STATS = [
  {
    key: "scenes",
    label: "影像总量",
    value: 12486,
    unit: "景",
    trend: +12.4,
    icon: ICONS.image,
    accent: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    soft: "rgba(99,102,241,.12)",
    solid: "#4f46e5",
    color: "#6366f1",
  },
  {
    key: "area",
    label: "累计覆盖",
    value: 382.6,
    unit: "万 km²",
    trend: +6.8,
    icon: ICONS.globe,
    accent: "linear-gradient(135deg,#06b6d4,#0ea5e9)",
    soft: "rgba(6,182,212,.12)",
    solid: "#0891b2",
    color: "#06b6d4",
  },
  {
    key: "jobs",
    label: "在线任务",
    value: 128,
    unit: "个",
    trend: -3.2,
    icon: ICONS.layers,
    accent: "linear-gradient(135deg,#f97316,#f59e0b)",
    soft: "rgba(249,115,22,.12)",
    solid: "#ea580c",
    color: "#f97316",
  },
  {
    key: "cloud",
    label: "平均云量",
    value: 12.4,
    unit: "%",
    trend: -1.9,
    icon: ICONS.cloud,
    accent: "linear-gradient(135deg,#10b981,#84cc16)",
    soft: "rgba(16,185,129,.12)",
    solid: "#059669",
    color: "#10b981",
  },
];

const SERIES = [
  { key: "optical", name: "光学影像", color: "#6366f1", base: 420, amp: 90 },
  { key: "sar", name: "雷达 SAR", color: "#06b6d4", base: 260, amp: 70 },
  { key: "hyper", name: "高光谱", color: "#ec4899", base: 150, amp: 48 },
];

const LANDCOVER = [
  { name: "林地", pct: 31.4, color: "#15803d" },
  { name: "耕地", pct: 26.8, color: "#84cc16" },
  { name: "草地", pct: 17.2, color: "#facc15" },
  { name: "水体", pct: 11.6, color: "#0ea5e9" },
  { name: "建设用地", pct: 8.9, color: "#ec4899" },
  { name: "裸土", pct: 4.1, color: "#f97316" },
];

const PLATFORMS = [
  { name: "高分六号", val: 3480, color: "#6366f1" },
  { name: "Sentinel-2", val: 2960, color: "#06b6d4" },
  { name: "Landsat 9", val: 2140, color: "#10b981" },
  { name: "哨兵一号", val: 1780, color: "#f59e0b" },
  { name: "资源三号", val: 1240, color: "#ec4899" },
  { name: "高分五号", val: 886, color: "#8b5cf6" },
];

const BANDS = [
  {
    name: "蓝波段",
    wl: "0.45–0.51 μm",
    desc: "水体穿透力强，用于海岸带与大气校正",
    bg: "linear-gradient(135deg,#60a5fa,#2563eb)",
    tag: "B2",
    tagColor: "#2563eb",
    tagBg: "rgba(37,99,235,.12)",
  },
  {
    name: "绿波段",
    wl: "0.52–0.60 μm",
    desc: "反映水体浑浊度与植被反射峰",
    bg: "linear-gradient(135deg,#4ade80,#16a34a)",
    tag: "B3",
    tagColor: "#16a34a",
    tagBg: "rgba(22,163,74,.12)",
  },
  {
    name: "红波段",
    wl: "0.63–0.69 μm",
    desc: "叶绿素吸收谷，植被与土壤分界",
    bg: "linear-gradient(135deg,#fb7185,#e11d48)",
    tag: "B4",
    tagColor: "#e11d48",
    tagBg: "rgba(225,29,72,.12)",
  },
  {
    name: "近红外",
    wl: "0.85–0.88 μm",
    desc: "植被强反射，NDVI 核心波段",
    bg: "linear-gradient(135deg,#c084fc,#7c3aed)",
    tag: "B8",
    tagColor: "#7c3aed",
    tagBg: "rgba(124,58,237,.12)",
  },
  {
    name: "短波红外",
    wl: "1.57–1.65 μm",
    desc: "识别含水量、岩矿与火烧迹地",
    bg: "linear-gradient(135deg,#fdba74,#ea580c)",
    tag: "B11",
    tagColor: "#ea580c",
    tagBg: "rgba(234,88,12,.12)",
  },
  {
    name: "热红外",
    wl: "10.4–12.5 μm",
    desc: "地表温度反演与城市热岛监测",
    bg: "linear-gradient(135deg,#f9a8d4,#be185d)",
    tag: "B12",
    tagColor: "#be185d",
    tagBg: "rgba(190,24,93,.12)",
  },
];

const TASKS = [
  {
    title: "京津冀秋季作物长势监测",
    sub: "高分六号 · 16m 多光谱 · 42 景",
    time: "10 分钟前",
    status: "完成",
    color: "#10b981",
    tagBg: "rgba(16,185,129,.14)",
    icon: ICONS.check,
  },
  {
    title: "鄱阳湖水体面积变化提取",
    sub: "Sentinel-2 · NDWI 指数 · 18 景",
    time: "32 分钟前",
    status: "处理中",
    color: "#0ea5e9",
    tagBg: "rgba(14,165,233,.14)",
    icon: ICONS.clock,
  },
  {
    title: "珠三角建设用地扩张分析",
    sub: "资源三号 · 2.1m 融合 · 27 景",
    time: "1 小时前",
    status: "排队",
    color: "#f59e0b",
    tagBg: "rgba(245,158,11,.16)",
    icon: ICONS.queue,
  },
  {
    title: "川西森林火点识别（SAR）",
    sub: "哨兵一号 · GRD 降噪 · 9 景",
    time: "3 小时前",
    status: "完成",
    color: "#10b981",
    tagBg: "rgba(16,185,129,.14)",
    icon: ICONS.check,
  },
  {
    title: "华北平原土壤墒情反演",
    sub: "高分五号 · 高光谱 · 6 景",
    time: "昨天 18:20",
    status: "失败",
    color: "#f43f5e",
    tagBg: "rgba(244,63,94,.14)",
    icon: ICONS.alert,
  },
];

const PALETTE = [
  { name: "靛蓝 Indigo", hex: "#4f46e5" },
  { name: "蓝晶 Blue", hex: "#6366f1" },
  { name: "天青 Sky", hex: "#0ea5e9" },
  { name: "青碧 Cyan", hex: "#06b6d4" },
  { name: "紫罗兰 Violet", hex: "#8b5cf6" },
  { name: "玫粉 Pink", hex: "#ec4899" },
  { name: "珊瑚 Rose", hex: "#f43f5e" },
  { name: "暖橙 Orange", hex: "#f97316" },
  { name: "琥珀 Amber", hex: "#f59e0b" },
  { name: "翠绿 Emerald", hex: "#10b981" },
  { name: "青绿 Teal", hex: "#14b8a6" },
  { name: "嫩芽 Lime", hex: "#84cc16" },
];

/** 生成时序数据：带轻微趋势与噪声 */
function makeSeries(days) {
  const out = {};
  const today = new Date("2026-10-20");
  SERIES.forEach((s) => {
    out[s.key] = Array.from({ length: days }, (_, i) => ({
      date: new Date(today.getTime() - (days - 1 - i) * 864e5),
      v: Math.max(
        20,
        s.base + Math.sin(i / 4.2 + s.base) * s.amp * 0.6 + rnd(-s.amp, s.amp) * 0.5
      ),
    }));
  });
  return out;
}

/* ③ 渲染函数 -------------------------------------------- */

/** 迷你 sparkline */
function sparkline(data, color) {
  const w = 100,
    h = 30;
  const max = Math.max(...data),
    min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="sg${color.slice(1)}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".28"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon fill="url(#sg${color.slice(1)})" points="0,${h} ${pts.join(" ")} ${w},${h}"/>
    <polyline fill="none" stroke="${color}" stroke-width="1.8"
      stroke-linejoin="round" stroke-linecap="round" points="${pts.join(" ")}"/>
  </svg>`;
}

function renderStats() {
  $("#stats").innerHTML = STATS.map((s, i) => {
    const spark = Array.from({ length: 18 }, (_, k) =>
      s.value * (0.82 + Math.sin(k / 2.6 + i) * 0.12 + rnd(-0.05, 0.05))
    );
    const up = s.trend >= 0;
    return `<article class="stat reveal" style="--accent:${s.accent};--accent-soft:${s.soft};--accent-solid:${s.solid}">
      <div class="stat-top">
        <span class="stat-ico">${s.icon}</span>
        <span class="stat-label">${s.label}</span>
      </div>
      <div class="stat-value"><b data-count="${s.value}" data-dec="${
      s.key === "area" || s.key === "cloud" ? 1 : 0
    }">0</b><small>${s.unit}</small></div>
      <div class="stat-foot">
        <span class="trend ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(
      s.trend
    ).toFixed(1)}%</span>
        <span>较上月</span>
      </div>
      <div class="spark">${sparkline(spark, s.color)}</div>
    </article>`;
  }).join("");
}

/** 折线主图 */
let chartState = { days: 30, data: null, hidden: new Set() };

function renderLineChart(animate = true) {
  const { days, data, hidden } = chartState;
  const W = 720,
    H = 268,
    PL = 44,
    PR = 14,
    PT = 18,
    PB = 30;
  const iw = W - PL - PR,
    ih = H - PT - PB;
  const active = SERIES.filter((s) => !hidden.has(s.key));
  const maxV = Math.max(
    ...active.flatMap((s) => data[s.key].map((d) => d.v)),
    100
  );
  const top = Math.ceil(maxV / 100) * 100;
  const n = days;
  const X = (i) => PL + (n === 1 ? 0 : (i / (n - 1)) * iw);
  const Y = (v) => PT + ih - (v / top) * ih;

  const grid = Array.from({ length: 5 }, (_, k) => {
    const v = (top / 4) * k;
    const y = Y(v);
    return `<line class="grid-line" x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}"/>
      <text class="axis-text" x="${PL - 10}" y="${y + 4}" text-anchor="end">${fmt(v)}</text>`;
  }).join("");

  const step = Math.max(1, Math.floor(n / 7));
  const xlabels = data[SERIES[0].key]
    .map((d, i) =>
      i % step === 0 || i === n - 1
        ? `<text class="axis-text" x="${X(i)}" y="${H - 8}" text-anchor="middle">${
            d.date.getMonth() + 1
          }/${d.date.getDate()}</text>`
        : ""
    )
    .join("");

  const paths = SERIES.map((s) => {
    const arr = data[s.key];
    const pts = arr.map((d, i) => `${X(i).toFixed(1)},${Y(d.v).toFixed(1)}`);
    const line = `M${pts.join("L")}`;
    const area = `${line}L${X(n - 1).toFixed(1)},${PT + ih}L${PL},${PT + ih}Z`;
    const off = hidden.has(s.key);
    return `<g class="s-${s.key}" opacity="${off ? 0 : 1}" style="transition:opacity .3s">
      <path d="${area}" fill="url(#ga${s.key})" ${off ? "" : ""}/>
      <path class="ln" d="${line}" fill="none" stroke="${s.color}" stroke-width="2.6"
        stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }).join("");

  $("#lineChart").innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" id="lineSvg">
      <defs>${SERIES.map(
        (s) => `<linearGradient id="ga${s.key}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${s.color}" stop-opacity=".26"/>
          <stop offset="100%" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`
      ).join("")}</defs>
      ${grid}${xlabels}${paths}
      <g id="hoverLayer"></g>
    </svg>
    <div class="chart-tip" id="lineTip"></div>`;

  if (animate) {
    document.querySelectorAll("#lineSvg .ln").forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 950, delay: i * 110, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" }
      );
    });
  }
  bindLineHover();
}

function bindLineHover() {
  const svg = $("#lineSvg");
  if (!svg) return;
  const wrap = $("#lineChart");
  const tip = $("#lineTip");
  const layer = svg.querySelector("#hoverLayer");
  const { days, data, hidden } = chartState;
  const W = 720,
    H = 268,
    PL = 44,
    PR = 14,
    PT = 18,
    PB = 30;
  const iw = W - PL - PR,
    ih = H - PT - PB;
  const top = Math.ceil(
    Math.max(
      ...SERIES.filter((s) => !hidden.has(s.key)).flatMap((s) =>
        data[s.key].map((d) => d.v)
      ),
      100
    ) / 100
  ) * 100;

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / W;
    const px = (e.clientX - rect.left) / scale;
    const i = clamp(Math.round(((px - PL) / iw) * (days - 1)), 0, days - 1);
    const x = PL + (days === 1 ? 0 : (i / (days - 1)) * iw);

    const rows = SERIES.filter((s) => !hidden.has(s.key))
      .map((s) => {
        const d = data[s.key][i];
        return `<div class="t-row"><i style="background:${s.color}"></i>${s.name}<b>${fmt(
          d.v
        )}</b></div>`;
      })
      .join("");
    const date = data[SERIES[0].key][i].date;
    tip.innerHTML = `<div class="t-date">${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}</div>${rows}`;
    tip.style.left = `${x * scale}px`;
    tip.style.top = `${PT * scale + 90}px`;
    tip.classList.add("show");

    layer.innerHTML = `<line x1="${x}" y1="${PT}" x2="${x}" y2="${
      PT + ih
    }" stroke="rgba(15,23,42,.18)" stroke-width="1" stroke-dasharray="4 4"/>` +
      SERIES.filter((s) => !hidden.has(s.key))
        .map(
          (s) =>
            `<circle cx="${x}" cy="${PT + ih - (data[s.key][i].v / top) * ih}" r="4.5"
              fill="#fff" stroke="${s.color}" stroke-width="2.6"/>`
        )
        .join("");
  });
  svg.addEventListener("mouseleave", () => {
    tip.classList.remove("show");
    layer.innerHTML = "";
  });
  void wrap;
}

function renderLegend() {
  $("#lineLegend").innerHTML = SERIES.map(
    (s) => `<button data-key="${s.key}" class="${
      chartState.hidden.has(s.key) ? "off" : ""
    }"><i style="background:${s.color}"></i>${s.name}</button>`
  ).join("");
  $("#lineLegend").querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.key;
      chartState.hidden.has(k)
        ? chartState.hidden.delete(k)
        : chartState.hidden.add(k);
      if (chartState.hidden.size === SERIES.length) chartState.hidden.delete(k);
      renderLegend();
      renderLineChart(false);
    });
  });
}

/** 环形进度 */
function renderDonut() {
  const R = 62,
    C = 2 * Math.PI * R;
  const score = 92;
  $("#donutSvg").innerHTML = `
    <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/><stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/></linearGradient></defs>
    <circle cx="74" cy="74" r="${R}" fill="none" stroke="#eef3fb" stroke-width="14"/>
    <circle id="dProg" cx="74" cy="74" r="${R}" fill="none" stroke="url(#dg)"
      stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${C}"/>`;
  const prog = $("#dProg");
  prog.animate(
    [{ strokeDashoffset: C }, { strokeDashoffset: C * (1 - score / 100) }],
    { duration: 1200, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" }
  );
  countUp($("#donutVal"), score, 0);

  const meta = [
    ["云量合格率", 96, "#10b981"],
    ["几何精度", 93, "#0ea5e9"],
    ["辐射定标", 88, "#f59e0b"],
  ];
  $("#donutMeta").innerHTML = meta
    .map(
      ([n, v, c]) =>
        `<div><i style="background:${c}"></i>${n}<b data-count="${v}" data-dec="0">0</b>%</div>`
    )
    .join("");
}

/** 地物分类横向条 */
function renderBars() {
  $("#bars").innerHTML = LANDCOVER.map(
    (l) => `<div class="bar-row">
      <span class="b-name">${l.name}</span>
      <span class="bar-track"><i class="bar-fill" style="background:linear-gradient(90deg,${l.color},${
      l.color
    }bb)"></i></span>
      <span class="b-val">${l.pct.toFixed(1)}%</span>
    </div>`
  ).join("");
  requestAnimationFrame(() => {
    document.querySelectorAll("#bars .bar-fill").forEach((el, i) => {
      setTimeout(() => (el.style.width = LANDCOVER[i].pct + "%"), 90 * i + 60);
    });
  });
}

/** 平台柱状图 */
function renderBarChart() {
  const W = 520,
    H = 232,
    PB = 34,
    PT = 18;
  const max = Math.max(...PLATFORMS.map((p) => p.val));
  const bw = (W - 30) / PLATFORMS.length;
  const bars = PLATFORMS.map((p, i) => {
    const h = ((H - PT - PB) * p.val) / max;
    const x = 15 + i * bw + bw * 0.18;
    const w = bw * 0.64;
    const y = H - PB - h;
    return `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="url(#pg${i})"/>
      <text class="axis-text" x="${x + w / 2}" y="${y - 8}" text-anchor="middle"
        style="fill:${p.color};font-weight:700">${fmt(p.val)}</text>
      <text class="axis-text" x="${x + w / 2}" y="${H - 12}" text-anchor="middle"
        style="font-size:11px">${p.name}</text>
    </g>`;
  }).join("");
  $("#barChart").innerHTML = `<svg viewBox="0 0 ${W} ${H}">
    <defs>${PLATFORMS.map(
      (p, i) => `<linearGradient id="pg${i}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${p.color}"/>
        <stop offset="100%" stop-color="${p.color}" stop-opacity=".45"/></linearGradient>`
    ).join("")}</defs>
    <line class="grid-line" x1="0" y1="${H - PB}" x2="${W}" y2="${H - PB}"/>
    ${bars}</svg>`;
  document.querySelectorAll("#barChart rect").forEach((r, i) => {
    const h = +r.getAttribute("height");
    r.animate(
      [
        { transform: "scaleY(0)", transformOrigin: `0 ${H - PB}px` },
        { transform: "scaleY(1)", transformOrigin: `0 ${H - PB}px` },
      ],
      { duration: 800, delay: i * 90, easing: "cubic-bezier(.22,.61,.36,1)", fill: "backwards" }
    );
    void h;
  });
}

/** 影像栅格 */
function renderRaster() {
  const cols = 40,
    rows = 18;
  const grid = $("#rasterGrid");
  grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  let html = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v =
        0.42 +
        Math.sin(c / 5.5) * 0.22 +
        Math.cos(r / 3.4) * 0.18 +
        Math.sin((r + c) / 2.3) * 0.12 +
        rnd(-0.08, 0.08);
      const ndvi = clamp(v, -0.2, 0.92);
      html += `<i style="background:${rampColor(ndvi)};animation-delay:${
        (r * cols + c) * 1.2
      }ms" data-v="${ndvi.toFixed(3)}"></i>`;
    }
  }
  grid.innerHTML = html;
  grid.querySelectorAll("i").forEach((cell) => {
    cell.addEventListener("mouseenter", () => {
      $("#cellInfo").textContent = `NDVI ${cell.dataset.v}`;
    });
  });

  const samples = [
    ["A-01 密林", 0.87],
    ["B-04 农田", 0.62],
    ["C-09 城区", 0.18],
    ["D-12 水体", -0.12],
    ["E-17 裸土", 0.31],
  ];
  $("#sampleList").innerHTML = samples
    .map(
      ([n, v]) =>
        `<div class="sample"><i style="background:${rampColor(v)}"></i>${n}<b>${v.toFixed(
          2
        )}</b></div>`
    )
    .join("");
}

/** 光谱波段卡 */
const WAVE_ICON = (c) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
    <path d="M2 12c2.5-7 5-7 7.5 0s5 7 7.5 0 3.5-3.5 5-1.5"/></svg>`;

function renderBands() {
  $("#bandGrid").innerHTML = BANDS.map(
    (b) => `<article class="band reveal">
      <div class="band-swatch" style="background:${b.bg}">
        ${WAVE_ICON()}
        <span class="wl">${b.wl}</span>
      </div>
      <div class="band-info">
        <h4>${b.name}</h4>
        <p>${b.desc}</p>
        <span class="band-tag" style="color:${b.tagColor};background:${b.tagBg}">${b.tag}</span>
      </div>
    </article>`
  ).join("");
}

/** 任务时间轴 */
function renderTasks() {
  $("#timeline").innerHTML = TASKS.map(
    (t) => `<div class="tl-item">
      <span class="tl-dot" style="background:${t.color}">${t.icon}</span>
      <div class="tl-main"><b>${t.title}</b><span>${t.sub}</span></div>
      <div class="tl-right">
        <span class="tl-time">${t.time}</span>
        <span class="tag" style="color:${t.color};background:${t.tagBg}">${t.status}</span>
      </div>
    </div>`
  ).join("");
}

/** 配色板 */
function renderPalette() {
  $("#paletteGrid").innerHTML = PALETTE.map(
    (p) => `<button class="sw" data-hex="${p.hex}">
      <div class="sw-color" style="background:${p.hex}"></div>
      <div class="sw-info"><b>${p.hex.toUpperCase()}</b><span>${p.name}</span></div>
    </button>`
  ).join("");
  $("#paletteGrid").querySelectorAll(".sw").forEach((b) => {
    b.addEventListener("click", () => copy(b.dataset.hex));
  });
}

/** Hero 标签 */
function renderChips() {
  const chips = [
    ["光学", "#6366f1"],
    ["雷达 SAR", "#06b6d4"],
    ["高光谱", "#ec4899"],
    ["热红外", "#f97316"],
    ["16 m 分辨率", "#10b981"],
  ];
  $("#heroChips").innerHTML = chips
    .map(
      ([n, c]) => `<span class="chip"><i style="background:${c}"></i>${n}</span>`
    )
    .join("");
}

/* 通用：数字滚动 */
function countUp(el, target, dec = 0) {
  if (!el) return;
  const dur = 1100;
  const t0 = performance.now();
  const step = (now) => {
    const p = clamp((now - t0) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(dec);
    if (dec === 0) el.textContent = fmt(target * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ④ 交互 ------------------------------------------------ */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function copy(text) {
  const done = () => toast(`已复制色值 ${text.toUpperCase()}`);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallback());
  } else fallback();
  function fallback() {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch {
      toast("复制失败，请手动选择");
    }
    ta.remove();
  }
}

/** 滚动入场 + 数字滚动触发 */
function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count]").forEach((n) => {
          if (n.dataset.done) return;
          n.dataset.done = "1";
          countUp(n, +n.dataset.count, +n.dataset.dec || 0);
        });
        io.unobserve(e.target);
      });
    },
    { threshold: 0.18 }
  );
  document
    .querySelectorAll(".reveal")
    .forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i, 8) * 60}ms`;
      io.observe(el);
    });
}

function bindActions() {
  $("#btn").addEventListener("click", () =>
    toast("Vite 运行成功！可以在这里对接后端、渲染 ECharts / Cesium")
  );
  $("#cta").addEventListener("click", () => {
    $("#board").scrollIntoView({ behavior: "smooth" });
    toast("已加载演示数据：影像吞吐、地物分类与 NDVI 栅格");
  });
  $("#refresh").addEventListener("click", () => {
    chartState.data = makeSeries(chartState.days);
    renderLineChart(true);
    renderRaster();
    renderBars();
    toast("模拟数据已刷新");
  });
  $("#rangeSeg")
    .querySelectorAll("button")
    .forEach((b) =>
      b.addEventListener("click", () => {
        $("#rangeSeg")
          .querySelectorAll("button")
          .forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        chartState.days = +b.dataset.range;
        chartState.data = makeSeries(chartState.days);
        renderLineChart(true);
      })
    );
}

/* ⑤ 启动 ------------------------------------------------ */
function boot() {
  chartState.data = makeSeries(chartState.days);
  renderChips();
  renderStats();
  renderLineChart(true);
  renderLegend();
  renderDonut();
  renderBars();
  renderBarChart();
  renderRaster();
  renderBands();
  renderTasks();
  renderPalette();
  bindActions();
  initReveal();
}
boot();
