import { useEffect, useRef } from "react";

// Touch previews start only after scrolling settles, for the cake nearest the center.
export default function useCakePreview() {
  const ref = useRef(null);

  useEffect(() => {
    const card = ref.current;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer;
    let visible = false;

    const reset = () => {
      window.clearTimeout(timer);
      delete card.dataset.preview;
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (!visible || !touch.matches || reducedMotion.matches || document.hidden) {
        reset();
        return;
      }
      timer = window.setTimeout(() => {
        const images = [...document.querySelectorAll(".reference-card .product-image-wrap")];
        const center = window.innerHeight / 2;
        const nearest = images.reduce((best, image) => {
          const bounds = image.getBoundingClientRect();
          if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return best;
          const distance = Math.abs((bounds.top + bounds.bottom) / 2 - center);
          return !best || distance < best.distance ? { image, distance } : best;
        }, null);
        if (nearest?.image.closest(".reference-card") === card) card.dataset.preview = "active";
        else delete card.dataset.preview;
      }, 650);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(card);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    touch.addEventListener("change", schedule);
    reducedMotion.addEventListener("change", schedule);

    return () => {
      reset();
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      touch.removeEventListener("change", schedule);
      reducedMotion.removeEventListener("change", schedule);
    };
  }, []);

  return ref;
}
