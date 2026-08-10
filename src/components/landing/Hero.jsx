import Button from "../common/Button";
import { PATHS } from "../../utils/constants";

const TRUST = [
  { icon: "bi-translate", value: "8 languages", label: "Voice & text input" },
  { icon: "bi-diagram-3", value: "22+ departments", label: "Auto-routed" },
  { icon: "bi-shield-check", value: "Tracked", label: "End to end" },
];

const ISSUES = [
  { icon: "bi-cone-striped", label: "Road damage" },
  { icon: "bi-trash3", label: "Garbage" },
  { icon: "bi-droplet-half", label: "Water leakage" },
  { icon: "bi-lightbulb", label: "Street lights" },
  { icon: "bi-water", label: "Drainage" },
  { icon: "bi-lightning-charge", label: "Electricity" },
];

/** Landing hero: headline, CTAs, trust strip and the CSS-only app preview. */
export default function Hero() {
  return (
    <section className="hero" id="top">
      <span className="bg-grid" aria-hidden="true" />
      <span className="glow glow--primary hero__glow-a" aria-hidden="true" />
      <span className="glow glow--teal hero__glow-b" aria-hidden="true" />

      <div className="container position-relative">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="eyebrow mb-4 d-inline-flex">
              AI-Powered Civic Grievance Platform
            </span>

            <h1 className="hero__title text-balance">
              Report. Track. <span className="text-gradient">Resolve.</span>
            </h1>

            <p className="hero__sub lead-text text-pretty">
              Report civic issues through voice, text or images. Our AI
              understands your complaint, identifies the right department and
              helps track resolution.
            </p>

            <div className="hero__cta">
              <Button size="lg" to={PATHS.REGISTER} icon="bi-megaphone">
                Report an Issue
              </Button>
              <Button
                size="lg"
                variant="secondary"
                to={PATHS.TRACK}
                icon="bi-search"
              >
                Track Complaint
              </Button>
            </div>

            <ul className="trust list-unstyled mb-0">
              {TRUST.map((item) => (
                <li key={item.value} className="trust__item">
                  <i
                    className={`trust__icon bi ${item.icon}`}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="trust__value">{item.value}</span>
                    <span className="trust__label">{item.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-6">
            <div className="position-relative">
              <HeroPanel />

              <div className="hero-float hero-float--tl" aria-hidden="true">
                <i className="bi bi-mic-fill text-primary-brand" />
                <span>
                  Voice complaint
                  <span className="hero-float__sub">Marathi detected</span>
                </span>
              </div>

              <div className="hero-float hero-float--br" aria-hidden="true">
                <i className="bi bi-check2-circle text-accent" />
                <span>
                  Routed in 4s
                  <span className="hero-float__sub">Public Works Dept.</span>
                </span>
              </div>
            </div>

            <ul className="cluster list-unstyled mt-4 mb-0">
              {ISSUES.map((issue) => (
                <li key={issue.label} className="issue-pill">
                  <i
                    className={`issue-pill__icon bi ${issue.icon}`}
                    aria-hidden="true"
                  />
                  {issue.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The fake product screenshot — pure CSS, no image assets. */
function HeroPanel() {
  return (
    <div className="hero-panel">
      <div className="hero-panel__bar">
        <span className="hero-panel__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="hero-panel__url">nagarsetu.in/citizen/complaints/new</span>
      </div>

      <div className="hero-panel__body">
        <div className="hero-complaint">
          <span className="icon-tile icon-tile--sm" aria-hidden="true">
            <i className="bi bi-mic" />
          </span>
          <div className="min-w-0">
            <p className="hero-complaint__text">
              “आमच्या भागात रस्त्यावर मोठा खड्डा पडला आहे, दुचाकी घसरत आहेत.”
            </p>
            <span className="hero-complaint__lang">
              <i className="bi bi-translate" aria-hidden="true" />
              Marathi detected · transcribed
            </span>
            <div className="waveform mt-3" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="ai-readout">
          <p className="ai-readout__head mb-0">
            <i className="bi bi-cpu" aria-hidden="true" />
            AI analysis
          </p>

          <div className="ai-row">
            <span className="ai-row__key">
              <i className="bi bi-tag" aria-hidden="true" />
              Category
            </span>
            <span className="ai-row__val">Potholes</span>
          </div>

          <div className="ai-row">
            <span className="ai-row__key">
              <i className="bi bi-diagram-3" aria-hidden="true" />
              Department
            </span>
            <span className="ai-row__val">Public Works</span>
          </div>

          <div className="ai-row">
            <span className="ai-row__key">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              Priority
            </span>
            <span className="ai-row__val text-accent">Critical</span>
          </div>

          <div className="ai-row">
            <span className="ai-row__key">
              <i className="bi bi-graph-up" aria-hidden="true" />
              Confidence
            </span>
            <span className="hero-conf">
              <span className="hero-conf__track" aria-hidden="true">
                <span className="hero-conf__fill" style={{ width: "96%" }} />
              </span>
              <span className="ai-row__val">96%</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
