import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import SelectField from "../common/SelectField";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import { LANGUAGES, VOICE_LANGUAGES } from "../../utils/constants";

/** mm:ss from a second count. */
function clock(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/** Static bar heights — a fixed pattern animated by CSS, not random noise. */
const BARS = [
  38, 62, 45, 78, 54, 88, 40, 70, 52, 92, 46, 66, 58, 84, 42, 74, 50, 86, 44,
  68, 56, 80, 48, 72,
];

/** The languages offered for dictation, in the order citizens ask for them. */
const SPOKEN = VOICE_LANGUAGES.map((code) =>
  LANGUAGES.find((l) => l.code === code),
).filter(Boolean);

/**
 * Voice complaint capture using the browser's own speech recognition.
 *
 * The transcript is whatever the engine actually heard — there is no sample
 * text and no fallback that pretends audio became words. If the browser has no
 * speech API, the component says so and points at the textarea instead of
 * quietly producing a made-up sentence.
 *
 * TODO(api): Whisper is not wired up. For unsupported browsers the next step is
 * MediaRecorder → POST /api/voice/transcribe → { transcript, language }, which
 * is the same shape `onTranscript` already receives.
 */
export default function VoiceRecorder({ onTranscript, transcript, disabled }) {
  const [language, setLanguage] = useState("en");
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");

  const spec = SPOKEN.find((l) => l.code === language) ?? SPOKEN[0];

  const {
    supported,
    listening,
    finalText,
    interim,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition({ lang: spec?.speech ?? "en-IN" });

  const timerRef = useRef(null);

  // Elapsed counter runs off the engine's own listening flag, so it can never
  // show time accruing after recognition has actually stopped.
  useEffect(() => {
    if (!listening) return undefined;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [listening]);

  // Publish upward when a session ends with words captured. Reporting on the
  // stop edge rather than per result keeps the parent's textarea from being
  // rewritten under the citizen while they are still speaking.
  const wasListening = useRef(false);
  useEffect(() => {
    if (wasListening.current && !listening) {
      const text = finalText.trim();
      if (text) {
        setNotice("");
        onTranscript?.({ transcript: text, language: spec?.label ?? "English" });
      } else if (!error) {
        setNotice("Nothing was captured. Try again, or type your complaint below.");
      }
    }
    wasListening.current = listening;
  }, [listening, finalText, error, onTranscript, spec]);

  const begin = () => {
    setSeconds(0);
    setNotice("");
    start();
  };

  const again = () => {
    setSeconds(0);
    setNotice("");
    reset();
    onTranscript?.(null);
  };

  const phase = listening ? "recording" : transcript ? "done" : "idle";
  const live = [finalText, interim].filter(Boolean).join(" ");

  return (
    <div className="voice">
      <div className="voice__lang">
        <SelectField
          label="Speak in"
          name="voice-language"
          icon="bi-translate"
          value={language}
          disabled={listening}
          onChange={(event) => setLanguage(event.target.value)}
          options={SPOKEN.map((l) => ({
            value: l.code,
            label: `${l.label} · ${l.native}`,
          }))}
          hint="Recognition accuracy varies by language and browser. You can always correct the text afterwards."
        />
      </div>

      {!supported && (
        <p className="voice__unsupported" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          Speech recognition is not supported in this browser. Please use Chrome
          or enter your complaint manually.
        </p>
      )}

      <div className={`voice__stage voice__stage--${phase}`} aria-live="polite">
        <div
          className={`voice__wave${listening ? " voice__wave--live" : ""}`}
          aria-hidden="true"
        >
          {BARS.map((height, index) => (
            <span
              key={index}
              className="voice__bar"
              style={{ "--h": `${height}%`, "--i": index }}
            />
          ))}
        </div>

        {phase === "idle" && (
          <>
            <span className="voice__mic" aria-hidden="true">
              <i className="bi bi-mic" />
            </span>
            <p className="voice__hint">
              Tap the button and describe the problem in your own words.
            </p>
            <Button
              icon="bi-mic-fill"
              onClick={begin}
              disabled={disabled || !supported}
            >
              Start Recording
            </Button>
          </>
        )}

        {phase === "recording" && (
          <>
            <span className="voice__mic voice__mic--live" aria-hidden="true">
              <i className="bi bi-mic-fill" />
            </span>
            <p className="voice__status">
              <span className="voice__pulse" aria-hidden="true" />
              Listening…
            </p>
            <p className="voice__timer num-tabular">{clock(seconds)}</p>
            <Button variant="danger" icon="bi-stop-fill" onClick={stop}>
              Stop Recording
            </Button>
          </>
        )}

        {phase === "done" && (
          <>
            <span className="voice__mic voice__mic--done" aria-hidden="true">
              <i className="bi bi-check-lg" />
            </span>
            <p className="voice__status">Transcript captured · {clock(seconds)}</p>
            <Button
              variant="ghost"
              icon="bi-arrow-counterclockwise"
              onClick={again}
            >
              Record again
            </Button>
          </>
        )}
      </div>

      {/* Words as they arrive, so the citizen can see recognition working and
          stop early if it is mishearing them. */}
      {listening && live && (
        <p className="voice__live">
          {finalText}
          {interim && <span className="voice__live-interim"> {interim}</span>}
        </p>
      )}

      {error && (
        <p className="field__error" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          {error}
          {supported && (
            <Button variant="ghost" size="sm" onClick={begin} className="ms-2">
              Retry
            </Button>
          )}
        </p>
      )}

      {notice && !error && (
        <p className="field__error" role="status">
          <i className="bi bi-info-circle" aria-hidden="true" />
          {notice}
        </p>
      )}

      {transcript && (
        <div className="voice__transcript">
          <div className="voice__transcript-head">
            <span className="voice__transcript-label">
              <i className="bi bi-card-text" aria-hidden="true" />
              Transcript
            </span>
            <span className="chip chip--soft">
              <i className="bi bi-translate" aria-hidden="true" />
              {transcript.language}
            </span>
          </div>
          <p className="voice__transcript-text">“{transcript.transcript}”</p>
        </div>
      )}

      <p className="voice__disclaimer">
        <i className="bi bi-info-circle" aria-hidden="true" />
        Speech is transcribed by your browser. Whisper transcription on the
        server is not wired up yet.
      </p>
    </div>
  );
}
