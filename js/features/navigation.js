// 모바일 메뉴와 페이지 내부 앵커 이동 관리
export const initNavigation = ({ desktopMediaQuery, reducedMotionQuery }) => {
  const siteHeader = document.querySelector("[data-header]");
  const navigation = document.querySelector("[data-navigation]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)');

  if (!navigation && !menuToggle && anchorLinks.length === 0) {
    return;
  }

  // 모바일 메뉴 열림 상태
  const state = { isMenuOpen: false };

  // 메뉴 내부 키보드 탐색 대상 수집
  const getFocusableHeaderElements = () => {
    if (!siteHeader) {
      return [];
    }

    return [...siteHeader.querySelectorAll('a[href], button:not([disabled])')].filter(
      (element) => !element.hidden && element.offsetParent !== null,
    );
  };

  // 메뉴 표시 상태와 접근성 속성 갱신
  const renderMenu = (isOpen, { moveFocus = false } = {}) => {
    state.isMenuOpen = isOpen;

    if (!navigation || !menuToggle) {
      return;
    }

    navigation.classList.toggle("active", isOpen);
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
    document.body.classList.toggle("menu-open", isOpen);

    if (isOpen && moveFocus) {
      navigation.querySelector("a")?.focus();
    }
  };

  // 메뉴 닫기와 선택적 포커스 복귀
  const closeMenu = ({ returnFocus = false } = {}) => {
    if (!state.isMenuOpen) {
      return;
    }

    renderMenu(false);

    if (returnFocus) {
      menuToggle?.focus();
    }
  };

  menuToggle?.addEventListener("click", () => {
    renderMenu(!state.isMenuOpen, { moveFocus: !state.isMenuOpen });
  });

  // Escape 종료와 Tab 포커스 순환
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isMenuOpen) {
      closeMenu({ returnFocus: true });
      return;
    }

    if (event.key !== "Tab" || !state.isMenuOpen) {
      return;
    }

    const focusableElements = getFocusableHeaderElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });

  // 데스크톱 전환 시 모바일 메뉴 상태 초기화
  desktopMediaQuery.addEventListener("change", ({ matches }) => {
    if (matches) {
      closeMenu();
    }
  });

  // 모션 감소 설정에 따른 스크롤 방식 결정
  const getScrollBehavior = () => (reducedMotionQuery.matches ? "auto" : "smooth");

  // 유효한 페이지 내부 링크의 부드러운 이동
  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.getElementById(targetId.slice(1));

      if (!target) {
        return;
      }

      event.preventDefault();

      if (link.closest("[data-navigation]")) {
        closeMenu();
      }

      target.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "start",
      });
    });
  });
};
