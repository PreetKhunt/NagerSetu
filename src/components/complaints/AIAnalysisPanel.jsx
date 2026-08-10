import PriorityBadge from "../common/PriorityBadge";
import ConfidenceMeter from "../common/ConfidenceMeter";
import { CATEGORIES } from "../../utils/constants";

/** Rows of the analysis read-out. Kept declarative so the markup stays flat. */
function Row({ icon, label, children }) {
  return (
    <div className="ai-panel__row">
      <span className="ai-panel__row-label">
        <i className={`bi ${icon}`} aria-hidden="true" />
        {label}
      </span>
      <span className="ai-panel__row-value">{children}</span>
    </div>
  );
}

/** Animated placeholder shown while the mock model "thinks". */
function Analyzing() {
  const steps = [
    "Reading your description",
    "Detecting language and intent",
    "Matching the right department",
  ];

  return (
    <div className="ai-panel ai-panel--busy">
      <div className="ai-panel__head">
        <span className="ai-orb ai-orb--busy" aria-hidden="true">
          <i className="bi bi-stars" />
        </span>
        <div>
          <h3 className="ai-panel__title">AI is analyzing your complaint…</h3>
          <p className="ai-panel__sub">This usually takes a moment.</p>
        </div>
      </div>

      <ul className="ai-steps" aria-hidden="true">
        {steps.map((step, index) => (
          <li key={step} className={`ai-steps__item ai-steps__item--${index + 1}`}>
            <span className="ai-steps__dot" />
            {step}
          </li>
        ))}
      </ul>

      <div className="stack-2" aria-hidden="true">
        <div className="skeleton skeleton--text" style={{ width: "85%" }} />
        <div className="skeleton skeleton--text" style={{ width: "60%" }} />
      </div>

      <p className="sr-only" role="status">
        Analyzing your complaint, please wait.
      </p>
    </div>
  );
}

/**
 * AI classification read-out.
 *
 * `loading` drives the processing state; `analysis` renders the result.
 * Every value shown here comes from `aiService`, which is a frontend
 * simulation — there is no model behind it yet.
 */
export default function AIAnalysisPanel({
  analysis,
  loading = false,
  onEdit,
  compact = false,
}) {
  if (loading) return <Analyzing />;
  if (!analysis) return null;

  const categoryIcon =
    CATEGORIES.find((c) => c.id === analysis.category)?.icon ?? "bi-tag";

  return (
    <div className={`ai-panel${compact ? " ai-panel--compact" : ""}`}>
      <div className="ai-panel__head">
        <span className="ai-orb" aria-hidden="true">
          <i className="bi bi-stars" />
        </span>
        <div className="min-w-0">
          <h3 className="ai-panel__title">AI Analysis</h3>
          <p className="ai-panel__sub">
            Generated from your description — review before submitting.
          </p>
        </div>
        {onEdit && (
          <button type="button" className="ai-panel__edit" onClick={onEdit}>
            <i className="bi bi-pencil" aria-hidden="true" />
            Edit
          </button>
        )}
      </div>

      <div className="ai-panel__grid">
        <Row icon={categoryIcon} label="Category">
          {analysis.categoryLabel}
        </Row>

        <Row icon="bi-exclamation-diamond" label="Issue">
          {analysis.issue}
        </Row>

        <Row icon="bi-speedometer2" label="Priority">
          <PriorityBadge priority={analysis.priority} size="sm" showSource />
        </Row>

        <Row icon="bi-building" label="Department">
          {analysis.department}
        </Row>

        <Row icon="bi-geo-alt" label="Location">
          {analysis.location || "Not detected — please add one"}
        </Row>

        <Row icon="bi-translate" label="Language">
          {analysis.language}
        </Row>
      </div>

      <div className="ai-panel__summary">
        <span className="ai-panel__summary-label">AI Summary</span>
        <p className="ai-panel__summary-text">“{analysis.summary}”</p>
      </div>

      {analysis.escalated && (
        <p className="ai-panel__flag">
          <i className="bi bi-arrow-up-circle-fill" aria-hidden="true" />
          Priority raised — your description mentions a safety risk.
        </p>
      )}

      <ConfidenceMeter value={analysis.confidence} />

      {analysis.matchedKeywords?.length > 0 && (
        <div className="cluster mt-3">
          <span className="ai-panel__kw-label">Signals detected:</span>
          {analysis.matchedKeywords.map((keyword) => (
            <span key={keyword} className="chip chip--soft">
              {keyword}
            </span>
          ))}
        </div>
      )}

      <p className="ai-panel__note">
        <i className="bi bi-info-circle" aria-hidden="true" />
        An officer verifies every AI classification before work begins.
      </p>
    </div>
  );
}
