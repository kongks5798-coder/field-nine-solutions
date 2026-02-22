// Dummy jarvis module for build
export function analyzeBusiness(_: unknown) { return {}; }
export type AIAnalysis = { summary?: string[]; actions?: string[]; risks?: string[]; forecast?: string };
export type ProactiveReport = { alerts?: string[]; recommendations?: string[]; [key: string]: unknown };