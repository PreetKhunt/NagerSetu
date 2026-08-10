import SectionHeading from "../common/SectionHeading";
import useScrollReveal from "../../hooks/useScrollReveal";
import { CATEGORIES } from "../../utils/constants";

/** Accent pairs keyed by category id, applied via CSS custom properties. */
const ACCENTS = {
  road: ["var(--c-accent-600)", "var(--c-accent-50)"],
  pothole: ["var(--c-danger)", "var(--c-danger-soft)"],
  garbage: ["var(--c-success)", "var(--c-success-soft)"],
  water: ["var(--c-info)", "var(--c-info-soft)"],
  streetlight: ["var(--c-accent-600)", "var(--c-accent-50)"],
  drainage: ["var(--c-secondary-600)", "var(--c-secondary-50)"],
  electricity: ["var(--c-primary-600)", "var(--c-primary-50)"],
  infrastructure: ["var(--c-ink-700)", "var(--c-bg-alt)"],
};

const DESCRIPTIONS = {
  road: "Broken surfaces, cracked stretches and unsafe patches on daily routes.",
  pothole: "Deep pits that cause skids and accidents, worse after every rain.",
  garbage: "Uncollected waste, overflowing bins and unattended dumping spots.",
  water: "Pipeline leaks, wastage and low-pressure supply in the locality.",
  streetlight: "Dark lanes from poles that stay off night after night.",
  drainage: "Blocked or overflowing drains and sewage on the street.",
  electricity: "Hanging wires, repeated outages and unsafe transformers.",
  infrastructure: "Damaged footpaths, benches, parks and public amenities.",
};

/** Grid of the civic issues the platform accepts. */
export default function CivicProblems() {
  const ref = useScrollReveal();

  return (
    <section className="section" id="issues" ref={ref}>
      <div className="container">
        <SectionHeading
          eyebrow="Common civic problems"
          title="The issues citizens report every single day"
          description="Pick a category or just describe the problem — the AI maps it to the right one and forwards it to the department that owns the fix."
        />

        <div className="row g-4">
          {CATEGORIES.map((category, index) => {
            const [accent, soft] = ACCENTS[category.id] ?? [
              "var(--c-primary-600)",
              "var(--c-primary-50)",
            ];

            return (
              <div
                key={category.id}
                className="col-sm-6 col-lg-3 reveal"
                data-reveal-index={index}
              >
                <article
                  className="problem-card"
                  style={{ "--pc-accent": accent, "--pc-soft": soft }}
                >
                  <span className="problem-card__icon" aria-hidden="true">
                    <i className={`bi ${category.icon}`} />
                  </span>
                  <h3 className="problem-card__title">{category.label}</h3>
                  <p className="problem-card__desc">
                    {DESCRIPTIONS[category.id]}
                  </p>
                  <p className="problem-card__dept mb-0">
                    <i className="bi bi-signpost-split" aria-hidden="true" />
                    Routed to <strong>{category.dept}</strong>
                  </p>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
