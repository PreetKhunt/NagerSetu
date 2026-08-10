import SectionHeading from "../common/SectionHeading";
import useScrollReveal from "../../hooks/useScrollReveal";

const OLD_WAY = [
  "Queue at the ward office during working hours only",
  "Complaint written in a register, no ID to follow up with",
  "Forms available in one language, often only English",
  "Files land in the wrong department and bounce for weeks",
  "Fifty people report one pothole as fifty separate cases",
  "No idea who owns the issue or when it will be fixed",
];

const NEW_WAY = [
  "Report in 60 seconds from a phone, any time of day",
  "Instant complaint ID with a live status timeline",
  "Speak or type in your own language — 8 supported",
  "AI predicts the department and routes it on submission",
  "Duplicate reports merge into one case with real weight",
  "Every stage is timestamped, visible and accountable",
];

/** Side-by-side comparison of the manual process against the platform. */
export default function WhyPlatform() {
  const ref = useScrollReveal();

  return (
    <section className="section section--alt" id="why" ref={ref}>
      <div className="container">
        <SectionHeading
          eyebrow="Why this platform"
          title="The complaint is not the hard part. The follow-up is."
          description="Municipal bodies already receive thousands of grievances. What breaks is classification, routing and visibility — which is exactly where the AI layer sits."
        />

        <div className="row g-4 align-items-stretch">
          <div className="col-lg-6 reveal">
            <div className="why-card why-card--old">
              <span className="why-card__label">
                <i className="bi bi-clock-history" aria-hidden="true" />
                The manual process
              </span>
              <ul className="why-list">
                {OLD_WAY.map((item) => (
                  <li key={item} className="why-list__item">
                    <i
                      className="why-list__icon bi bi-x-circle-fill"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-6 reveal" data-reveal-index="1">
            <div className="why-card why-card--new">
              <span className="why-card__label">
                <i className="bi bi-stars" aria-hidden="true" />
                With NagarSetu
              </span>
              <ul className="why-list">
                {NEW_WAY.map((item) => (
                  <li key={item} className="why-list__item">
                    <i
                      className="why-list__icon bi bi-check-circle-fill"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
