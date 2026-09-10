"use strict";

const HEADER_SCROLL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;
const REVEAL_THRESHOLD = 0.2;
const THEME_STORAGE_KEY = "portfolio-theme";

const root = document.documentElement;
const siteHeader = document.querySelector("[data-header]");
const navigation = document.querySelector("[data-navigation]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)');
const revealElements = document.querySelectorAll("[data-reveal]");
const contactForm = document.querySelector("[data-contact-form]");
const formResult = document.querySelector("[data-form-result]");
const desktopMediaQuery = window.matchMedia("(min-width: 64rem)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const FORM_FIELD_NAMES = ["name", "email", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const state = {
  isMenuOpen: false,
  isHeaderScrolled: false,
  isScrollTopVisible: false,
  theme: "light",
};

const formState = {
  values: {
    name: "",
    email: "",
    message: "",
  },
  errors: {
    name: "",
    email: "",
    message: "",
  },
  touched: {
    name: false,
    email: false,
    message: false,
  },
  hasSubmitted: false,
  isSuccessful: false,
};

const formFields = Object.fromEntries(
  FORM_FIELD_NAMES.map((name) => [name, contactForm?.elements.namedItem(name) ?? null]),
);

const formErrorElements = Object.fromEntries(
  FORM_FIELD_NAMES.map((name) => [
    name,
    contactForm?.querySelector(`[data-error-for="${name}"]`) ?? null,
  ]),
);

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

const getStoredTheme = () => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  } catch {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 현재 페이지의 테마 전환은 유지합니다.
  }
};

const renderTheme = (theme) => {
  const isDark = theme === "dark";
  state.theme = theme;
  root.dataset.theme = theme;

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  }

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Light" : "Dark";
  }
};

renderTheme(getStoredTheme() ?? "light");

themeToggle?.addEventListener("click", () => {
  const nextTheme = state.theme === "dark" ? "light" : "dark";
  renderTheme(nextTheme);
  saveTheme(nextTheme);
});

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

renderScrollState();
initializeRevealAnimation();

const getFieldValue = (name) => formFields[name]?.value.trim() ?? "";

const collectFormValues = () =>
  Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, getFieldValue(name)]));

const validateField = (name, value) => {
  if (!value) {
    const requiredMessages = {
      name: "이름을 입력해 주세요.",
      email: "이메일을 입력해 주세요.",
      message: "메시지를 입력해 주세요.",
    };

    return requiredMessages[name] ?? "필수 입력값을 입력해 주세요.";
  }

  if (name === "email" && !EMAIL_PATTERN.test(value)) {
    return "올바른 이메일 형식으로 입력해 주세요.";
  }

  return "";
};

const validateForm = (values) =>
  Object.fromEntries(FORM_FIELD_NAMES.map((name) => [name, validateField(name, values[name])]));

const renderFieldError = (name) => {
  const field = formFields[name];
  const errorElement = formErrorElements[name];
  const errorMessage = formState.errors[name];
  const shouldShowError = formState.touched[name] || formState.hasSubmitted;
  const visibleError = shouldShowError ? errorMessage : "";

  if (!field || !errorElement) {
    return;
  }

  errorElement.textContent = visibleError;

  if (visibleError) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }
};

const renderFormErrors = () => {
  FORM_FIELD_NAMES.forEach((name) => {
    renderFieldError(name);
  });
};

const renderFormResult = () => {
  if (!formResult) {
    return;
  }

  formResult.hidden = !formState.isSuccessful;
  formResult.textContent = formState.isSuccessful
    ? "입력 내용이 확인되었습니다. 현재는 실제 전송 기능이 연결되어 있지 않습니다."
    : "";
};

const clearSuccessfulState = () => {
  if (!formState.isSuccessful) {
    return;
  }

  formState.isSuccessful = false;
  renderFormResult();
};

FORM_FIELD_NAMES.forEach((name) => {
  const field = formFields[name];

  if (!field) {
    return;
  }

  field.addEventListener("input", () => {
    formState.values[name] = getFieldValue(name);
    clearSuccessfulState();

    if (formState.touched[name] || formState.hasSubmitted) {
      formState.errors[name] = validateField(name, formState.values[name]);
      renderFieldError(name);
    }
  });

  field.addEventListener("blur", () => {
    formState.touched[name] = true;
    formState.values[name] = getFieldValue(name);
    formState.errors[name] = validateField(name, formState.values[name]);
    renderFieldError(name);
  });
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  formState.hasSubmitted = true;
  formState.values = collectFormValues();
  formState.errors = validateForm(formState.values);

  FORM_FIELD_NAMES.forEach((name) => {
    formState.touched[name] = true;
  });

  renderFormErrors();

  const firstInvalidFieldName = FORM_FIELD_NAMES.find((name) => formState.errors[name]);

  if (firstInvalidFieldName) {
    formState.isSuccessful = false;
    renderFormResult();
    formFields[firstInvalidFieldName]?.focus();
    return;
  }

  formState.isSuccessful = true;
  renderFormResult();
  formResult?.focus();
});
