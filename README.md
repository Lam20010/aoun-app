# عون · Aoun — web app

Installable iPhone/Android web app for the Aoun early-screening agent (agentX hackathon, Ministry of Health track).

- Opens as an incoming call from Rufaida (رفيدة) or Rafeed (رفيد), talks with the **live ElevenLabs agent** through the microphone, shows live captions and the ready appointment, and books it by voice (`book_ready_appointment` client tool) or by tap.
- Tabs: الرئيسية، دفتري، the agent, عائلتي (family history with privacy by design), الوصول (voice choice, text size, high contrast, simple mode, captions, live/offline switch).
- Offline demo: turn off «الوكيل الحي» in الوصول and the call plays a scripted conversation with the phone's own voice.

**Install on iPhone:** open the link in Safari → Share → Add to Home Screen → open «عون» from the home screen → allow the microphone.

Source: `src/app.js` (bundled into `app.js` with esbuild, `@elevenlabs/client` 1.34.0).
