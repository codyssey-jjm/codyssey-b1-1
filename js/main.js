import { createMediaQueries } from "./shared/media.js";
import { initTheme } from "./features/theme.js";
import { initNavigation } from "./features/navigation.js";
import { initScroll } from "./features/scroll.js";
import { initReveal } from "./features/reveal.js";
import { initTyping } from "./features/typing.js";
import { initContact } from "./features/contact/index.js";
import { initProjects } from "./features/projects/index.js";

const { desktopMediaQuery, reducedMotionQuery, systemThemeQuery } = createMediaQueries();

initTheme({ systemThemeQuery });
initNavigation({ desktopMediaQuery, reducedMotionQuery });
initScroll({ reducedMotionQuery });
initReveal({ reducedMotionQuery });
initTyping({ reducedMotionQuery });
initContact();
initProjects();
