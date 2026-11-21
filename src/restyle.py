"""Restyle the original Aoun design boards: new palette, iOS buttons, less detail, privacy.
Layout and content stay as designed; live features are added by live.js."""
import re

# ---- palette (teal #5AA7A7, mint #96D7C6, lime #BAC94A, yellow #E2D36B, blue #6C8CBF) ----
# Deeper shades of the same hues are used where text must stay readable (≥4.5:1).
APP_COLORS = {
    '#174963': '#2F7F80', '#256686': '#2F7F80', '#0D2B3D': '#173F42', '#0D2D3F': '#173F42', '#09202E': '#173F42', '#0E3043': '#173F42', '#0D2C3E': '#173F42',
    '#205E7D': '#3A7C7D', '#286C8C': '#3A7C7D', '#21607F': '#3A7C7D', '#2E7899': '#3A7C7D', '#2E7798': '#3A7C7D', '#3683A3': '#3A7C7D', '#276A8B': '#3A7C7D', '#2E7798': '#3A7C7D',
    '#2C7495': '#6C8CBF', '#337E9F': '#2F7F80', '#4F9FBD': '#5AA7A7', '#81C2D6': '#96D7C6', '#7ABED4': '#96D7C6', '#93CBDD': '#96D7C6',
    '#A9D6E6': '#CDEDE5', '#C3E5F2': '#D9F2EB', '#D3EDF7': '#D9F2EB', '#9ED1E1': '#BFE6DC',
    '#D8EFF9': '#E3F4EF', '#D7EEF9': '#E3F4EF', '#DDF0FA': '#E3F4EF', '#E7F4FD': '#EDF8F4', '#EFF8FF': '#EDF8F4', '#ECF6FE': '#EDF8F4', '#EAF5FD': '#EDF8F4',
    '#DEF1FA': '#E3F4EF', '#CBEAF5': '#D5EFE7', '#CAE9F5': '#D5EFE7', '#E1F2FB': '#E3F4EF', '#F0F8FF': '#F4FAF8', '#FAFCFF': '#FAFDFC', '#ADD8E6': '#CFE7E0',
    '#9FE0C1': '#D4DE7A', '#1A73E8': '#6C8CBF', '#3E8E3E': '#8A9B2E', '#D9603F': '#9A8A1F', '#F2C14E': '#E2D36B', '#FDE293': '#F1E7A6', '#C6E6BD': '#DCE6A6',
    '#E6F3FB': '#EDF8F4', '#FDE6DE': '#FBF5D6', '#B54A2C': '#8A7A10',
}
MIN_COLORS = {
    '#0B6E4F': '#2F7F80', '#0E8A63': '#3F8B8B', '#2FA37F': '#5AA7A7', '#08513A': '#1F5D5E', '#6CC29C': '#96D7C6', '#10241C': '#173F42',
    '#E8F5EF': '#E6F4F1', '#E3EEE9': '#E3F0EE', '#D4ECE2': '#D5EFE7', '#EEF3F0': '#EEF5F4', '#E1ECE6': '#E1EFEC', '#E3F3EC': '#E3F4EF', '#E5F4EC': '#E5F4F0',
    '#E6EFEA': '#E6F0EE', '#F2F8F5': '#F2F8F7', '#F4F8F6': '#F4F9F8', '#F7FBF9': '#F7FBFA', '#DCE9E2': '#DCEBE8', '#E3EEE8': '#E3F0ED', '#CBEAD9': '#CDEDE5',
    '#BFE8D6': '#C4EADF', '#BFE1D3': '#C4E3DC', '#CFE0D8': '#CFE2DF', '#C7D6CE': '#C7DAD7', '#B9C7C0': '#B9CBC8',
    '#4A5D54': '#4C6466', '#5C7066': '#5A7375', '#34493F': '#35494B', '#5B8DB8': '#6C8CBF', '#24507F': '#3D5F94',
    '#FFF4DE': '#FBF5D6', '#6B4405': '#6B5A08', '#F6DFAE': '#F1E7A6',
}

SYS_FONT = '-apple-system, BlinkMacSystemFont, "SF Arabic", "SF Pro Text", "IBM Plex Sans Arabic", system-ui, sans-serif'

IOS_CSS = """
<style>
  /* iOS feel: system font, press feedback, no web focus glow, smooth scroll */
  html, body { -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; }
  button, a.ios-btn { font-family: inherit !important; -webkit-appearance: none; touch-action: manipulation; transition: opacity .12s ease, transform .12s ease; }
  button:active, a.ios-btn:active { opacity: .55; }
  button:focus-visible, a.ios-btn:focus-visible { outline: 3px solid #96D7C6; outline-offset: 2px; }
  * { scrollbar-width: none; } *::-webkit-scrollbar { display: none; }
</style>
"""

def recolor(s, cmap):
    def rep(m):
        h = m.group(0).upper()
        return cmap.get(h, m.group(0))
    return re.sub(r'#[0-9A-Fa-f]{6}\b', rep, s)

def ios_buttons(s):
    """Primary buttons → iOS filled (radius 14, 50pt, semibold 17); bordered secondary → iOS gray-tinted."""
    def fix(m):
        tag = m.group(0)
        st = re.search(r'style="([^"]*)"', tag)
        if not st: return tag
        css = st.group(1)
        mh = re.search(r'min-height:\s*(\d+)px', css)
        if not mh or int(mh.group(1)) < 44 or 'border-radius: 26px' in css or 'flex: 0 0 52px' in css: return tag
        filled = re.search(r'background:\s*(#2F7F80|#173F42|\{\{t\.primary\}\}|\{\{hero\.ctaBg\}\}|#1E9E5A)', css) and 'border: none' in css
        bordered = re.search(r'border:\s*1(\.5)?px solid', css) and re.search(r'background:\s*(\{\{t\.card\}\}|#FFFFFF)', css)
        if 'transparent' in css and not filled: return tag
        new = re.sub(r'border-radius:\s*\d+px', 'border-radius: 14px', css)
        new = re.sub(r'font-weight:\s*\d+', 'font-weight: 600', new)
        if int(mh.group(1)) >= 48: new = re.sub(r'min-height:\s*\d+px', 'min-height: 50px', new)
        if bordered and 'aria-pressed' not in tag:
            new = re.sub(r'border:\s*1(\.5)?px solid [^;]+', 'border: none', new)
            new = re.sub(r'background:\s*(\{\{t\.card\}\}|#FFFFFF)', 'background: {{t.soft}}', new)
            new = re.sub(r'(?<![-\w])color:\s*(\{\{t\.ink\}\}|#[0-9A-F]{6})', 'color: {{t.primary}}', new)
        return tag.replace(css, new)
    return re.sub(r'<button[^>]*>', fix, s)

def restyle_app(src, dst):
    s = open(src, encoding='utf-8').read()
    # --- less detail ---
    s = re.sub(r'\s*<button onClick="\{\{toggleMode\}\}"[^>]*>.*?</button>', '', s, count=1, flags=re.S)
    s = re.sub(r'\s*<sc-if value="\{\{fullMode\}\}".*?</sc-if>\n', '\n', s, count=1, flags=re.S)
    s = re.sub(r'\s*<button onClick="\{\{goStory\}\}".*?</button>', '', s, count=1, flags=re.S)
    s = s.replace("const mode = s.mode || P.defMode;", "const mode = 'simple';")
    # --- privacy: the person's own genetic trait is never shown or kept ---
    s = re.sub(r"me: \[X\('أنت', 'You', 'آپ'\), X\('أ', 'Y', 'آ'\), X\('حامل صفة منجلي'.*?\)\],",
               "me: [X('أنت', 'You', 'آپ'), X('أ', 'Y', 'آ'), X('بياناتك عندك', 'Your data stays with you', 'آپ کا ڈیٹا آپ کے پاس'), 'ok', X('ما نحفظ نتائجك هنا. الشجرة من اللي تشاركه أنت، وتقدر تحذفها متى ما بغيت.', 'Your results are not stored here. The tree is only what you share, and you can delete it anytime.', 'آپ کے نتائج یہاں محفوظ نہیں ہوتے۔')],", s, count=1, flags=re.S)
    s = re.sub(r",\s*\{ name: X\('فقر الدم المنجلي'.*?\] \}\n(\s*\];)", r"\n\1", s, count=1, flags=re.S)
    # --- template additions for live features ---
    s = s.replace('<button style="flex: 1; min-height: 46px; border-radius: 14px; border: none; background: #337E9F;',
                  '<button onClick="{{near.go}}" style="flex: 1; min-height: 46px; border-radius: 14px; border: none; background: #337E9F;', 1)
    chips = '''<sc-if value="{{call.hasChips}}" hint-placeholder-val="{{ false }}">
              <div class="ruf-in" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 4px 0">
                <sc-for list="{{call.chips}}" as="ch" hint-placeholder-count="4">
                  <button onClick="{{ch.run}}" style="min-height: 44px; padding: 0 16px; border-radius: 22px; border: none; background: #FFFFFF; color: #173F42; font-weight: 600; font-size: 0.86em; cursor: pointer">{{ch.label}}</button>
                </sc-for>
              </div>
            </sc-if>
            '''
    s = s.replace('<sc-if value="{{call.showCard}}" hint-placeholder-val="{{ false }}">', chips + '<sc-if value="{{call.showCard}}" hint-placeholder-val="{{ false }}">', 1)
    trcard = lambda cls: f'''<sc-if value="{{{{tr.show}}}}" hint-placeholder-val="{{{{ false }}}}">
              <div class="ruf-in" style="background: #FFFFFF; color: #173F42; border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 6px{cls}">
                <span style="font-size: 0.72em; font-weight: 700; color: #2F7F80">{{{{tr.kicker}}}}</span>
                <b style="font-size: 1em">{{{{tr.title}}}}</b>
                <sc-for list="{{{{tr.lines}}}}" as="ln" hint-placeholder-count="3">
                  <span style="font-size: 0.8em; color: #3A7C7D; display: flex; gap: 8px; align-items: center"><span style="flex: 0 0 10px; height: 10px; border-radius: 3px; background: {{{{ln.color}}}}"></span>{{{{ln.text}}}}</span>
                </sc-for>
                <a class="ios-btn" href="{{{{tr.href}}}}" target="_blank" rel="noopener" onClick="{{{{tr.go}}}}" style="min-height: 50px; border-radius: 14px; background: {{{{tr.ctaBg}}}}; color: #FFFFFF; font-weight: 600; display: flex; align-items: center; justify-content: center; text-decoration: none">{{{{tr.cta}}}}</a>
                <sc-if value="{{{{tr.has2}}}}" hint-placeholder-val="{{{{ false }}}}">
                  <a class="ios-btn" href="{{{{tr.href2}}}}" target="_blank" rel="noopener" style="min-height: 50px; border-radius: 14px; background: #E3F4EF; color: #2F7F80; font-weight: 600; display: flex; align-items: center; justify-content: center; text-decoration: none">{{{{tr.cta2}}}}</a>
                </sc-if>
                <span style="font-size: 0.68em; color: #5A7375">{{{{tr.note}}}}</span>
              </div>
            </sc-if>
            '''
    # in the call (column-reverse: put it above the ready card)
    s = s.replace('''            <sc-if value="{{call.endedNote}}" hint-placeholder-val="{{ false }}">''', trcard('') + '''            <sc-if value="{{call.endedNote}}" hint-placeholder-val="{{ false }}">''', 1)
    # on the booked screen and home
    s = s.replace('''        <sc-if value="{{fromCall}}" hint-placeholder-val="{{ true }}">''', trcard('; border: 1px solid {{t.line}}') + '''        <sc-if value="{{fromCall}}" hint-placeholder-val="{{ true }}">''', 1)
    s = s.replace('''        <!-- اقتراح الحي بخريطة -->''', trcard('; border: 1px solid {{t.line}}') + '''        <!-- اقتراح الحي بخريطة -->''', 1)
    # privacy line + delete data in Access
    s = s.replace('''    <!-- ===================== تم الحجز ===================== -->''', '''    <sc-if value="{{is.access}}" hint-placeholder-val="{{ false }}">
      <div style="margin-top: 12px; background: {{t.card}}; border: 1px solid {{t.line}}; border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 8px">
        <b style="font-size: 0.95em">{{priv.title}}</b>
        <sc-for list="{{priv.lines}}" as="pl" hint-placeholder-count="3"><span style="font-size: 0.8em; color: {{t.muted}}; line-height: 1.6">✓ {{pl}}</span></sc-for>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px"><span style="font-size: 0.82em">{{priv.liveLabel}}</span>
          <button onClick="{{priv.toggleLive}}" aria-pressed="{{priv.live}}" aria-label="{{priv.liveLabel}}" style="flex: 0 0 51px; height: 31px; border-radius: 16px; border: none; background: {{priv.track}}; display: flex; align-items: center; justify-content: {{priv.justify}}; padding: 0 2px; cursor: pointer"><span style="width: 27px; height: 27px; border-radius: 14px; background: #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,.2)"></span></button></div>
        <button onClick="{{priv.del}}" style="min-height: 50px; border-radius: 14px; border: none; background: #FBEDEB; color: #B4382F; font-weight: 600; cursor: pointer">{{priv.delLabel}}</button>
        <a class="ios-btn" href="ministry.html" style="min-height: 44px; display: flex; align-items: center; justify-content: center; color: {{t.primary}}; font-weight: 600; font-size: 0.85em; text-decoration: none">{{priv.ministry}}</a>
      </div>
    </sc-if>

    <!-- ===================== تم الحجز ===================== -->''', 1)
    # --- fill the phone (the board was a fixed 390×844 frame) ---
    s = s.replace('position: relative; width: 390px; height: 844px; box-sizing: border-box;', 'position: relative; width: 100%; max-width: 520px; margin: 0 auto; height: 100dvh; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box;', 1)
    # --- look ---
    s = recolor(s, APP_COLORS)
    s = s.replace("'#F0F8FF'", "'#F4FAF8'")
    s = re.sub(r"font-family:\s*'IBM Plex Sans Arabic'[^;\"]*", 'font-family: ' + SYS_FONT.replace('"', "'"), s)
    s = ios_buttons(s)
    s = s.replace('</helmet>', IOS_CSS + '</helmet>', 1)
    open(dst, 'w', encoding='utf-8').write(s)
    return s

def restyle_ministry(src, dst):
    s = open(src, encoding='utf-8').read()
    s = recolor(s, MIN_COLORS)
    s = re.sub(r"font-family:\s*'IBM Plex Sans Arabic'[^;\"]*", 'font-family: ' + SYS_FONT.replace('"', "'"), s)
    s = s.replace('</helmet>', IOS_CSS + '</helmet>', 1)
    open(dst, 'w', encoding='utf-8').write(s)
    return s

if __name__ == '__main__':
    P = '../../aoun-canvas/project/'
    a = restyle_app(P + 'App.dc.html', '../dcsrc/App.dc.html')
    m = restyle_ministry(P + 'Ministry.dc.html', '../dcsrc/Ministry.dc.html')
    for k in ['{{near.go}}', '{{call.hasChips}}', '{{tr.show}}', '{{priv.title}}', "const mode = 'simple'", 'بياناتك عندك']:
        print(k, a.count(k))
    print('sickle left', a.count('منجلي'), 'story btn', a.count('goStory}}" style'), 'toggleMode btn', a.count('{{toggleMode}}'))
