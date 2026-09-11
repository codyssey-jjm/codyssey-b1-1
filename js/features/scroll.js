const HEADER_SCROLL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;

export const initScroll = ({ reducedMotionQuery }) => {
  const siteHeader = document.querySelector("[data-header]");
  const scrollTopButton = document.querySelector("[data-scroll-top]");

  if (!siteHeader && !scrollTopButton) {
    return;
  }

  const state = {
    isHeaderScrolled: false,
    isScrollTopVisible: false,
  };
  const getScrollBehavior = () => (reducedMotionQuery.matches ? "auto" : "smooth");

  let scrollFrameId = null;
  let scrollTopHideTimer = null;

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

  scrollTopButton?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(),
    });
  });

  renderScrollState();
};
