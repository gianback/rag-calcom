export async function getContentRepo(path: string) {
  const resp = await fetch(
    `https://api.github.com/repos/calcom/cal.com/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!resp.ok) {
    throw new Error(`Failed to get repo content: ${resp.statusText}`);
  }

  const data = await resp.json();

  return data;
}
