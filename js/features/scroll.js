// 헤더 배경과 스크롤 탑 버튼의 표시 기준
const HEADER_SCROLL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;

// 현재 스크롤 위치에 따른 화면 상태 관리
export const initScroll = ({ reducedMotionQuery }) => {
  const siteHeader = document.querySelector("[data-header]");
  const scrollTopButton = document.querySelector("[data-scroll-top]");

  if (!siteHeader && !scrollTopButton) {
    return;
  }

  // 스크롤 기반 UI 상태
  const state = {
    isHeaderScrolled: false,
    isScrollTopVisible: false,
  };
  const getScrollBehavior = () => (reducedMotionQuery.matches ? "auto" : "smooth");

  // 연속 스크롤 처리와 버튼 종료 애니메이션 제어값
  let scrollFrameId = null;
  let scrollTopHideTimer = null;

  // 스크롤 탑 버튼 표시와 지연 숨김 처리
  const renderScrollTopButton = (isVisible) => {
    if (!scrollTopButton) {
      return;
    }

    window.clearTimeout(scrollTopHideTimer);

    if (isVisible) {
      scrollTopButton.hidden = false;
      scrollTopButton.removeAttribute("aria-hidden");

      window.requestAnimationFrame(() => {
        scrollTopButton.classList.add("is-visible");
      });
      return;
    }

    scrollTopButton.classList.remove("is-visible");
    scrollTopButton.setAttribute("aria-hidden", "true");

    scrollTopHideTimer = window.setTimeout(() => {
      if (!state.isScrollTopVisible) {
        scrollTopButton.hidden = true;
      }
    }, 200);
  };

  // 현재 위치를 기준으로 헤더와 버튼 상태 갱신
  const renderScrollState = () => {
    const scrollPosition = window.scrollY;
    const shouldShowHeaderBackground = scrollPosition >= HEADER_SCROLL_THRESHOLD;
    const shouldShowScrollTop = scrollPosition >= SCROLL_TOP_THRESHOLD;

    if (state.isHeaderScrolled !== shouldShowHeaderBackground) {
      state.isHeaderScrolled = shouldShowHeaderBackground;
      siteHeader?.classList.toggle("is-scrolled", shouldShowHeaderBackground);
    }

    if (state.isScrollTopVisible !== shouldShowScrollTop) {
      state.isScrollTopVisible = shouldShowScrollTop;
      renderScrollTopButton(shouldShowScrollTop);
    }
  };

  // 프레임당 한 번으로 제한한 스크롤 상태 계산
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrameId !== null) {
        return;
      }

      scrollFrameId = window.requestAnimationFrame(() => {
        renderScrollState();
        scrollFrameId = null;
      });
    },
    { passive: true },
  );

  // 모션 설정을 반영한 페이지 최상단 이동
  scrollTopButton?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(),
    });
  });

  renderScrollState();
};
