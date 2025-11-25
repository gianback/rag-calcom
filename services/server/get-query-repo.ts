export async function getQueryRepo(query: string) {
  const response = await fetch(
    `https://api.github.com/search/code?q=${query}+repo:calcom/cal.com`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok)
    throw new Error(`Failed to get query repo: ${response.statusText}`);

  const data = await response.json();

  return data;
}
