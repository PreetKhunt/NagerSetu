import { useMemo } from "react";
import { Link } from "react-router-dom";

import Card, { CardHeader } from "../common/Card";
import {
  formatRemaining,
  slaFor,
  slaSummary,
} from "../../utils/grievanceUtils";
import {
  PRIORITY,
  SLA_HOURS,
  SLA_META,
  SLA_STATE,
  officerComplaintPath,
} from "../../utils/constants";

/**
 * SLA standing across the queue.
 *
 * Windows come from `SLA_HOURS` (critical 24h, high 48h, medium 3 days,
 * low 7 days) and every count here is measured per complaint at render time —
 * a complaint crosses into "breached" because the clock passed its window, not
 * because a flag was written somewhere.
 *
 * Closed complaints are reported separately rather than folded into on-track.
 * A resolved complaint is not "on track"; counting it there would inflate the
 * healthy bucket every time work was finished.
 */
export default function SlaPanel({ complaints = [], limit = 4 }) {
  const { summary, urgent } = useMemo(() => {
    const now = Date.now();

    // Breached first, then whatever is closest to breaching.
    const open = complaints
      .map((complaint) => ({ complaint, sla: slaFor(complaint, now) }))
      .filter((row) => !row.sla.closed)
      .sort((a, b) => a.sla.remainingMs - b.sla.remainingMs);

    return {
      summary: slaSummary(complaints, now),
      urgent: open.slice(0, limit),
    };
  }, [complaints, limit]);

  const buckets = [
    SLA_STATE.BREACHED,
    SLA_STATE.DUE_SOON,
    SLA_STATE.ON_TRACK,
    SLA_STATE.CLOSED,
  ];

  return (
    <Card padding="lg">
      <CardHeader
        title="SLA performance"
        subtitle={`Critical ${SLA_HOURS[PRIORITY.CRITICAL]}h · High ${
          SLA_HOURS[PRIORITY.HIGH]
        }h · Medium ${SLA_HOURS[PRIORITY.MEDIUM] / 24}d · Low ${
          SLA_HOURS[PRIORITY.LOW] / 24
        }d`}
      />

      <ul className="sla-grid">
        {buckets.map((state) => {
          const meta = SLA_META[state];
          return (
            <li className={`sla-grid__cell sla-grid__cell--${meta.tone}`} key={state}>
              <i className={`bi ${meta.icon}`} aria-hidden="true" />
              <span className="sla-grid__value">{summary[state]}</span>
              <span className="sla-grid__label">{meta.label}</span>
            </li>
          );
        })}
      </ul>

      {urgent.length === 0 ? (
        <p className="sla-panel__clear">
          <i className="bi bi-check2-circle" aria-hidden="true" />
          Nothing open against the clock.
        </p>
      ) : (
        <>
          <p className="sla-panel__caption">Closest to breach</p>
          <ul className="sla-panel__list">
            {urgent.map(({ complaint, sla }) => (
              <li key={complaint.id}>
                <Link
                  className="sla-panel__row"
                  to={officerComplaintPath(complaint.id)}
                >
                  <span className="sla-panel__main">
                    <span className="mono sla-panel__id">{complaint.id}</span>
                    <span className="sla-panel__title">{complaint.title}</span>
                  </span>
                  <span
                    className={`sla-panel__clock sla-panel__clock--${
                      SLA_META[sla.state].tone
                    }`}
                  >
                    {formatRemaining(sla.remainingMs)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
