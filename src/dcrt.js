/* Minimal runtime for Aoun's design boards: renders a template with {{holes}},
   <sc-if value>, <sc-for list as>, onClick/onMouseEnter/onMouseLeave handlers,
   driven by a component class (state, setState, renderVals, lifecycle). */
import morphdom from "morphdom";

export class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(patch, cb) {
    const p = typeof patch === "function" ? patch(this.state, this.props) : patch;
    this.state = { ...this.state, ...(p || {}) };
    this.__schedule && this.__schedule();
    if (cb) Promise.resolve().then(cb);
  }
  forceUpdate() { this.__schedule && this.__schedule(); }
}

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const EVENTS = { onclick: "click", onmouseenter: "mouseenter", onmouseleave: "mouseleave", oninput: "input", onchange: "change" };

function lookup(expr, scopes) {
  expr = expr.trim();
  if (expr === "true") return true; if (expr === "false") return false; if (expr === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(expr)) return +expr;
  if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
  const parts = expr.split(".");
  for (let i = scopes.length - 1; i >= 0; i--) {
    const sc = scopes[i];
    if (sc && Object.prototype.hasOwnProperty.call(sc, parts[0])) {
      let v = sc[parts[0]];
      for (let k = 1; k < parts.length; k++) { if (v == null) return undefined; v = v[parts[k]]; }
      return v;
    }
  }
  return undefined;
}
const str = (v) => (v == null || v === false ? "" : v === true ? "true" : String(v));
function interp(text, scopes) {
  const m = text.match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/);
  if (m) return lookup(m[1], scopes);
  return text.replace(HOLE, (_, e) => str(lookup(e, scopes)));
}

export function mount(rootEl, templateEl, Comp, props) {
  const inst = new Comp(props || {});
  let handlers = [], queued = false, mounted = false;
  inst.__schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; render(); }); } };

  function build(node, scopes, out) {
    for (const ch of Array.from(node.childNodes)) {
      if (ch.nodeType === 3) { out.appendChild(document.createTextNode(ch.data.includes("{{") ? str(interp(ch.data, scopes)) : ch.data)); continue; }
      if (ch.nodeType !== 1) continue;
      const tag = ch.localName;
      if (tag === "sc-if") { if (interp(ch.getAttribute("value") || "", scopes)) build(ch, scopes, out); continue; }
      if (tag === "sc-for") {
        const list = interp(ch.getAttribute("list") || "", scopes) || [], as = ch.getAttribute("as") || "item";
        (Array.isArray(list) ? list : []).forEach((item, idx) => build(ch, [...scopes, { [as]: item, index: idx }], out));
        continue;
      }
      const el = ch.namespaceURI === "http://www.w3.org/2000/svg" ? document.createElementNS(ch.namespaceURI, ch.tagName) : document.createElement(tag);
      for (const a of Array.from(ch.attributes)) {
        const name = a.name;
        if (name.startsWith("hint-")) continue;
        const ev = EVENTS[name.toLowerCase()];
        if (ev) { const fn = interp(a.value, scopes); if (typeof fn === "function") { el.setAttribute("data-dc-" + ev, handlers.length); handlers.push(fn); } continue; }
        if (!a.value.includes("{{")) { el.setAttribute(name, a.value); continue; }
        const v = interp(a.value, scopes);
        if (v === false || v == null) continue;
        el.setAttribute(name, v === true ? "true" : String(v));
      }
      build(tag === "template" ? ch.content : ch, scopes, el);
      out.appendChild(el);
    }
  }

  function render() {
    handlers = [];
    const vals = inst.renderVals ? inst.renderVals() : {};
    const next = rootEl.cloneNode(false);
    build(templateEl.content || templateEl, [vals], next);
    morphdom(rootEl, next, {
      onBeforeElUpdated(from, to) {
        if (from.tagName === "VIDEO" || from.hasAttribute("data-dc-keep")) return false;
        return !from.isEqualNode(to);
      },
    });
    if (!mounted) { mounted = true; inst.componentDidMount && inst.componentDidMount(); }
    else inst.componentDidUpdate && inst.componentDidUpdate();
    inst.__afterRender && inst.__afterRender(rootEl);
  }

  ["click", "mouseenter", "mouseleave", "input", "change"].forEach((type) => {
    rootEl.addEventListener(type, (e) => {
      let t = e.target;
      if (type === "mouseenter" || type === "mouseleave") { if (t.nodeType === 1 && t.hasAttribute("data-dc-" + type)) handlers[+t.getAttribute("data-dc-" + type)]?.(e); return; }
      while (t && t !== rootEl) {
        if (t.nodeType === 1 && t.hasAttribute("data-dc-" + type)) { handlers[+t.getAttribute("data-dc-" + type)]?.call(inst, e); return; }
        t = t.parentNode;
      }
    }, type === "mouseenter" || type === "mouseleave");
  });
  render();
  return inst;
}
