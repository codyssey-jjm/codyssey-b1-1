const MAX_PROJECT_COUNT = 6;
export const ALL_PROJECT_LANGUAGES = "all";

export const prepareRepositories = (repositories) =>
  repositories
    .filter(({ fork, archived }) => !fork && !archived)
    .slice(0, MAX_PROJECT_COUNT);

export const getProjectLanguage = ({ language }) =>
  typeof language === "string" && language.trim() ? language.trim() : "Other";

export const getProjectLanguages = (repositories) =>
  [...new Set(repositories.map(getProjectLanguage))].sort((first, second) =>
    first.localeCompare(second, "en", { sensitivity: "base" }),
  );

export const filterRepositories = (repositories, language) => {
  if (language === ALL_PROJECT_LANGUAGES) {
    return repositories;
  }

  return repositories.filter(
    (repository) => getProjectLanguage(repository) === language,
  );
};
