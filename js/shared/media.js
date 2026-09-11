// 반응형·모션 감소·시스템 테마 감지를 위한 공통 미디어 쿼리 생성
export const createMediaQueries = () => ({
  desktopMediaQuery: window.matchMedia("(min-width: 64rem)"),
  reducedMotionQuery: window.matchMedia("(prefers-reduced-motion: reduce)"),
  systemThemeQuery: window.matchMedia("(prefers-color-scheme: dark)"),
});
