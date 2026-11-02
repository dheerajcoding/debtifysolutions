// Tiny scroll-reveal: adds .in to any .reveal / .reveal-stagger element that enters
// the viewport, once. No dependency, a few lines, safe to call repeatedly (route changes).
let io;
export function startReveal() {
  try {
    if (io) io.disconnect();
    const els = document.querySelectorAll(".reveal, .reveal-stagger");
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
  } catch {}
}
