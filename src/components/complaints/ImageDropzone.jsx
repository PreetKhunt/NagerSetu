import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import ConfidenceMeter from "../common/ConfidenceMeter";
import { imageAnalysisService } from "../../services/ImageAnalysisService";
import { fileSize, toStorableDataUrl } from "../../utils/imageTools";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Photo upload with drag-and-drop and real vision read-out via ImageAnalysisService.
 */
export default function ImageDropzone({ onAnalysis, onFileChange, disabled, selectedCategory }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("empty"); // empty | uploading | analyzing | done | error
  const [progress, setProgress] = useState(0);
  const [vision, setVision] = useState(null);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const timers = useRef([]);

  // Object URLs and pending timers must not outlive the component.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const reject = (message) => {
    setError(message);
    setStatus("error");
  };

  const handleFile = async (nextFile) => {
    if (!nextFile) return;

    if (!ACCEPTED.includes(nextFile.type)) {
      reject("Use a JPG, PNG or WebP image.");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      reject(`That file is ${fileSize(nextFile.size)}. The limit is 5 MB.`);
      return;
    }

    setError("");
    setVision(null);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));

    // Ensure safe filename extraction in case of fake paths
    const safeName = nextFile.name ? nextFile.name.split(/[/\\]/).pop() : "image.jpg";
    const safeFile = new File([nextFile], safeName, { type: nextFile.type });

    // Downscaled copy for the store.
    const dataUrl = await toStorableDataUrl(safeFile);
    onFileChange?.(safeFile, dataUrl);

    // Simulated upload progress, then real detection.
    setStatus("uploading");
    setProgress(0);
    [20, 45, 70, 100].forEach((value, index) => {
      timers.current.push(
        setTimeout(() => setProgress(value), (index + 1) * 220),
      );
    });

    timers.current.push(
      setTimeout(async () => {
        setStatus("analyzing");
        try {
          const result = await imageAnalysisService.validateImage(safeFile, selectedCategory);

          if (!result.valid) {
            reject(result.reason || "Inappropriate/Irrelevant image");
            onAnalysis?.({ ...result, valid: false });
            return;
          }

          const formattedResult = {
            valid: true,
            relevant: true,
            category: result.category,
            detected_category: result.category,
            label: result.label || result.category,
            confidence: result.confidence,
            severity: result.severity,
            department: result.department,
            reason: result.reason,
            description: result.description,
            tags: result.tags || [],
          };

          setVision(formattedResult);
          setStatus("done");
          onAnalysis?.(formattedResult);
        } catch (err) {
          console.error("Vision analysis API error:", err);
          reject(err.message || "We could not analyze that image. Try another photo.");
          onAnalysis?.({ valid: false });
        }
      }, 1000),
    );
  };

  const remove = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setVision(null);
    setProgress(0);
    setStatus("empty");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onFileChange?.(null, null);
    onAnalysis?.(null);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="dropzone-wrap">
      {!file && (
        <div
          className={`dropzone${dragging ? " dropzone--over" : ""}${
            status === "error" ? " dropzone--error" : ""
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="dropzone__art" aria-hidden="true">
            <i className="bi bi-cloud-arrow-up" />
          </span>

          <p className="dropzone__title">Drag and drop a photo here</p>
          <p className="dropzone__hint">
            A clear photo helps AI confirm the issue and its severity.
            JPG, PNG or WebP up to 5 MB.
          </p>

          <Button
            variant="secondary"
            icon="bi-folder2-open"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Browse files
          </Button>

          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={ACCEPTED.join(",")}
            onChange={(event) => handleFile(event.target.files?.[0])}
            aria-label="Upload a photo of the issue"
          />
        </div>
      )}

      {file && (
        <div className="upload">
          <div className="upload__preview">
            {/* Local object URL — the user's own file, not a remote image. */}
            <img src={preview} alt="Selected issue photo" />
            <button
              type="button"
              className="upload__remove"
              onClick={remove}
              aria-label="Remove image"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="upload__body">
            <div className="upload__file">
              <i className="bi bi-file-earmark-image" aria-hidden="true" />
              <span className="upload__name">{file.name}</span>
              <span className="upload__size">{fileSize(file.size)}</span>
            </div>

            {status === "uploading" && (
              <div className="upload__progress" aria-live="polite">
                <div className="mini-bar">
                  <span
                    className="mini-bar__fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="upload__status">Uploading… {progress}%</span>
              </div>
            )}

            {status === "analyzing" && (
              <p className="upload__status upload__status--busy">
                <span className="btn-ds__spinner" aria-hidden="true" />
                Running AI vision analysis…
              </p>
            )}

            {status === "done" && (
              <p className="upload__status upload__status--ok">
                <i className="bi bi-check-circle-fill" aria-hidden="true" />
                Upload complete
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="field__error" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          {error}
        </p>
      )}

      {vision && (
        <div className="vision">
          <div className="vision__head">
            <span className="ai-orb ai-orb--sm" aria-hidden="true">
              <i className="bi bi-eye" />
            </span>
            <h4 className="vision__title">AI Vision Analysis</h4>
          </div>

          <div className="vision__grid">
            <div className="vision__cell">
              <span className="vision__label">Detected</span>
              <span className="vision__value">{vision.label}</span>
            </div>
            <div className="vision__cell">
              <span className="vision__label">Severity</span>
              <span className="vision__value">{vision.severity}</span>
            </div>
            <div className="vision__cell">
              <span className="vision__label">Suggested department</span>
              <span className="vision__value">{vision.department}</span>
            </div>
          </div>

          <ConfidenceMeter value={vision.confidence} label="Detection confidence" size="sm" />

          <div className="cluster mt-3">
            {vision.tags?.map((tag) => (
              <span key={tag} className="chip chip--soft">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
