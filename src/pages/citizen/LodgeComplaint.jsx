import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Segmented from "../../components/common/Segmented";
import FormField from "../../components/common/FormField";
import SelectField from "../../components/common/SelectField";
import TextareaField from "../../components/common/TextareaField";
import AIAnalysisPanel from "../../components/complaints/AIAnalysisPanel";
import VoiceRecorder from "../../components/complaints/VoiceRecorder";
import ImageDropzone from "../../components/complaints/ImageDropzone";

import useToast from "../../hooks/useToast";
import useAuth from "../../hooks/useAuth";
import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import * as aiService from "../../services/aiService";
import { SAVED_LOCATIONS } from "../../utils/mockData";
import { nearestLocation } from "../../utils/grievanceUtils";
import {
  CATEGORIES,
  COMPLAINT_MAX_CHARS,
  COMPLAINT_MIN_CHARS,
  INPUT_MODES,
  PATHS,
} from "../../utils/constants";

const MODE_IDS = INPUT_MODES.map((m) => m.id);

const CATEGORY_OPTIONS = [
  { value: "", label: "Let AI decide (recommended)" },
  ...CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
];

const PLACEHOLDER =
  "Example: There is a large pothole near Parul University Gate 2 and two-wheelers are skidding every evening.";

/**
 * Lodge a complaint — text, voice or photo.
 *
 * The AI values come from `aiService`, which is keyword matching rather than a
 * model, and the voice transcript comes from the browser's speech engine. The
 * flow is deliberately three steps (describe → review AI → confirm) so a
 * misclassification is always caught by the citizen before submission.
 *
 * Submitting writes straight into the shared store, which is why the complaint
 * is on the officer's queue before the success screen has finished animating.
 */
export default function LodgeComplaint() {
  useDocumentTitle("Lodge a complaint");

  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { createComplaint } = useGrievances();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedMode = searchParams.get("mode");
  const [mode, setMode] = useState(
    MODE_IDS.includes(requestedMode) ? requestedMode : "text",
  );

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [transcript, setTranscript] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [coords, setCoords] = useState(null);
  const [vision, setVision] = useState(null);

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const panelRef = useRef(null);

  const trimmed = description.trim();
  const enoughText = trimmed.length >= COMPLAINT_MIN_CHARS;

  /** Keep the tab reflected in the URL so the voice deep link is shareable. */
  const changeMode = (next) => {
    setMode(next);
    setAnalysis(null);
    setErrors({});
    const params = new URLSearchParams(searchParams);
    if (next === "text") params.delete("mode");
    else params.set("mode", next);
    setSearchParams(params, { replace: true });
  };

  // Scroll the analysis into view once it lands — on mobile it is below the fold.
  useEffect(() => {
    if (analysis) panelRef.current?.scrollIntoView({ block: "nearest" });
  }, [analysis]);

  const activeMode = INPUT_MODES.find((m) => m.id === mode);

  const readiness = useMemo(() => {
    if (mode === "text") {
      if (!enoughText) return `Describe the issue in at least ${COMPLAINT_MIN_CHARS} characters.`;
    } else if (mode === "voice") {
      if (!transcript) return "Record your complaint to continue.";
    } else if (mode === "image") {
      if (!imageFile) return "Add a photo to continue.";
      if (!vision) return "Wait for AI to analyze the photo.";
      if (!vision.valid) return "Please provide a relevant image for this category.";
      if (!enoughText) return `Describe the issue in at least ${COMPLAINT_MIN_CHARS} characters.`;
    }
    return null;
  }, [mode, transcript, imageFile, enoughText, vision]);

  const runAnalysis = async () => {
    if (readiness) {
      setErrors({ description: readiness });
      return;
    }

    setErrors({});
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await aiService.analyzeText(trimmed, { location });
      // A manual category choice overrides the model, and the department
      // has to follow it — otherwise routing would contradict the label.
      const final =
        category && category !== result.category
          ? {
              ...result,
              category,
              categoryLabel:
                CATEGORIES.find((c) => c.id === category)?.label ?? result.categoryLabel,
              department:
                CATEGORIES.find((c) => c.id === category)?.dept ?? result.department,
              overridden: true,
            }
          : result;
      setAnalysis(final);
    } catch {
      toast.error(
        "Analysis failed",
        "We could not classify that just now. You can still submit.",
      );
    } finally {
      setAnalyzing(false);
    }
  };
  /**
   * Real browser geolocation.
   *
   * There is no reverse-geocoding service wired up, so rather than invent a
   * street name we snap to the nearest known landmark when the fix is close to
   * one and otherwise show the actual coordinates. The precise point is kept
   * either way and travels with the complaint to the officer's map.
   * TODO(api): send the coordinates to a geocoder for a proper address.
   */
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Location unavailable",
        "This browser cannot share your location. Please type the area or landmark.",
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: fix }) => {
        const point = { latitude: fix.latitude, longitude: fix.longitude };
        setCoords(point);

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${fix.latitude}&lon=${fix.longitude}`);
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          const address = data.display_name || `Near ${fix.latitude.toFixed(4)}, ${fix.longitude.toFixed(4)}`;
          setLocation(address);
          toast.success("Location detected", "Coordinates captured and mapped");
        } catch (error) {
          const near = nearestLocation(point);
          setLocation(near ?? `Near ${fix.latitude.toFixed(4)}, ${fix.longitude.toFixed(4)}`);
          toast.success("Location detected", near ?? "Coordinates captured");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toast.error(
          "Location unavailable",
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked. Please type the area or landmark instead."
            : "We could not get a fix. Please type the area or landmark instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const complaint = await createComplaint(
        {
          description: trimmed,
          location,
          coords,
          mode,
          analysis,
          imageName: imageFile?.name ?? null,
          image: imageData,
          voiceTranscript: transcript?.transcript ?? null,
          title: analysis?.issue,
        },
        user,
      );

      setConfirmOpen(false);
      toast.success("Complaint registered", `Reference ${complaint.id}`);
      navigate(PATHS.CITIZEN_SUCCESS, {
        replace: true,
        state: { complaintId: complaint.id },
      });
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Submission failed", err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack-6">
      <PageHeader
        title="Lodge a complaint"
        description="Describe the problem in your own words. AI classifies it, sets a priority and routes it to the right department."
        breadcrumbs={[
          { label: "Citizen", to: PATHS.CITIZEN_DASHBOARD },
          { label: "Lodge complaint" },
        ]}
        actions={
          <Button variant="ghost" to={PATHS.CITIZEN_COMPLAINTS} icon="bi-card-checklist">
            My complaints
          </Button>
        }
      />

      <div className="row g-4">
        {/* ---------- Composer ---------- */}
        <div className="col-12 col-xl-7">
          <Card padding="lg">
            <CardHeader
              title="How would you like to report?"
              subtitle={activeMode?.hint}
            />

            <Segmented
              options={INPUT_MODES}
              value={mode}
              onChange={changeMode}
              name="input-mode"
              label="Complaint input mode"
              className="mb-4"
            />

            {mode === "voice" && (
              <div className="mb-4">
                <VoiceRecorder
                  transcript={transcript}
                  disabled={submitting}
                  onTranscript={(result) => {
                    setTranscript(result);
                    setAnalysis(null);
                    // Transcript feeds the same textarea, so the citizen can
                    // correct a mis-heard word before anything is classified.
                    setDescription(result?.transcript ?? "");
                  }}
                />
              </div>
            )}

            {mode === "image" && (
              <div className="mb-4">
                <ImageDropzone
                  disabled={submitting}
                  selectedCategory={category}
                  onFileChange={(file, dataUrl) => {
                    setImageFile(file);
                    setImageData(dataUrl);
                    if (!file) setVision(null);
                  }}
                  onAnalysis={(result) => {
                    setVision(result);
                    setAnalysis(null);
                    if (result?.valid) {
                      if (!category) setCategory(result.category);
                      if (result.description) setDescription(result.description);
                    }
                  }}
                />
              </div>
            )}

            <form
              className="stack-4"
              onSubmit={(event) => {
                event.preventDefault();
                runAnalysis();
              }}
            >
              <TextareaField
                label={
                  mode === "voice"
                    ? "Transcript — edit if anything is wrong"
                    : "Describe your problem"
                }
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={PLACEHOLDER}
                rows={7}
                required
                showCount
                maxLength={COMPLAINT_MAX_CHARS}
                error={errors.description}
                hint={
                  vision?.label
                    ? `Photo analysis suggests ${vision.label.toLowerCase()} — add anything the picture cannot show.`
                    : "Mention the nearest landmark and how long the problem has existed."
                }
              />

              <div className="row g-3">
                <div className="col-12 col-md-7">
                  <FormField
                    label="Location"
                    name="location"
                    icon="bi-geo-alt"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Area, landmark or ward"
                    list="saved-locations"
                    hint="Leave blank and AI will read a landmark from your description."
                  />
                  <datalist id="saved-locations">
                    {SAVED_LOCATIONS.map((place) => (
                      <option key={place} value={place} />
                    ))}
                  </datalist>
                </div>

                <div className="col-12 col-md-5 d-flex align-items-end">
                  <Button
                    variant="secondary"
                    icon="bi-crosshair"
                    block
                    loading={locating}
                    onClick={useMyLocation}
                  >
                    Use my location
                  </Button>
                </div>
              </div>

              <SelectField
                label="Category"
                name="category"
                icon="bi-tags"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                options={CATEGORY_OPTIONS}
                hint="Only override this if the AI suggestion looks wrong."
              />

              <div className="lodge__actions">
                <Button
                  type="button"
                  icon="bi-stars"
                  loading={analyzing}
                  disabled={Boolean(readiness) || submitting}
                  onClick={(e) => {
                    console.log("=== ANALYZE CLICK ===");
                    console.log("mode:", mode);
                    console.log("hasText:", trimmed.length > 0);
                    console.log("hasVoice:", !!transcript);
                    console.log("hasImage:", !!imageFile);
                    console.log("descriptionLength:", trimmed.length);
                    console.log("locationValid:", true);
                    console.log("categoryValid:", true);
                    console.log("modeInputValid:", !readiness);
                    console.log("analysisAllowed:", !readiness && !submitting);
                    if (readiness) {
                       console.log("EXACT reason:", readiness);
                    }
                    runAnalysis();
                  }}
                >
                  {analysis ? "Re-run AI analysis" : "Analyze with AI"}
                </Button>

                <Button
                  variant="primary"
                  icon="bi-send"
                  disabled={!analysis || analyzing || submitting}
                  onClick={() => {
                    console.log("=== SUBMIT CLICK ===");
                    console.log("mode:", mode);
                    console.log("analysisCompleted:", !!analysis);
                    console.log("isCivicIssue:", vision?.is_civic_issue ?? null);
                    console.log("isRelevant:", vision?.is_relevant ?? null);
                    console.log("submissionAllowed:", !!analysis && !analyzing && !submitting);
                    if (!analysis) {
                      console.log("submissionBlockReason:", "AI analysis not completed or cleared.");
                    }
                    setConfirmOpen(true);
                  }}
                >
                  Submit complaint
                </Button>
              </div>

              {readiness && !errors.description && (
                <p className="lodge__gate">
                  <i className="bi bi-info-circle" aria-hidden="true" />
                  {readiness}
                </p>
              )}
            </form>
          </Card>
        </div>

        {/* ---------- AI column ---------- */}
        <div className="col-12 col-xl-5">
          <div className="stack-4" ref={panelRef}>
            {(analyzing || analysis) && (
              <AIAnalysisPanel
                analysis={analysis}
                loading={analyzing}
                onEdit={() => {
                  setAnalysis(null);
                  document.getElementsByName("description")[0]?.focus();
                }}
              />
            )}

            {!analyzing && !analysis && (
              <Card padding="lg" sunken>
                <div className="lodge__idle">
                  <span className="ai-orb ai-orb--idle" aria-hidden="true">
                    <i className="bi bi-stars" />
                  </span>
                  <h3 className="lodge__idle-title">AI analysis appears here</h3>
                  <p className="lodge__idle-text">
                    Once you describe the issue, we detect the category, set a
                    priority and pick the department that owns it — before you
                    submit anything.
                  </p>
                  <ul className="lodge__idle-list">
                    {[
                      "Category and specific issue",
                      "Priority, raised automatically for safety risks",
                      "Responsible department and confidence score",
                    ].map((item) => (
                      <li key={item}>
                        <i className="bi bi-check-circle-fill" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            <Card padding="lg">
              <CardHeader
                title="Write a stronger complaint"
                subtitle="Clearer reports reach the right desk faster."
              />
              <ul className="lodge__tips">
                {[
                  {
                    icon: "bi-geo-alt",
                    text: "Name the nearest landmark, gate or lane number.",
                  },
                  {
                    icon: "bi-camera",
                    text: "Attach a photo — vision analysis confirms severity.",
                  },
                  {
                    icon: "bi-clock-history",
                    text: "Say how long the problem has been there.",
                  },
                  {
                    icon: "bi-translate",
                    text: "Write in your own language; we translate for the officer.",
                  },
                ].map((tip) => (
                  <li key={tip.text}>
                    <i className={`bi ${tip.icon}`} aria-hidden="true" />
                    <span>{tip.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* ---------- Confirmation ---------- */}
      <Modal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="Submit this complaint?"
        description="It is sent to the department below and you receive a tracking ID."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Keep editing
            </Button>
            <Button icon="bi-send" loading={submitting} onClick={submit}>
              Confirm and submit
            </Button>
          </>
        }
      >
        {analysis && (
          <dl className="confirm-list">
            <div>
              <dt>Issue</dt>
              <dd>{analysis.issue}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{analysis.categoryLabel}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{analysis.department}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{location || analysis.location || "Not specified"}</dd>
            </div>
            {imageFile && (
              <div>
                <dt>Photo</dt>
                <dd>{imageFile.name}</dd>
              </div>
            )}
          </dl>
        )}

        <p className="text-muted-soft small mb-0 mt-3">
          False or misleading complaints can be closed without action.
        </p>
      </Modal>
    </div>
  );
}
