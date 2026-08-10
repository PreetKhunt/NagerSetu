import { useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import Card, { CardHeader } from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import EmptyState from "../../components/common/EmptyState";
import Segmented from "../../components/common/Segmented";
import BarList from "../../components/officer/BarList";
import SlaPanel from "../../components/officer/SlaPanel";
import TrendChart from "../../components/officer/TrendChart";

import useGrievances from "../../hooks/useGrievances";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import {
  categoryBreakdown,
  complaintTrend,
  computeStats,
  departmentWorkload,
  priorityBreakdown,
  statusBreakdown,
} from "../../utils/grievanceUtils";
import {
  PATHS,
  PRIORITY_META,
  STATUS_META,
} from "../../utils/constants";

const RANGES = [
  { id: "7", label: "7 days" },
  { id: "14", label: "14 days" },
  { id: "30", label: "30 days" },
];

/**
 * Analytics over the live complaint list.
 *
 * Nothing here is a stored figure: trends, distributions, workload, resolution
 * rate and average resolution time are all recomputed from `complaints` on
 * every change, which is why resolving one complaint on the detail page moves
 * the resolution rate and the trend line at the same time.
 */
export default function OfficerAnalytics() {
  useDocumentTitle("Analytics");

  const { complaints } = useGrievances();
  const [range, setRange] = useState("14");

  const days = Number(range);
  const stats = useMemo(() => computeStats(complaints), [complaints]);
  const trend = useMemo(
    () => complaintTrend(complaints, { days }),
    [complaints, days],
  );
  const categories = useMemo(() => categoryBreakdown(complaints), [complaints]);
  const priorities = useMemo(() => priorityBreakdown(complaints), [complaints]);
  const statuses = useMemo(() => statusBreakdown(complaints), [complaints]);
  const departments = useMemo(
    () => departmentWorkload(complaints),
    [complaints],
  );

  const avgDays =
    stats.avgResolutionHours == null
      ? null
      : (stats.avgResolutionHours / 24).toFixed(1);

  if (complaints.length === 0) {
    return (
      <div className="stack-6">
        <PageHeader
          title="Analytics"
          description="Trends and distributions across every complaint in the system."
          breadcrumbs={[
            { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
            { label: "Analytics" },
          ]}
        />
        <Card padding="lg">
          <EmptyState
            icon="bi-graph-up"
            title="No data to analyse yet"
            description="Every chart here is computed from live complaints. Once the first grievance is filed, trends and distributions appear automatically."
            actionLabel="Open the queue"
            actionTo={PATHS.OFFICER_COMPLAINTS}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="stack-6">
      <PageHeader
        title="Analytics"
        description="Trends and distributions across every complaint in the system."
        breadcrumbs={[
          { label: "Officer", to: PATHS.OFFICER_DASHBOARD },
          { label: "Analytics" },
        ]}
      />

      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="Resolution rate"
            value={stats.resolutionRate == null ? "—" : `${stats.resolutionRate}%`}
            icon="bi-check2-circle"
            tone="success"
            hint={`${stats.resolved + stats.rejected} of ${stats.total} closed`}
            progress={stats.resolutionRate ?? 0}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="Avg. resolution time"
            value={avgDays == null ? "—" : `${avgDays}d`}
            icon="bi-stopwatch"
            tone="teal"
            hint={
              avgDays == null
                ? "Nothing resolved yet"
                : `${stats.avgResolutionHours} hours across resolved complaints`
            }
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="Open workload"
            value={stats.pending + stats.assigned + stats.inProgress}
            icon="bi-inboxes"
            tone="amber"
            hint={`${stats.pending} still awaiting assignment`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            label="SLA breached"
            value={stats.slaBreached}
            icon="bi-alarm"
            tone="danger"
            hint={`${stats.slaDueSoon} due soon · ${stats.slaOnTrack} on track`}
          />
        </div>
      </div>

      <Card padding="lg">
        <CardHeader
          title="Complaint trend"
          subtitle="Filed against resolved, by day"
          action={
            <Segmented
              options={RANGES}
              value={range}
              onChange={setRange}
              name="trend-range"
              label="Trend range"
              className="segmented--sm"
            />
          }
        />
        <TrendChart series={trend} />
      </Card>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title="Category distribution"
                subtitle="What citizens are reporting most"
              />
              <BarList
                items={categories.map((c) => ({
                  key: c.id,
                  label: c.label,
                  icon: c.icon,
                  value: c.count,
                }))}
              />
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Priority distribution"
                subtitle="Severity mix across the whole queue"
              />
              <BarList
                items={priorities.map((p) => ({
                  key: p.priority,
                  label: PRIORITY_META[p.priority].label,
                  icon: PRIORITY_META[p.priority].icon,
                  value: p.count,
                }))}
              />
            </Card>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="stack-4">
            <Card padding="lg">
              <CardHeader
                title="Status distribution"
                subtitle="Where complaints currently sit in the lifecycle"
              />
              <BarList
                items={statuses.map((s) => ({
                  key: s.status,
                  label: STATUS_META[s.status].label,
                  icon: STATUS_META[s.status].icon,
                  value: s.count,
                }))}
              />
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Department workload"
                subtitle="Total complaints handled per department"
              />
              <BarList
                items={departments.map((d) => ({
                  key: d.name,
                  label: d.name,
                  value: d.total,
                  hint:
                    d.resolutionRate == null
                      ? "Nothing closed yet"
                      : `${d.resolutionRate}% closed · ${d.slaBreached} past SLA`,
                }))}
              />
            </Card>
          </div>
        </div>
      </div>

      <SlaPanel complaints={complaints} limit={5} />
    </div>
  );
}
