import SectionHeading from "../common/SectionHeading";
import useScrollReveal from "../../hooks/useScrollReveal";

const FEATURES = [
  {
    title: "Voice Complaint",
    tag: "AI",
    icon: "bi-mic",
    tone: "",
    desc: "Speak the problem instead of typing it. Audio is transcribed and cleaned into a structured complaint.",
    list: ["Speech-to-text", "Noise tolerant", "Hands-free"],
  },
  {
    title: "AI Classification",
    tag: "AI",
    icon: "bi-cpu",
    tone: "teal",
    desc: "Free-form text is sorted into the right civic category without the citizen picking from a dropdown.",
    list: ["8 categories", "Intent parsing", "Confidence score"],
  },
  {
    title: "Smart Department Routing",
    tag: "AI",
    icon: "bi-diagram-3",
    tone: "",
    desc: "The responsible department and ward officer are predicted at submission, so nothing sits unassigned.",
    list: ["22+ departments", "Ward mapping", "Zero manual sorting"],
  },
  {
    title: "Priority Detection",
    tag: "AI",
    icon: "bi-exclamation-triangle",
    tone: "amber",
    desc: "Severity, public-safety risk and report volume combine into a priority so urgent work surfaces first.",
    list: ["Critical → Low", "Safety weighting", "Volume signal"],
  },
  {
    title: "Location Intelligence",
    tag: "Geo",
    icon: "bi-geo-alt",
    tone: "teal",
    desc: "Complaints are pinned to a ward and locality, giving officers spatial context and clustering by hotspot.",
    list: ["Ward tagging", "Hotspot clusters", "Map-ready"],
  },
  {
    title: "Duplicate Detection",
    tag: "AI",
    icon: "bi-copy",
    tone: "",
    desc: "Fifty reports of one pothole become a single case with fifty voices behind it, instead of fifty tickets.",
    list: ["Text similarity", "Geo proximity", "Auto-merge"],
  },
  {
    title: "Complaint Tracking",
    tag: "Live",
    icon: "bi-activity",
    tone: "success",
    desc: "A timestamped timeline from Registered to Resolved, visible to the citizen at every stage.",
    list: ["Live status", "Closure proof", "Complaint ID"],
  },
  {
    title: "Multilingual Support",
    tag: "AI",
    icon: "bi-translate",
    tone: "teal",
    desc: "Report in Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada or English — the language is detected for you.",
    list: ["8 languages", "Auto-detect", "Native script"],
  },
];

/** The eight capability cards. */
export default function Features() {
  const ref = useScrollReveal();

  return (
    <section className="section section--alt" id="features" ref={ref}>
      <div className="container">
        <SectionHeading
          eyebrow="Platform features"
          title="Built around what actually slows resolution down"
          description="Each capability removes one specific bottleneck in the grievance lifecycle — from how a complaint is captured to how its closure is proved."
        />

        <div className="row g-4">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="col-md-6 col-xl-3 reveal"
              data-reveal-index={index}
            >
              <article className="feature-card">
                <span
                  className={`icon-tile${feature.tone ? ` icon-tile--${feature.tone}` : ""}`}
                  aria-hidden="true"
                >
                  <i className={`bi ${feature.icon}`} />
                </span>
                <h3 className="feature-card__title">
                  {feature.title}
                  <span className="feature-card__tag">{feature.tag}</span>
                </h3>
                <p className="feature-card__desc">{feature.desc}</p>
                <ul className="feature-card__list">
                  {feature.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
