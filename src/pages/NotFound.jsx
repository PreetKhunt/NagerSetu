import { Link } from "react-router-dom";
import Brand from "../components/layout/Brand";
import Button from "../components/common/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { PATHS } from "../utils/constants";

const LINKS = [
  { label: "Track a complaint", to: PATHS.TRACK, icon: "bi-search" },
  { label: "Sign in", to: PATHS.LOGIN, icon: "bi-box-arrow-in-right" },
  { label: "Create an account", to: PATHS.REGISTER, icon: "bi-person-plus" },
];

/** Catch-all route. Kept outside the layouts so it works from any URL. */
export default function NotFound() {
  useDocumentTitle("Page not found");

  return (
    <main className="notfound" id="main">
      <span className="bg-grid" aria-hidden="true" />
      <span className="glow glow--primary notfound__glow" aria-hidden="true" />

      <div className="container position-relative">
        <div className="row justify-content-center text-center">
          <div className="col-12 col-lg-7">
            <div className="d-flex justify-content-center mb-5">
              <Brand />
            </div>

            <p className="notfound__code">404</p>
            <h1 className="notfound__title text-balance">
              This page has not been paved yet
            </h1>
            <p className="notfound__text">
              The link may be outdated, or the section is still being built. The
              routes below are live in this prototype.
            </p>

            <div className="cluster justify-content-center mb-5">
              <Button to={PATHS.HOME} icon="bi-house">
                Back to home
              </Button>
              <Button variant="secondary" to={PATHS.CITIZEN_DASHBOARD}>
                Go to dashboard
              </Button>
            </div>

            <ul className="notfound__links">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>
                    <i className={`bi ${link.icon}`} aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
