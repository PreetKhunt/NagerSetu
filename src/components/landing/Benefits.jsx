import SectionHeading from "../common/SectionHeading";
import useScrollReveal from "../../hooks/useScrollReveal";

const CITIZEN = [
  {
    title: "Report in under a minute",
    desc: "One voice note or a short message is enough — no forms, no office visit, no working hours.",
  },
  {
    title: "Your own language",
    desc: "Speak or write in Hindi, Marathi, Tamil and more. The system detects it and takes it from there.",
  },
  {
    title: "A complaint ID you can trust",
    desc: "Every submission returns a trackable ID with a live timeline you can check any time.",
  },
  {
    title: "Collective weight",
    desc: "When neighbours report the same issue, the reports merge and the priority rises together.",
  },
];

const GOVERNMENT = [
  {
    title: "Pre-sorted, pre-routed queues",
    desc: "Complaints arrive already classified and assigned, so staff time goes to fixing, not filing.",
  },
  {
    title: "Fewer duplicate tickets",
    desc: "Near-identical reports from the same area collapse into one case with an accurate report count.",
  },
  {
    title: "Priority that reflects risk",
    desc: "Safety-critical issues rise to the top instead of waiting behind whatever arrived first.",
  },
  {
    title: "Accountability by default",
    desc: "Timestamped stage transitions give supervisors a clear view of load, delays and resolution rates.",
  },
];

/** Two-column benefits panel: citizens on the left, departments on the right. */
export default function Benefits() {
  const ref = useScrollReveal();

  return (
    <section className="section" id="benefits" ref={ref}>
      <div className="container">
        <SectionHeading
          eyebrow="Who it helps"
          title="One platform, two very different jobs to do"
          description="Citizens need speed and visibility. Departments need clean, prioritised, non-duplicated work. The AI layer is what lets both happen at once."
        />

        <div className="row g-4 align-items-stretch">
          <div className="col-lg-6 reveal">
            <Panel
              variant="citizen"
              icon="bi-people"
              title="For citizens"
              subtitle="Report once, then simply watch it move"
              items={CITIZEN}
            />
          </div>
          <div className="col-lg-6 reveal" data-reveal-index="1">
            <Panel
              variant="gov"
              icon="bi-building"
              title="For government"
              subtitle="Less triage, faster closure, clearer accountability"
              items={GOVERNMENT}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ variant, icon, title, subtitle, items }) {
  return (
    <div className={`benefit-panel benefit-panel--${variant}`}>
      <div className="benefit-panel__head">
        <span
          className={`icon-tile icon-tile--lg${variant === "gov" ? " icon-tile--teal" : ""}`}
          aria-hidden="true"
        >
          <i className={`bi ${icon}`} />
        </span>
        <div>
          <h3 className="benefit-panel__title">{title}</h3>
          <p className="benefit-panel__sub">{subtitle}</p>
        </div>
      </div>

      <ul className="benefit-list">
        {items.map((item) => (
          <li key={item.title} className="benefit-list__item">
            <span className="benefit-list__check" aria-hidden="true">
              <i className="bi bi-check-lg" />
            </span>
            <div>
              <p className="benefit-list__title">{item.title}</p>
              <p className="benefit-list__desc">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
