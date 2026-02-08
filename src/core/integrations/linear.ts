type CreateIssueInput = {
  teamId: string;
  title: string;
  description?: string;
};

export async function linearCreateIssue(input: CreateIssueInput) {
  const token = process.env.LINEAR_API_KEY || "";
  if (!token) return null;
  const query = `
mutation IssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { id title }
  }
}
`;
  const body = {
    query,
    variables: {
      input: {
        teamId: input.teamId,
        title: input.title,
        description: input.description || "",
      },
    },
  };
  const resp = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.data?.issueCreate?.issue || null;
}
