// Dummy linear integration for build
// Accepts an issue data argument, returns a resolved promise
export async function linearCreateIssue(data: any) {
	return { id: 'linear-issue', ...data };
}