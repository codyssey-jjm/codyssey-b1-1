import { GITHUB_USERNAME } from "../../services/github.js";
import { ALL_PROJECT_LANGUAGES, getProjectLanguage } from "./repository.js";

const PROJECT_STATUS_CLASSES = ["is-loading", "is-success", "is-empty", "is-error"];
const HTML_ESCAPE_CHARACTERS = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};
const projectDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPE_CHARACTERS[character]);

const getSafeGitHubUrl = (value) => {
  const fallbackUrl = `https://github.com/${GITHUB_USERNAME}`;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.href : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

const formatProjectDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "날짜 정보 없음" : projectDateFormatter.format(date);
};

const createProjectCard = (repository) => {
  const {
    name = "Untitled",
    description,
    stargazers_count: starCount = 0,
    updated_at: updatedAt,
    html_url: htmlUrl,
  } = repository;

  const projectName = String(name).trim() || "Untitled";
  const projectDescription = description || "프로젝트 설명이 아직 등록되지 않았습니다.";
  const projectLanguage = getProjectLanguage(repository);
  const projectInitial = [...projectName][0]?.toUpperCase() ?? "?";
  const projectUrl = getSafeGitHubUrl(htmlUrl);
  const formattedStarCount = Number.isFinite(starCount) ? starCount : 0;

  return `
    <article class="project-card" role="listitem">
      <div class="project-card__cover" aria-hidden="true">
        <span>${escapeHTML(projectInitial)}</span>
      </div>
      <div class="project-card__body">
        <div class="project-card__meta">
          <span>${escapeHTML(projectLanguage)}</span>
          <span>PUBLIC REPOSITORY</span>
        </div>
        <h3 class="project-card__title">${escapeHTML(projectName)}</h3>
        <p class="project-card__description">${escapeHTML(projectDescription)}</p>
        <footer class="project-card__footer">
          <span aria-label="별 ${formattedStarCount}개">★ ${formattedStarCount}</span>
          <span>${escapeHTML(formatProjectDate(updatedAt))}</span>
          <a
            class="project-card__link"
            href="${escapeHTML(projectUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHTML(projectName)} GitHub 저장소 새 창에서 보기"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </footer>
      </div>
    </article>
  `;
};

export const createProjectsView = ({
  projectStatus,
  projectStatusMessage,
  projectList,
  projectRetryButton,
  projectFilters,
}) => {
  const getProjectStatusMessage = ({
    status,
    errorType,
    selectedLanguage,
    filteredRepositories,
  }) => {
    if (status === "loading") {
      return "GitHub에서 프로젝트를 불러오는 중입니다.";
    }

    if (status === "success") {
      if (filteredRepositories.length === 0) {
        return "선택한 언어에 해당하는 프로젝트가 없습니다.";
      }

      if (selectedLanguage === ALL_PROJECT_LANGUAGES) {
        return `${filteredRepositories.length}개의 프로젝트를 불러왔습니다.`;
      }

      return `${selectedLanguage} 프로젝트 ${filteredRepositories.length}개를 표시하고 있습니다.`;
    }

    if (status === "empty") {
      return "표시할 프로젝트가 없습니다.";
    }

    if (errorType === "rate-limit") {
      return "GitHub API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
    }

    if (errorType === "not-found") {
      return "GitHub 사용자를 찾을 수 없습니다. 설정된 사용자명을 확인해 주세요.";
    }

    if (status === "error") {
      return "프로젝트를 불러올 수 없습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
    }

    return "프로젝트를 불러올 준비가 되었습니다.";
  };

  const renderProjectStatus = (viewModel) => {
    if (!projectStatus || !projectStatusMessage) {
      return;
    }

    PROJECT_STATUS_CLASSES.forEach((className) => {
      projectStatus.classList.remove(className);
    });

    const statusClass = `is-${viewModel.status}`;

    if (PROJECT_STATUS_CLASSES.includes(statusClass)) {
      projectStatus.classList.add(statusClass);
    }

    projectStatusMessage.textContent = getProjectStatusMessage(viewModel);

    if (projectRetryButton) {
      const canRetry = viewModel.status === "error";
      projectRetryButton.hidden = !canRetry;
      projectRetryButton.disabled = viewModel.status === "loading";
    }
  };

  const renderProjectList = ({ status, filteredRepositories }) => {
    if (!projectList) {
      return;
    }

    projectList.setAttribute("aria-busy", String(status === "loading"));
    projectList.innerHTML =
      status === "success"
        ? filteredRepositories.map((repository) => createProjectCard(repository)).join("")
        : "";
  };

  const createProjectFilterButton = (language, count, selectedLanguage) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const countBadge = document.createElement("span");
    const isAllLanguages = language === ALL_PROJECT_LANGUAGES;
    const displayLanguage = isAllLanguages ? "All" : language;
    const isActive = selectedLanguage === language;

    button.className = "project-filter";
    button.type = "button";
    button.dataset.projectFilter = language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.setAttribute("aria-label", `${displayLanguage} 프로젝트 ${count}개`);

    label.className = "project-filter__label";
    label.textContent = displayLanguage;

    countBadge.className = "project-filter__count";
    countBadge.textContent = String(count);
    countBadge.setAttribute("aria-hidden", "true");

    button.append(label, countBadge);
    return button;
  };

  const renderProjectFilters = ({
    status,
    repositoryCount,
    languageCounts,
    selectedLanguage,
  }) => {
    if (!projectFilters) {
      return;
    }

    const shouldShowFilters = status === "success" && repositoryCount > 0;

    projectFilters.hidden = !shouldShowFilters;
    projectFilters.replaceChildren();

    if (!shouldShowFilters) {
      return;
    }

    const fragment = document.createDocumentFragment();

    fragment.append(
      createProjectFilterButton(ALL_PROJECT_LANGUAGES, repositoryCount, selectedLanguage),
    );

    languageCounts.forEach(({ language, count }) => {
      fragment.append(createProjectFilterButton(language, count, selectedLanguage));
    });

    projectFilters.append(fragment);
  };

  const render = (viewModel) => {
    renderProjectStatus(viewModel);
    renderProjectFilters(viewModel);
    renderProjectList(viewModel);
  };

  const focusFilter = (selectedLanguage) => {
    if (!projectFilters) {
      return;
    }

    const activeFilterButton = [...projectFilters.querySelectorAll("[data-project-filter]")].find(
      (button) => button.dataset.projectFilter === selectedLanguage,
    );

    activeFilterButton?.focus();
  };

  return { render, focusFilter };
};
