// Runs inside the web page before it loads. It gives the web app the phone's own microphone,
// voices and built-in AI, using the same browser APIs the website already uses
// (SpeechRecognition, speechSynthesis, navigator.wakeLock), so app.html works unchanged on the web.
export function bridgeScript(platform: string): string {
  return `(() => {
  const post = (m) => window.ReactNativeWebView.postMessage(JSON.stringify(m));
  let nextId = 1;
  const pending = {};
  const call = (method, args) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending[id] = { resolve, reject };
    post({ id, method, args: args || {} });
  });
  window.__abroadReply = (id, ok, value) => {
    const p = pending[id]; if (!p) return; delete pending[id];
    ok ? p.resolve(value) : p.reject({ message: String(value || "Something went wrong.") });
  };

  // ---------- Speech in ----------
  let current = null, nextSession = 1;
  class NativeSpeechRecognition {
    constructor() { this.lang = "en-US"; this.interimResults = false; this.continuous = false; this.maxAlternatives = 1;
      this.onresult = this.onerror = this.onend = this.onstart = null; this._sid = 0; }
    start() {
      this._sid = nextSession++; current = this;
      post({ id: 0, method: "sr.start", args: { sid: this._sid, lang: this.lang, interimResults: !!this.interimResults, continuous: !!this.continuous } });
    }
    stop() { if (this._sid) post({ id: 0, method: "sr.stop", args: { sid: this._sid } }); }
    abort() { if (this._sid) post({ id: 0, method: "sr.abort", args: { sid: this._sid } }); }
  }
  window.SpeechRecognition = window.webkitSpeechRecognition = NativeSpeechRecognition;

  // ---------- Speech out ----------
  const utterances = {};
  class NativeUtterance {
    constructor(text) { this.text = text || ""; this.lang = ""; this.rate = 1; this.volume = 1; this.voice = null; this.onend = this.onerror = null; }
  }
  const synth = {
    speaking: false, onvoiceschanged: null,
    getVoices() { return []; },
    speak(u) {
      // A silent utterance is how the website unlocks audio; the app doesn't need it.
      if (!u || !String(u.text).trim() || u.volume === 0) { setTimeout(() => u && u.onend && u.onend({}), 0); return; }
      const id = nextId++; utterances[id] = u; synth.speaking = true;
      post({ id: 0, method: "tts.speak", args: { uid: id, text: String(u.text), lang: u.lang, rate: u.rate } });
    },
    cancel() { post({ id: 0, method: "tts.stop", args: {} }); },
    pause() {}, resume() {},
  };
  window.SpeechSynthesisUtterance = NativeUtterance;
  try { Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true, writable: true }); } catch (e) { window.speechSynthesis = synth; }

  // ---------- Events from the app ----------
  window.__abroadEvent = (name, d) => {
    if (name === "tts.done") {
      const u = utterances[d.uid]; delete utterances[d.uid];
      synth.speaking = Object.keys(utterances).length > 0;
      if (u) (d.error ? u.onerror : u.onend) && (d.error ? u.onerror : u.onend)({ error: d.error });
      return;
    }
    const r = current; if (!r || r._sid !== d.sid) return;
    if (name === "sr.start") r.onstart && r.onstart({});
    if (name === "sr.result") {
      const res = [{ transcript: d.transcript, confidence: 1 }]; res.isFinal = !!d.isFinal;
      r.onresult && r.onresult({ results: [res], resultIndex: 0 });
    }
    if (name === "sr.error") r.onerror && r.onerror({ error: d.error, message: d.message });
    if (name === "sr.end") { if (current === r) current = null; r.onend && r.onend({}); }
  };

  // ---------- Keep the screen on during a conversation ----------
  try {
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: {
      request() { post({ id: 0, method: "awake", args: { on: true } });
        return Promise.resolve({ released: false, addEventListener() {}, release() { post({ id: 0, method: "awake", args: { on: false } }); return Promise.resolve(); } }); },
    } });
  } catch (e) {}

  // ---------- The phone's built-in AI ----------
  window.AbroadNative = {
    platform: ${JSON.stringify(platform)},
    ai: {
      availability: (lang) => call("ai.availability", { lang }),
      download: () => call("ai.download"),
      generate: (prompt, maxTokens) => call("ai.generate", { prompt, maxTokens: maxTokens || 400 }),
    },
  };
})(); true;`;
}
