// 사용자 테마 선택 저장 키
const THEME_STORAGE_KEY = "portfolio-theme";

// 저장된 사용자 설정과 시스템 설정을 반영한 테마 관리
export const initTheme = ({ systemThemeQuery }) => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeLabel = document.querySelector("[data-theme-label]");

  // 현재 테마와 테마 결정 출처
  const state = { theme: "light", themeSource: "system" };

  // 유효한 저장 테마 조회
  const getStoredTheme = () => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
    } catch {
      return null;
    }
  };

  const getSystemTheme = () => (systemThemeQuery.matches ? "dark" : "light");

  // 사용자 저장값 우선의 초기 테마 결정
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

  // 저장소 사용 불가 환경을 고려한 테마 저장
  const saveTheme = (theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // 저장소 사용 불가 환경에서도 현재 페이지 테마 전환 유지
    }
  };

  // 문서 테마와 토글 버튼 상태 갱신
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

  // 사용자 조작 이후 시스템 변경보다 사용자 선택 우선
  themeToggle?.addEventListener("click", () => {
    const nextTheme = state.theme === "dark" ? "light" : "dark";
    state.themeSource = "user";
    renderTheme(nextTheme);
    saveTheme(nextTheme);
  });

  // 시스템 설정을 따르는 동안의 실시간 테마 변경
  systemThemeQuery.addEventListener("change", ({ matches }) => {
    if (state.themeSource !== "system") {
      return;
    }

    renderTheme(matches ? "dark" : "light");
  });
};
