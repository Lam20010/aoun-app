# عون · Aoun

The Aoun resident app and the Ministry platform (agentX hackathon, Ministry of Health track), built from the original Aoun designs.

- **App:** https://lam20010.github.io/aoun-app/ (open in Safari → Share → Add to Home Screen)
- **Ministry platform:** https://lam20010.github.io/aoun-app/ministry.html

## The app
1. **The call:** Rufaida (رفيدة) or Rafeed (رفيد), the live ElevenLabs agent, calls and announces a ready appointment. Confirm, or say it doesn't suit you; the agent asks why and rebooks to remove the reason.
2. **No transport:** the agent asks for your location (with permission) and offers **Uber** (ride pre-filled from home to the center, confirmed in Uber) or the **Riyadh Metro** (full plan + ticket in the Darb app).
3. **Your neighborhood:** after booking, the app asks for your location to show your area, its screening rate and the nearest park, mobile clinic or health center, with directions in Maps. If diabetes or high blood pressure runs in the family, it suggests a daily walk in the nearest park.
4. **Always with you:** the Rufaida bar at the bottom is the live agent: «افتح دفتري», «وريني شجرة عائلتي», «وين أقرب حديقة؟», «كبّري الخط».
5. **Privacy:** location stays on the phone, the family tree has no names, the person's own genetic results are never shown or stored, and «احذف بياناتي من الجوال» clears everything.

Settings (الوصول): turn «الوكيل الحي» off to run the same flow offline with the phone's voice.

## The Ministry platform
The original platform (map, regions, neighborhoods, statistics, interventions with human approval, reports, settings) plus **أداء الوكلاء**: completed screenings per 1,000 vs SMS, the journey of 1,000 residents, the four agents' metrics, what each agent adds, and language understanding.

## How it is built
`src/designs/*.dc.html` are the Aoun design boards (restyled: palette #5AA7A7 #96D7C6 #BAC94A #E2D36B #6C8CBF, iOS buttons). `src/dcrt.js` is a small runtime that renders them; `src/live.js` adds the live agent, location, transport and maps; `src/ministry_live.js` adds the agent dashboard. Build: `python3 build_site3.py`.

Data: agent evaluation from the project's simulation (synthetic residents anchored on 2020+ Saudi statistics); Riyadh Metro stations and lines from RCRC open data (via github.com/engmohammeda/RiyadhMetro-, MIT); nearby parks and health centers from OpenStreetMap; Saudi region borders from svg-maps (CC BY 4.0). Mobile clinic locations are demo placements.
