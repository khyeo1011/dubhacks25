// stt.js
// Lightweight wrapper around the Web Speech API (Chrome/Edge).
// Exposes: BrowserSTT with .start(), .stop(), and one-shot .once().

export class BrowserSTT {
  /**
   * @param {Object} [opts]
   * @param {string} [opts.lang='en-US']            - Language code.
   * @param {boolean} [opts.interim=true]          - Emit partial results.
   * @param {boolean} [opts.continuous=false]      - Keep listening after a final result.
   */
  constructor(opts = {}) {
    this.lang = opts.lang ?? "en-US";
    this.interimResults = opts.interim ?? true;
    this.continuous = opts.continuous ?? false;

    if (!("webkitSpeechRecognition" in window)) {
      throw new Error("SpeechRecognition not supported. Use Chrome/Edge.");
    }

    this._rec = new webkitSpeechRecognition();
    this._rec.lang = this.lang;
    this._rec.interimResults = this.interimResults;
    this._rec.continuous = this.continuous;

    this._onPartial = null;
    this._onFinal = null;
    this._onError = null;

    this._rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      const isFinal = e.results[e.results.length - 1].isFinal;

      if (isFinal) {
        this._onFinal && this._onFinal(text.trim());
      } else {
        this._onPartial && this._onPartial(text.trim());
      }
    };

    this._rec.onerror = (e) => this._onError && this._onError(e);

    this._rec.onend = () => {
      // If continuous === true and user called stop() manually, that's fine.
      // If you want auto-restart, implement here.
    };
  }

  /**
   * Start recognition.
   * @param {Object} [handlers]
   * @param {(text:string)=>void} [handlers.onPartial]
   * @param {(text:string)=>void} [handlers.onFinal]
   * @param {(err:SpeechRecognitionErrorEvent)=>void} [handlers.onError]
   */
  start(handlers = {}) {
    this._onPartial = handlers.onPartial ?? null;
    this._onFinal = handlers.onFinal ?? null;
    this._onError = handlers.onError ?? null;
    try {
      this._rec.start();
    } catch {
      // Chrome throws if called twice; ignore.
    }
  }

  /** Stop gracefully (fires final result if any). */
  stop() {
    try { this._rec.stop(); } catch {}
  }

  /** Abort immediately (no final). */
  abort() {
    try { this._rec.abort(); } catch {}
  }

  /**
   * One-shot helper: returns a single final utterance then stops.
   * @returns {Promise<string>}
   */
  once() {
    return new Promise((resolve, reject) => {
      const oneShot = new BrowserSTT({
        lang: this.lang,
        interim: false,
        continuous: false,
      });
      oneShot.start({
        onFinal: (t) => { oneShot.stop(); resolve(t); },
        onError: (e) => { oneShot.abort(); reject(e); },
      });
    });
  }

  /** Quick capability check for consumers. */
  static isSupported() {
    return "webkitSpeechRecognition" in window;
  }
}
