import Button from "../common/Button";
import { PATHS } from "../../utils/constants";

/** Closing call-to-action band. */
export default function CTASection() {
  return (
    <section className="section" id="get-started">
      <div className="container">
        <div className="cta-band">
          <span className="bg-dots-inverse" aria-hidden="true" />

          <div className="row align-items-center g-4 position-relative">
            <div className="col-lg-7">
              <h2 className="cta-band__title text-balance">
                Found a problem on your street? Report it now.
              </h2>
              <p className="cta-band__text">
                It takes less than a minute. Speak it, type it or photograph it —
                the AI will handle the classification, the routing and the
                follow-up.
              </p>

              <div className="cta-band__actions">
                <Button
                  size="lg"
                  variant="light"
                  to={PATHS.REGISTER}
                  icon="bi-megaphone"
                >
                  Report an Issue
                </Button>
                <Button
                  size="lg"
                  variant="outline-inverse"
                  to={PATHS.TRACK}
                  icon="bi-search"
                >
                  Track Complaint
                </Button>
              </div>

              <p className="cta-band__note">
                <i className="bi bi-shield-lock" aria-hidden="true" />
                Your details stay with the department handling your complaint.
              </p>
            </div>

            <div className="col-lg-5 d-none d-xl-block">
              <div className="stack-3">
                <div className="hero-float position-relative m-0">
                  <i className="bi bi-mic-fill text-primary-brand" aria-hidden="true" />
                  <span>
                    Record a voice note
                    <span className="hero-float__sub">Any of 8 languages</span>
                  </span>
                </div>
                <div className="hero-float position-relative m-0 ms-4">
                  <i className="bi bi-cpu text-primary-brand" aria-hidden="true" />
                  <span>
                    AI classifies it
                    <span className="hero-float__sub">Category + priority</span>
                  </span>
                </div>
                <div className="hero-float position-relative m-0">
                  <i className="bi bi-check2-circle text-accent" aria-hidden="true" />
                  <span>
                    Track to resolution
                    <span className="hero-float__sub">Live status timeline</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
