// 현재 모션 감소 설정에 따른 스크롤 방식 결정
export const getScrollBehavior = (reducedMotionQuery) =>
  reducedMotionQuery.matches ? "auto" : "smooth";
