// 화면에 표시할 저장소와 분야·기술 정보
const FEATURED_REPOSITORIES = [
  {
    fullName: "jungmyung16/CatdogEats-FE",
    category: "web",
    stack: ["React", "Frontend"],
  },
  {
    fullName: "jungmyung16/CatdogEats-BE",
    category: "web",
    stack: ["Spring", "Backend"],
  },
  {
    fullName: "jungmyung16/Shipment-Simulator",
    category: "web",
    stack: ["Spring", "Backend"],
  },
  {
    fullName: "jungmyung16/WeatherApp-with-Flutter",
    category: "app",
    stack: ["Flutter", "Dart"],
  },
  {
    fullName: "gameDev-graphics-Lab/ComputerGraphics_Project",
    category: "game",
    stack: ["Computer Graphics"],
  },
  {
    fullName: "gameDev-graphics-Lab/VamSurvialLike_Game",
    category: "game",
    stack: ["Unity"],
  },
  {
    fullName: "gameDev-graphics-Lab/EscapeDungeon",
    category: "game",
    stack: ["Unity"],
  },
  {
    fullName: "gameDev-graphics-Lab/UnrealTPS",
    category: "game",
    stack: ["Unreal Engine"],
  },
];

// 개발 분야의 출력 순서와 화면 표시명
const PROJECT_CATEGORY_ORDER = ["web", "app", "game"];
const PROJECT_CATEGORY_LABELS = {
  all: "전체",
  web: "웹 개발",
  app: "앱 개발",
  game: "게임 개발",
};

export const ALL_PROJECT_CATEGORIES = "all";
export const ALL_PROJECT_LANGUAGES = "all";

// 대소문자 차이를 제거한 저장소 전체 이름
const normalizeRepositoryName = (repositoryName) =>
  String(repositoryName).trim().toLowerCase();

// 지정한 저장소만 분야·기술 정보와 함께 정의된 순서로 선별
export const prepareRepositories = (repositories) => {
  const repositoriesByName = new Map(
    repositories.map((repository) => [
      normalizeRepositoryName(repository.full_name),
      repository,
    ]),
  );

  return FEATURED_REPOSITORIES.map(({ fullName, category, stack }) => {
    const repository = repositoriesByName.get(normalizeRepositoryName(fullName));

    return repository
      ? {
          ...repository,
          portfolioCategory: category,
          portfolioStack: stack,
        }
      : null;
  }).filter(Boolean);
};

// 언어 정보가 없는 저장소의 대체 분류
export const getProjectLanguage = ({ language }) =>
  typeof language === "string" && language.trim() ? language.trim() : "Other";

// 저장소의 개발 분야와 기술 정보 조회
export const getProjectCategory = ({ portfolioCategory }) =>
  PROJECT_CATEGORY_ORDER.includes(portfolioCategory) ? portfolioCategory : "other";

export const getProjectCategoryLabel = (category) =>
  PROJECT_CATEGORY_LABELS[category] ?? "기타";

export const getProjectStack = ({ portfolioStack }) =>
  Array.isArray(portfolioStack) ? portfolioStack : [];

// 언어 목록과 개수 목록의 공통 정렬 기준
const compareLanguages = (first, second) =>
  first.localeCompare(second, "en", { sensitivity: "base" });

// 개발 분야별 저장소 개수 집계
export const getProjectCategoryCounts = (repositories) =>
  PROJECT_CATEGORY_ORDER.map((category) => ({
    category,
    label: getProjectCategoryLabel(category),
    count: repositories.filter(
      (repository) => getProjectCategory(repository) === category,
    ).length,
  })).filter(({ count }) => count > 0);

// 중복 없는 언어 목록의 알파벳 정렬
export const getProjectLanguages = (repositories) =>
  [...new Set(repositories.map(getProjectLanguage))].sort(compareLanguages);

// 언어별 저장소 개수 집계와 정렬
export const getProjectLanguageCounts = (repositories) => {
  const counts = new Map();

  repositories.forEach((repository) => {
    const language = getProjectLanguage(repository);
    counts.set(language, (counts.get(language) ?? 0) + 1);
  });

  return [...counts]
    .sort(([first], [second]) => compareLanguages(first, second))
    .map(([language, count]) => ({ language, count }));
};

// 선택 개발 분야 기준 저장소 필터링
export const filterRepositoriesByCategory = (repositories, category) => {
  if (category === ALL_PROJECT_CATEGORIES) {
    return repositories;
  }

  return repositories.filter(
    (repository) => getProjectCategory(repository) === category,
  );
};

// 선택 언어 기준 저장소 필터링
export const filterRepositoriesByLanguage = (repositories, language) => {
  if (language === ALL_PROJECT_LANGUAGES) {
    return repositories;
  }

  return repositories.filter(
    (repository) => getProjectLanguage(repository) === language,
  );
};
