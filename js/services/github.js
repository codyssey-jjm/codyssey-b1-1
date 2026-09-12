// GitHub 저장소 요청 설정
const GITHUB_USERNAME = "jungmyung16";
const GITHUB_ORGANIZATION = "gameDev-graphics-Lab";
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_API_URLS = [
  `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100&type=owner`,
  `https://api.github.com/orgs/${GITHUB_ORGANIZATION}/repos?sort=updated&direction=desc&per_page=100&type=public`,
];

// 단일 소유자의 저장소 목록 요청과 응답 형식 검증
const fetchRepositorySource = async (apiUrl) => {
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  // 상태별 화면 처리를 위한 HTTP 상태 보존
  if (!response.ok) {
    const requestError = new Error(`GitHub API request failed: ${response.status}`);
    requestError.status = response.status;
    throw requestError;
  }

  const responseData = await response.json();

  if (!Array.isArray(responseData)) {
    throw new Error("GitHub API returned an unexpected response.");
  }

  return responseData;
};

// 사용자·조직 저장소 목록의 병렬 요청과 병합
export const fetchRepositories = async () => {
  const repositoriesBySource = await Promise.all(
    GITHUB_API_URLS.map(fetchRepositorySource),
  );

  return repositoriesBySource.flat();
};
