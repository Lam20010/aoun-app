import { Conversation } from "@elevenlabs/client";

/* ---------------- data ---------------- */
const AGENTS = {
  rufaida: { name: "رفيدة", img: "img/rufaida.png", id: "agent_2401m7x9pdtpfghakjnscgt90zsp", f: true },
  rafeed: { name: "رفيد", img: "img/rafeed.png", id: "agent_1801m7x9q2tney5r6qh2erxg8rf7", f: false },
};
const L = (speaker, text, tr) => ({ speaker, text, tr });
const PEOPLE = {
  om: {
    label: "أم سعد · 68", first: "حصة", male: false, detected: "العربية · نجدية · كبيرة سن", lang: "ar-SA",
    appt: { test: "فحص السكر التراكمي", when: "الخميس 4:30 العصر", alt: "الأحد 10:00 الصبح", place: "مركز صحي الحي", arranged: "المشوار محجوز ذهاب وعودة · سعد يستلم التنبيهات" },
    script: {
      opening: [L("p", "ألو؟ مين معي؟"), L("a", "السلام عليكم يا خالة حصة، معك رفيدة من «عون» التابع لوزارة الصحة. اتصالي بس عشان أطمّن عليك، وما راح آخذ من وقتك إلا دقيقتين."), L("p", "وعليكم السلام يا بنتي، الله يحييك."), L("a", "الله يسلمك. فحص السكر حقك صار له فوق السنة، وهو بسيط: نقطة دم وتخلصين. والفحص بدري يحفظ لك صحتك سنين مع عيالك وأحفادك."), L("p", "والله يا بنتي أخاف يطلع فيني شي… وبعدين ما عندي أحد يوديني، سعد بالدوام."), L("a", "الخوف طبيعي يا خالة، بس الفحص اطمئنان مو خوف. والمشوار لا تشيلين همّه: رتّبت لك الخميس 4:30 العصر بمركز الحي، وسيارة توديك وترجعك، وأبلّغ سعد.")],
      alternative: [L("p", "الخميس عندي عزيمة، فيه وقت ثاني؟"), L("a", "أبشري، الأحد 10 الصبح بنفس المركز ونفس السيارة. يناسبك؟")],
      closing: [L("p", "إيه يا بنتي، أكّديه، الله يجزاك خير."), L("a", "تم يا خالة. يوصلك تذكير قبلها بيوم، وأنا متابعة معك لين يشوف الطبيب النتيجة. في أمان الله.")],
    },
  },
  noura: {
    label: "نورة · 34", first: "نورة", male: false, detected: "العربية · حجازية · موظفة", lang: "ar-SA",
    appt: { test: "فحص السكر + فيتامين د", when: "الثلاثاء 7:30 م", alt: "الخميس 8:00 م", place: "مركز صحي الحي", arranged: "مع طبيبة · موعد واحد للتحليلين" },
    script: {
      opening: [L("p", "ألو، أيوه؟"), L("a", "مساء الخير نورة، معك رفيدة من «عون» التابع لوزارة الصحة. معك دقيقة؟"), L("p", "أهلين، بس أنا في الدوام، بسرعة لو سمحتي."), L("a", "أكيد. آخر فحص لك قبل سنتين، وربع ساعة تطمّنك على سنين قدّام."), L("p", "عارفة والله، بس دوامي لين خمسة وما ألحق المواعيد."), L("a", "عشان كذا رتّبتها على وقتك: الثلاثاء 7:30 المسا مع طبيبة، وأضفت تحليل فيتامين د بنفس السحبة.")],
      alternative: [L("p", "الثلاثاء صعب، فيه يوم ثاني؟"), L("a", "ولا يهمك، الخميس 8 المسا مع نفس الطبيبة. يمشي؟")],
      closing: [L("p", "تمام، احجزيه."), L("a", "تم يا نورة. أرسلت لك التفاصيل برسالة، وتذكير يوم الموعد. بالتوفيق!")],
    },
  },
  rahim: {
    label: "رحيم · 41", first: "رحيم", male: true, detected: "الأوردو · عامل · جمل بسيطة", lang: "ur-PK",
    appt: { test: "فحص السكر والضغط", when: "الجمعة 10:00 ص", alt: "الجمعة 2:30 م", place: "عيادة متنقلة قرب السكن", arranged: "التذكير بالأوردو · بدون إجازة من العمل" },
    script: {
      opening: [L("p", "ہیلو؟", "ألو؟"), L("a", "السلام علیکم رحیم بھائی، میں وزارتِ صحت کے «عون» سے رفید بات کر رہا ہوں۔", "السلام عليكم يا رحيم، معك رفيد من «عون» التابع لوزارة الصحة."), L("p", "جی، خیریت؟", "أيوه، خير؟"), L("a", "سب خیر ہے۔ آپ کے لیے شوگر اور بلڈ پریشر کا مفت معائنہ ہے۔ صرف دس منٹ۔", "كل خير. عندك فحص سكر وضغط مجاني، عشر دقايق بس."), L("p", "میں صبح سے رات تک کام کرتا ہوں، چھٹی نہیں ملتی۔", "أشتغل من الصبح لين الليل، وما عندي إجازة."), L("a", "کوئی بات نہیں۔ جمعہ صبح 10 بجے آپ کی رہائش کے قریب موبائل کلینک آئے گا۔ چھٹی کی ضرورت نہیں۔", "ولا يهمك. الجمعة 10 الصبح بتجي عيادة متنقلة قرب سكنك، بدون إجازة.")],
      alternative: [L("p", "جمعہ کی نماز کے بعد ہو سکتا ہے؟", "ممكن بعد صلاة الجمعة؟"), L("a", "جی ہاں، میں 2:30 بجے کا وقت رکھ سکتا ہوں، ٹھیک ہے؟", "أكيد، أقدر أحجز لك 2:30، يناسبك؟")],
      closing: [L("p", "ٹھیک ہے، بک کر دیں۔", "تمام، احجزه."), L("a", "ہو گیا رحیم بھائی! اردو میں یاد دہانی بھیجوں گا۔ اللہ حافظ۔", "تم يا رحيم! بأرسل لك تذكير بالأوردو. في أمان الله.")],
    },
  },
};
const FAMILY_Q = [
  { id: "metabolic", text: "أحد من والديك أو إخوانك عنده سكري أو ضغط؟" },
  { id: "heart", text: "أحد من أهلك القريبين صار عنده مرض قلب قبل الخمسين؟" },
  { id: "cancer", text: "اختياري: أحد من أهلك القريبين أصيب بسرطان الثدي أو القولون؟" },
];
const ANSWERS = [["yes", "نعم"], ["no", "لا"], ["dk", "ما أعرف"], ["skip", "تخطّي"]];
const RELS = { brother: ["أخ", "أخوك"], sister: ["أخت", "أختك"], son: ["ابن", "أبوك أو أمك"], daughter: ["بنت", "أبوك أو أمك"] };
const invite = (r) => `السلام عليكم، ${RELS[r][1]} يدعوك لفحص دوري مجاني قريب منك عن طريق «عون» من وزارة الصحة. رد على هذي الرسالة ونرتب لك موعد يناسبك.`;

/* ---------------- state ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("aoun." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("aoun." + k, JSON.stringify(v)); } catch {} },
};
const S = {
  stage: "ring", // ring | live | missed | app
  tab: "home",
  person: store.get("person", "om"),
  appt: null,
  voice: store.get("voice", "auto"),
  live: store.get("live", true),
  contrast: store.get("contrast", false),
  simple: store.get("simple", false),
  captions: store.get("captions", true),
  textScale: store.get("textScale", 1),
  family: store.get("family", { metabolic: "skip", heart: "skip", cancer: "skip" }),
  seg: 0,
  later: false,
  sheet: null, // booked | invite | confirmDelete
  rel: "brother", consent: false, sent: false,
};
S.appt = { ...PEOPLE[S.person].appt, confirmed: false };
const P = () => PEOPLE[S.person];
const A = () => S.voice === "female" ? AGENTS.rufaida : S.voice === "male" ? AGENTS.rafeed : (P().male ? AGENTS.rafeed : AGENTS.rufaida);
const g = (f, m) => (A().f ? f : m);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------------- icons (SF Symbols-like, inline SVG) ---------------- */
const I = {
  phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>',
  down: '<g transform="rotate(135 12 12)"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/></g>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  micOff: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  speaker: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  speakerOff: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  text: '<path d="M4 5h16v11H9l-5 4z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M8 9h8M8 12h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  seal: '<path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 15.8l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" fill="currentColor"/><path d="M8.5 12l2.3 2.3 4.7-4.7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  cross: '<rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 7V5h6v2M12 10.5v6M9 13.5h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  check: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 12.3l2.6 2.6L16 9.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  checkFill: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.3l3 3 6-6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  circle: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>',
  house: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 17a3 3 0 0 1 3-3h11" stroke="currentColor" stroke-width="2" fill="none"/>',
  family: '<circle cx="7" cy="6" r="2.5" fill="currentColor"/><circle cx="17" cy="6" r="2.5" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M4 21v-6a3 3 0 0 1 6 0v6M14 21v-6a3 3 0 0 1 6 0v6M10 21v-3a2 2 0 0 1 4 0v3" fill="currentColor"/>',
  access: '<circle cx="12" cy="4.5" r="2" fill="currentColor"/><path d="M4 8l8 1.5L20 8M12 9.5V14l-3 7M12 14l3 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/>',
  send: '<path d="M21 3L3 10.5l7 2.5 2.5 7z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M10 13l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
  car: '<path d="M4 16v-4l2-5h12l2 5v4zM4 16v2M20 16v2" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="8" cy="14" r="1.3" fill="currentColor"/><circle cx="16" cy="14" r="1.3" fill="currentColor"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" stroke="currentColor" stroke-width="2" fill="none"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z" stroke="currentColor" stroke-width="2" fill="none"/>',
  sun: '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  wave: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  play: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M10 8.5v7l5.5-3.5z" fill="currentColor"/>',
  hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.5L8 15" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
};
const ic = (n, s = 22, cls = "") => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ---------------- call engine ---------------- */
const C = { lines: [], phase: "idle", speaking: false, micMuted: false, agentMuted: false, sec: 0, alt: false, conv: null, timer: null, cancel: false, error: "" };

function resetCall() {
  Object.assign(C, { lines: [], phase: "connecting", speaking: false, micMuted: false, agentMuted: false, sec: 0, alt: false, conv: null, cancel: false, error: "" });
  S.appt = { ...P().appt, confirmed: false };
}

async function answer() {
  resetCall();
  S.stage = "live";
  render();
  clearInterval(C.timer);
  C.timer = setInterval(() => { C.sec++; const el = document.getElementById("status"); if (el) el.textContent = statusText(); }, 1000);
  if (S.live) startLive(); else playScript(P().script.opening, "offer");
}

function decline() { S.stage = "missed"; render(); }

async function startLive() {
  const p = P(), a = S.appt;
  const context = `بيانات المكالمة: الاسم ${p.first}. الفحص المقترح: ${a.test}. الموعد الجاهز: ${a.when} في ${a.place} (${a.arranged}). البديل إذا طلب وقت ثاني: ${a.alt}. إذا وافق الشخص على الموعد استدعِ الأداة book_ready_appointment.`;
  try {
    // Ask for the mic first so iOS shows its prompt inside the tap.
    await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop()));
  } catch (e) {
    return fail("ما قدرنا نستخدم المايكروفون. اسمح للمتصفح باستخدامه وجرّب مرة ثانية.");
  }
  const opts = (connectionType) => ({
    agentId: A().id,
    connectionType,
    clientTools: {
      book_ready_appointment: async ({ slot } = {}) => {
        const alt = slot === "alt" || C.alt;
        confirmAppt(alt);
        C.phase = "closing"; render();
        setTimeout(finishCall, 7000);
        return `booked: ${S.appt.test}, ${S.appt.when}, ${S.appt.place}`;
      },
    },
    onConnect: () => { C.phase = "talking"; render(); setTimeout(() => { try { C.conv?.sendContextualUpdate(context); } catch {} }, 400); },
    onDisconnect: () => { if (C.phase !== "ended" && C.phase !== "failed") finishCall(); },
    onError: (m) => { console.warn("agent error", m); },
    onModeChange: ({ mode }) => { C.speaking = mode === "speaking"; updateWave(); },
    onMessage: (m) => {
      const role = m.role || (m.source === "ai" ? "agent" : "user");
      const text = m.message || "";
      if (!text.trim()) return;
      C.lines.push(L(role === "agent" ? "a" : "p", text));
      const agentTurns = C.lines.filter((l) => l.speaker === "a").length;
      if (C.phase === "talking" && agentTurns >= 3) C.phase = "offer";
      render();
    },
  });
  try {
    C.conv = await Conversation.startSession(opts("webrtc"));
  } catch (e1) {
    console.warn("webrtc failed, trying websocket", e1);
    try { C.conv = await Conversation.startSession(opts("websocket")); }
    catch (e2) { return fail(String(e2?.message || e2)); }
  }
}

function fail(msg) { C.phase = "failed"; C.error = msg; render(); }

function confirmAppt(alt) {
  if (alt) S.appt.when = S.appt.alt;
  S.appt.confirmed = true;
  store.set("booked", S.appt);
}

function onConfirm() {
  confirmAppt(C.alt);
  C.phase = "closing"; render();
  if (S.live && C.conv) {
    try { C.conv.sendUserMessage(`أكّد الموعد ${S.appt.when}، الله يجزاك خير.`); } catch {}
    setTimeout(finishCall, 9000);
  } else playScript(P().script.closing, null, finishCall);
}

function onOther() {
  C.alt = true; C.phase = "talking"; render();
  if (S.live && C.conv) {
    try {
      C.conv.sendUserMessage("الوقت هذا ما يناسبني، فيه وقت ثاني؟");
      C.conv.sendContextualUpdate(`الشخص طلب وقت ثاني. اعرض: ${S.appt.alt} بنفس المكان والترتيب.`);
    } catch {}
    setTimeout(() => { if (C.phase === "talking") { C.phase = "offer"; render(); } }, 4000);
  } else playScript(P().script.alternative, "offer");
}

async function stopAll() {
  clearInterval(C.timer);
  C.cancel = true;
  try { speechSynthesis.cancel(); } catch {}
  const conv = C.conv; C.conv = null;
  if (conv) { try { await conv.endSession(); } catch {} }
}

async function finishCall() {
  if (C.phase === "ended") return;
  C.phase = "ended";
  await stopAll();
  if (S.appt.confirmed) { S.stage = "app"; S.tab = "home"; S.sheet = "booked"; }
  else S.stage = "missed";
  render();
}

function toggleMic() { C.micMuted = !C.micMuted; try { C.conv?.setMicMuted(C.micMuted); } catch {} render(); }
function toggleSpeaker() {
  C.agentMuted = !C.agentMuted;
  try { C.conv?.setVolume({ volume: C.agentMuted ? 0 : 1 }); } catch {}
  try { C.agentMuted ? speechSynthesis.pause() : speechSynthesis.resume(); } catch {}
  render();
}

/* offline scripted call (device speech) */
function pickVoice(lang) {
  const vs = speechSynthesis.getVoices();
  return vs.find((v) => v.lang === lang) || vs.find((v) => v.lang.startsWith(lang.slice(0, 2))) || null;
}
function say(text, lang) {
  return new Promise((res) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; const v = pickVoice(lang); if (v) u.voice = v;
      u.rate = S.person === "om" ? 0.9 : 1;
      u.onend = u.onerror = () => res();
      speechSynthesis.speak(u);
      setTimeout(res, 2500 + text.length * 120); // safety net
    } catch { res(); }
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function playScript(lines, next, done) {
  C.cancel = false;
  if (C.phase === "connecting" || C.phase === "offer") C.phase = "talking";
  render();
  for (const line of lines) {
    if (C.cancel) return;
    C.lines.push({ ...line }); render();
    if (line.speaker === "a") { C.speaking = true; updateWave(); await say(line.text, P().lang); C.speaking = false; updateWave(); }
    else await wait(900 + line.text.length * 40);
    await wait(300);
  }
  if (C.cancel) return;
  if (next) { C.phase = next; render(); }
  done && done();
}

/* ---------------- views ---------------- */
const avatar = (size, ring = false) => `<div class="avatar ${ring ? "ringing" : ""}" style="--s:${size}px">${ring ? '<span class="r1"></span><span class="r2"></span>' : ""}<img src="${A().img}" alt=""></div>`;
const trust = () => `<div class="trust"><div>${ic("seal", 16)} مكالمة موثّقة من وزارة الصحة</div><small>ما نطلب أبدًا كلمة مرور أو رمز تحقق أو بيانات بنكية</small></div>`;
const statusText = () => {
  if (C.phase === "connecting") return "جاري الاتصال…";
  if (C.phase === "failed") return "تعذّر الاتصال";
  const m = Math.floor(C.sec / 60), s = String(C.sec % 60).padStart(2, "0");
  return `${m}:${s} · ${C.speaking ? g("تتكلم", "يتكلم") : g("تسمعك", "يسمعك")}`;
};

function vRing() {
  return `<div class="call">
    <div class="seg dark">${Object.entries(PEOPLE).map(([k, p]) => `<button data-act="person" data-v="${k}" class="${S.person === k ? "on" : ""}">${p.label}</button>`).join("")}</div>
    <div class="grow"></div>
    ${avatar(132, true)}
    <h1 class="brand callname">${A().name} · عون</h1>
    <div class="sub">وزارة الصحة · مكالمة صوتية</div>
    <div class="chip">${S.live ? ic("wave", 14) + " الوكيل الحي" : ic("play", 14) + " عرض بدون إنترنت"}</div>
    <div class="grow"></div>
    ${trust()}
    <div class="callbtns" dir="ltr">
      <button class="cbtn" data-act="decline" aria-label="رفض مكالمة عون"><span class="red">${ic("down", 34)}</span>رفض</button>
      <button class="cbtn" data-act="answer" aria-label="رد على مكالمة عون"><span class="green pulse">${ic("phone", 34)}</span>رد</button>
    </div></div>`;
}

const bubble = (l) => { const fresh = !l.shown; l.shown = true; return `<div class="bub ${l.speaker === "a" ? "agent" : "me"}${fresh ? " new" : ""}"><div>${esc(l.text)}${l.tr ? `<small>${esc(l.tr)}</small>` : ""}</div></div>`; };

function apptCard(a, actions) {
  return `<div class="card appt">
    <div class="eyebrow">${ic("cal", 18)} الموعد الجاهز</div>
    <div class="title">${esc(a.test)}</div>
    <div class="meta">${ic("clock", 17)} ${esc(a.when)}</div>
    <div class="meta">${ic("cross", 17)} ${esc(a.place)}</div>
    <div class="meta">${ic("check", 17)} ${esc(a.arranged)}</div>
    ${actions ? `<button class="btn" data-act="confirm">أكّد الموعد</button>${!C.alt && !S.simple ? `<button class="btn tinted" data-act="other">وقت ثاني</button>` : ""}` : ""}
  </div>`;
}

function vLive() {
  const a = { ...S.appt }; if (C.alt) a.when = a.alt;
  return `<div class="call live">
    <div class="livehead">${avatar(56)}<div class="who"><div class="brand n">${A().name}</div><div id="status" class="sub mono">${statusText()}</div></div><div class="wave ${C.speaking ? "on" : ""}" id="wave">${"<i></i>".repeat(7)}</div></div>
    <div class="chip">${ic("ear", 14)} ${esc(P().detected)}</div>
    <div class="caps" id="caps">${S.captions ? C.lines.map(bubble).join("") : ""}
      ${C.phase === "connecting" ? `<div class="hint">${S.live ? "يتصل بالوكيل الحي… اسمح بالمايكروفون إذا سألك" : ""}</div>` : ""}
      ${C.phase === "talking" && S.live && C.lines.length === 0 ? `<div class="hint">تكلّم بشكل طبيعي، ${A().name} ${g("تسمعك", "يسمعك")}</div>` : ""}
    </div>
    ${C.phase === "offer" ? `<div class="offer${C.offerShown ? "" : " new"}">${apptCard(a, true)}</div>` : ""}
    ${C.phase === "failed" ? `<div class="failbox"><b>ما قدرنا نوصل للوكيل الحي.</b><small>${esc(C.error)}</small><button class="btn tinted" data-act="offline">جرّب العرض بدون إنترنت</button></div>` : ""}
    <div class="controls">
      ${ctrl(C.micMuted ? "micOff" : "mic", "كتم", C.micMuted, "mic")}
      ${ctrl(C.agentMuted ? "speakerOff" : "speaker", "السماعة", C.agentMuted, "spk")}
      ${ctrl("text", "الترجمة", S.captions, "caps")}
      <button class="cbtn small" data-act="hangup" aria-label="إنهاء المكالمة"><span class="red">${ic("down", 28)}</span>إنهاء</button>
    </div></div>`;
}
const ctrl = (icon, label, on, act) => `<button class="cbtn small" data-act="${act}" aria-pressed="${on}"><span class="round ${on ? "on" : ""}">${ic(icon, 26)}</span>${label}</button>`;

function vMissed() {
  return `<div class="page center">
    <img src="img/aoun-mark.png" class="mark" alt="">
    <h2>فاتتك مكالمة من ${A().name}</h2>
    <p class="muted">ولا يهمك. ${g("بتتصل", "بيتصل")} عليك مرة ثانية في وقت أنسب، أو تقدر ترجع الاتصال الحين.</p>
    <button class="btn" data-act="replay">${ic("phone", 20)} رجّع الاتصال</button>
    <button class="btn tinted" data-act="later">اتصلوا علي الساعة 7 المسا</button>
    ${S.later ? `<div class="ok">${ic("checkFill", 18)} تم، بنتصل عليك 7 المسا</div>` : ""}
    <p class="foot">ما نتصل أكثر من 3 مرات، ولا نتصل وقت صلاة الجمعة أو بعد 9:30 المسا.</p>
  </div>`;
}

const row = (icon, title, detail = "", extra = "") => `<div class="row"><span class="rowic">${ic(icon, 18)}</span><div class="rowt"><div>${esc(title)}</div>${detail ? `<small>${esc(detail)}</small>` : ""}</div>${extra}</div>`;
const step = (done, t, d) => `<div class="step">${ic(done ? "checkFill" : "circle", 24, done ? "ok" : "off")}<div><b>${esc(t)}</b><small>${esc(d)}</small></div></div>`;

function vHome() {
  const a = S.appt;
  return `<header class="lt"><img src="img/aoun-mark.png" class="hm" alt=""><div><h1>هلا ${esc(P().first)}</h1><p>نطمّنك، ونسهّل عليك، ونبقى معك لين تطمّن.</p></div></header>
    ${a.confirmed ? `<div class="card appt"><div class="eyebrow">${ic("cal", 18)} موعدك القادم <span class="tag">مؤكد</span></div><div class="title">${esc(a.test)}</div><div class="meta">${ic("clock", 17)} ${esc(a.when)}</div><div class="meta">${ic("cross", 17)} ${esc(a.place)}</div><div class="meta">${ic("check", 17)} ${esc(a.arranged)}</div></div>` : `<div class="card"><b>ما فيه موعد مؤكد بعد</b><p class="muted">${A().name} ${g("بتتصل", "بيتصل")} عليك وترتب لك موعد يناسبك.</p></div>`}
    <h3 class="sec">الخطوات</h3>
    <div class="list">${step(true, "المكالمة", `${A().name} ${g("فهمت", "فهم")} وش يناسبك`)}${step(a.confirmed, "الموعد", a.confirmed ? a.when : "بانتظار التأكيد")}${step(false, "التذكير", "قبل الموعد بيوم")}${step(false, "الطبيب يشوف النتيجة", "ويطمّنك بنفسه")}</div>
    <div class="card hero"><div class="ringstat">61%</div><div><b>61% من جيرانك فحصوا</b><small>كل فحص يقرّب حيّك من هدف 80%، وأنت جزء منه.</small></div></div>
    <button class="btn tinted" data-act="replay">${ic("replay", 20)} أعد تشغيل المكالمة</button>`;
}

function vNotebook() {
  const a = S.appt;
  const segs = ["مواعيدي", "فحوصاتي", "التذكيرات"];
  let body = "";
  if (S.seg === 0) body = `<div class="group"><div class="gh">القادمة</div><div class="list">${a.confirmed ? row("cal", a.test, `${a.when} · ${a.place}`) : `<div class="row"><span class="muted">ما فيه مواعيد مؤكدة بعد.</span></div>`}</div></div>`;
  else if (S.seg === 1) body = `<div class="group"><div class="list">${row("drop", "السكر التراكمي", "آخر مرة: قبل أكثر من سنة", '<span class="pill">مستحق</span>')}${row("heart", "ضغط الدم", "يُقاس في نفس الزيارة", '<span class="pill">مستحق</span>')}${row("sun", "فيتامين د", "اختياري بنفس السحبة", '<span class="pill soft">لاحقًا</span>')}</div><div class="gf">النتائج يشرحها لك الطبيب بنفسه. «عون» ما يفسّر النتائج.</div></div>`;
  else body = `<div class="group"><div class="list">${row("bell", "قبل الموعد بيوم", "رسالة ومكالمة قصيرة")}${row("car", "المشوار", "يوصلك تأكيد السيارة صباح الموعد")}</div></div>`;
  return `<header class="lt"><h1>دفتري</h1></header>
    <div class="seg">${segs.map((s, i) => `<button data-act="seg" data-v="${i}" class="${S.seg === i ? "on" : ""}">${s}</button>`).join("")}</div>${body}`;
}

function vAgent() {
  return `<div class="agenthero">${avatar(120)}<div class="brand big">${A().name}</div><p>${g("اسأليني", "اسألني")} عن موعدك، أو غيّر الوقت، أو ${g("خليني أشرح", "خلني أشرح")} لك الفحص بكلام بسيط.</p></div>
    <button class="btn" data-act="replay">${ic("phone", 20)} كلّم ${A().name} الحين</button>
    <div class="list" style="margin-top:14px">${row("globe", "8 لغات ولهجات", "نجدية، حجازية، أوردو، هندي، بنغالي، فلبيني، إندونيسي، إنجليزي")}${row("lock", "ما يطلب بيانات حساسة", "لا كلمة مرور ولا رمز تحقق ولا بيانات بنكية")}${row("cross", "حالة طارئة؟", `${A().name} ${g("تحوّلك", "يحوّلك")} فورًا لـ 997`)}</div>`;
}

function familyMeaning() {
  const f = S.family, parts = [];
  if (f.metabolic === "yes") parts.push("نبدأ لك فحص السكر التراكمي الحين بدل ما تنتظر عمر 35.");
  if (f.heart === "yes") parts.push("ونضيف فحص الكوليسترول.");
  if (f.cancer === "yes") parts.push("والطبيب يقرر معك متى يبدأ فحص الثدي أو القولون.");
  return parts.length ? parts.join(" ") : "خطتك ماشية حسب عمرك، وهذا تمام.";
}
function vFamily() {
  const f = S.family, flagged = Object.values(f).includes("yes");
  const node = (t, m, me) => `<span class="node ${me ? "me" : m ? "mk" : ""}">${t}</span>`;
  return `<header class="lt"><h1>عائلتي</h1></header>
    <div class="banner">${ic("lock", 18)}<span>معلوماتك تبقى عندك وعند طبيبك. ما نسأل عن أسماء أهلك ولا أرقامهم، ونحفظ فقط وش يعني هذا لفحوصاتك أنت.</span></div>
    <div class="gh">ثلاث أسئلة، كلها اختيارية</div>
    ${FAMILY_Q.map((q) => `<div class="card q"><div>${q.text}</div><div class="seg">${ANSWERS.map(([v, t]) => `<button data-act="fam" data-q="${q.id}" data-v="${v}" class="${f[q.id] === v ? "on" : ""}">${t}</button>`).join("")}</div></div>`).join("")}
    <div class="gh">وش يعني لك</div>
    <div class="card"><div class="tree" role="img" aria-label="${flagged ? "في تاريخ عائلي يغيّر خطة فحوصاتك" : "ما فيه تاريخ عائلي مسجّل"}">
      <div>${node("الأب", flagged)}${node("الأم", flagged)}</div><div>${node("أنت", false, true)}</div><div>${node("إخوانك", f.metabolic === "yes")}${node("عيالك", false)}</div></div>
      <p class="meaning">${familyMeaning()}</p></div>
    <div class="list"><button class="row link" data-act="invite"><span class="rowic">${ic("send", 18)}</span><div class="rowt"><div>ادعُ أحد من أهلك للفحص</div></div></button>
      <button class="row link danger" data-act="delfam"><span class="rowic">${ic("trash", 18)}</span><div class="rowt"><div>احذف معلومات العائلة</div></div></button></div>
    <div class="gf">الدعوة عامة وما تذكر أي مرض أو نتيجة، وما تنربط بملفك.</div>`;
}

const toggle = (act, on, label, sub = "") => `<div class="row"><div class="rowt"><div>${label}</div>${sub ? `<small>${sub}</small>` : ""}</div><button class="sw ${on ? "on" : ""}" role="switch" aria-checked="${on}" aria-label="${label}" data-act="${act}"><i></i></button></div>`;
function vAccess() {
  const opt = (v, t) => `<button class="row link" data-act="voice" data-v="${v}"><div class="rowt"><div>${t}</div></div>${S.voice === v ? `<span class="tick">✓</span>` : ""}</button>`;
  return `<header class="lt"><h1>الوصول</h1></header>
    <div class="gh">صوت المساعد</div><div class="list">${opt("auto", "تلقائي حسب صوتك")}${opt("female", "رفيدة (صوت امرأة)")}${opt("male", "رفيد (صوت رجل)")}</div>
    <div class="gh">القراءة والعرض</div><div class="list">
      <div class="row"><div class="rowt"><div>حجم الخط</div></div><div class="stepper"><button data-act="ts" data-v="-1" aria-label="تصغير">ع-</button><span>${Math.round(S.textScale * 100)}%</span><button data-act="ts" data-v="1" aria-label="تكبير">ع+</button></div></div>
      ${toggle("tcaps", S.captions, "نص المكالمة", "كل كلمة تنقال تظهر مكتوبة")}
      ${toggle("contrast", S.contrast, "تباين عالي", "خلفية سوداء ولون أصفر واضح")}
      ${toggle("simple", S.simple, "الوضع المبسّط", "أزرار أكبر وخطوة وحدة في كل شاشة")}</div>
    <div class="gh">المكالمة</div><div class="list">${toggle("live", S.live, "الوكيل الحي (ElevenLabs)", "إذا أطفأته، تشتغل المكالمة كعرض بدون إنترنت بصوت الجهاز")}</div>
    <div class="gh">الخصوصية</div><div class="list">${row("seal", "كل مكالمة موثّقة من وزارة الصحة")}${row("hand", "ما نطلب كلمة مرور أو رمز تحقق أو بيانات بنكية")}${row("shield", "ما نحفظ بيانات أهلك")}</div>
    <p class="foot">عون · نموذج أولي لهاكثون agentX · مسار وزارة الصحة</p>`;
}

function vTabs() {
  const tabs = [["home", "house", "الرئيسية"], ["nb", "book", "دفتري"], ["agent", null, A().name], ["fam", "family", "عائلتي"], ["acc", "access", "الوصول"]];
  const body = { home: vHome, nb: vNotebook, agent: vAgent, fam: vFamily, acc: vAccess }[S.tab]();
  return `<div class="app"><main class="scroll" id="scroll">${body}</main>
    <nav class="tabbar">${tabs.map(([k, icn, t]) => `<button data-act="tab" data-v="${k}" class="${S.tab === k ? "on" : ""}">${icn ? ic(icn, 24) : `<img src="${A().img}" class="tabav" alt="">`}<span>${t}</span></button>`).join("")}</nav></div>`;
}

function vSheet() {
  if (!S.sheet) return "";
  let inner = "";
  if (S.sheet === "booked") {
    const a = S.appt;
    inner = `<div class="center">${ic("checkFill", 58, "ok big")}<h2>تم، موعدك مؤكد</h2></div>
      <div class="list">${row("cross", a.test)}${row("clock", a.when)}${row("pin", a.place)}${row("check", a.arranged)}</div>
      <p class="muted center">يوصلك تذكير قبلها بيوم. و${A().name} ${g("متابعة", "متابع")} معك لين يشوف الطبيب النتيجة.</p>
      <button class="btn" data-act="close">تمام</button>`;
  } else if (S.sheet === "invite") {
    inner = `<h2>دعوة أهلك للفحص</h2><p class="muted">أنت تختار مين. الرسالة عامة وما تذكر أي مرض أو نتيجة، وكل واحد يقرر بنفسه.</p>
      <div class="seg">${Object.entries(RELS).map(([k, [t]]) => `<button data-act="rel" data-v="${k}" class="${S.rel === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="gh">معاينة الرسالة</div><div class="msg">${invite(S.rel)}</div>
      <div class="list">${toggle("consent", S.consent, "أوافق نرسل له هذي الرسالة العامة")}</div>
      ${S.sent ? `<div class="ok">${ic("checkFill", 18)} تم. كل واحد يقرر بنفسه، وملفه منفصل عن ملفك.</div>` : ""}
      <button class="btn" data-act="send" ${S.consent ? "" : "disabled"}>${ic("send", 18)} أرسل الدعوة</button>
      <button class="btn tinted" data-act="close">إغلاق</button>`;
  } else if (S.sheet === "delfam") {
    inner = `<h2>نحذف إجاباتك عن العائلة؟</h2><p class="muted">تقدر تجاوب مرة ثانية متى ما بغيت.</p>
      <button class="btn destructive" data-act="dodel">احذف</button><button class="btn tinted" data-act="close">إلغاء</button>`;
  }
  const fresh = S.sheet !== S._prevSheet ? " new" : "";
  return `<div class="scrim${fresh}" data-act="close"></div><div class="sheet${fresh}" role="dialog"><div class="grab"></div>${inner}</div>`;
}

/* ---------------- render & events ---------------- */
const root = document.getElementById("root");
function render() {
  document.documentElement.classList.toggle("hc", S.contrast);
  document.documentElement.classList.toggle("simple", S.simple);
  document.documentElement.style.setProperty("--ts", S.textScale);
  const keepScroll = document.getElementById("scroll")?.scrollTop || 0;
  const v = S.stage === "ring" ? vRing() : S.stage === "live" ? vLive() : S.stage === "missed" ? vMissed() : vTabs();
  root.innerHTML = v + vSheet();
  C.offerShown = C.phase === "offer";
  S._prevSheet = S.sheet;
  const sc = document.getElementById("scroll"); if (sc && S._sameTab) sc.scrollTop = keepScroll;
  const caps = document.getElementById("caps"); if (caps) caps.scrollTop = caps.scrollHeight;
  S._sameTab = true;
}
function updateWave() { const w = document.getElementById("wave"); if (w) w.classList.toggle("on", C.speaking); const st = document.getElementById("status"); if (st) st.textContent = statusText(); }

root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const v = b.dataset.v;
  switch (b.dataset.act) {
    case "person": S.person = v; store.set("person", v); S.appt = { ...P().appt, confirmed: false }; break;
    case "answer": return answer();
    case "decline": return decline();
    case "hangup": return finishCall();
    case "mic": return toggleMic();
    case "spk": return toggleSpeaker();
    case "caps": case "tcaps": S.captions = !S.captions; store.set("captions", S.captions); break;
    case "confirm": return onConfirm();
    case "other": return onOther();
    case "offline": S.live = false; store.set("live", false); stopAll().then(answer); return;
    case "replay": stopAll(); S.sheet = null; S.stage = "ring"; S.later = false; break;
    case "later": S.later = true; break;
    case "tab": S.tab = v; S._sameTab = false; break;
    case "seg": S.seg = +v; break;
    case "fam": S.family[b.dataset.q] = v; store.set("family", S.family); break;
    case "invite": S.sheet = "invite"; S.consent = false; S.sent = false; break;
    case "delfam": S.sheet = "delfam"; break;
    case "dodel": S.family = { metabolic: "skip", heart: "skip", cancer: "skip" }; store.set("family", S.family); S.sheet = null; break;
    case "rel": S.rel = v; S.sent = false; break;
    case "consent": S.consent = !S.consent; break;
    case "send":
      if (navigator.share) navigator.share({ text: invite(S.rel) }).then(() => { S.sent = true; render(); }).catch(() => {});
      else { S.sent = true; }
      break;
    case "close": S.sheet = null; break;
    case "voice": S.voice = v; store.set("voice", v); break;
    case "contrast": S.contrast = !S.contrast; store.set("contrast", S.contrast); break;
    case "simple": S.simple = !S.simple; store.set("simple", S.simple); break;
    case "live": S.live = !S.live; store.set("live", S.live); break;
    case "ts": S.textScale = Math.min(1.4, Math.max(0.85, +(S.textScale + 0.1 * +v).toFixed(2))); store.set("textScale", S.textScale); break;
  }
  render();
});

try { speechSynthesis.getVoices(); } catch {}
render();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
