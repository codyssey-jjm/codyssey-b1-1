// 요소가 화면에 들어온 것으로 판단할 교차 비율
const REVEAL_THRESHOLD = 0.2;

// 화면 진입 요소의 등장 효과 관리
export const initReveal = ({ reducedMotionQuery }) => {
  const root = document.documentElement;
  const revealElements = document.querySelectorAll("[data-reveal]");

  if (revealElements.length === 0) {
    return;
  }

  // 모션 감소 또는 Observer 미지원 환경의 즉시 표시
  const showRevealElementsImmediately = () => {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  };

  // 요소별 최초 화면 진입 감지
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
