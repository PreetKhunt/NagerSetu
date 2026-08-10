import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser speech recognition, wrapped for React.
 *
 * This is the real Web Speech API — `window.SpeechRecognition`, or the
 * `webkit-` prefixed build Chrome and Edge still ship. Nothing here invents
 * text: if the engine returns nothing, the transcript stays empty and the
 * caller shows an error. Recognition runs against the browser's own service,
 * so an unsupported browser is reported rather than silently faked.
 *
 * TODO(api): for browsers without the API, record with MediaRecorder and POST
 * the blob to /api/voice/transcribe (Whisper). The shape returned here —
 * { transcript, language } — is what that endpoint should answer with, so the
 * recorder component will not need to change.
 */

/** The constructor this browser exposes, or null. */
function getRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

const MESSAGES = {
  "not-allowed":
    "Microphone access was blocked. Allow it in your browser's site settings and try again.",
  "service-not-allowed":
    "Microphone access was blocked. Allow it in your browser's site settings and try again.",
  "no-speech": "We did not hear anything. Try again and speak a little closer to the mic.",
  "audio-capture": "No microphone was found. Connect one and try again.",
  network: "Speech recognition needs a network connection. Check your connection and retry.",
  aborted: "Recording stopped before anything was captured.",
};

export default function useSpeechRecognition({ lang = "en-IN" } = {}) {
  const Recognition = getRecognition();
  const supported = Boolean(Recognition);

  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  // Accumulated across `onresult` events: continuous mode delivers finalised
  // chunks one at a time and each event only carries what is new.
  const finalRef = useRef("");
  const langRef = useRef(lang);
  langRef.current = lang;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setFinalText("");
    setInterim("");
    setError("");
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or enter your complaint manually.",
      );
      return;
    }

    // A second start() on a live instance throws InvalidStateError, so the
    // previous one is always torn down first.
    recognitionRef.current?.abort();

    const recognition = new Recognition();
    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalRef.current += text;
        else pending += text;
      }
      setFinalText(finalRef.current.trim());
      setInterim(pending.trim());
    };

    recognition.onerror = (event) => {
      // "no-speech" after words were already captured is just the pause before
      // the user stops — reporting it would contradict the transcript on screen.
      if (event.error === "no-speech" && finalRef.current.trim()) return;
      setError(MESSAGES[event.error] ?? "Speech recognition failed. Please try again.");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    finalRef.current = "";
    setFinalText("");
    setInterim("");

    try {
      recognition.start();
    } catch {
      setError("Recording could not start. Please try again.");
      setListening(false);
    }
  }, [Recognition, supported]);

  // A live recognition session holds the microphone; unmounting mid-recording
  // must release it rather than leave the tab indicator on.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, finalText, interim, error, start, stop, reset };
}
