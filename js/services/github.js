export const GITHUB_USERNAME = "jungmyung16";
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=12&type=owner`;

export const fetchRepositories = async () => {
  const response = await fetch(GITHUB_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

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
