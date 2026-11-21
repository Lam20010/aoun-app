/* Aoun live layer: runs on top of the original app design (Component).
   - The call: live ElevenLabs agent announces the ready appointment; confirm, or decline → reason → rebook.
   - Transport: Uber (pre-filled ride, confirmed in Uber) or Riyadh Metro (full plan + Darb ticket).
   - Location (with permission) → real neighborhood, nearest park / health center / metro.
   - In the app, the assistant bar is the live agent: it opens screens and changes settings.
   Offline demo (no internet / live off): the same flow plays with the phone's voice. */
(function () {
  const G = window.AounGeo, PL = window.AOUN_PLACES, DATA = window.AOUN_DATA;
  const AG = { f: { name: "رفيدة", id: "agent_2401m7x9pdtpfghakjnscgt90zsp" }, m: { name: "رفيد", id: "agent_1801m7x9q2tney5r6qh2erxg8rf7" } };
  const LS = {
    get(k, d) { try { const v = localStorage.getItem("aoun3." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("aoun3." + k, JSON.stringify(v)); } catch (e) {} },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith("aoun")).forEach((k) => localStorage.removeItem(k)); } catch (e) {} },
  };
  const DEMO_HOOD = { om: "النسيم", noura: "الملقا", rahim: "السلي" };
  const ALT_SLOTS = "مسائي بعد الدوام: الثلاثاء 7:30 المسا | طبيبة: الأربعاء 10 الصبح | زيارة منزلية: الأحد 11 الصبح | مترجم: نفس الموعد مع مترجم | عيادة متنقلة قريبة: انظر nearest_truck | بدون مشوار: arrange_transport (أوبر أو المترو)";
  const REASONS = [["time", "الوقت والدوام"], ["transport", "ما عندي مشوار"], ["fear", "خايف من الفحص"], ["female", "أبي طبيبة"]];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  class AounApp extends Component {
    constructor(props) {
      super(props);
      Object.assign(this.state, {
        live: LS.get("live", true), lv: [], lvPhase: null, lvSpeaking: false, ov: LS.get("ov", null), tr: LS.get("tr", null),
        appState: "off", realHood: LS.get("hood", null), nearKind: null, placesTick: 0, trSent: false,
      });
      this.places = null; this.conv = null; this.appConv = null;
      if (this.state.realHood) this.loadPlaces();
    }

    /* ---------- helpers ---------- */
    asst() { return this._v && this._v.asstM ? AG.m : AG.f; }
    g(f, m) { return this.asst() === AG.f ? f : m; }
    home() {
      if (this.state.realHood) return this.state.realHood;
      const name = (this._v && this._v.myHood && this._v.myHood.name) || DEMO_HOOD[this.state.persona] || "النسيم";
      const d = (DATA.riyadh || []).find((x) => x.ar.includes(name)) || (DATA.riyadh || [])[0];
      return { lat: d.lat, lng: d.lon, name: d.ar.replace(/^حي /, ""), pct: Math.round(d.completion * 100), gap: d.gap, demo: true };
    }
    loadPlaces() {
      const h = this.home();
      this.places = G.localPlaces(h, PL);
      this.setState({ placesTick: Date.now() });
      G.overpass(h).then((live) => {
        if (live.parks.length) this.places.parks = live.parks;
        if (live.centers.length) this.places.center = live.centers[0];
        this.places.live = true; this.setState({ placesTick: Date.now() });
      }).catch(() => {});
    }
    familyText() {
      const nodes = (this._v && this._v.tree) || [];
      const parts = nodes.filter((n) => n && n.tag && n.rel && !/بصحت|بياناتك/.test(n.tag)).map((n) => `${n.rel}: ${n.tag}`);
      return parts.length ? parts.join("؛ ") : "لم يشارك شيئًا";
    }
    familyMetabolic() { return /سكري|ضغط/.test(this.familyText()); }
    describe(kind) {
      const p = this.places || G.localPlaces(this.home(), PL);
      if (kind === "park" && p.parks[0]) return `أقرب حديقة: ${p.parks[0].name}، ${G.walkMin(p.parks[0].km)} دقيقة مشي.`;
      if (kind === "mobile_clinic" && p.trucks[0]) return `${p.trucks[0].name}، ${G.fmtKm(p.trucks[0].km)} منك، ${p.trucks[0].hours}.`;
      if (kind === "health_center" && p.center) return `${p.center.name}، ${G.fmtKm(p.center.km)} منك.`;
      if (kind === "metro" && p.stations[0]) return `أقرب محطة مترو: ${p.stations[0].ar}، ${G.walkMin(p.stations[0].km)} دقيقة مشي.`;
      return `حيّك: ${this.home().name}.`;
    }
    openMaps(pt, mode) { if (pt) window.open(G.appleDir(this.home(), pt, mode || "w"), "_blank"); }

    /* ---------- location (asked with permission) ---------- */
    askLocation() {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(false);
        this.setState({ loc: "locating" });
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude, lng = pos.coords.longitude;
          let best = null, bd = 1e9; for (const d of DATA.riyadh || []) { const k = G.km(lat, lng, d.lat, d.lon); if (k < bd) { bd = k; best = d; } }
          const hood = best && bd < 8 ? { lat, lng, name: best.ar.replace(/^حي /, ""), pct: Math.round(best.completion * 100), gap: best.gap } : { lat, lng, name: "منطقتك", pct: null, gap: "" };
          LS.set("hood", hood); this.setState({ realHood: hood, loc: "found" }); this.loadPlaces(); resolve(true);
        }, () => { this.setState({ loc: "found" }); if (!this.places) this.loadPlaces(); resolve(false); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 });
      });
    }

    /* ---------- transport ---------- */
    makeTransport(option) {
      const h = this.home(); if (!this.places) this.places = G.localPlaces(h, PL);
      const c = this.places.center || G.fakeCenter(h);
      let tr, say;
      if (option === "uber") {
        const km = G.km(h.lat, h.lng, c.lat, c.lng), min = Math.max(6, Math.round((km / 28) * 60) + 4);
        tr = { option, km, min, dest: c.name, from: h.name, link: G.uberLink(h, c) };
        say = `جهّزت رحلة أوبر من ${h.name} إلى ${c.name}، حوالي ${min} دقيقة. اضغط «أكّد في أوبر» على الشاشة.`;
      } else {
        const plan = G.metroPlan(h, c, PL);
        if (!plan) { const d = G.km(h.lat, h.lng, c.lat, c.lng); return d < 2.5 ? `المركز قريب منك، ${G.walkMin(d)} دقيقة مشي. تحب أوبر بدال المشي؟` : "ما فيه محطة مترو قريبة منك، الأفضل أوبر أو العيادة المتنقلة."; }
        tr = { option, plan, dest: c.name, gmaps: G.transitLink(h, c) };
        say = `خطة المترو: امشِ ${plan.walk1} دقائق لمحطة ${plan.from.ar}، ثم ${plan.legs.map((l) => `${l.line.ar} ${l.stops} محطات`).join(" ثم ")}، وامشِ ${plan.walk2} دقائق للمركز. حوالي ${plan.total} دقيقة.`;
      }
      LS.set("tr", tr); this.setState({ tr, trSent: false });
      return say;
    }
    trVals() {
      const t = this.state.tr; if (!t) return { show: false };
      if (t.option === "uber") return { show: true, kicker: "Uber · رحلة جاهزة", title: `من ${t.from} إلى ${t.dest}`,
        lines: [{ color: "#BAC94A", text: "الاستلام قبل الموعد بـ 30 دقيقة" }, { color: "#6C8CBF", text: `حوالي ${t.min} دقيقة · ${G.fmtKm(t.km)}` }],
        href: t.link, cta: this.state.trSent ? "✓ أُرسلت لأوبر" : "أكّد في أوبر", ctaBg: "#000000", go: () => this.setState({ trSent: true }), has2: false,
        note: "يفتح تطبيق أوبر والرحلة معبّأة، والتأكيد النهائي يكون فيه." };
      const p = t.plan;
      return { show: true, kicker: "مترو الرياض · خطة كاملة", title: `${p.total} دقيقة إلى ${t.dest}`,
        lines: [{ color: "#96D7C6", text: `امشِ ${p.walk1} د إلى محطة ${p.from.ar}` }].concat(p.legs.map((l) => ({ color: l.line.color, text: `${l.line.ar} · ${l.stops} محطات إلى ${l.to.ar}` }))).concat([{ color: "#96D7C6", text: `امشِ ${p.walk2} د إلى ${t.dest}` }]),
        href: "https://apps.apple.com/sa/app/id1549817739", cta: "التذكرة في تطبيق «درب»", ctaBg: "#2F7F80", go: () => {}, has2: true, href2: t.gmaps, cta2: "الخطة في الخرائط",
        note: "محطات وخطوط مترو الرياض من بيانات الهيئة الملكية المفتوحة." };
    }

    /* ---------- the live agent ---------- */
    dyn(mode) {
      const v = this._v || {}, P = v.persona || {}, h = this.home(), t = (this.places || {}).trucks || [];
      const first = ((v.acct && v.acct.name) || "").split(" ")[0] || "";
      return {
        opening: mode === "call" ? this.opening() : `هلا ${first}! أنا ${this.asst().name}، معك في التطبيق. قول لي وش تبي، مثلًا: افتح دفتري، أو وين أقرب حديقة؟`,
        mode, user_name: first, test: P.test || "", slot_when: P.when || "", place: P.where || "", arranged: P.extra || "",
        appt_status: this.state.booked ? "مؤكد" : "بانتظار التأكيد",
        home_area: this.state.realHood ? h.name : `${h.name} (تقريبي، ما سمح بالموقع بعد)`,
        nearest_truck: t[0] ? `${t[0].name}، ${G.fmtKm(t[0].km)}، ${t[0].hours}` : "لا يوجد",
        family_history: this.familyText(), alt_slots: ALT_SLOTS,
      };
    }
    opening() {
      const v = this._v || {}, P = v.persona || {}, a = this.asst();
      if (this.state.persona === "rahim") return `السلام علیکم رحیم بھائی! میں وزارتِ صحت کے «عون» سے ${a === AG.f ? "رفیدہ" : "رفید"} بات کر رہی ہوں۔ آپ کا شوگر اور بلڈ پریشر کا مفت چیک اپ جمعہ صبح 10 بجے تیار ہے۔ کیا میں کنفرم کر دوں؟`;
      const name = ((v.acct && v.acct.name) || "").split(" ")[0];
      return `هلا والله${name ? " يا " + name : ""}! معك ${a.name} من «عون» التابع لوزارة الصحة. جهّزت لك موعد ${P.test} ${P.when} في ${P.where}. يناسبك نأكّده؟`;
    }
    tools(mode) {
      return {
        book_ready_appointment: async () => { this.confirmed(mode); return `booked: ${this._v.persona.test}, ${this._v.persona.when}`; },
        book_appointment: async ({ when, place, arrangement } = {}) => {
          const ov = { ...(this.state.ov || {}) }; if (when) ov.when = when; if (place) ov.where = place; if (arrangement) ov.extra = arrangement;
          LS.set("ov", ov); this.setState({ ov }); this.confirmed(mode, 12000); return `booked: ${ov.when || ""} ${ov.where || ""}`;
        },
        arrange_transport: async ({ option } = {}) => { if (!this.state.realHood) await this.askLocation(); return this.makeTransport(option === "metro" ? "metro" : "uber"); },
        show_on_map: async ({ place } = {}) => {
          if (!this.state.realHood) await this.askLocation();
          const kind = place === "mobile_clinic" ? "truck" : place === "health_center" ? "center" : place === "metro" ? "metro" : "park";
          this.setState({ nearKind: kind, ...(mode === "app" ? { screen: "home", voiceOpen: false } : {}) });
          return this.describe(place);
        },
        open_screen: async ({ screen } = {}) => {
          const m = { home: { screen: "home" }, notebook: { screen: "notebook", page: 0 }, family: { screen: "family" }, map: { screen: "home" }, settings: { screen: "access" }, appointment: { screen: "booked" } };
          this.setState({ ...(m[screen] || m.home), voiceOpen: false }); return "opened";
        },
        change_setting: async ({ setting, on } = {}) => {
          if (setting === "larger_text") this.setState({ large: true }); else if (setting === "smaller_text") this.setState({ large: false });
          else if (setting === "high_contrast") this.setState({ contrast: !!on });
          return "done";
        },
      };
    }
    async session(mode, cb) {
      const El = window.AounEL;
      const opts = (connectionType) => ({ agentId: this.asst().id, connectionType, dynamicVariables: this.dyn(mode), clientTools: this.tools(mode), ...cb });
      try { return await El.Conversation.startSession(opts("webrtc")); } catch (e) { return await El.Conversation.startSession(opts("websocket")); }
    }
    async mic() { try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach((t) => t.stop()); return true; } catch (e) { return false; } }

    /* ---------- the call ---------- */
    startCall() {
      this.stopCall();
      if (!this.places) this.loadPlaces();
      this.setState({ callStage: "live", callStep: 0, callSec: 0, callOk: false, callAlt: false, lv: [], lvPhase: "connecting", ov: null, tr: null, trSent: false });
      LS.set("ov", null); LS.set("tr", null);
      this.ctT = setInterval(() => this.setState({ callSec: this.state.callSec + 1 }), 1000);
      if (this.state.live) this.liveCall(); else this.offline();
    }
    async liveCall() {
      if (!(await this.mic())) { this.push("r", "اسمح للمايكروفون عشان نتكلم. أو أطفئ «الوكيل الحي» من الوصول وجرّب العرض بدون إنترنت."); return this.setState({ lvPhase: "offer" }); }
      try {
        this.conv = await this.session("call", {
          onConnect: () => this.setState({ lvPhase: "talking" }),
          onDisconnect: () => { this.conv = null; if (this.state.callStage === "live") this.endCall(!!this.state.callOk); },
          onModeChange: ({ mode }) => this.setState({ lvSpeaking: mode === "speaking" }),
          onMessage: (m) => { const t = (m.message || "").trim(); if (!t) return; this.push((m.role || (m.source === "ai" ? "agent" : "user")) === "agent" ? "r" : "u", t); if (this.state.lvPhase === "talking") this.setState({ lvPhase: "offer" }); },
          onError: (e) => console.warn("agent", e),
        });
      } catch (e) { this.push("r", "ما قدرنا نوصل للوكيل الحي الحين، كمّلنا بالعرض بدون إنترنت."); this.offline(true); }
    }
    push(who, text, sub) { this.setState({ lv: this.state.lv.concat([[who, text, sub || ""]]) }); }
    confirmed(mode, ms) {
      if (mode === "app") { this.setState({ booked: true }); return; }
      this.setState({ callOk: true, booked: true, lvPhase: "done" });
      clearTimeout(this.ceT); this.ceT = setTimeout(() => this.endCall(true), ms || 8000);
    }
    tapConfirm() {
      if (this.conv) { try { this.conv.sendUserMessage("إيه، أكّد الموعد."); } catch (e) {} this.confirmed("call", 9000); }
      else this.offConfirm();
    }
    tapDecline() {
      if (this.conv) { try { this.conv.sendUserMessage("لا، ما يناسبني."); } catch (e) {} this.setState({ lvPhase: "talking" }); setTimeout(() => this.state.lvPhase === "talking" && this.setState({ lvPhase: "offer" }), 6000); }
      else this.offDecline();
    }
    endConv() { const c = this.conv; this.conv = null; if (c) { try { c.endSession(); } catch (e) {} } }
    stopCall() { super.stopCall(); this.offCancel = true; this.endConv(); }
    endCall(ok) {
      super.endCall(ok);
      if (ok && !this.state.realHood) this.setState({ needLoc: true });
    }

    /* offline: same flow, phone voice */
    async say(who, text, sub) {
      if (this.offCancel) throw 0;
      this.push(who, text, sub);
      if (who === "r") {
        this.setState({ lvSpeaking: true });
        await new Promise((res) => { try { if (this.state.callMute || !this.state.callSpk) return setTimeout(res, 1200 + text.length * 40);
          const u = new SpeechSynthesisUtterance(text); u.lang = /[ٹڈڑںھہے]/.test(text) ? "ur-PK" : "ar-SA"; u.rate = 0.95; u.onend = u.onerror = res; speechSynthesis.speak(u); setTimeout(res, 2500 + text.length * 110); } catch (e) { res(); } });
        this.setState({ lvSpeaking: false });
      } else await wait(700 + text.length * 30);
      await wait(250);
    }
    async offline(already) {
      this.offCancel = false;
      try {
        if (!already) await this.say("u", this.state.persona === "rahim" ? "ہیلو؟" : "ألو؟", this.state.persona === "rahim" ? "ألو؟" : "");
        await this.say("r", this.opening(), this.state.persona === "rahim" ? "جهّزت لك فحص السكر والضغط الجمعة 10 الصبح. أأكّده؟" : "");
        this.setState({ lvPhase: "offer" });
      } catch (e) {}
    }
    async offConfirm() {
      try {
        this.setState({ lvPhase: "closing" }); await this.say("u", "إيه، أكّده الله يجزاك خير."); this.setState({ callOk: true, booked: true });
        await this.say("r", `تم! يوصلك تذكير قبلها بيوم، وأنا ${this.g("متابعة", "متابع")} معك لين يشوف الطبيب النتيجة.`);
        if (this.familyMetabolic()) await this.say("r", "وبما إن في عائلتك سكري أو ضغط، حطيت لك أقرب حديقة في التطبيق عشان مشي 20 دقيقة يوميًا.");
        this.setState({ lvPhase: "done" }); clearTimeout(this.ceT); this.ceT = setTimeout(() => this.endCall(true), 1800);
      } catch (e) {}
    }
    async offDecline() {
      try { this.setState({ lvPhase: "talking" }); await this.say("u", "لا، ما يناسبني."); await this.say("r", "ولا يهمك أبد. وش أكثر شي مصعّبها عليك؟"); this.setState({ lvPhase: "reasons" }); } catch (e) {}
    }
    async offReason(k, label) {
      try {
        this.setState({ lvPhase: "talking" }); await this.say("u", label);
        const t = (this.places || {}).trucks || [];
        if (k === "transport") { await this.say("r", `ولا يهمك! تحب أحجز لك أوبر من البيت للمركز، ولا أجهز لك خطة المترو؟${t[0] ? ` وفيه عيادة متنقلة ${G.fmtKm(t[0].km)} منك.` : ""}`); return this.setState({ lvPhase: "transport" }); }
        const S = { time: [{ when: "الثلاثاء 7:30 المسا", extra: "موعد مسائي بعد الدوام" }, "ولا يهمك، رتّبت لك موعد مسائي: الثلاثاء 7:30 المسا. يناسبك؟"],
          fear: [{ extra: "مع طبيبة هادئة · الفحص دقيقتين" }, "أفهمك، بس الفحص بسيط: نقطة دم ودقيقتين وتطمّن. رتّبت لك نفس الموعد مع طبيبة هادئة. يناسبك؟"],
          female: [{ when: "الأربعاء 10 الصبح", extra: "مع طبيبة" }, "أبشر، الأربعاء 10 الصبح مع طبيبة. يناسبك؟"] }[k];
        const ov = { ...(this.state.ov || {}), ...S[0] }; LS.set("ov", ov); this.setState({ ov });
        await this.say("r", S[1]); this.setState({ lvPhase: "offer" });
      } catch (e) {}
    }
    async offTransport(k, label) {
      try {
        this.setState({ lvPhase: "talking" }); await this.say("u", label);
        if (k === "truck") { const t = this.places.trucks[0]; const ov = { ...(this.state.ov || {}), where: t.name, when: t.when, extra: "قريبة من بيتك" }; LS.set("ov", ov); this.setState({ ov }); await this.say("r", `ممتاز، ${t.name}، ${G.fmtKm(t.km)} منك، ${t.when}. يناسبك؟`); return this.setState({ lvPhase: "offer" }); }
        if (!this.state.realHood) await this.askLocation();
        const msg = this.makeTransport(k); const ov = { ...(this.state.ov || {}), extra: k === "uber" ? "أوبر ذهاب وعودة" : "خطة المترو" }; LS.set("ov", ov); this.setState({ ov });
        await this.say("r", msg + " يناسبك نأكّد الموعد؟"); this.setState({ lvPhase: "offer" });
      } catch (e) {}
    }

    /* ---------- the assistant inside the app ---------- */
    async toggleApp() {
      if (this.appConv || this.state.appState === "connecting") { const c = this.appConv; this.appConv = null; this.setState({ appState: "off", caption: null }); if (c) { try { await c.endSession(); } catch (e) {} } return; }
      this.setState({ appState: "connecting", voiceOpen: false });
      if (!(await this.mic())) { this.setState({ appState: "off", caption: "اسمح للمايكروفون عشان تكلّم " + this.asst().name }); return; }
      try {
        this.appConv = await this.session("app", {
          onConnect: () => this.setState({ appState: "listening" }),
          onDisconnect: () => { this.appConv = null; this.setState({ appState: "off" }); },
          onModeChange: ({ mode }) => this.setState({ appState: mode === "speaking" ? "speaking" : "listening" }),
          onMessage: (m) => { if ((m.role || (m.source === "ai" ? "agent" : "user")) === "agent") { clearTimeout(this.capT); this.setState({ caption: m.message }); this.capT = setTimeout(() => this.setState({ caption: null }), 7000); } },
          onError: (e) => console.warn("app agent", e),
        });
      } catch (e) { this.setState({ appState: "off", caption: "ما قدرنا نوصل لـ" + this.asst().name + " الحين." }); }
    }

    /* ---------- values for the design ---------- */
    renderVals() {
      const v = super.renderVals(); this._v = v;
      const s = this.state, self = this;
      if (s.ov) v.persona = { ...v.persona, ...(s.ov.when ? { when: s.ov.when } : {}), ...(s.ov.where ? { where: s.ov.where } : {}), ...(s.ov.extra ? { extra: s.ov.extra } : {}) };

      // the call
      const c = v.call;
      if (c.live) {
        c.msgs = s.lv.map((m) => ({ text: m[1], sub: m[2], hasSub: !!m[2], who: m[0] === "u" ? "أنت" : this.asst().name,
          justify: m[0] === "u" ? "flex-start" : "flex-end", bg: m[0] === "u" ? "rgba(255,255,255,.14)" : "#FFFFFF", color: m[0] === "u" ? "#FFFFFF" : "#173F42" })).reverse();
        c.known = s.lv.some((m) => m[0] === "r"); c.unknown = !c.known; c.who1 = c.known ? this.asst().name : "عون";
        c.speaking = !!s.lvSpeaking; c.when = v.persona.when;
        c.showCard = !s.callOk && s.lvPhase === "offer"; c.canAlt = true; c.altLabel = "ما يناسبني"; c.confirmLabel = "أكّد الموعد";
        c.confirm = () => this.tapConfirm(); c.alt = () => this.tapDecline();
        c.endedNote = !!s.callOk && s.lvPhase === "done";
        c.hasChips = !this.conv && (s.lvPhase === "reasons" || s.lvPhase === "transport");
        const trucks = (this.places || {}).trucks || [];
        c.chips = s.lvPhase === "reasons" ? REASONS.map(([k, l]) => ({ label: l, run: () => this.offReason(k, l) }))
          : [["uber", "أوبر"], ["metro", "المترو"]].concat(trucks[0] ? [["truck", "العيادة المتنقلة"]] : []).map(([k, l]) => ({ label: l, run: () => this.offTransport(k, l) }));
        c.ctrls = (c.ctrls || []).slice(0, 2);
        if (c.ctrls[0]) c.ctrls[0].run = () => { const on = !s.callMute; try { speechSynthesis.cancel(); this.conv && this.conv.setMicMuted(on); } catch (e) {} this.setState({ callMute: on }); };
        if (c.ctrls[1]) c.ctrls[1].run = () => { const on = !s.callSpk; try { speechSynthesis.cancel(); this.conv && this.conv.setVolume({ volume: on ? 1 : 0 }); } catch (e) {} this.setState({ callSpk: on }); };
        c.hang = () => this.endCall(!!s.callOk);
      }
      v.tr = this.trVals();

      // the neighborhood (real when location is allowed)
      const h = this.home();
      if (s.realHood) v.myHood = { ...v.myHood, name: h.name, city: "الرياض", pct: h.pct == null ? v.myHood.pct : h.pct, pctW: (h.pct == null ? v.myHood.pct : h.pct) + "%", gap: h.gap || v.myHood.gap };
      v.allowLoc = () => this.askLocation();
      v.startAgent = () => this.setState({ screen: "home" });
      const p = this.places;
      if (p) {
        const kind = s.nearKind || (this.familyMetabolic() ? "park" : (p.trucks[0] ? "truck" : "park"));
        const pt = kind === "truck" ? p.trucks[0] : kind === "center" ? p.center : kind === "metro" ? p.stations[0] : p.parks[0];
        if (pt) {
          const nm = pt.name || pt.ar, km = pt.km;
          v.near = { ...v.near, place: nm,
            title: kind === "park" ? `مشي 20 دقيقة في ${nm}` : kind === "truck" ? "عيادة فحص متنقلة قريبة منك" : kind === "metro" ? `أقرب محطة مترو: ${nm}` : `مركزك الصحي: ${nm}`,
            why: kind === "park" ? (this.familyMetabolic() ? "لأن في عائلتك سكري أو ضغط، المشي اليومي يحميك. هذي أقرب حديقة لبيتك." : "أقرب حديقة لبيتك، ومشي يومي بسيط يفرق كثير.") : kind === "truck" ? "افحص بدون مشوار طويل وبدون إجازة." : "",
            walk: `${G.walkMin(km)} دقيقة مشي · ${G.fmtKm(km)}`, when: kind === "truck" ? pt.hours : kind === "park" ? "الأفضل الصبح أو بعد العصر" : "",
            go: () => this.openMaps(pt, kind === "center" ? "d" : "w") };
        }
      } else v.near = { ...v.near, go: () => window.open("https://maps.apple.com/?q=" + encodeURIComponent((v.near.place || "") + " " + (v.myHood.name || "")), "_blank") };

      // ask for the location after booking, before entering the app
      const goHome = v.goHome;
      v.goHome = () => { if (!s.realHood && s.screen === "booked") this.setState({ screen: "locate", loc: "ask" }); else goHome(); };

      // the assistant bar is the live agent
      if (s.live) {
        const st = s.appState, a = this.asst().name;
        v.toggleVoice = () => this.toggleApp();
        v.wake = () => this.toggleApp();
        v.listening = st !== "off";
        v.voiceText = st === "off" ? `اضغط وكلّم ${a}` : st === "connecting" ? "يتصل…" : st === "speaking" ? `${a} ${this.g("تتكلم", "يتكلم")}… اضغط للإيقاف` : `${a} ${this.g("تسمعك", "يسمعك")}… اضغط للإيقاف`;
        v.wakeTitle = st === "off" ? `اضغط وكلّم ${a}، مثلًا: «افتح دفتري»` : v.voiceText;
      }
      v.langChips = (v.langChips || []).filter((l) => !l.disabled);

      // privacy & settings
      v.priv = {
        title: "خصوصيتك",
        lines: ["موقعك يُستخدم بس لمعرفة حيّك وأقرب خدمة، ويبقى على جوالك.", "شجرة العائلة بدون أسماء، ومحفوظة عندك.", "ما نطلب أبدًا كلمة مرور أو رمز تحقق أو بيانات بنكية."],
        live: !!s.live, liveLabel: "الوكيل الحي بصوت حقيقي", track: s.live ? "#34C759" : "#CFE7E0", justify: s.live ? "flex-end" : "flex-start",
        toggleLive: () => { LS.set("live", !s.live); this.setState({ live: !s.live }); },
        delLabel: "احذف بياناتي من الجوال", del: () => { LS.clear(); this.places = null; this.setState({ realHood: null, ov: null, tr: null, booked: false, screen: "call", callStage: "ring", lv: [], loc: "ask" }); },
        ministry: "واجهة وزارة الصحة ←",
      };
      return v;
    }
  }
  window.AounApp = AounApp;
})();
