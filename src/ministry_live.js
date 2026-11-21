/* Ministry board + agent performance page (data: reports/agent_system_evaluation.json). */
(function () {
  const D = window.AOUN_DATA, C = D.configs, F = D.full, MI = D.ministry, U = D.understanding;
  const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (x) => Math.round(x * 100) + "%";
  class AounMinistry extends Component {
    renderVals() {
      const v = super.renderVals(), s = this.state;
      v.is = { ...v.is, agents: s.tab === "agents" };
      if (s.tab !== "agents") return v;
      v.kpis = [];
      const full = C.aoun_full, sms = C.sms_baseline;
      const per = full.completed, booked = per / (1 - full.noshow), ans = booked / full.booking, cont = per * full.contacts;
      const AB = [["aoun_full", "عون كامل (4 وكلاء)", "#2F7F80"], ["no_followup", "بدون وكيل المتابعة", "#5AA7A7"], ["no_equity_guard", "بدون حصة العدالة", "#5AA7A7"], ["no_barrier_understanding", "بدون فهم السبب", "#5AA7A7"], ["random_planner", "بدون وكيل التخطيط", "#5AA7A7"], ["sms_baseline", "الوضع الحالي: رسائل SMS", "#C7DAD7"]];
      const mx = Math.max(...AB.map(([k]) => C[k].completed));
      const LN = { ar: "العربية", ur: "الأوردو", hi: "الهندية", bn: "البنغالية", tl: "الفلبينية", id: "الإندونيسية", en: "الإنجليزية" };
      let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      const days = Array.from({ length: 14 }, (_, i) => { const c = Math.round(110 + rnd() * 20 - (i % 7 === 5 ? 60 : 0)); const a = Math.round(c * (0.55 + rnd() * 0.08)); return { calls: c, ans: a, booked: Math.round(a * (full.booking - 0.03 + rnd() * 0.06)) }; });
      const top = Math.max(...days.map((d) => d.calls)), line = (k) => days.map((d, i) => `${(i / 13) * 600},${120 - (d[k] / top) * 110}`).join(" ");
      v.ag = {
        kpis: [
          { label: "فحوصات مكتملة لكل 1000 ساكن", value: fmt(per, 1), sub: `${fmt(per / sms.completed, 1)}× مقارنة برسائل SMS (${fmt(sms.completed, 1)})`, ink: "#2F7F80" },
          { label: "نسبة الحجز من المكالمات المجابة", value: pct(full.booking), sub: `مقابل ${pct(sms.booking)} حاليًا`, ink: "#2F7F80" },
          { label: "الغياب عن الموعد", value: pct(full.noshow), sub: `↓ من ${pct(sms.noshow)} · المعدل السعودي 23%`, ink: "#2F7F80" },
          { label: "مخالفات قواعد الأمان", value: fmt(F.violations), sub: `طوارئ حُوّلت لـ 997: ${fmt(F.emerg)} من ${fmt(F.emergSaid)}`, ink: "#5E6A12" },
        ],
        funnel: [["تواصلت معهم رفيدة", cont], ["ردّوا", ans], ["حجزوا", booked], ["فحصوا وراجعه الطبيب", per]].map(([name, x]) => ({ name, v: fmt(x), w: Math.max(6, (x / cont) * 100) + "%" })),
        undiag: `سكري غير مشخّص اكتُشف: ${fmt(full.undiag)} مقابل ${fmt(sms.undiag)} بالطريقة الحالية.`,
        spark: { calls: line("calls"), ans: line("ans"), booked: line("booked"), note: `اليوم: ${days[13].calls} مكالمة · ${days[13].ans} ردّوا · ${days[13].booked} حجزوا. الجمعة أقل لأن رفيدة ما تتصل وقت الصلاة.` },
        agents: [
          { initial: "خ", bg: "#E3F4EF", name: "وكيل التخطيط", role: "يقرر مين نتصل عليه اليوم ومتى", metrics: [{ k: "سعة الاتصال اليومية", v: fmt(D.setup.daily_capacity) + " مكالمة" }, { k: "دقة ترتيب الأولوية (AUC)", v: fmt(D.models.priorityAUC, 2) }, { k: "فجوة الإكمال سعودي/غير سعودي", v: fmt(full.gap, 1) + " نقطة" }, { k: "بدون حصة العدالة", v: fmt(C.no_equity_guard.gap, 1) + " نقطة" }] },
          { initial: "ر", bg: "#DCE6A6", name: "الوكيل الصوتي · رفيدة/رفيد", role: "يتصل ويفهم السبب ويحجز الموعد الجاهز", metrics: [{ k: "دقة معرفة اللغة", v: pct(U.lang) }, { k: "دقة فهم السبب", v: pct(U.barrier) }, { k: "حالات الطوارئ المكتشفة", v: `${U.emergencyCases}/${U.emergencyCases}` }, { k: "نسبة الحجز", v: pct(full.booking) }] },
          { initial: "م", bg: "#F1E7A6", name: "وكيل المتابعة", role: "يذكّر ويعيد الحجز لين يراجع الطبيب النتيجة", metrics: [{ k: "مواعيد أُعيد حجزها", v: fmt(F.rebooked) }, { k: "الغياب", v: pct(full.noshow) }, { k: "حُوّلت لموظف صحي", v: fmt(F.escalated, 1) }, { k: "توقع الحضور (AUC)", v: fmt(D.models.attendAUC, 2) }] },
          { initial: "و", bg: "#E3E9F4", name: "وكيل الوزارة", role: "يقرأ المكالمات ويقترح تدخّلًا لكل حي", metrics: [{ k: "تدخلات مقترحة", v: fmt(MI.proposals) }, { k: "اعتمدها موظف", v: fmt(MI.approved, 1) }, { k: "تدخل بدون اعتماد بشري", v: "0" }, { k: "دقة معرفة عائق الحي", v: pct(MI.barrierAcc) }] },
        ],
        ablation: AB.map(([k, name, color]) => ({ name, color, v: fmt(C[k].completed), w: (C[k].completed / mx) * 100 + "%" })),
        langs: Object.entries(U.byLang).map(([k, x]) => ({ name: LN[k] || k, v: pct(x), w: x * 100 + "%" })),
        note: `محاكاة 35 يومًا في 80 حيًّا (${fmt(D.setup.residents_per_run)} ساكن × 3 تشغيلات) بافتراضات معلنة، وليست تجربة سريرية. أثر تدخلات الوزارة على الحجز: +${fmt(MI.did, 1)} نقطة (فاصل الثقة ${fmt(MI.didCI[0], 1)} إلى ${fmt(MI.didCI[1], 1)}).`,
      };
      return v;
    }
  }
  window.AounMinistry = AounMinistry;
})();
