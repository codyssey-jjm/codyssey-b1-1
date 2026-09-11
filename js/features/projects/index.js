import { fetchRepositories } from "../../services/github.js";
import {
  ALL_PROJECT_LANGUAGES,
  prepareRepositories,
  getProjectLanguages,
  filterRepositories,
} from "./repository.js";
import { createProjectsView } from "./view.js";

export const initProjects = () => {
  const projectStatus = document.querySelector("[data-project-status]");
  const projectStatusMessage = document.querySelector("[data-project-status-message]");
  const projectList = document.querySelector("[data-project-list]");
  const projectRetryButton = document.querySelector("[data-project-retry]");
  const projectFilters = document.querySelector("[data-project-filters]");

  if (!projectList) {
    return;
  }

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
  });

  const renderProjects = () => {
    const { status, repositories, errorType, selectedLanguage } = projectState;
    const filteredRepositories = filterRepositories(repositories, selectedLanguage);
    const languageCounts = getProjectLanguages(repositories).map((language) => ({
      language,
      count: filterRepositories(repositories, language).length,
    }));

    view.render({
      status,
      errorType,
      selectedLanguage,
      filteredRepositories,
      repositoryCount: repositories.length,
      languageCounts,
    });
  };

  const getProjectErrorType = (status) => {
    if (status === 403) {
      return "rate-limit";
    }

    if (status === 404) {
      return "not-found";
    }

    return "general";
  };

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
