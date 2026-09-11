import { GITHUB_PROFILE_URL, fetchRepositories } from "../../services/github.js";
import {
  ALL_PROJECT_LANGUAGES,
  prepareRepositories,
  getProjectLanguages,
  getProjectLanguageCounts,
  filterRepositories,
} from "./repository.js";
import { createProjectsView } from "./view.js";

// GitHub 프로젝트 요청·필터·화면 상태 조정
export const initProjects = () => {
  const projectStatus = document.querySelector("[data-project-status]");
  const projectStatusMessage = document.querySelector("[data-project-status-message]");
  const projectList = document.querySelector("[data-project-list]");
  const projectRetryButton = document.querySelector("[data-project-retry]");
  const projectFilters = document.querySelector("[data-project-filters]");

  if (!projectList) {
    return;
  }

  // 요청 결과와 현재 언어 선택 상태
  const projectState = {
    status: "idle",
    repositories: [],
    errorType: null,
    selectedLanguage: ALL_PROJECT_LANGUAGES,
  };

  const view = createProjectsView({
    projectStatus,
    projectStatusMessage,
    projectList,
    projectRetryButton,
    projectFilters,
    fallbackUrl: GITHUB_PROFILE_URL,
  });

  // 상태에서 화면 출력용 파생 데이터 생성
  const renderProjects = () => {
    const { status, repositories, errorType, selectedLanguage } = projectState;
    const filteredRepositories = filterRepositories(repositories, selectedLanguage);
    const languageCounts = getProjectLanguageCounts(repositories);

    view.render({
      status,
      errorType,
      selectedLanguage,
      filteredRepositories,
      repositoryCount: repositories.length,
      languageCounts,
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
    projectState.selectedLanguage = ALL_PROJECT_LANGUAGES;
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

  // 추가 요청 없는 언어 필터 상태 변경
  projectFilters?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const filterButton = event.target.closest("[data-project-filter]");

    if (!filterButton || !projectFilters.contains(filterButton)) {
      return;
    }

    const { projectFilter } = filterButton.dataset;

    if (!projectFilter || projectFilter === projectState.selectedLanguage) {
      return;
    }

    const isKnownLanguage =
      projectFilter === ALL_PROJECT_LANGUAGES ||
      getProjectLanguages(projectState.repositories).includes(projectFilter);

    if (!isKnownLanguage) {
      return;
    }

    projectState.selectedLanguage = projectFilter;
    renderProjects();

    view.focusFilter(projectState.selectedLanguage);
  });

  projectRetryButton?.addEventListener("click", loadProjects);
  loadProjects();
};
