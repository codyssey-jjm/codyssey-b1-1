// 화면에 표시할 최대 저장소 수와 전체 언어 필터값
const MAX_PROJECT_COUNT = 6;
export const ALL_PROJECT_LANGUAGES = "all";

// 포크·보관 저장소 제외 후 표시 개수 제한
export const prepareRepositories = (repositories) =>
  repositories
    .filter(({ fork, archived }) => !fork && !archived)
    .slice(0, MAX_PROJECT_COUNT);

// 언어 정보가 없는 저장소의 대체 분류
export const getProjectLanguage = ({ language }) =>
  typeof language === "string" && language.trim() ? language.trim() : "Other";

// 중복 없는 언어 목록의 알파벳 정렬
export const getProjectLanguages = (repositories) =>
  [...new Set(repositories.map(getProjectLanguage))].sort((first, second) =>
    first.localeCompare(second, "en", { sensitivity: "base" }),
  );

// 선택 언어 기준 저장소 필터링
export const filterRepositories = (repositories, language) => {
  if (language === ALL_PROJECT_LANGUAGES) {
    return repositories;
  }

  return repositories.filter(
    (repository) => getProjectLanguage(repository) === language,
  );
};
