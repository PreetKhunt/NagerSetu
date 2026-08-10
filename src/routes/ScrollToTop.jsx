import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll on route change, but honours in-page anchors (`/#features`)
 * so the navbar and footer section links still work.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
}
