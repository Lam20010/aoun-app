import { Conversation } from "@elevenlabs/client";
import { I, ic } from "./icons.js";
import * as G from "./geo.js";

/* =========================================================
   عون · Aoun — the resident app
   Call first (the agent announces a ready appointment) → the app,
   with the agent always available in the dock.
   ========================================================= */

const AGENTS = {
  rufaida: { name: "رفيدة", img: "img/rufaida.png", id: "agent_2401m7x9pdtpfghakjnscgt90zsp", f: true },
  rafeed: { name: "رفيد", img: "img/rafeed.png", id: "agent_1801m7x9q2tney5r6qh2erxg8rf7", f: false },
};

const PEOPLE = {
  om: {
    label: "أم سعد · 68", first: "حصة", male: false, lang: "ar-SA", district: "حي النسيم الغربي",
    appt: { test: "فحص السكر التراكمي", when: "الخميس 4:30 العصر", place: "مركز صحي الحي", arranged: "موعد جاهز" },
    opening: (a, ag) => `هلا والله يا خالة حصة! معك ${ag.name} من «عون» التابع لوزارة الصحة. جهّزت لك موعد ${a.test} يوم ${a.when} في ${a.place}. يناسبك نأكّده؟`,
  },
  noura: {
    label: "نورة · 34", first: "نورة", male: false, lang: "ar-SA", district: "حي الملقا",
    appt: { test: "فحص السكر + فيتامين د", when: "الثلاثاء 10 الصبح", place: "مركز صحي الحي", arranged: "موعد واحد للتحليلين" },
    opening: (a, ag) => `مساء الخير نورة! معك ${ag.name} من «عون» التابع لوزارة الصحة. جهّزت لك موعد ${a.test} يوم ${a.when} في ${a.place}. يناسبك نأكّده؟`,
  },
  rahim: {
    label: "رحيم · 41", first: "رحيم", male: true, lang: "ur-PK", district: "حي السلي",
    appt: { test: "فحص السكر والضغط", when: "الجمعة 10 الصبح", place: "عيادة متنقلة قرب السكن", arranged: "بدون إجازة من العمل" },
    opening: (a, ag) => `السلام علیکم رحیم بھائی! میں وزارتِ صحت کے «عون» سے ${ag.f ? "رفیدہ" : "رفید"} بات کر رہا ہوں۔ آپ کے لیے شوگر اور بلڈ پریشر کا مفت چیک اپ جمعہ صبح 10 بجے تیار ہے۔ کیا میں اسے کنفرم کر دوں؟`,
  },
};

/* Slots the agent can offer, by the reason the person gives */
const SLOTS = {
  time: { when: "الثلاثاء 7:30 المسا", arranged: "موعد مسائي بعد الدوام", say: "ولا يهمك، رتّبت لك موعد مسائي بعد الدوام: الثلاثاء 7:30 المسا." },
  transport: { when: null, arranged: "مشوار مرتّب", say: "" },
  fear: { when: null, arranged: "مع طبيبة هادئة · الفحص دقيقتين", say: "أفهمك والله، بس الفحص بسيط: نقطة دم ودقيقتين وتطمّن. رتّبت لك نفس الموعد مع طبيبة هادئة." },
  female_doctor: { when: "الأربعاء 10 الصبح", arranged: "مع طبيبة", say: "أبشر، رتّبت لك الأربعاء 10 الصبح مع طبيبة." },
  language: { when: null, arranged: "مترجم بلغتك", say: "ولا يهمك، رتّبت لك مترجم بلغتك بنفس الموعد." },
  mobility: { when: "الأحد 11 الصبح", place: "زيارة منزلية", arranged: "الفريق يجيك البيت", say: "ولا تتعب نفسك، الفريق الطبي يجيك البيت الأحد 11 الصبح." },
};
const REASONS = [["time", "الوقت والدوام"], ["transport", "ما عندي مشوار"], ["fear", "خايف من الفحص"], ["female_doctor", "أبي طبيبة"], ["language", "اللغة"], ["mobility", "صعب أتحرك"]];

const ALT_SLOTS = "مسائي بعد الدوام: الثلاثاء 7:30 المسا | طبيبة: الأربعاء 10 الصبح | زيارة منزلية: الأحد 11 الصبح | مترجم: نفس الموعد مع مترجم بلغته | عيادة متنقلة قريبة: انظر nearest_truck | بدون مشوار: استخدم arrange_transport (أوبر أو المترو)";

/* Family tree: relations only, no names, stays on this phone */
const MEMBERS = [
  { id: "gf_p", label: "جدك لأبوك", x: 12, y: 6, gen: 0 }, { id: "gm_p", label: "جدتك لأبوك", x: 37, y: 6, gen: 0 },
  { id: "gf_m", label: "جدك لأمك", x: 63, y: 6, gen: 0 }, { id: "gm_m", label: "جدتك لأمك", x: 88, y: 6, gen: 0 },
  { id: "father", label: "الأب", x: 25, y: 40, gen: 1, first: true }, { id: "mother", label: "الأم", x: 62, y: 40, gen: 1, first: true },
  { id: "aunt", label: "الخالة", x: 87, y: 45, gen: 1 },
  { id: "you", label: "أنت", x: 44, y: 73, gen: 2, me: true }, { id: "sib", label: "الأخ", x: 74, y: 73, gen: 2, first: true },
];
const CONDS = { diabetes: "سكري", bp: "ضغط الدم", chol: "كوليسترول", heart: "قلب قبل الخمسين", breast: "سرطان الثدي", colon: "سرطان القولون" };

/* ---------------- storage & state ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("aoun2." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("aoun2." + k, JSON.stringify(v)); } catch {} },
};
const S = {
  stage: store.get("onboarded", false) ? "ring" : "welcome", // welcome | ring | live | missed | app
  tab: "home", nbSeg: 0,
  person: store.get("person", "om"),
  voice: store.get("voice", "auto"), live: store.get("live", true),
  contrast: store.get("contrast", false), simple: store.get("simple", false), captions: store.get("captions", true), textScale: store.get("textScale", 1),
  family: store.get("family", { father: ["diabetes"], mother: ["bp"], gf_p: ["diabetes", "heart"], gm_p: "healthy", gf_m: ["bp"], gm_m: "unknown", aunt: ["breast"], sib: "healthy", you: [] }),
  loc: store.get("loc", null), // {lat,lng,source,area}
  places: null, // {center, trucks, parks, stations}
  appt: null, transport: null, sheet: null, mapFocus: "home", toast: "",
};
const P = () => PEOPLE[S.person];
const A = () => S.voice === "female" ? AGENTS.rufaida : S.voice === "male" ? AGENTS.rafeed : (P().male ? AGENTS.rafeed : AGENTS.rufaida);
const g = (f, m) => (A().f ? f : m);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const resetAppt = () => { S.appt = { ...P().appt, confirmed: false }; S.transport = null; };
resetAppt();
const savedAppt = store.get("appt", null);

/* ---------------- location & nearby places ---------------- */
function demoHome() {
  const d = (window.AOUN_DATA?.riyadh || []).find((x) => x.ar === P().district) || { lat: 24.72495, lon: 46.82594, ar: "حي النسيم الغربي" };
  return { lat: d.lat, lng: d.lon, source: "demo", area: d.ar };
}
const home = () => S.loc || demoHome();
function areaFor(lat, lng) {
  const ds = window.AOUN_DATA?.riyadh || [];
  let best = null, bd = 1e9;
  for (const d of ds) { const k = G.km(lat, lng, d.lat, d.lon); if (k < bd) { bd = k; best = d; } }
  return best && bd < 6 ? best : null;
}
function askLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(false);
    navigator.geolocation.getCurrentPosition((p) => {
      const lat = p.coords.latitude, lng = p.coords.longitude, d = areaFor(lat, lng);
      S.loc = { lat, lng, source: "gps", area: d ? d.ar : "منطقتك" };
      store.set("loc", S.loc); S.places = null; loadPlaces(); resolve(true);
    }, () => resolve(false), { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 });
  });
}
async function loadPlaces() {
  const h = home();
  const base = G.localPlaces(h, window.AOUN_PLACES);
  S.places = base; render();
  try {
    const live = await G.overpass(h); // real parks & health centers around the person (OpenStreetMap)
    if (live.parks.length) S.places.parks = live.parks;
    if (live.centers.length) S.places.center = live.centers[0];
    S.places.live = true;
    if (!S.appt.confirmed && S.appt.place === "مركز صحي الحي") S.appt.place = S.places.center.name;
    render();
  } catch (e) { console.warn("overpass", e); }
}
const familyText = () => {
  const parts = [];
  for (const m of MEMBERS) { const v = S.family[m.id]; if (Array.isArray(v) && v.length) parts.push(`${m.label}: ${v.map((c) => CONDS[c]).join("، ")}`); }
  return parts.length ? parts.join("؛ ") : "لم يشارك شيئًا";
};
const familyHasMetabolic = () => ["father", "mother", "sib"].some((k) => Array.isArray(S.family[k]) && S.family[k].some((c) => ["diabetes", "bp"].includes(c)));

/* ---------------- transport ---------------- */
function arrangeTransport(option) {
  const h = home(), c = S.places?.center || G.fakeCenter(h);
  if (option === "uber") {
    const km = G.km(h.lat, h.lng, c.lat, c.lng);
    S.transport = { option, confirmed: false, km, min: Math.max(6, Math.round(km / 28 * 60) + 4), link: G.uberLink(h, c), dest: c.name, from: h.area };
    return `جهّزت رحلة أوبر من ${h.area} إلى ${c.name}، حوالي ${S.transport.min} دقيقة. الرحلة جاهزة على الشاشة، اضغط «أكّد في أوبر».`;
  }
  const plan = G.metroPlan(h, c, window.AOUN_PLACES);
  if (!plan) {
    S.transport = { option: "metro", none: true };
    const d = G.km(h.lat, h.lng, c.lat, c.lng);
    return d < 2.5 ? `المركز قريب منك، ${G.walkMin(d)} دقيقة مشي، ما يحتاج مترو. تحب أحجز لك أوبر بدال المشي؟` : "ما فيه محطة مترو قريبة منك، الأفضل أوبر أو العيادة المتنقلة.";
  }
  S.transport = { option, confirmed: false, plan, gmaps: G.transitLink(h, c), dest: c.name };
  return `خطة المترو: امشِ ${plan.walk1} دقائق لمحطة ${plan.from.ar}، ثم ${plan.legs.map((l) => `${l.line.ar} ${l.stops} محطات`).join(" ثم ")}، وامشِ ${plan.walk2} دقائق للمركز. المجموع حوالي ${plan.total} دقيقة.`;
}

/* ---------------- live agent sessions ---------------- */
const C = { conv: null, mode: null, lines: [], phase: "idle", speaking: false, sec: 0, timer: null, micMuted: false, agentMuted: false, err: "", offline: null };
const dock = { state: "off", text: "", conv: null };

function dynVars(mode) {
  const h = home(), t = S.places?.trucks?.[0];
  return {
    opening: mode === "call" ? P().opening(S.appt, A()) : `هلا ${P().first}! أنا ${A().name}، معك هنا في التطبيق. قول لي وش تبي، مثلًا: افتح دفتري، أو وريني أقرب حديقة.`,
    mode, user_name: P().first, test: S.appt.test, slot_when: S.appt.when, place: S.appt.place, arranged: S.appt.arranged,
    appt_status: S.appt.confirmed ? "مؤكد" : "بانتظار التأكيد",
    home_area: S.loc ? h.area : `${h.area} (تقريبي، ما سمح بالموقع بعد)`,
    nearest_truck: t ? `${t.name}، ${G.fmtKm(t.km)} من بيته، ${t.hours}` : "لا يوجد",
    family_history: familyText(), alt_slots: ALT_SLOTS,
  };
}

function clientTools(mode) {
  return {
    book_ready_appointment: async () => { confirmAppt(); if (mode === "call") scheduleEnd(); return `booked: ${S.appt.test}, ${S.appt.when}, ${S.appt.place}`; },
    book_appointment: async ({ when, place, arrangement, reason } = {}) => {
      if (when) S.appt.when = when; if (place) S.appt.place = place; if (arrangement) S.appt.arranged = arrangement;
      S.appt.reason = reason; confirmAppt(); if (mode === "call") scheduleEnd(12000);
      return `booked: ${S.appt.when}, ${S.appt.place}, ${S.appt.arranged}`;
    },
    arrange_transport: async ({ option } = {}) => { const r = arrangeTransport(option === "metro" ? "metro" : "uber"); render(); return r; },
    show_on_map: async ({ place } = {}) => {
      if (!S.loc) await askLocation();
      if (!S.places) await loadPlaces();
      S.mapFocus = place || "home";
      if (mode === "app") { S.tab = "map"; S.sheet = null; } else C.mapPeek = place;
      render();
      return describePlace(S.mapFocus);
    },
    open_screen: async ({ screen } = {}) => {
      const map = { home: "home", notebook: "nb", family: "fam", map: "map" };
      if (screen === "settings") S.sheet = "settings"; else if (screen === "appointment") { S.tab = "home"; S.sheet = null; } else { S.tab = map[screen] || "home"; S.sheet = null; }
      render(); return "opened " + screen;
    },
    change_setting: async ({ setting, on } = {}) => {
      if (setting === "larger_text") S.textScale = Math.min(1.4, +(S.textScale + 0.15).toFixed(2));
      else if (setting === "smaller_text") S.textScale = Math.max(0.85, +(S.textScale - 0.15).toFixed(2));
      else if (setting === "high_contrast") S.contrast = !!on;
      else if (setting === "simple_mode") S.simple = !!on;
      else if (setting === "captions") S.captions = !!on;
      ["textScale", "contrast", "simple", "captions"].forEach((k) => store.set(k, S[k]));
      render(); return "done";
    },
  };
}

function describePlace(kind) {
  const h = home(), p = S.places || {};
  if (kind === "park") { const k = p.parks?.[0]; return k ? `أقرب حديقة: ${k.name}، ${G.fmtKm(k.km)} (${G.walkMin(k.km)} دقيقة مشي).` : "ما لقيت حديقة قريبة."; }
  if (kind === "mobile_clinic") { const t = p.trucks?.[0]; return t ? `${t.name}، ${G.fmtKm(t.km)} منك، ${t.hours}.` : "ما فيه عيادة متنقلة قريبة الحين."; }
  if (kind === "health_center") { const c = p.center; return c ? `${c.name}، ${G.fmtKm(c.km)} منك.` : "مركز صحي الحي."; }
  if (kind === "metro") { const s = p.stations?.[0]; return s ? `أقرب محطة مترو: ${s.ar}، ${G.fmtKm(s.km)}.` : "ما فيه محطة قريبة."; }
  return `منطقتك: ${h.area}.`;
}

async function micOK() {
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); return true; } catch { return false; }
}
async function startSession(mode, cb) {
  const opts = (connectionType) => ({
    agentId: A().id, connectionType, dynamicVariables: dynVars(mode), clientTools: clientTools(mode), ...cb,
  });
  try { return await Conversation.startSession(opts("webrtc")); }
  catch (e1) { console.warn("webrtc failed", e1); return await Conversation.startSession(opts("websocket")); }
}

/* ---- the call ---- */
async function answer() {
  if (!S.places) loadPlaces();
  Object.assign(C, { lines: [], phase: "connecting", speaking: false, sec: 0, micMuted: false, agentMuted: false, err: "", offline: null, mapPeek: null });
  resetAppt(); S.stage = "live"; render();
  clearInterval(C.timer); C.timer = setInterval(() => { C.sec++; const el = document.getElementById("status"); if (el) el.textContent = statusText(); }, 1000);
  if (!S.live) return offlineCall();
  if (!(await micOK())) { C.phase = "failed"; C.err = "اسمح للمايكروفون عشان تكلّم " + A().name; return render(); }
  try {
    C.conv = await startSession("call", {
      onConnect: () => { C.phase = "talking"; render(); },
      onDisconnect: () => { if (S.stage === "live" && C.phase !== "ended") finishCall(); },
      onError: (m) => console.warn("agent", m),
      onModeChange: ({ mode }) => { C.speaking = mode === "speaking"; paintStatus(); },
      onMessage: (m) => {
        const t = (m.message || "").trim(); if (!t) return;
        C.lines.push({ who: (m.role || (m.source === "ai" ? "agent" : "user")) === "agent" ? "a" : "p", text: t });
        if (C.phase === "talking") C.phase = "offer";
        render();
      },
    });
  } catch (e) { C.phase = "failed"; C.err = String(e?.message || e); render(); }
}
let endTimer = null;
function scheduleEnd(ms = 9000) { clearTimeout(endTimer); endTimer = setTimeout(finishCall, ms); }
function confirmAppt() { S.appt.confirmed = true; store.set("appt", S.appt); render(); }
async function stopCall() {
  clearInterval(C.timer); clearTimeout(endTimer); try { speechSynthesis.cancel(); } catch {}
  if (C.offline) C.offline.cancel = true;
  const c = C.conv; C.conv = null; if (c) { try { await c.endSession(); } catch {} }
}
async function finishCall() {
  if (C.phase === "ended") return; C.phase = "ended";
  await stopCall();
  if (S.appt.confirmed) { S.stage = "app"; S.tab = "home"; S.sheet = "booked"; } else S.stage = "missed";
  render();
}
function tapConfirm() {
  if (C.conv) { try { C.conv.sendUserMessage("إيه، أكّد الموعد."); } catch {} confirmAppt(); scheduleEnd(9000); }
  else offlineConfirm();
}
function tapDecline() {
  if (C.conv) { try { C.conv.sendUserMessage("لا، ما يناسبني."); } catch {} }
  else offlineDecline();
}

/* ---- offline call (device voice), same flow ---- */
function say(text, lang) {
  return new Promise((res) => {
    try {
      const u = new SpeechSynthesisUtterance(text); u.lang = lang;
      const v = speechSynthesis.getVoices().find((x) => x.lang === lang) || speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang.slice(0, 2)));
      if (v) u.voice = v; u.rate = S.person === "om" ? 0.92 : 1; u.onend = u.onerror = () => res();
      speechSynthesis.speak(u); setTimeout(res, 2500 + text.length * 110);
    } catch { res(); }
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function line(who, text, tr) {
  if (C.offline?.cancel) throw new Error("cancel");
  C.lines.push({ who, text, tr }); render();
  if (who === "a") { C.speaking = true; paintStatus(); await say(text, S.person === "rahim" && tr ? "ur-PK" : "ar-SA"); C.speaking = false; paintStatus(); }
  else await wait(700 + text.length * 35);
  await wait(250);
}
async function offlineCall() {
  C.offline = { step: "offer" }; C.phase = "talking";
  try { await line("p", S.person === "rahim" ? "ہیلو؟" : "ألو؟", S.person === "rahim" ? "ألو؟" : null);
    await line("a", P().opening(S.appt, A()), S.person === "rahim" ? `السلام عليكم يا رحيم! معك ${A().name} من «عون». جهّزت لك فحص السكر والضغط الجمعة 10 الصبح. أأكّده؟` : null);
    C.phase = "offer"; render(); } catch {}
}
async function offlineConfirm() {
  try { C.phase = "closing"; render(); await line("p", "إيه، أكّده الله يجزاك خير."); confirmAppt();
    await line("a", `تم! موعدك ${S.appt.when} في ${S.appt.place}. يوصلك تذكير قبلها بيوم، وأنا ${g("متابعة", "متابع")} معك لين يشوف الطبيب النتيجة.`);
    if (familyHasMetabolic() && S.places?.parks?.[0]) await line("a", `وبما إن في العائلة سكري أو ضغط، حطيت لك أقرب حديقة على الخريطة لمشي 20 دقيقة يوميًا.`);
    finishCall(); } catch {}
}
async function offlineDecline() {
  try { C.phase = "talking"; render(); await line("p", "لا، ما يناسبني.");
    await line("a", "ولا يهمك أبد. وش أكثر شي مصعّبها عليك؟ الوقت، المشوار، ولا شي ثاني؟");
    C.phase = "reasons"; render(); } catch {}
}
async function offlineReason(r) {
  try {
    C.phase = "talking"; render();
    await line("p", REASONS.find((x) => x[0] === r)[1]);
    if (r === "transport") { await line("a", `ولا يهمك! تحب أحجز لك أوبر يوصلك من البيت للمركز، ولا أجهز لك خطة المترو؟${S.places?.trucks?.[0] ? ` وفيه عيادة متنقلة ${G.fmtKm(S.places.trucks[0].km)} منك لو تحب.` : ""}`); C.phase = "transport"; render(); return; }
    const s = SLOTS[r]; if (s.when) S.appt.when = s.when; if (s.place) S.appt.place = s.place; S.appt.arranged = s.arranged; S.appt.reason = r;
    await line("a", s.say + " يناسبك؟"); C.phase = "offer"; render();
  } catch {}
}
async function offlineTransport(opt) {
  try {
    C.phase = "talking"; render();
    if (opt === "truck") { const t = S.places.trucks[0]; await line("p", "العيادة المتنقلة أسهل."); S.appt.place = t.name; S.appt.when = t.when; S.appt.arranged = "قريبة من بيتك"; await line("a", `ممتاز، ${t.name} ${G.fmtKm(t.km)} منك، ${t.when}. يناسبك؟`); C.phase = "offer"; render(); return; }
    await line("p", opt === "uber" ? "أوبر أفضل." : "المترو.");
    const r = arrangeTransport(opt); S.appt.arranged = opt === "uber" ? "أوبر ذهاب وعودة" : "خطة المترو"; S.appt.reason = "transport";
    await line("a", r); C.phase = "offer"; render();
  } catch {}
}

/* ---- the dock: the agent, always available inside the app ---- */
async function dockStart() {
  if (dock.conv || dock.state === "connecting") return;
  if (!S.live) { S.sheet = "commands"; render(); return; }
  dock.state = "connecting"; dock.text = ""; paintDock();
  if (!(await micOK())) { dock.state = "off"; toast("اسمح للمايكروفون عشان تكلّم " + A().name); return; }
  try {
    dock.conv = await startSession("app", {
      onConnect: () => { dock.state = "listening"; paintDock(); },
      onDisconnect: () => { dock.conv = null; dock.state = "off"; paintDock(); },
      onModeChange: ({ mode }) => { dock.state = mode === "speaking" ? "speaking" : "listening"; paintDock(); },
      onMessage: (m) => { if ((m.role || (m.source === "ai" ? "agent" : "user")) === "agent") { dock.text = m.message; paintDock(); } },
      onError: (m) => console.warn("dock", m),
    });
  } catch (e) { dock.state = "off"; toast("ما قدرنا نوصل لـ" + A().name); }
}
async function dockStop() { const c = dock.conv; dock.conv = null; dock.state = "off"; paintDock(); if (c) { try { await c.endSession(); } catch {} } }
async function runCommand(cmd) {
  const t = clientTools("app");
  const map = {
    notebook: () => t.open_screen({ screen: "notebook" }), family: () => t.open_screen({ screen: "family" }), map: () => t.open_screen({ screen: "map" }),
    park: () => t.show_on_map({ place: "park" }), truck: () => t.show_on_map({ place: "mobile_clinic" }), bigger: () => t.change_setting({ setting: "larger_text", on: true }),
  };
  S.sheet = null; const res = await map[cmd](); dock.text = typeof res === "string" && !res.startsWith("opened") && res !== "done" ? res : "فتحته لك."; paintDock();
  try { say(dock.text, "ar-SA"); } catch {}
}

/* ---------------- views ---------------- */
const av = (size, ring = false, img = A().img) => `<div class="avatar ${ring ? "ringing" : ""}" style="--s:${size}px">${ring ? "<span></span><span></span>" : ""}<img src="${img}" alt=""></div>`;
const statusText = () => C.phase === "connecting" ? "جاري الاتصال…" : C.phase === "failed" ? "تعذّر الاتصال" : `${Math.floor(C.sec / 60)}:${String(C.sec % 60).padStart(2, "0")} · ${C.speaking ? g("تتكلم", "يتكلم") : g("تسمعك", "يسمعك")}`;
function paintStatus() { const el = document.getElementById("status"); if (el) el.textContent = statusText(); const w = document.getElementById("wave"); if (w) w.classList.toggle("on", C.speaking); }

function vWelcome() {
  return `<div class="welcome">
    <img src="img/aoun-mark.png" class="wmark" alt=""><h1 class="brand">عون</h1><p class="lead">رفيقك للفحص المبكر من وزارة الصحة</p>
    <div class="perm card"><div class="pi">${ic("pin", 22)}</div><div><b>موقعك</b><small>عشان نعرف حيّك ونقترح أقرب مركز وعيادة متنقلة وحديقة.</small></div>
      ${S.loc ? `<span class="okc">${ic("checkFill", 22)}</span>` : `<button class="pill-btn" data-act="allowLoc">اسمح</button>`}</div>
    <div class="perm card"><div class="pi">${ic("mic", 22)}</div><div><b>المايكروفون</b><small>عشان تكلّم ${A().name} بصوتك.</small></div>
      ${S.mic ? `<span class="okc">${ic("checkFill", 22)}</span>` : `<button class="pill-btn" data-act="allowMic">اسمح</button>`}</div>
    <p class="fine">ما نشارك موقعك مع أحد، ونستخدمه بس لاقتراح الأماكن القريبة.</p>
    <div class="grow"></div>
    <button class="btn" data-act="startDemo">ابدأ</button></div>`;
}

function vRing() {
  return `<div class="call">
    <div class="seg dark">${Object.entries(PEOPLE).map(([k, p]) => `<button data-act="person" data-v="${k}" class="${S.person === k ? "on" : ""}">${p.label}</button>`).join("")}</div>
    <div class="grow"></div>${av(128, true)}
    <h1 class="brand callname">${A().name}</h1><div class="sub">عون · وزارة الصحة</div>
    <div class="chip">${ic("seal", 14)} مكالمة موثّقة</div>
    <div class="grow"></div>
    <div class="trust">ما نطلب أبدًا كلمة مرور أو رمز تحقق أو بيانات بنكية</div>
    <div class="callbtns" dir="ltr">
      <button class="cbtn" data-act="decline" aria-label="رفض"><span class="red">${ic("down", 34)}</span>رفض</button>
      <button class="cbtn" data-act="answer" aria-label="رد"><span class="green pulse">${ic("phone", 34)}</span>رد</button></div></div>`;
}

function transportCard(inCall) {
  const t = S.transport; if (!t || t.none) return "";
  if (t.option === "uber") return `<div class="card tcard"><div class="tc-h"><span class="ub">Uber</span><b>رحلة جاهزة</b>${t.confirmed ? `<span class="tag ok">أُرسلت لأوبر</span>` : ""}</div>
    <div class="route"><div><i class="dot g"></i>${esc(t.from)} <small>البيت</small></div><div><i class="dot r"></i>${esc(t.dest)}</div></div>
    <div class="meta">${ic("clock", 16)} الاستلام قبل الموعد بـ 30 دقيقة · حوالي ${t.min} دقيقة · ${G.fmtKm(t.km)}</div>
    <a class="btn black" href="${t.link}" target="_blank" rel="noopener" data-act="uberGo">أكّد في أوبر</a>
    <small class="fine">يفتح تطبيق أوبر والرحلة معبّأة، وتأكيدها النهائي يكون فيه.</small></div>`;
  const p = t.plan;
  return `<div class="card tcard"><div class="tc-h"><span class="mt">${ic("train", 16)}</span><b>خطة المترو</b><span class="tag">${p.total} دقيقة</span></div>
    <ol class="plan"><li>${ic("walk", 16)} امشِ ${p.walk1} د إلى محطة <b>${esc(p.from.ar)}</b></li>
    ${p.legs.map((l) => `<li><i class="lc" style="background:${l.line.color}"></i> ${esc(l.line.ar)} · ${l.stops} محطات إلى <b>${esc(l.to.ar)}</b></li>`).join("")}
    <li>${ic("walk", 16)} امشِ ${p.walk2} د إلى ${esc(t.dest)}</li></ol>
    <div class="row2"><a class="btn" href="https://apps.apple.com/sa/app/id1549817739" target="_blank" rel="noopener">التذكرة في «درب»</a>
    <a class="btn tinted" href="${t.gmaps}" target="_blank" rel="noopener">الخطة في الخرائط</a></div></div>`;
}

function apptCard(actions) {
  const a = S.appt;
  return `<div class="card appt ${a.confirmed ? "done" : ""}">
    <div class="eyebrow">${ic("cal", 18)} ${a.confirmed ? "موعدك مؤكد" : "الموعد الجاهز"}</div>
    <div class="title">${esc(a.test)}</div>
    <div class="meta">${ic("clock", 16)} ${esc(a.when)}</div><div class="meta">${ic("cross", 16)} ${esc(a.place)}</div>
    ${a.arranged ? `<div class="meta">${ic("check", 16)} ${esc(a.arranged)}</div>` : ""}
    ${actions && !a.confirmed ? `<div class="row2"><button class="btn" data-act="confirm">أكّد</button><button class="btn tinted" data-act="declineAppt">ما يناسبني</button></div>` : ""}
  </div>`;
}

function vLive() {
  const caps = S.captions ? C.lines.map((l, i) => `<div class="bub ${l.who === "a" ? "agent" : "me"} ${i >= (C.shown || 0) ? "new" : ""}"><div>${esc(l.text)}${l.tr ? `<small>${esc(l.tr)}</small>` : ""}</div></div>`).join("") : "";
  C.shown = C.lines.length;
  const chips = C.phase === "reasons" ? `<div class="chips">${REASONS.map(([k, t]) => `<button data-act="reason" data-v="${k}">${t}</button>`).join("")}</div>`
    : C.phase === "transport" ? `<div class="chips">${S.places?.trucks?.[0] ? `<button data-act="tr" data-v="truck">${ic("truck", 16)} العيادة المتنقلة</button>` : ""}<button data-act="tr" data-v="uber">Uber</button><button data-act="tr" data-v="metro">${ic("train", 16)} المترو</button></div>` : "";
  return `<div class="call live">
    <div class="livehead">${av(52)}<div class="who"><div class="brand n">${A().name}</div><div id="status" class="sub">${statusText()}</div></div><div class="wave ${C.speaking ? "on" : ""}" id="wave">${"<i></i>".repeat(5)}</div></div>
    <div class="caps" id="caps">${caps}${C.phase === "connecting" && S.live ? `<div class="hint">يتصل… اسمح بالمايكروفون إذا سألك</div>` : ""}</div>
    ${chips}
    ${C.phase === "failed" ? `<div class="failbox"><b>ما قدرنا نوصل للوكيل الحي</b><small>${esc(C.err)}</small><button class="btn tinted" data-act="offline">جرّب بدون إنترنت</button></div>` : ""}
    <div class="sheetcards">${C.mapPeek ? `<div class="card mini">${mapCard()}</div>` : ""}${S.transport && !S.transport.none ? transportCard(true) : ""}${["offer", "closing", "talking", "reasons", "transport"].includes(C.phase) && C.lines.length ? apptCard(C.phase === "offer") : ""}</div>
    <div class="controls">
      ${ctrl(C.micMuted ? "micOff" : "mic", "كتم", C.micMuted, "mute")}${ctrl(C.agentMuted ? "speakerOff" : "speaker", "الصوت", C.agentMuted, "spk")}${ctrl("text", "النص", S.captions, "caps")}
      <button class="cbtn small" data-act="hangup" aria-label="إنهاء"><span class="red">${ic("down", 26)}</span>إنهاء</button></div></div>`;
}
const ctrl = (icon, label, on, act) => `<button class="cbtn small" data-act="${act}" aria-pressed="${on}"><span class="round ${on ? "on" : ""}">${ic(icon, 24)}</span>${label}</button>`;

function vMissed() {
  return `<div class="page center"><img src="img/aoun-mark.png" class="wmark sm" alt="">
    <h2>ولا يهمك</h2><p class="muted">${A().name} ${g("بتتصل", "بيتصل")} عليك في وقت أنسب. أو ارجع الاتصال الحين.</p>
    <button class="btn" data-act="replay">${ic("phone", 20)} رجّع الاتصال</button>
    <button class="btn tinted" data-act="enterApp">افتح التطبيق</button></div>`;
}

/* ---- tabs ---- */
function vHome() {
  const a = S.appt, h = home(), d = areaFor(h.lat, h.lng), park = S.places?.parks?.[0];
  return `<header class="hdr"><div><small class="muted">${esc(h.area)}</small><h1>هلا ${esc(P().first)}</h1></div>
      <button class="iconbtn" data-act="settings" aria-label="الإعدادات">${ic("gear", 22)}</button></header>
    ${apptCard(false)}
    ${transportCard(false)}
    ${a.confirmed ? `<div class="row2 tight"><button class="btn tinted" data-act="goMap" data-v="health_center">${ic("pin", 18)} الطريق</button><button class="btn tinted" data-act="ics">${ic("cal", 18)} للتقويم</button></div>` : `<button class="btn" data-act="replay">${ic("phone", 18)} ${A().name} ${g("تتصل", "يتصل")} عليك</button>`}
    ${familyHasMetabolic() && park ? `<button class="card tip" data-act="goMap" data-v="park"><span class="tipic">${ic("leaf", 22)}</span><div><b>مشي 20 دقيقة يوميًا</b><small>بما إن في عائلتك سكري أو ضغط: ${esc(park.name)} على بعد ${G.walkMin(park.km)} دقيقة مشي.</small></div>${ic("chev", 18)}</button>` : ""}
    ${d ? `<button class="card hood" data-act="goMap" data-v="home"><div><small>حيّك</small><b>${esc(d.ar)}</b><div class="bar"><i style="width:${Math.round(d.completion * 100)}%"></i></div><small>${Math.round(d.completion * 100)}% من جيرانك فحصوا · الأكثر عندكم: ${esc(d.gap)}</small></div>${ic("chev", 18)}</button>` : ""}`;
}

function vNotebook() {
  const a = S.appt, segs = ["المواعيد", "الفحوصات", "التذكيرات"];
  const rows = [
    a.confirmed ? row("cal", a.test, `${a.when} · ${a.place}`, '<span class="tag ok">مؤكد</span>') : row("cal", a.test, "بانتظار التأكيد"),
    row("drop", "السكر التراكمي", familyHasMetabolic() ? "الحين، لأن في عائلتك سكري" : "كل سنة من عمر 35", '<span class="tag">مستحق</span>') + row("heart", "ضغط الدم", "كل سنة") + row("sun", "فيتامين د", "كل سنتين") + (S.family.aunt?.includes?.("breast") || S.family.mother?.includes?.("breast") ? row("ribbon", "فحص الثدي", "الطبيب يحدد متى تبدأ") : ""),
    row("bell", "تذكير قبل الموعد بيوم", "رسالة ومكالمة قصيرة") + (S.transport ? row(S.transport.option === "uber" ? "car" : "train", S.transport.option === "uber" ? "رحلة أوبر" : "خطة المترو", S.transport.dest) : ""),
  ];
  return `<header class="hdr"><h1>دفتري</h1></header>
    <div class="seg">${segs.map((s, i) => `<button data-act="nbSeg" data-v="${i}" class="${S.nbSeg === i ? "on" : ""}">${s}</button>`).join("")}</div>
    <div class="list">${rows[S.nbSeg]}</div><p class="fine">النتائج يشرحها لك الطبيب بنفسه.</p>`;
}
const row = (icon, title, detail = "", extra = "") => `<div class="row"><span class="rowic">${ic(icon, 18)}</span><div class="rowt"><div>${esc(title)}</div>${detail ? `<small>${esc(detail)}</small>` : ""}</div>${extra}</div>`;

function memberState(id) {
  const v = S.family[id]; if (!Array.isArray(v)) return v || "unknown"; if (!v.length) return "none";
  const repeated = v.some((c) => MEMBERS.filter((m) => m.id !== id && Array.isArray(S.family[m.id]) && S.family[m.id].includes(c)).length);
  return repeated ? "repeat" : "watch";
}
function vFamily() {
  const counts = {}; MEMBERS.forEach((m) => { const v = S.family[m.id]; if (Array.isArray(v)) v.forEach((c) => (counts[c] = (counts[c] || 0) + 1)); });
  const common = Object.entries(counts).sort((a, b) => b[1] - a[1]).filter(([, n]) => n > 0);
  const meaning = [];
  if (["father", "mother", "sib"].some((k) => S.family[k]?.includes?.("diabetes"))) meaning.push(["drop", "فحص السكر الحين", "لأن أحد والديك أو إخوانك عنده سكري، ما تنتظر عمر 35."]);
  if (["father", "mother", "sib"].some((k) => S.family[k]?.includes?.("bp"))) meaning.push(["heart", "قياس الضغط كل سنة", "والمشي اليومي يساعد كثير."]);
  if (MEMBERS.some((m) => S.family[m.id]?.includes?.("heart"))) meaning.push(["heart", "فحص الكوليسترول", "لأن في العائلة مرض قلب مبكر."]);
  if (MEMBERS.some((m) => S.family[m.id]?.includes?.("breast") || S.family[m.id]?.includes?.("colon"))) meaning.push(["ribbon", "استشارة الطبيب", "يقرر معك متى تبدأ فحص الثدي أو القولون."]);
  return `<header class="hdr"><h1>شجرة عائلتي</h1></header>
    <div class="banner">${ic("lock", 18)}<span>الشجرة محفوظة على جوالك بس، بدون أسماء. اضغط على أي فرد وعدّل.</span></div>
    <div class="tree card">
      <svg class="trunk" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M44 100 C44 90 44 84 44 76 M44 76 C38 62 30 52 25 43 M44 76 C52 62 58 52 62 43 M25 43 C20 30 15 20 12 10 M25 43 C30 30 34 20 37 10 M62 43 C62 30 63 20 63 10 M62 43 C70 30 80 20 88 10 M62 43 C72 44 80 46 87 48 M44 76 C56 76 66 76 74 76"/></svg>
      ${MEMBERS.map((m) => { const st = memberState(m.id), v = S.family[m.id];
        const lab = Array.isArray(v) ? (v.length ? CONDS[v[0]] + (v.length > 1 ? " +" + (v.length - 1) : "") : (m.me ? "" : "—")) : v === "healthy" ? "بصحته" : "ما أعرف";
        return `<button class="mem ${st} ${m.me ? "me" : ""}" style="left:${m.x}%;top:${m.y}%" data-act="member" data-v="${m.id}"><span class="dotm">${m.label.slice(0, 1) === "ا" ? m.label.slice(2, 3) : m.label.slice(0, 1)}</span><b>${m.label}</b><small>${lab}</small></button>`; }).join("")}
    </div>
    <div class="legend"><span><i class="lg repeat"></i>يتكرر</span><span><i class="lg watch"></i>انتبه له</span><span><i class="lg healthy"></i>بصحته</span></div>
    ${meaning.length ? `<h3 class="sec">وش يعني لك</h3><div class="list">${meaning.map(([i, t, d]) => row(i, t, d)).join("")}</div>` : ""}
    ${common.length ? `<h3 class="sec">الأكثر شيوعًا في عائلتك</h3><div class="list">${common.slice(0, 3).map(([c, n]) => row("chart", CONDS[c], `${n} من العائلة`)).join("")}</div>` : ""}
    <button class="btn tinted" data-act="invite">${ic("send", 18)} ادعُ أحد من أهلك للفحص</button>`;
}

function vMap() {
  return `<div class="mapwrap"><div id="map"></div>
    <div class="mapchips">${[["home", "حيّي"], ["health_center", "المركز"], ["mobile_clinic", "العيادة المتنقلة"], ["park", "حديقة"], ["metro", "المترو"]].map(([k, t]) => `<button data-act="focus" data-v="${k}" class="${S.mapFocus === k ? "on" : ""}">${t}</button>`).join("")}</div>
    ${!S.loc ? `<button class="locbtn" data-act="allowLoc">${ic("pin", 16)} استخدم موقعي</button>` : ""}
    <div class="mapcard card" id="mapcard">${mapCard()}</div></div>`;
}
function mapCard() {
  const h = home(), p = S.places || {}, f = S.mapFocus;
  const dir = (pt, mode) => `<a class="btn" href="${G.appleDir(h, pt, mode)}" target="_blank" rel="noopener">${ic("nav", 18)} الاتجاهات</a>`;
  if (f === "park" && p.parks?.[0]) { const k = p.parks[0]; return `<small class="muted">أقرب حديقة</small><b class="mc-t">${esc(k.name)}</b><div class="meta">${ic("walk", 16)} ${G.walkMin(k.km)} دقيقة مشي · ${G.fmtKm(k.km)}</div>${familyHasMetabolic() ? `<p class="fine">20 دقيقة مشي يوميًا تساعد على ضبط السكر والضغط.</p>` : ""}${dir(k, "w")}`; }
  if (f === "mobile_clinic" && p.trucks?.[0]) { const t = p.trucks[0]; return `<small class="muted">عيادة فحص متنقلة</small><b class="mc-t">${esc(t.name)}</b><div class="meta">${ic("clock", 16)} ${esc(t.hours)} · ${G.fmtKm(t.km)}</div><div class="row2">${dir(t, "w")}<button class="btn tinted" data-act="truckBook">احجز فيها</button></div>`; }
  if (f === "health_center" && p.center) { const c = p.center; return `<small class="muted">مركزك الصحي</small><b class="mc-t">${esc(c.name)}</b><div class="meta">${ic("car", 16)} ${G.fmtKm(c.km)}</div><div class="row2">${dir(c, "d")}<button class="btn tinted" data-act="trOpen">أوبر أو مترو</button></div>`; }
  if (f === "metro" && p.stations?.[0]) { const s = p.stations[0]; return `<small class="muted">أقرب محطة مترو</small><b class="mc-t">${esc(s.ar)}</b><div class="meta">${ic("walk", 16)} ${G.walkMin(s.km)} دقيقة مشي · ${s.lines.map((l) => `<i class="lc" style="background:${G.lineColor(window.AOUN_PLACES, l)}"></i>`).join("")}</div>${dir(s, "w")}`; }
  const d = areaFor(h.lat, h.lng);
  return `<small class="muted">${S.loc ? "موقعك" : "موقع تقريبي"}</small><b class="mc-t">${esc(h.area)}</b>${d ? `<div class="bar"><i style="width:${Math.round(d.completion * 100)}%"></i></div><div class="meta">${Math.round(d.completion * 100)}% من جيرانك أكملوا فحوصاتهم · الأكثر: ${esc(d.gap)}</div>` : ""}${p.live ? `<p class="fine">الأماكن من OpenStreetMap حول موقعك.</p>` : ""}`;
}

let LMAP = null;
function mountMap() {
  const el = document.getElementById("map"); if (!el || !window.L) return;
  if (LMAP) { LMAP.remove(); LMAP = null; }
  const h = home(), p = S.places || G.localPlaces(h, window.AOUN_PLACES);
  LMAP = L.map(el, { zoomControl: false, attributionControl: true }).setView([h.lat, h.lng], 14);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19, attribution: "© OpenStreetMap · © CARTO" }).addTo(LMAP);
  const pin = (cls, html) => L.divIcon({ className: "", html: `<div class="pin ${cls}">${html}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] });
  L.circle([h.lat, h.lng], { radius: 900, color: "#256686", weight: 1.5, dashArray: "6 6", fillOpacity: 0.06 }).addTo(LMAP);
  L.marker([h.lat, h.lng], { icon: L.divIcon({ className: "", html: '<div class="me-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(LMAP);
  const pts = { home: h };
  if (p.center) { L.marker([p.center.lat, p.center.lng], { icon: pin("c", ic("cross", 18)) }).addTo(LMAP); pts.health_center = p.center; }
  (p.trucks || []).forEach((t, i) => { L.marker([t.lat, t.lng], { icon: pin("t", ic("truck", 18)) }).addTo(LMAP); if (!i) pts.mobile_clinic = t; });
  (p.parks || []).slice(0, 4).forEach((k, i) => { L.marker([k.lat, k.lng], { icon: pin("p", ic("leaf", 18)) }).addTo(LMAP); if (!i) pts.park = k; });
  (p.stations || []).slice(0, 3).forEach((s, i) => { L.marker([s.lat, s.lng], { icon: pin("m", ic("train", 16)) }).addTo(LMAP); if (!i) pts.metro = s; });
  const T = S.transport;
  if (T?.plan) { const pl = T.plan; L.polyline([[h.lat, h.lng], [pl.from.lat, pl.from.lng]], { color: "#555", dashArray: "4 6", weight: 3 }).addTo(LMAP);
    pl.legs.forEach((l) => L.polyline(l.path, { color: l.line.color, weight: 6, opacity: 0.9 }).addTo(LMAP));
    L.polyline([[pl.to.lat, pl.to.lng], [p.center.lat, p.center.lng]], { color: "#555", dashArray: "4 6", weight: 3 }).addTo(LMAP); }
  const f = pts[S.mapFocus];
  if (f && S.mapFocus !== "home") { L.polyline([[h.lat, h.lng], [f.lat, f.lng]], { color: "#256686", dashArray: "2 8", weight: 4 }).addTo(LMAP);
    LMAP.fitBounds(L.latLngBounds([[h.lat, h.lng], [f.lat, f.lng]]).pad(0.35), { paddingBottomRight: [0, 160] }); }
  else if (T?.plan && S.mapFocus === "home") LMAP.fitBounds(L.latLngBounds([[h.lat, h.lng], [p.center.lat, p.center.lng]]).pad(0.2));
}

function vSettings() {
  const opt = (v, t) => `<button class="row link" data-act="voice" data-v="${v}"><div class="rowt"><div>${t}</div></div>${S.voice === v ? `<span class="tick">✓</span>` : ""}</button>`;
  const tg = (act, on, label, sub = "") => `<div class="row"><div class="rowt"><div>${label}</div>${sub ? `<small>${sub}</small>` : ""}</div><button class="sw ${on ? "on" : ""}" role="switch" aria-checked="${on}" aria-label="${label}" data-act="${act}"><i></i></button></div>`;
  return `<h2>الوصول والإعدادات</h2>
    <div class="gh">صوت المساعد</div><div class="list">${opt("auto", "تلقائي حسب صوتك")}${opt("female", "رفيدة · صوت امرأة")}${opt("male", "رفيد · صوت رجل")}</div>
    <div class="gh">العرض</div><div class="list"><div class="row"><div class="rowt"><div>حجم الخط</div></div><div class="stepper"><button data-act="ts" data-v="-1">أ-</button><span>${Math.round(S.textScale * 100)}%</span><button data-act="ts" data-v="1">أ+</button></div></div>
      ${tg("tcaps", S.captions, "نص المكالمة")}${tg("contrast", S.contrast, "تباين عالي")}${tg("simple", S.simple, "الوضع البسيط", "أزرار أكبر")}</div>
    <div class="gh">الخصوصية</div><div class="list">${tg("locToggle", !!S.loc, "استخدام موقعي", S.loc ? esc(S.loc.area) : "لاقتراح الأماكن القريبة")}</div>
    <div class="gh">العرض التجريبي</div><div class="list">${tg("live", S.live, "الوكيل الحي (ElevenLabs)", "إذا أطفأته تشتغل المكالمة بصوت الجهاز")}
      <button class="row link" data-act="replay"><div class="rowt"><div>أعد المكالمة من البداية</div></div></button>
      <a class="row link" href="ministry.html"><div class="rowt"><div>واجهة وزارة الصحة</div><small>لوحة الأحياء وأداء الوكلاء</small></div>${ic("chev", 16)}</a></div>
    <button class="btn tinted" data-act="close">تم</button>`;
}

function vSheet() {
  if (!S.sheet) return "";
  let inner = "";
  if (S.sheet === "booked") inner = `<div class="center">${ic("checkFill", 56, "ok")}<h2>تم، موعدك مؤكد</h2></div>${apptCard(false)}${transportCard(false)}
    <p class="muted center">${A().name} ${g("معك", "معك")} في التطبيق دايم. اضغط على الشريط تحت وكلّمه${g("ا", "")} متى ما بغيت.</p><button class="btn" data-act="bookedOk">تمام</button>`;
  else if (S.sheet === "settings") inner = vSettings();
  else if (S.sheet === "member") {
    const m = MEMBERS.find((x) => x.id === S.memberId), v = S.family[m.id], arr = Array.isArray(v) ? v : [];
    inner = `<h2>${m.label}</h2><p class="muted">اختر اللي تعرفه. ما نحفظ أسماء، وكل شي يبقى على جوالك.</p>
      <div class="chips wrap">${Object.entries(CONDS).map(([k, t]) => `<button data-act="cond" data-v="${k}" class="${arr.includes(k) ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="chips wrap"><button data-act="cond" data-v="healthy" class="${v === "healthy" ? "on" : ""}">بصحته</button><button data-act="cond" data-v="unknown" class="${v === "unknown" ? "on" : ""}">ما أعرف</button></div>
      <button class="btn" data-act="close">تم</button>`;
  } else if (S.sheet === "invite") inner = `<h2>دعوة للفحص</h2><p class="muted">رسالة عامة ما تذكر أي مرض، وكل واحد يقرر بنفسه.</p>
      <div class="msg">السلام عليكم، أدعوك لفحص دوري مجاني قريب منك عن طريق «عون» من وزارة الصحة. رد على هذي الرسالة ونرتب لك موعد يناسبك.</div>
      <button class="btn" data-act="share">${ic("send", 18)} أرسل</button><button class="btn tinted" data-act="close">إغلاق</button>`;
  else if (S.sheet === "transport") inner = `<h2>كيف تبي توصل؟</h2>
      <button class="row link card" data-act="trPick" data-v="uber"><span class="ub">Uber</span><div class="rowt"><div>أوبر من البيت للمركز</div><small>رحلة جاهزة تأكدها في أوبر</small></div></button>
      <button class="row link card" data-act="trPick" data-v="metro"><span class="rowic">${ic("train", 18)}</span><div class="rowt"><div>مترو الرياض</div><small>خطة كاملة وتذكرة من «درب»</small></div></button>
      <button class="btn tinted" data-act="close">إلغاء</button>`;
  else if (S.sheet === "commands") inner = `<h2>وش تبي ${A().name} ${g("تسوي", "يسوي")}؟</h2><p class="muted">الوكيل الحي مطفّأ، اختر أمر:</p>
      <div class="list">${[["notebook", "book", "افتح دفتري"], ["family", "family", "شجرة العائلة"], ["park", "leaf", "وريني أقرب حديقة"], ["truck", "truck", "أقرب عيادة متنقلة"], ["bigger", "text", "كبّر الخط"]].map(([k, i, t]) => `<button class="row link" data-act="cmd" data-v="${k}"><span class="rowic">${ic(i, 18)}</span><div class="rowt"><div>${t}</div></div></button>`).join("")}</div>
      <button class="btn tinted" data-act="close">إغلاق</button>`;
  const fresh = S.sheet !== S._prevSheet ? " new" : "";
  return `<div class="scrim${fresh}" data-act="close"></div><div class="sheet${fresh}" role="dialog"><div class="grab"></div>${inner}</div>`;
}

function vDock() {
  const st = dock.state, label = st === "off" ? `كلّم ${A().name}` : st === "connecting" ? "يتصل…" : st === "speaking" ? `${A().name} ${g("تتكلم", "يتكلم")}` : `${A().name} ${g("تسمعك", "يسمعك")}…`;
  return `<div class="dock ${st}" id="dock"><button class="dock-main" data-act="dock">${av(40)}<div class="dock-t"><b>${label}</b><small>${esc(dock.text || (st === "off" ? "قول مثلًا: «افتح دفتري» أو «وين أقرب حديقة؟»" : ""))}</small></div>
    <span class="dwave">${"<i></i>".repeat(4)}</span></button>${st !== "off" ? `<button class="dock-x" data-act="dockStop" aria-label="إيقاف">${ic("x", 16)}</button>` : ""}</div>`;
}
function paintDock() { const d = document.getElementById("dock"); if (d) d.outerHTML = vDock(); }

function vApp() {
  const tabs = [["home", "house", "الرئيسية"], ["nb", "book", "دفتري"], ["map", "map", "الخريطة"], ["fam", "family", "عائلتي"]];
  const body = { home: vHome, nb: vNotebook, map: vMap, fam: vFamily }[S.tab]();
  return `<div class="app"><main class="scroll ${S.tab === "map" ? "nopad" : ""}" id="scroll">${body}</main>${vDock()}
    <nav class="tabbar">${tabs.map(([k, i, t]) => `<button data-act="tab" data-v="${k}" class="${S.tab === k ? "on" : ""}">${ic(i, 24)}<span>${t}</span></button>`).join("")}</nav></div>`;
}

/* ---------------- render & events ---------------- */
const root = document.getElementById("root");
function toast(t) { S.toast = t; render(); setTimeout(() => { S.toast = ""; render(); }, 2600); }
function render() {
  const de = document.documentElement;
  de.classList.toggle("hc", S.contrast); de.classList.toggle("simple", S.simple); de.style.setProperty("--ts", S.textScale);
  const v = { welcome: vWelcome, ring: vRing, live: vLive, missed: vMissed, app: vApp }[S.stage]();
  const keepScroll = document.getElementById("scroll")?.scrollTop || 0, sameTab = S._lastTab === S.tab;
  root.innerHTML = v + vSheet() + (S.toast ? `<div class="toast">${esc(S.toast)}</div>` : "");
  S._prevSheet = S.sheet;
  const sc = document.getElementById("scroll"); if (sc && sameTab) sc.scrollTop = keepScroll; S._lastTab = S.tab;
  const caps = document.getElementById("caps"); if (caps) caps.scrollTop = caps.scrollHeight;
  if (S.stage === "app" && S.tab === "map") mountMap(); else if (LMAP) { LMAP.remove(); LMAP = null; }
}

function ics() {
  const body = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${S.appt.test} · عون\nLOCATION:${S.appt.place}\nDESCRIPTION:${S.appt.when}\nDTSTART:${G.nextDateICS()}\nDURATION:PT30M\nEND:VEVENT\nEND:VCALENDAR`;
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" })); a.download = "aoun.ics"; a.click();
}

root.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const v = b.dataset.v, act = b.dataset.act;
  switch (act) {
    case "allowLoc": { const ok = await askLocation(); if (!ok) toast("ما قدرنا نوصل لموقعك، نستخدم موقع تقريبي"); break; }
    case "allowMic": S.mic = await micOK(); break;
    case "startDemo": store.set("onboarded", true); S.stage = "ring"; if (!S.places) loadPlaces(); break;
    case "person": S.person = v; store.set("person", v); resetAppt(); if (!S.loc) { S.places = null; loadPlaces(); } break;
    case "answer": return answer();
    case "decline": S.stage = "missed"; break;
    case "hangup": return finishCall();
    case "mute": C.micMuted = !C.micMuted; try { C.conv?.setMicMuted(C.micMuted); } catch {} break;
    case "spk": C.agentMuted = !C.agentMuted; try { C.conv?.setVolume({ volume: C.agentMuted ? 0 : 1 }); } catch {} break;
    case "caps": case "tcaps": S.captions = !S.captions; store.set("captions", S.captions); break;
    case "confirm": return tapConfirm();
    case "declineAppt": return tapDecline();
    case "reason": return offlineReason(v);
    case "tr": return offlineTransport(v);
    case "offline": S.live = false; store.set("live", false); await stopCall(); return answer();
    case "replay": await stopCall(); await dockStop(); S.sheet = null; S.stage = "ring"; break;
    case "enterApp": S.stage = "app"; break;
    case "tab": S.tab = v; break;
    case "nbSeg": S.nbSeg = +v; break;
    case "settings": S.sheet = "settings"; break;
    case "goMap": S.tab = "map"; S.mapFocus = v; S.sheet = null; break;
    case "focus": S.mapFocus = v; if (!S.loc && v !== "home") askLocation(); break;
    case "member": S.memberId = v; S.sheet = "member"; break;
    case "cond": {
      const id = S.memberId; let cur = S.family[id];
      if (v === "healthy" || v === "unknown") cur = v; else { cur = Array.isArray(cur) ? cur.slice() : []; cur = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]; }
      S.family[id] = cur; store.set("family", S.family); break;
    }
    case "invite": S.sheet = "invite"; break;
    case "share": try { await navigator.share({ text: "السلام عليكم، أدعوك لفحص دوري مجاني قريب منك عن طريق «عون» من وزارة الصحة." }); } catch {} break;
    case "close": S.sheet = null; break;
    case "bookedOk": S.sheet = null; render(); return dockStart();
    case "dock": return dock.state === "off" ? dockStart() : null;
    case "dockStop": return dockStop();
    case "cmd": return runCommand(v);
    case "uberGo": if (S.transport) { S.transport.confirmed = true; store.set("transport", S.transport); } return;
    case "trOpen": S.sheet = "transport"; break;
    case "trPick": arrangeTransport(v); S.sheet = null; S.tab = "home"; break;
    case "truckBook": { const t = S.places.trucks[0]; S.appt = { ...S.appt, place: t.name, when: t.when, arranged: "قريبة من بيتك", confirmed: true }; store.set("appt", S.appt); toast("تم، موعدك في العيادة المتنقلة"); break; }
    case "ics": ics(); return;
    case "voice": S.voice = v; store.set("voice", v); break;
    case "contrast": S.contrast = !S.contrast; store.set("contrast", S.contrast); break;
    case "simple": S.simple = !S.simple; store.set("simple", S.simple); break;
    case "live": S.live = !S.live; store.set("live", S.live); break;
    case "locToggle": if (S.loc) { S.loc = null; store.set("loc", null); S.places = null; loadPlaces(); } else await askLocation(); break;
    case "ts": S.textScale = Math.min(1.4, Math.max(0.85, +(S.textScale + 0.1 * +v).toFixed(2))); store.set("textScale", S.textScale); break;
  }
  render();
});

if (savedAppt && S.stage === "ring" && location.hash === "#app") { S.appt = savedAppt; S.stage = "app"; }
try { speechSynthesis.getVoices(); } catch {}
render();
if (S.stage !== "welcome") loadPlaces();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
