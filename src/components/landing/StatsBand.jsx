import useCountUp from "../../hooks/useCountUp";
import { PLATFORM_STATS } from "../../utils/mockData";

/** Dark statistics band with count-up metrics. */
export default function StatsBand() {
  return (
    <section className="section section--tight section--inverse stat-band" id="impact">
      <span className="glow glow--primary stat-band__glow" aria-hidden="true" />
      <span className="bg-dots-inverse" aria-hidden="true" />

      <div className="container position-relative">
        <div className="row g-0">
          {PLATFORM_STATS.map((stat, index) => (
            <div key={stat.label} className="col-6 col-md-3">
              <Metric
                {...stat}
                divided={index < PLATFORM_STATS.length - 1}
              />
            </div>
          ))}
        </div>

        <p className="text-center text-muted-inverse small mb-0 mt-4">
          Illustrative figures for the prototype — these will be driven by live
          data once the platform is connected to municipal systems.
        </p>
      </div>
    </section>
  );
}

function Metric({ value, suffix, label, divided }) {
  const decimals = Number.isInteger(value) ? 0 : 1;
  const [ref, current] = useCountUp(value, { decimals });

  return (
    <div className="stat-metric" ref={ref}>
      <span className="stat-metric__value">
        {decimals > 0 ? current.toFixed(1) : current}
        <span className="stat-metric__suffix">{suffix}</span>
      </span>
      <span className="stat-metric__label">{label}</span>
      {divided && (
        <span className="stat-metric__divider d-none d-md-block" aria-hidden="true" />
      )}
    </div>
  );
}
