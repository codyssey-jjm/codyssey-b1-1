export const initNavigation = ({ desktopMediaQuery, reducedMotionQuery }) => {
  const siteHeader = document.querySelector("[data-header]");
  const navigation = document.querySelector("[data-navigation]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)');

  if (!navigation && !menuToggle && anchorLinks.length === 0) {
    return;
  }

  const state = { isMenuOpen: false };

  const getFocusableHeaderElements = () => {
    if (!siteHeader) {
      return [];
    }

    return [...siteHeader.querySelectorAll('a[href], button:not([disabled])')].filter(
      (element) => !element.hidden && element.offsetParent !== null,
    );
  };

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

  desktopMediaQuery.addEventListener("change", ({ matches }) => {
    if (matches) {
      closeMenu();
    }
  });

  const getScrollBehavior = () => (reducedMotionQuery.matches ? "auto" : "smooth");

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
