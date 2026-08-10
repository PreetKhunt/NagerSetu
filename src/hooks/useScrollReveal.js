import { useEffect, useRef } from "react";

/**
 * Adds `.is-visible` to every `.reveal` descendant as it scrolls into view.
 * Attach the returned ref to a section wrapper.
 *
 * Elements are unobserved once revealed so nothing re-animates on scroll-up,
 * and users with `prefers-reduced-motion` get everything visible immediately.
 */
export default function useScrollReveal({
  selector = ".reveal",
  threshold = 0.12,
  rootMargin = "0px 0px -60px 0px",
  stagger = 70,
} = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const targets = Array.from(root.querySelectorAll(selector));
    if (!targets.length) return undefined;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // Stagger siblings so a grid cascades instead of popping at once.
          const index = Number(el.dataset.revealIndex ?? 0);
          el.style.transitionDelay = `${Math.min(index, 8) * stagger}ms`;
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold, rootMargin },
    );

    targets.forEach((el, i) => {
      if (el.dataset.revealIndex === undefined) {
        el.dataset.revealIndex = String(i % 9);
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [selector, threshold, rootMargin, stagger]);

  return containerRef;
}
