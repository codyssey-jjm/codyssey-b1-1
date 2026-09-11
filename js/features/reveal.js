const REVEAL_THRESHOLD = 0.2;

export const initReveal = ({ reducedMotionQuery }) => {
  const root = document.documentElement;
  const revealElements = document.querySelectorAll("[data-reveal]");

  if (revealElements.length === 0) {
    return;
  }

  const showRevealElementsImmediately = () => {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  };

  const initializeRevealAnimation = () => {
    root.classList.add("reveal-ready");

    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
      showRevealElementsImmediately();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: REVEAL_THRESHOLD,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });
  };

  initializeRevealAnimation();
};
