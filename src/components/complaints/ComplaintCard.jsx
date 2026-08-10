import { Link } from "react-router-dom";

import StatusBadge from "../common/StatusBadge";
import PriorityBadge from "../common/PriorityBadge";
import { timeAgo, truncate } from "../../utils/formatters";
import { CATEGORIES } from "../../utils/constants";

/**
 * Summary card for a single complaint.
 *
 * Renders as a <Link> with `to`, a <button> with `onClick`, otherwise a plain
 * <article> — so the whole card is one keyboard-reachable target without any
 * call site needing a nested anchor.
 */
export default function ComplaintCard({ complaint, to, onClick, compact = false }) {
  if (!complaint) return null;

  const {
    id,
    title,
    description,
    status,
    priority,
    department,
    location,
    updatedAt,
    createdAt,
    aiConfidence,
    language,
    isVoice,
    hasImage,
    duplicatesMerged,
    category,
  } = complaint;

  const categoryIcon =
    CATEGORIES.find((c) => c.id === category)?.icon ?? "bi-file-earmark-text";

  const interactive = Boolean(to || onClick);
  const Tag = to ? Link : onClick ? "button" : "article";

  return (
    <Tag
      className={`complaint-card${interactive ? " complaint-card--clickable" : ""}`}
      to={to || undefined}
      onClick={onClick}
      type={!to && onClick ? "button" : undefined}
    >
      <div className="complaint-card__top">
        <span className="icon-tile icon-tile--sm" aria-hidden="true">
          <i className={`bi ${categoryIcon}`} />
        </span>

        <div className="flex-grow-1 min-w-0">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="complaint-card__id">{id}</span>
            {isVoice && (
              <span className="complaint-card__ai">
                <i className="bi bi-mic-fill" aria-hidden="true" />
                Voice
              </span>
            )}
            {hasImage && (
              <span className="complaint-card__ai">
                <i className="bi bi-image" aria-hidden="true" />
                Photo
              </span>
            )}
          </div>
          <h3 className="complaint-card__title">{title}</h3>
        </div>

        <div className="complaint-card__badges d-none d-sm-flex flex-column align-items-end">
          <StatusBadge status={status} size="sm" />
        </div>
      </div>

      {!compact && description && (
        <p className="complaint-card__desc">{truncate(description, 150)}</p>
      )}

      <div className="complaint-card__badges d-sm-none">
        <StatusBadge status={status} size="sm" />
        <PriorityBadge priority={priority} size="sm" />
      </div>

      <div className="complaint-card__meta">
        <span className="complaint-card__meta-item d-none d-sm-inline-flex">
          <PriorityBadge priority={priority} size="sm" showSource />
        </span>
        {department && (
          <span className="complaint-card__meta-item">
            <i className="bi bi-building" aria-hidden="true" />
            {department}
          </span>
        )}
        {location && (
          <span className="complaint-card__meta-item">
            <i className="bi bi-geo-alt" aria-hidden="true" />
            {location}
          </span>
        )}
        <span className="complaint-card__meta-item">
          <i className="bi bi-clock-history" aria-hidden="true" />
          Updated {timeAgo(updatedAt ?? createdAt)}
        </span>
        {language && (
          <span className="complaint-card__meta-item">
            <i className="bi bi-translate" aria-hidden="true" />
            {language}
          </span>
        )}
        {aiConfidence != null && (
          <span className="complaint-card__meta-item">
            <i className="bi bi-cpu" aria-hidden="true" />
            AI {Math.round(aiConfidence * 100)}%
          </span>
        )}
        {duplicatesMerged > 0 && (
          <span className="complaint-card__meta-item">
            <i className="bi bi-collection" aria-hidden="true" />
            {duplicatesMerged} similar merged
          </span>
        )}
      </div>
    </Tag>
  );
}
