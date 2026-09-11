import { GITHUB_USERNAME } from "../../services/github.js";
import { ALL_PROJECT_LANGUAGES, getProjectLanguage } from "./repository.js";

// 프로젝트 상태 클래스와 외부 문자열 치환표
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

// 외부 데이터의 HTML 삽입 전 특수문자 치환
const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPE_CHARACTERS[character]);

// GitHub 외부 주소 제한과 사용자 페이지 대체 주소
const getSafeGitHubUrl = (value) => {
  const fallbackUrl = `https://github.com/${GITHUB_USERNAME}`;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com" ? url.href : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

// 유효하지 않은 저장소 날짜의 대체 문구 처리
const formatProjectDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "날짜 정보 없음" : projectDateFormatter.format(date);
};

// 저장소 데이터 기반 프로젝트 카드 마크업 생성
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

// 프로젝트 상태를 직접 변경하지 않는 화면 렌더러 생성
export const createProjectsView = ({
  projectStatus,
  projectStatusMessage,
  projectList,
  projectRetryButton,
  projectFilters,
}) => {
  // 요청·필터 상태별 안내 문구 결정
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

  // 상태 패널과 재시도 버튼 표시 갱신
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

  // 성공 상태의 프로젝트 카드 목록 갱신
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

  // 언어별 개수와 선택 상태를 포함한 필터 버튼 생성
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

  // 현재 저장소 언어 구성을 기준으로 필터 목록 재생성
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

  // 상태 패널·필터·카드 목록의 일괄 화면 갱신
  const render = (viewModel) => {
    renderProjectStatus(viewModel);
    renderProjectFilters(viewModel);
    renderProjectList(viewModel);
  };

  // 필터 목록 재생성 후 활성 버튼으로 포커스 복귀
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
