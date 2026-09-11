export const createMediaQueries = () => ({
  desktopMediaQuery: window.matchMedia("(min-width: 64rem)"),
  reducedMotionQuery: window.matchMedia("(prefers-reduced-motion: reduce)"),
  systemThemeQuery: window.matchMedia("(prefers-color-scheme: dark)"),
});
