const THEME_STORAGE_KEY = "portfolio-theme";

export const initTheme = ({ systemThemeQuery }) => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeLabel = document.querySelector("[data-theme-label]");

  const state = { theme: "light", themeSource: "system" };

  const getStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
    } catch {
      return null;
    }
  };

  const getSystemTheme = () => (systemThemeQuery.matches ? "dark" : "light");

  const getInitialTheme = () => {
    const storedTheme = getStoredTheme();

    if (storedTheme) {
      return {
        theme: storedTheme,
        source: "user",
      };
    }

    return {
      theme: getSystemTheme(),
      source: "system",
    };
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

  const { theme: initialTheme, source: initialThemeSource } = getInitialTheme();

  state.themeSource = initialThemeSource;
  renderTheme(initialTheme);

  themeToggle?.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    state.themeSource = "user";
    renderTheme(nextTheme);
    saveTheme(nextTheme);
  });

  systemThemeQuery.addEventListener("change", ({ matches }) => {
    if (state.themeSource !== "system") {
      return;
    }

    renderTheme(matches ? "dark" : "light");
  });
};
