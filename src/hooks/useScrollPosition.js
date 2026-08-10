import { useEffect, useState } from "react";

/**
 * True once the window has scrolled past `offset` pixels.
 * Used to give the navbar its border + shadow on scroll.
 */
export default function useScrollPosition(offset = 12) {
  const [scrolled, setScrolled] = useState(
    () => typeof window !== "undefined" && window.scrollY > offset,
  );

  useEffect(() => {
    let frame = null;

    const onScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > offset);
        frame = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [offset]);

  return scrolled;
}
