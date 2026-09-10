"use strict";

const HEADER_SCROLL_THRESHOLD = 60;
const SCROLL_TOP_THRESHOLD = 300;
const REVEAL_THRESHOLD = 0.2;
const TYPING_INTERVAL = 55;
const TYPING_START_DELAY = 450;
const THEME_STORAGE_KEY = "portfolio-theme";
const GITHUB_USERNAME = "jungmyung16";
const MAX_PROJECT_COUNT = 6;
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=12&type=owner`;

const root = document.documentElement;
const siteHeader = document.querySelector("[data-header]");
const navigation = document.querySelector("[data-navigation]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const anchorLinks = document.querySelectorAll('a[href^="#"]:not(.skip-link)');
const revealElements = document.querySelectorAll("[data-reveal]");
const typingElement = document.querySelector("[data-typing]");
const typingOutput = document.querySelector("[data-typing-output]");
const contactForm = document.querySelector("[data-contact-form]");
const formResult = document.querySelector("[data-form-result]");
const projectStatus = document.querySelector("[data-project-status]");
const projectStatusMessage = document.querySelector("[data-project-status-message]");
const projectList = document.querySelector("[data-project-list]");
const projectRetryButton = document.querySelector("[data-project-retry]");
const projectFilters = document.querySelector("[data-project-filters]");
const desktopMediaQuery = window.matchMedia("(min-width: 64rem)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const FORM_FIELD_NAMES = ["name", "email", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALL_PROJECT_LANGUAGES = "all";
const PROJECT_STATUS_CLASSES = ["is-loading", "is-success", "is-empty", "is-error"];
const HTML_ESCAPE_CHARACTERS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};
const projectDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const state = {
  isMenuOpen: false,
  isHeaderScrolled: false,
  isScrollTopVisible: false,
  theme: "light",
};

const typingState = {
  status: "idle",
  characters: [],
  currentIndex: 0,
  timerId: null,
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

const projectState = {
  status: "idle",
  repositories: [],
  errorType: null,
  selectedLanguage: ALL_PROJECT_LANGUAGES,
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

const clearTypingTimer = () => {
  if (typingState.timerId === null) {
    return;
  }

  window.clearTimeout(typingState.timerId);
  typingState.timerId = null;
};

const renderTypingText = () => {
  if (!typingElement || !typingOutput) {
    return;
  }

  typingOutput.textContent = typingState.characters
    .slice(0, typingState.currentIndex)
    .join("");
  typingElement.classList.toggle("is-typing", typingState.status === "typing");
  typingElement.classList.toggle("is-complete", typingState.status === "complete");
};

const completeTyping = () => {
  clearTypingTimer();
  typingState.currentIndex = typingState.characters.length;
  typingState.status = "complete";
  renderTypingText();
};

const typeNextCharacter = () => {
  typingState.timerId = null;

  if (typingState.status !== "typing") {
    return;
  }

  typingState.currentIndex += 1;

  if (typingState.currentIndex >= typingState.characters.length) {
    completeTyping();
    return;
  }

  renderTypingText();
  typingState.timerId = window.setTimeout(typeNextCharacter, TYPING_INTERVAL);
};

const startTyping = () => {
  typingState.timerId = null;

  if (typingState.status !== "idle") {
    return;
  }

  if (reducedMotionQuery.matches) {
    completeTyping();
    return;
  }

  typingState.status = "typing";
  typingState.currentIndex = 0;
  renderTypingText();
  typingState.timerId = window.setTimeout(typeNextCharacter, TYPING_INTERVAL);
};

const initializeTypingEffect = () => {
  if (
    !typingElement ||
    !typingOutput ||
    typingState.status !== "idle" ||
    typingState.timerId !== null
  ) {
    return;
  }

  const fullText = typingOutput.textContent.trim();

  if (!fullText) {
    return;
  }

  typingState.characters = [...fullText];

  if (reducedMotionQuery.matches) {
    completeTyping();
    return;
  }

  typingState.timerId = window.setTimeout(startTyping, TYPING_START_DELAY);
};

renderScrollState();
initializeRevealAnimation();
initializeTypingEffect();

reducedMotionQuery.addEventListener("change", ({ matches }) => {
  if (matches && typingState.status !== "complete") {
    completeTyping();
  }
});

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

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPE_CHARACTERS[character]);

const getSafeGitHubUrl = (value) => {
  const fallbackUrl = `https://github.com/${GITHUB_USERNAME}`;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.href : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

const formatProjectDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "날짜 정보 없음" : projectDateFormatter.format(date);
};

const prepareRepositories = (repositories) =>
  repositories
    .filter(({ fork, archived }) => !fork && !archived)
    .slice(0, MAX_PROJECT_COUNT);

const getProjectLanguage = ({ language }) =>
  typeof language === "string" && language.trim() ? language.trim() : "Other";

const getProjectLanguages = () =>
  [...new Set(projectState.repositories.map(getProjectLanguage))].sort((first, second) =>
    first.localeCompare(second, "en", { sensitivity: "base" }),
  );

const getFilteredRepositories = () => {
  if (projectState.selectedLanguage === ALL_PROJECT_LANGUAGES) {
    return projectState.repositories;
  }

  return projectState.repositories.filter(
    (repository) => getProjectLanguage(repository) === projectState.selectedLanguage,
  );
};

const createProjectCard = (repository) => {
  const {
    name = "Untitled",
    description,
    stargazers_count: starCount = 0,
    updated_at: updatedAt,
    html_url: htmlUrl,
  } = repository;

  const projectName = String(name).trim() || "Untitled";
  const projectDescription = description || "프로젝트 설명이 아직 등록되지 않았습니다.";
  const projectLanguage = getProjectLanguage(repository);
  const projectInitial = [...projectName][0]?.toUpperCase() ?? "?";
  const projectUrl = getSafeGitHubUrl(htmlUrl);
  const formattedStarCount = Number.isFinite(starCount) ? starCount : 0;

  return `
    <article class="project-card" role="listitem">
      <div class="project-card__cover" aria-hidden="true">
        <span>${escapeHTML(projectInitial)}</span>
      </div>
      <div class="project-card__body">
        <div class="project-card__meta">
          <span>${escapeHTML(projectLanguage)}</span>
          <span>PUBLIC REPOSITORY</span>
        </div>
        <h3 class="project-card__title">${escapeHTML(projectName)}</h3>
        <p class="project-card__description">${escapeHTML(projectDescription)}</p>
        <footer class="project-card__footer">
          <span aria-label="별 ${formattedStarCount}개">★ ${formattedStarCount}</span>
          <span>${escapeHTML(formatProjectDate(updatedAt))}</span>
          <a
            class="project-card__link"
            href="${escapeHTML(projectUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHTML(projectName)} GitHub 저장소 새 창에서 보기"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </article>
  `;
};

const getProjectStatusMessage = () => {
  if (projectState.status === "loading") {
    return "GitHub에서 프로젝트를 불러오는 중입니다.";
  }

  if (projectState.status === "success") {
    const filteredRepositories = getFilteredRepositories();

    if (filteredRepositories.length === 0) {
      return "선택한 언어에 해당하는 프로젝트가 없습니다.";
    }

    if (projectState.selectedLanguage === ALL_PROJECT_LANGUAGES) {
      return `${filteredRepositories.length}개의 프로젝트를 불러왔습니다.`;
    }

    return `${projectState.selectedLanguage} 프로젝트 ${filteredRepositories.length}개를 표시하고 있습니다.`;
  }

  if (projectState.status === "empty") {
    return "표시할 프로젝트가 없습니다.";
  }

  if (projectState.errorType === "rate-limit") {
    return "GitHub API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (projectState.errorType === "not-found") {
    return "GitHub 사용자를 찾을 수 없습니다. 설정된 사용자명을 확인해 주세요.";
  }

  if (projectState.status === "error") {
    return "프로젝트를 불러올 수 없습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }

  return "프로젝트를 불러올 준비가 되었습니다.";
};

const renderProjectStatus = () => {
  if (!projectStatus || !projectStatusMessage) {
    return;
  }

  PROJECT_STATUS_CLASSES.forEach((className) => {
    projectStatus.classList.remove(className);
  });

  const statusClass = `is-${projectState.status}`;

  if (PROJECT_STATUS_CLASSES.includes(statusClass)) {
    projectStatus.classList.add(statusClass);
  }

  projectStatusMessage.textContent = getProjectStatusMessage();

  if (projectRetryButton) {
    const canRetry = projectState.status === "error";
    projectRetryButton.hidden = !canRetry;
    projectRetryButton.disabled = projectState.status === "loading";
  }
};

const renderProjectList = () => {
  if (!projectList) {
    return;
  }

  projectList.setAttribute("aria-busy", String(projectState.status === "loading"));
  projectList.innerHTML =
    projectState.status === "success"
      ? getFilteredRepositories().map((repository) => createProjectCard(repository)).join("")
      : "";
};

const createProjectFilterButton = (language, count) => {
  const button = document.createElement("button");
  const label = document.createElement("span");
  const countBadge = document.createElement("span");
  const isAllLanguages = language === ALL_PROJECT_LANGUAGES;
  const displayLanguage = isAllLanguages ? "All" : language;
  const isActive = projectState.selectedLanguage === language;

  button.className = "project-filter";
  button.type = "button";
  button.dataset.projectFilter = language;
  button.classList.toggle("is-active", isActive);
  button.setAttribute("aria-pressed", String(isActive));
  button.setAttribute("aria-label", `${displayLanguage} 프로젝트 ${count}개`);

  label.className = "project-filter__label";
  label.textContent = displayLanguage;

  countBadge.className = "project-filter__count";
  countBadge.textContent = String(count);
  countBadge.setAttribute("aria-hidden", "true");

  button.append(label, countBadge);
  return button;
};

const renderProjectFilters = () => {
  if (!projectFilters) {
    return;
  }

  const shouldShowFilters =
    projectState.status === "success" && projectState.repositories.length > 0;

  projectFilters.hidden = !shouldShowFilters;
  projectFilters.replaceChildren();

  if (!shouldShowFilters) {
    return;
  }

  const fragment = document.createDocumentFragment();
  const languages = getProjectLanguages();

  fragment.append(
    createProjectFilterButton(ALL_PROJECT_LANGUAGES, projectState.repositories.length),
  );

  languages.forEach((language) => {
    const projectCount = projectState.repositories.filter(
      (repository) => getProjectLanguage(repository) === language,
    ).length;

    fragment.append(createProjectFilterButton(language, projectCount));
  });

  projectFilters.append(fragment);
};

const renderProjects = () => {
  renderProjectStatus();
  renderProjectFilters();
  renderProjectList();
};

const getProjectErrorType = (status) => {
  if (status === 403) {
    return "rate-limit";
  }

  if (status === 404) {
    return "not-found";
  }

  return "general";
};

const loadProjects = async () => {
  if (projectState.status === "loading") {
    return;
  }

  projectState.status = "loading";
  projectState.repositories = [];
  projectState.errorType = null;
  projectState.selectedLanguage = ALL_PROJECT_LANGUAGES;
  renderProjects();

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      const requestError = new Error(`GitHub API request failed: ${response.status}`);
      requestError.status = response.status;
      throw requestError;
    }

    const responseData = await response.json();

    if (!Array.isArray(responseData)) {
      throw new Error("GitHub API returned an unexpected response.");
    }

    projectState.repositories = prepareRepositories(responseData);
    projectState.status = projectState.repositories.length > 0 ? "success" : "empty";
    renderProjects();
  } catch (error) {
    projectState.status = "error";
    projectState.repositories = [];
    projectState.errorType = getProjectErrorType(error.status);
    renderProjects();
  }
};

projectFilters?.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const filterButton = event.target.closest("[data-project-filter]");

  if (!filterButton || !projectFilters.contains(filterButton)) {
    return;
  }

  const { projectFilter } = filterButton.dataset;

  if (!projectFilter || projectFilter === projectState.selectedLanguage) {
    return;
  }

  const isKnownLanguage =
    projectFilter === ALL_PROJECT_LANGUAGES || getProjectLanguages().includes(projectFilter);

  if (!isKnownLanguage) {
    return;
  }

  projectState.selectedLanguage = projectFilter;
  renderProjects();

  const activeFilterButton = [...projectFilters.querySelectorAll("[data-project-filter]")].find(
    (button) => button.dataset.projectFilter === projectState.selectedLanguage,
  );

  activeFilterButton?.focus();
});

projectRetryButton?.addEventListener("click", loadProjects);
loadProjects();
