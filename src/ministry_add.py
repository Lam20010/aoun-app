import re
p='../dcsrc/Ministry.dc.html'; s=open(p,encoding='utf-8').read()
# 1) new tab
s=s.replace("['actions', 'التدخلات', 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z'],",
 "['actions', 'التدخلات', 'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z'], ['agents', 'أداء الوكلاء', 'M12 8a4 4 0 1 0 0-.01M4 21c0-4 4-7 8-7s8 3 8 7M19 4l1.5 1.5L23 3'],",1)
SEC='''style="background: rgba(255,255,255,.9); border-radius: 24px; padding: 18px; display: flex; flex-direction: column; gap: 10px"'''
page=f'''    <sc-if value="{{{{is.agents}}}}" hint-placeholder-val="{{{{ false }}}}">
      <div style="display: flex; flex-direction: column; gap: 18px">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px">
          <sc-for list="{{{{ag.kpis}}}}" as="k" hint-placeholder-count="4">
            <div style="background: rgba(255,255,255,.9); border-radius: 22px; padding: 16px; display: flex; flex-direction: column; gap: 4px">
              <span style="font-size: 13px; color: #4C6466">{{{{k.label}}}}</span>
              <b style="font-size: 30px; color: #173F42; font-variant-numeric: tabular-nums">{{{{k.value}}}}</b>
              <span style="font-size: 12px; font-weight: 700; color: {{{{k.ink}}}}">{{{{k.sub}}}}</span>
            </div>
          </sc-for>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px">
          <section {SEC}>
            <h2 style="margin: 0; font-size: 18px">رحلة كل 1000 ساكن</h2>
            <span style="font-size: 12px; color: #4C6466">من أول مكالمة إلى فحص راجعه الطبيب</span>
            <sc-for list="{{{{ag.funnel}}}}" as="f" hint-placeholder-count="4">
              <div style="display: grid; grid-template-columns: 150px minmax(0, 1fr) 60px; align-items: center; gap: 10px">
                <span style="font-size: 13px">{{{{f.name}}}}</span>
                <div style="height: 24px; background: #EEF5F4; border-radius: 7px; overflow: hidden"><div style="width: {{{{f.w}}}}; height: 24px; background: linear-gradient(90deg, #96D7C6, #2F7F80); border-radius: 7px"></div></div>
                <b style="font-size: 13px">{{{{f.v}}}}</b>
              </div>
            </sc-for>
            <span style="font-size: 12px; color: #4C6466">{{{{ag.undiag}}}}</span>
          </section>
          <section {SEC}>
            <h2 style="margin: 0; font-size: 18px">مكالمات رفيدة آخر 14 يوم</h2>
            <span style="font-size: 12px; color: #4C6466">مكالمات · ردّوا · حجزوا</span>
            <svg viewBox="0 0 600 120" preserveAspectRatio="none" style="width: 100%; height: 130px">
              <polyline points="{{{{ag.spark.calls}}}}" fill="none" stroke="#C7DAD7" stroke-width="3"></polyline>
              <polyline points="{{{{ag.spark.ans}}}}" fill="none" stroke="#6C8CBF" stroke-width="3"></polyline>
              <polyline points="{{{{ag.spark.booked}}}}" fill="none" stroke="#2F7F80" stroke-width="4"></polyline>
            </svg>
            <span style="font-size: 12px; color: #4C6466">{{{{ag.spark.note}}}}</span>
          </section>
        </div>
        <h2 style="margin: 4px 0 0; font-size: 18px">الوكلاء الأربعة</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px">
          <sc-for list="{{{{ag.agents}}}}" as="a" hint-placeholder-count="4">
            <section style="background: rgba(255,255,255,.9); border-radius: 22px; padding: 16px; display: flex; flex-direction: column; gap: 8px">
              <div style="display: flex; align-items: center; gap: 10px">
                <span style="width: 40px; height: 40px; border-radius: 12px; background: {{{{a.bg}}}}; color: #173F42; display: flex; align-items: center; justify-content: center; font-weight: 700">{{{{a.initial}}}}</span>
                <div style="display: flex; flex-direction: column; flex: 1"><b style="font-size: 15px">{{{{a.name}}}}</b><span style="font-size: 12px; color: #4C6466">{{{{a.role}}}}</span></div>
                <span style="font-size: 11px; font-weight: 700; background: #F2F5DC; color: #5E6A12; padding: 3px 9px; border-radius: 10px">يعمل</span>
              </div>
              <sc-for list="{{{{a.metrics}}}}" as="m" hint-placeholder-count="4">
                <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 13px; border-top: 1px dashed #D5E6EE; padding-top: 6px"><span style="color: #4C6466">{{{{m.k}}}}</span><b>{{{{m.v}}}}</b></div>
              </sc-for>
            </section>
          </sc-for>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px">
          <section {SEC}>
            <h2 style="margin: 0; font-size: 18px">كل وكيل له دور</h2>
            <span style="font-size: 12px; color: #4C6466">فحوصات مكتملة لكل 1000 ساكن عند إيقاف وكيل واحد</span>
            <sc-for list="{{{{ag.ablation}}}}" as="b" hint-placeholder-count="6">
              <div style="display: grid; grid-template-columns: 170px minmax(0, 1fr) 50px; align-items: center; gap: 10px">
                <span style="font-size: 13px">{{{{b.name}}}}</span>
                <div style="height: 14px; background: #EEF5F4; border-radius: 7px; overflow: hidden"><div style="width: {{{{b.w}}}}; height: 14px; background: {{{{b.color}}}}; border-radius: 7px"></div></div>
                <b style="font-size: 13px">{{{{b.v}}}}</b>
              </div>
            </sc-for>
          </section>
          <section {SEC}>
            <h2 style="margin: 0; font-size: 18px">فهم رفيدة حسب لغة الساكن</h2>
            <span style="font-size: 12px; color: #4C6466">على عبارات جديدة لم يُضبط عليها النظام</span>
            <sc-for list="{{{{ag.langs}}}}" as="l" hint-placeholder-count="7">
              <div style="display: grid; grid-template-columns: 110px minmax(0, 1fr) 50px; align-items: center; gap: 10px">
                <span style="font-size: 13px">{{{{l.name}}}}</span>
                <div style="height: 14px; background: #EEF5F4; border-radius: 7px; overflow: hidden"><div style="width: {{{{l.w}}}}; height: 14px; background: #5AA7A7; border-radius: 7px"></div></div>
                <b style="font-size: 13px">{{{{l.v}}}}</b>
              </div>
            </sc-for>
          </section>
        </div>
        <span style="font-size: 12px; color: #4C6466">{{{{ag.note}}}}</span>
      </div>
    </sc-if>

'''
s=s.replace('    <sc-if value="{{is.actions}}" hint-placeholder-val="{{ false }}">', page+'    <sc-if value="{{is.actions}}" hint-placeholder-val="{{ false }}">',1)
open(p,'w',encoding='utf-8').write(s); print('ok', s.count('is.agents'), s.count("'agents'"))
