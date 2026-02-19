// Dummy proactive module for build
// Returns a dummy proactive report object
export function runProactive() {
	return {
		id: 'proactive-1',
		summary: 'Dummy proactive report',
		createdAt: new Date().toISOString(),
		signals: [
			{ message: 'Signal 1' },
			{ message: 'Signal 2' },
			{ message: 'Signal 3' }
		],
		forecast: { nextRevenue: 1000, confidence: 0.9 },
		snapshot: { customers: 10, orders: 5, revenue: 500 }
	};
}

// Dummy type for build
export type ProactiveReport = {
	id?: string;
	summary?: string;
	createdAt?: string;
	signals: { message: string }[];
	forecast: { nextRevenue: number; confidence: number };
	snapshot: { customers: number; orders: number; revenue: number };
};