/* Geography helpers: distances, nearby places, metro routing, deep links. */

export function km(a, b, c, d) {
  const R = 6371, r = Math.PI / 180, dLat = (c - a) * r, dLng = (d - b) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export const fmtKm = (k) => (k < 1 ? `${Math.max(50, Math.round((k * 1000) / 50) * 50)} م` : `${k.toFixed(1)} كم`);
export const walkMin = (k) => Math.max(1, Math.round((k / 4.8) * 60));
const offset = (h, kmN, kmE) => ({ lat: h.lat + kmN / 110.57, lng: h.lng + kmE / (111.32 * Math.cos((h.lat * Math.PI) / 180)) });

/* A health center stand-in used until real ones load from OpenStreetMap. */
export function fakeCenter(h) { const p = offset(h, 2.2, 2.6); return { ...p, name: "مركز صحي الحي", km: km(h.lat, h.lng, p.lat, p.lng) }; }

/* Mobile check-up trucks are scheduled by the Ministry; in this demo they are placed near the person. */
function trucks(h) {
  const t1 = offset(h, -0.45, -0.55), t2 = offset(h, 1.1, -1.2);
  return [
    { ...t1, name: "عيادة الفحص المتنقلة · وزارة الصحة", hours: "اليوم من 4 إلى 9 المسا", when: "اليوم 5 المسا" },
    { ...t2, name: "عيادة متنقلة عند جامع الحي", hours: "الجمعة بعد الصلاة 2:30 إلى 9", when: "الجمعة 2:30" },
  ].map((t) => ({ ...t, km: km(h.lat, h.lng, t.lat, t.lng) })).sort((a, b) => a.km - b.km);
}

export function localPlaces(h, PL) {
  const near = (arr, f) => arr.map((x) => ({ ...x, ...f(x), km: km(h.lat, h.lng, x.lat, x.lng ?? x.lon) })).sort((a, b) => a.km - b.km);
  return {
    center: fakeCenter(h),
    trucks: trucks(h),
    parks: near(PL?.parks || [], (x) => ({ name: x.ar })).slice(0, 5),
    stations: near(PL?.stations || [], () => ({})).slice(0, 5),
    live: false,
  };
}

/* Real parks and health centers around the person, from OpenStreetMap (runs on the phone). */
export async function overpass(h) {
  const q = `[out:json][timeout:15];(nwr["leisure"="park"](around:3500,${h.lat},${h.lng});nwr["healthcare"="centre"](around:6000,${h.lat},${h.lng});nwr["amenity"="clinic"](around:6000,${h.lat},${h.lng});nwr["amenity"="hospital"](around:6000,${h.lat},${h.lng}););out center tags 120;`;
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 14000);
  const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctl.signal });
  clearTimeout(t);
  const j = await r.json();
  const pt = (e) => ({ lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon });
  const name = (e) => e.tags?.["name:ar"] || e.tags?.name || "";
  const parks = [], centers = [];
  for (const e of j.elements || []) {
    const p = pt(e); if (p.lat == null) continue;
    const d = km(h.lat, h.lng, p.lat, p.lng), n = name(e);
    if (e.tags?.leisure === "park") parks.push({ ...p, km: d, name: n || "حديقة الحي" });
    else if (n) {
      const phc = /مركز|صحي|centre|center|PHC/i.test(n) || e.tags?.healthcare === "centre";
      centers.push({ ...p, km: d, name: n, rank: d - (phc ? 1.5 : 0) - (e.tags?.amenity === "hospital" ? -1 : 0) });
    }
  }
  parks.sort((a, b) => (a.name === "حديقة الحي") - (b.name === "حديقة الحي") || a.km - b.km);
  parks.sort((a, b) => a.km - b.km);
  centers.sort((a, b) => a.rank - b.rank);
  return { parks: parks.slice(0, 6), centers: centers.slice(0, 3) };
}

/* ---- links ---- */
const enc = encodeURIComponent;
export function uberLink(h, c) {
  return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${h.lat}&pickup[longitude]=${h.lng}&pickup[nickname]=${enc("البيت")}` +
    `&dropoff[latitude]=${c.lat}&dropoff[longitude]=${c.lng}&dropoff[nickname]=${enc(c.name)}&dropoff[formatted_address]=${enc(c.name)}`;
}
export const transitLink = (h, c) => `https://www.google.com/maps/dir/?api=1&origin=${h.lat},${h.lng}&destination=${c.lat},${c.lng}&travelmode=transit`;
export const appleDir = (h, p, mode) => `https://maps.apple.com/?saddr=${h.lat},${h.lng}&daddr=${p.lat},${p.lng}&dirflg=${mode}`;
export const lineColor = (PL, id) => (PL?.lines || []).find((l) => l.id === id)?.color || "#888";

/* ---- Riyadh Metro routing: fewest stops, transfers cost extra ---- */
export function metroPlan(h, c, PL) {
  if (!PL?.stations?.length) return null;
  const st = Object.fromEntries(PL.stations.map((s) => [s.id, s]));
  const nearest = (p) => PL.stations.map((s) => ({ s, d: km(p.lat, p.lng, s.lat, s.lng) })).sort((a, b) => a.d - b.d)[0];
  const A = nearest(h), B = nearest(c);
  if (A.d > 4 || B.d > 4 || A.s.id === B.s.id || km(h.lat, h.lng, c.lat, c.lng) < 2) return null;
  const adj = {};
  for (const l of PL.lines) l.stations.forEach((id, i) => {
    (adj[id] ||= []);
    if (i > 0) adj[id].push([l.stations[i - 1], l.id]);
    if (i < l.stations.length - 1) adj[id].push([l.stations[i + 1], l.id]);
  });
  const key = (s, l) => s + "|" + l, dist = {}, prev = {}, Q = [];
  for (const l of A.s.lines) { dist[key(A.s.id, l)] = 0; Q.push([0, A.s.id, l]); }
  while (Q.length) {
    Q.sort((a, b) => a[0] - b[0]); const [d, s, l] = Q.shift();
    if (d > (dist[key(s, l)] ?? 1e9)) continue;
    if (s === B.s.id) { return build(s, l); }
    for (const [n, nl] of adj[s] || []) {
      const nd = d + 1 + (nl !== l ? 4 : 0), k = key(n, nl);
      if (nd < (dist[k] ?? 1e9)) { dist[k] = nd; prev[k] = key(s, l); Q.push([nd, n, nl]); }
    }
  }
  return null;
  function build(s, l) {
    const seq = []; let k = key(s, l);
    while (k) { const [ss, ll] = k.split("|"); seq.unshift({ s: ss, l: ll }); k = prev[k]; }
    const legs = [];
    for (const x of seq) {
      const last = legs[legs.length - 1];
      if (!last || last.lid !== x.l) legs.push({ lid: x.l, ids: last ? [last.ids[last.ids.length - 1], x.s] : [x.s] });
      else last.ids.push(x.s);
    }
    const out = legs.filter((g) => g.ids.length > 1).map((g) => {
      const line = PL.lines.find((q) => q.id === g.lid);
      const ids = g.ids.filter((v, i, a) => i === 0 || v !== a[i - 1]);
      return { line, stops: ids.length - 1, to: st[ids[ids.length - 1]], path: ids.map((i) => [st[i].lat, st[i].lng]) };
    });
    const stops = out.reduce((a, g) => a + g.stops, 0), w1 = walkMin(A.d), w2 = walkMin(B.d);
    return { from: A.s, to: B.s, legs: out, walk1: w1, walk2: w2, total: w1 + w2 + 4 + stops * 2 + (out.length - 1) * 5 };
  }
}

export function nextDateICS() {
  const d = new Date(Date.now() + 86400000); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T160000`;
}
