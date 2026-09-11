// 포트폴리오 인터랙션 모듈 초기화 진입점
import { createMediaQueries } from "./shared/media.js";
import { initTheme } from "./features/theme.js";
import { initNavigation } from "./features/navigation.js";
import { initScroll } from "./features/scroll.js";
import { initReveal } from "./features/reveal.js";
import { initTyping } from "./features/typing.js";
import { initContact } from "./features/contact/index.js";
import { initProjects } from "./features/projects/index.js";

// 여러 기능에서 공유할 미디어 쿼리 인스턴스 생성
const { desktopMediaQuery, reducedMotionQuery, systemThemeQuery } = createMediaQueries();

// 화면 표시 순서에 따른 기능 초기화
initTheme({ systemThemeQuery });
initNavigation({ desktopMediaQuery, reducedMotionQuery });
initScroll({ reducedMotionQuery });
initReveal({ reducedMotionQuery });
initTyping({ reducedMotionQuery });
initContact();
initProjects();
