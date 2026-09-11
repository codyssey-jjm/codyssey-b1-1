// GitHub 저장소 요청 설정
export const GITHUB_USERNAME = "jungmyung16";
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=12&type=owner`;

// GitHub 저장소 원본 목록 요청과 응답 형식 검증
export const fetchRepositories = async () => {
  const response = await fetch(GITHUB_API_URL, {
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
