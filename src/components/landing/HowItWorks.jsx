import SectionHeading from "../common/SectionHeading";
import useScrollReveal from "../../hooks/useScrollReveal";

const STEPS = [
  {
    title: "Describe the issue",
    desc: "Record a voice note, type a few lines or upload a photo. No forms, no jargon, no fixed format — describe it the way you would to a neighbour.",
    chips: ["Voice note", "Free text", "Photo upload", "Any language"],
  },
  {
    title: "AI reads and classifies it",
    desc: "Speech is transcribed, the language is detected and the text is classified into a civic category. Attached images are checked for severity cues.",
    chips: ["Speech-to-text", "Language detection", "Category prediction"],
  },
  {
    title: "It reaches the right desk",
    desc: "The predicted category maps to a department and ward. Duplicate reports of the same issue are merged so one problem is one case.",
    chips: ["Department routing", "Ward mapping", "Duplicate merge"],
  },
  {
    title: "Officers act on priority",
    desc: "Each case carries a priority score from severity, location sensitivity and how many citizens reported it — so critical work surfaces first.",
    chips: ["Priority score", "Evidence view", "Assignment"],
  },
  {
    title: "You watch it close",
    desc: "Registered, Assigned, In Progress, Resolved — every transition is timestamped and pushed back to you, with closure proof at the end.",
    chips: ["Live timeline", "Closure proof", "Feedback"],
  },
];

/** Numbered vertical timeline explaining the citizen journey. */
export default function HowItWorks() {
  const ref = useScrollReveal();

  return (
    <section className="section" id="how-it-works" ref={ref}>
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-4">
            <SectionHeading
              align="start"
              eyebrow="How it works"
              title="Five steps, start to finish"
              description="No account jargon, no department codes to memorise. You describe the problem — the system does the routing."
              className="mb-0"
            />
          </div>

          <div className="col-lg-8">
            <div className="steps">
              {STEPS.map((step, index) => (
                <article
                  key={step.title}
                  className="step-row reveal"
                  data-reveal-index={index}
                >
                  <div className="step-row__marker">
                    <span className="step-row__num">{index + 1}</span>
                    <span className="step-row__line" aria-hidden="true" />
                  </div>
                  <div className="step-row__body">
                    <h3 className="step-row__title">{step.title}</h3>
                    <p className="step-row__desc">{step.desc}</p>
                    <div className="step-row__chips">
                      {step.chips.map((chip) => (
                        <span key={chip} className="chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
