// Dummy rateLimit module for build
export function ipFromHeaders(headers: any): string {
	return '127.0.0.1';
}
export function checkLimit(key: string) {
	return { ok: true };
}
export function headersFor(limit: any): Record<string, string> {
	return {};
}