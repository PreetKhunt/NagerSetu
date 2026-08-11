import { Link } from "react-router-dom";
import Brand from "./Brand";
import { APP_NAME, PATHS } from "../../utils/constants";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "How it works", to: `${PATHS.HOME}#how-it-works` },
      { label: "Features", to: `${PATHS.HOME}#features` },
      { label: "Civic issues", to: `${PATHS.HOME}#issues` },
      { label: "Impact", to: `${PATHS.HOME}#impact` },
    ],
  },
  {
    title: "For citizens",
    links: [
      { label: "Report an issue", to: PATHS.REGISTER },
      { label: "Track a complaint", to: PATHS.TRACK },
      { label: "Create an account", to: PATHS.REGISTER },
      { label: "Sign in", to: PATHS.LOGIN },
    ],
  },
  {
    title: "For departments",
    links: [
      { label: "Officer sign in", to: PATHS.LOGIN },
      { label: "Department routing", to: `${PATHS.HOME}#workflow` },
      { label: "Priority detection", to: `${PATHS.HOME}#features` },
      { label: "Resolution analytics", to: `${PATHS.HOME}#impact` },
    ],
  },
];

const SOCIALS = [
  { icon: "bi-twitter-x", label: "X" },
  { icon: "bi-linkedin", label: "LinkedIn" },
  { icon: "bi-github", label: "GitHub" },
  { icon: "bi-youtube", label: "YouTube" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-ds">
      <span className="bg-dots-inverse" aria-hidden="true" />

      <div className="container position-relative">
        <div className="row g-5">
          <div className="col-lg-4">
            <Brand />
            <p className="footer-ds__about">
              An AI-assisted grievance platform that helps citizens report civic
              issues in their own language, and helps departments resolve them
              faster with automatic classification, routing and tracking.
            </p>
            <div className="cluster">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href="#top"
                  className="social-btn"
                  aria-label={social.label}
                >
                  <i className={`bi ${social.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className="col-6 col-lg-2">
              <h3 className="footer-ds__title">{column.title}</h3>
              <ul className="footer-ds__list">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="footer-ds__link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-12 col-lg-2">
            <h3 className="footer-ds__title">Helpline</h3>
            <ul className="footer-ds__list">
              <li className="d-flex align-items-center gap-2">
                <i className="bi bi-telephone" aria-hidden="true" />
                1800-000-1947
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="bi bi-envelope" aria-hidden="true" />
                help@nagarsetu.in
              </li>
              <li className="d-flex align-items-center gap-2">
                <i className="bi bi-clock" aria-hidden="true" />
                24 × 7 support
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-ds__bottom">
          <p className="mb-0">
            © {year} {APP_NAME}. Built for Smart India Hackathon.
          </p>
          <p className="mb-0 d-flex flex-wrap gap-3">
            <Link to={PATHS.HOME} className="footer-ds__link">
              Privacy
            </Link>
            <Link to={PATHS.HOME} className="footer-ds__link">
              Terms
            </Link>
            <Link to={PATHS.HOME} className="footer-ds__link">
              Accessibility
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
