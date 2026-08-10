import { getGreeting, firstName, formatDate } from "../../utils/formatters";

/**
 * Dashboard hero. Greets by first name using the local clock and surfaces the
 * few facts a citizen wants immediately: ward, join date, verification.
 */
export default function WelcomeBanner({ user, meta = [] }) {
  return (
    <section className="welcome">
      <span className="glow glow--teal welcome__glow" aria-hidden="true" />
      <span className="bg-dots-inverse" aria-hidden="true" />

      <div className="position-relative">
        <h1 className="welcome__greeting">
          {getGreeting()}, {firstName(user?.name)}
        </h1>
        <p className="welcome__sub">
          Everything you have reported is tracked here — from the moment our AI
          classifies it to the day the department closes it.
        </p>

        <div className="welcome__meta">
          {user?.location && (
            <span className="chip chip--inverse">
              <i className="bi bi-geo-alt" aria-hidden="true" />
              {user.location}
            </span>
          )}
          {user?.verified && (
            <span className="chip chip--inverse">
              <i className="bi bi-patch-check-fill" aria-hidden="true" />
              Verified account
            </span>
          )}
          {user?.joinedAt && (
            <span className="chip chip--inverse">
              <i className="bi bi-calendar3" aria-hidden="true" />
              Member since {formatDate(user.joinedAt)}
            </span>
          )}
          {meta.map((item) => (
            <span key={item.label} className="chip chip--inverse">
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
