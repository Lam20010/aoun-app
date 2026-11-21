# عون · Aoun

Installable iPhone/Android web app for the Aoun early-screening agent (agentX hackathon, Ministry of Health track).

**Live:** https://lam20010.github.io/aoun-app/ · **Ministry dashboard:** https://lam20010.github.io/aoun-app/ministry.html

## The resident app
1. **Welcome:** asks to use the location (to know the neighborhood and suggest the nearest center, mobile clinic and park) and the microphone.
2. **The call:** Rufaida (رفيدة) or Rafeed (رفيد), the live ElevenLabs agent, calls and announces a **ready appointment**. The person confirms, or declines; the agent asks why and rebooks to remove the reason (evening slot, female doctor, interpreter, home visit, mobile clinic).
3. **No transport:** the agent offers **Uber** (the ride is pre-filled from home to the center; the person confirms it in the Uber app) or the **Riyadh Metro** (full plan: walk → line and stops → walk, with the ticket in the Darb app and the plan in Google Maps).
4. **The app:** Home, دفتري, the map, the family tree. The agent stays available in the dock on every screen: "افتح دفتري", "وين أقرب حديقة؟", "كبّر الخط".
5. **Map:** the person's area and its screening rate, the nearest health center, the nearest mobile check-up truck, parks and metro stations, with directions.
6. **Family tree:** relations only, no names, saved on the phone. If diabetes or high blood pressure runs in the family, the app and the agent suggest a daily walk in the nearest park and show the way.

Install on iPhone: open the link in Safari → Share → Add to Home Screen.

## Ministry dashboard
Overview of the regions, Riyadh districts with the main barrier and a suggested intervention (human approval), and **agent performance**: completed screenings per 1,000 vs SMS, funnel, the four agents' metrics, ablations, language understanding.

## Data
- Agent evaluation and district data: simulation on synthetic residents anchored on 2020+ Saudi statistics (see the main project repo).
- Riyadh Metro stations and lines: RCRC open data via github.com/engmohammeda/RiyadhMetro- (MIT).
- Parks and health centers near the person: OpenStreetMap (live, Overpass API). Map tiles © OpenStreetMap, © CARTO.
- Mobile check-up truck locations are demo placements near the person.

Source: `src/` (bundled into `app.js` with esbuild, `@elevenlabs/client` 1.34.0, Leaflet 1.9.4).
