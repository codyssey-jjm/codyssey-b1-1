import { GITHUB_PROFILE_URL, fetchRepositories } from "../../services/github.js";
import {
  ALL_PROJECT_CATEGORIES,
  ALL_PROJECT_LANGUAGES,
  ALL_PROJECT_STATUSES,
  prepareRepositories,
  getProjectCategoryCounts,
  getProjectLanguages,
  getProjectLanguageCounts,
  getProjectStatusCounts,
  isProjectCategory,
  isProjectStatus,
  filterRepositoriesByCategory,
  filterRepositoriesByLanguage,
  filterRepositoriesByStatus,
} from "./repository.js";
import { createProjectsView } from "./view.js";

// GitHub 프로젝트 요청·필터·화면 상태 조정
export const initProjects = () => {
  const projectStatus = document.querySelector("[data-project-status]");
  const projectStatusMessage = document.querySelector("[data-project-status-message]");
  const projectList = document.querySelector("[data-project-list]");
  const projectRetryButton = document.querySelector("[data-project-retry]");
  const projectFilters = document.querySelector("[data-project-filters]");
  const projectCategoryFilters = document.querySelector("[data-project-category-filters]");
  const projectLanguageFilters = document.querySelector("[data-project-language-filters]");
  const projectStatusFilters = document.querySelector("[data-project-status-filters]");
  const projectCategoryShortcuts = document.querySelectorAll(
    "[data-project-category-shortcut]",
  );

  if (!projectList) {
    return;
  }

  // 요청 결과와 현재 개발 분야 선택 상태
  const projectState = {
    status: "idle",
    repositories: [],
    errorType: null,
    selectedCategory: ALL_PROJECT_CATEGORIES,
    selectedLanguage: ALL_PROJECT_LANGUAGES,
    selectedStatus: ALL_PROJECT_STATUSES,
  };

  const view = createProjectsView({
    projectStatus,
    projectStatusMessage,
    projectList,
    projectRetryButton,
    projectFilters,
    projectCategoryFilters,
    projectLanguageFilters,
    projectStatusFilters,
    fallbackUrl: GITHUB_PROFILE_URL,
  });

  // 상태에서 화면 출력용 파생 데이터 생성
  const renderProjects = () => {
    const {
      status,
      repositories,
      errorType,
      selectedCategory,
      selectedLanguage,
      selectedStatus,
    } = projectState;
    const categoryRepositories = filterRepositoriesByCategory(
      repositories,
      selectedCategory,
    );
    const languageRepositories = filterRepositoriesByLanguage(
      categoryRepositories,
      selectedLanguage,
    );
    const filteredRepositories = filterRepositoriesByStatus(
      languageRepositories,
      selectedStatus,
    );
    const categoryCounts = getProjectCategoryCounts(repositories);
    const languageCounts = getProjectLanguageCounts(categoryRepositories);
    const statusCounts = getProjectStatusCounts(languageRepositories);

    view.render({
      status,
      errorType,
      selectedCategory,
      selectedLanguage,
      selectedStatus,
      filteredRepositories,
      repositoryCount: repositories.length,
      categoryRepositoryCount: categoryRepositories.length,
      languageRepositoryCount: languageRepositories.length,
      categoryCounts,
      languageCounts,
      statusCounts,
    });
  };

  // HTTP 상태 기준 사용자 오류 유형 분류
  const getProjectErrorType = (status) => {
    if (status === 403) {
      return "rate-limit";
    }

    if (status === 404) {
      return "not-found";
    }

    return "general";
  };

  // 저장소 요청의 로딩·성공·빈 결과·오류 흐름
  const loadProjects = async () => {
    if (projectState.status === "loading") {
      return;
    }

    projectState.status = "loading";
    projectState.repositories = [];
    projectState.errorType = null;
    projectState.selectedCategory = ALL_PROJECT_CATEGORIES;
    projectState.selectedLanguage = ALL_PROJECT_LANGUAGES;
    projectState.selectedStatus = ALL_PROJECT_STATUSES;
    renderProjects();

    try {
      const responseData = await fetchRepositories();

      projectState.repositories = prepareRepositories(responseData);
      projectState.status = projectState.repositories.length > 0 ? "success" : "empty";
      renderProjects();
    } catch (error) {
      projectState.status = "error";
      projectState.repositories = [];
      projectState.errorType = getProjectErrorType(error.status);
      renderProjects();
    }
  };

  // 추가 요청 없는 상·하위 필터 상태 변경
  projectFilters?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const filterButton = event.target.closest("[data-project-filter]");

    if (!filterButton || !projectFilters.contains(filterButton)) {
      return;
    }

    const { projectFilter, projectFilterType } = filterButton.dataset;

    if (!projectFilter || !projectFilterType) {
      return;
    }

    if (projectFilterType === "category") {
      if (projectFilter === projectState.selectedCategory) {
        return;
      }

      if (!isProjectCategory(projectFilter)) {
        return;
      }

      projectState.selectedCategory = projectFilter;
      projectState.selectedLanguage = ALL_PROJECT_LANGUAGES;
      projectState.selectedStatus = ALL_PROJECT_STATUSES;
      renderProjects();
      view.focusFilter("category", projectState.selectedCategory);
      return;
    }

    if (projectFilterType === "language") {
      if (projectFilter === projectState.selectedLanguage) {
        return;
      }

      const categoryRepositories = filterRepositoriesByCategory(
        projectState.repositories,
        projectState.selectedCategory,
      );
      const isKnownLanguage =
        projectFilter === ALL_PROJECT_LANGUAGES ||
        getProjectLanguages(categoryRepositories).includes(projectFilter);

      if (!isKnownLanguage) {
        return;
      }

      projectState.selectedLanguage = projectFilter;
      projectState.selectedStatus = ALL_PROJECT_STATUSES;
      renderProjects();
      view.focusFilter("language", projectState.selectedLanguage);
      return;
    }

    if (
      projectFilterType !== "status" ||
      projectFilter === projectState.selectedStatus ||
      !isProjectStatus(projectFilter)
    ) {
      return;
    }

    projectState.selectedStatus = projectFilter;
    renderProjects();
    view.focusFilter("status", projectState.selectedStatus);
  });

  // Hero 분야 카드와 상위 필터 상태 연결
  projectCategoryShortcuts.forEach((shortcut) => {
    shortcut.addEventListener("click", () => {
      const { projectCategoryShortcut } = shortcut.dataset;

      if (!projectCategoryShortcut || !isProjectCategory(projectCategoryShortcut)) {
        return;
      }

      projectState.selectedCategory = projectCategoryShortcut;
      projectState.selectedLanguage = ALL_PROJECT_LANGUAGES;
      projectState.selectedStatus = ALL_PROJECT_STATUSES;
      renderProjects();
    });
  });

  projectRetryButton?.addEventListener("click", loadProjects);
  loadProjects();
};
