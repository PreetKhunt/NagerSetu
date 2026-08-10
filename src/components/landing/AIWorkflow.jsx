import SectionHeading from "../common/SectionHeading";
import useScrollReveal from "../../hooks/useScrollReveal";

const STEPS = [
  {
    title: "Citizen",
    desc: "Speaks, types or uploads a photo of the issue — in any supported language.",
    tag: "Voice · Text · Image",
    icon: "bi-person-raised-hand",
  },
  {
    title: "AI Understanding",
    desc: "The complaint is transcribed, translated and read for intent, category and severity.",
    tag: "NLP + Vision",
    icon: "bi-cpu",
  },
  {
    title: "Smart Routing",
    desc: "The predicted department and ward officer are matched automatically — no manual sorting.",
    tag: "Auto-assignment",
    icon: "bi-diagram-3",
  },
  {
    title: "Officer Action",
    desc: "Officers see a prioritised, de-duplicated queue with location context and evidence.",
    tag: "Priority queue",
    icon: "bi-tools",
  },
  {
    title: "Resolution",
    desc: "Status updates flow back to the citizen with proof of closure and a feedback loop.",
    tag: "Closure proof",
    icon: "bi-check2-circle",
  },
];

/** The five-stage pipeline: Citizen → AI → Routing → Officer → Resolution. */
export default function AIWorkflow() {
  const ref = useScrollReveal();

  return (
    <section className="section section--alt" id="workflow" ref={ref}>
      <div className="container">
        <SectionHeading
          eyebrow="How the AI works"
          title="From a spoken sentence to a closed complaint"
          description="Every grievance moves through the same transparent pipeline, so citizens always know where their issue stands and departments never receive misrouted work."
        />

        <div className="flow">
          {STEPS.map((step, index) => (
            <article
              key={step.title}
              className="flow__step reveal"
              data-reveal-index={index}
            >
              <span className="icon-tile" aria-hidden="true">
                <i className={`bi ${step.icon}`} />
              </span>
              <span className="flow__num" />
              <h3 className="flow__title">{step.title}</h3>
              <p className="flow__desc">{step.desc}</p>
              <span className="flow__tag">
                <i className="bi bi-dot" aria-hidden="true" />
                {step.tag}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
