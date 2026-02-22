// Dummy linear integration for build
// Accepts an issue data argument, returns a resolved promise
export async function linearCreateIssue(data: Record<string, unknown>) {
	return { id: 'linear-issue', ...data };
}