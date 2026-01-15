/**
 * Panopticon Library Index
 * CEO 대시보드 서비스 클라이언트 모듈
 */

// Google Workspace
export {
  getTodayEvents,
  getWeekEvents,
  getUpcomingEvents,
  getRecentFiles,
  searchFiles,
  checkGoogleConnection,
  type CalendarEvent,
  type DriveFile,
} from './google';

// Vercel
export {
  getDeployments,
  getLatestDeployment,
  getDeploymentById,
  getProject,
  getProjectDomains,
  checkVercelConnection,
  getDeploymentStateText,
  getDeploymentBadgeType,
  type Deployment,
  type Project,
  type DomainInfo,
} from './vercel';

// External Data (Musinsa, Server, Finance, etc.)
export {
  getMusinsaRanking,
  getMusinsaSales,
  getMusinsaTopProducts,
  getCSReport,
  getServerStatus,
  getFinancialData,
  getProductionData,
  getDashboardData,
  checkLocalServerConnection,
  formatKRW,
  calculatePercentChange,
  calculateDDay,
  type MusinsaRanking,
  type MusinsaSales,
  type MusinsaProduct,
  type CSReport,
  type ServerStatus,
  type FinancialData,
  type ProductionData,
  type DashboardData,
} from './external-data';

// GitHub
export {
  getRepositoryInfo,
  getRecentCommits,
  getOpenPullRequests,
  getOpenIssues,
  getRepoStats,
  checkGitHubConnection,
  type GitHubCommit,
  type GitHubPullRequest,
  type GitHubIssue,
  type GitHubRepoStats,
} from './github';

// Supabase Sync
export {
  getSupabaseClient,
  getLatestFinancial,
  getLatestMusinsaRanking,
  getLatestMusinsaSales,
  getLatestCSReport,
  getLatestServerStatus,
  getActiveProduction,
  recordFinancial,
  recordMusinsaRanking,
  recordMusinsaSales,
  recordCSReport,
  recordServerStatus,
  recordJarvisLog,
  subscribeToTable,
  subscribeToAllTables,
  unsubscribeAll,
  type FinancialRecord,
  type MusinsaRankingRecord,
  type MusinsaSalesRecord,
  type CSReportRecord,
  type ServerStatusRecord,
  type ProductionRecord,
} from './supabase-sync';

// Musinsa Partner API
export {
  getMusinsaPartnerClient,
  checkMusinsaPartnerConnection,
  getMusinsaDashboardData,
  type MusinsaPartnerAuth,
  type MusinsaOrderItem,
  type MusinsaSalesData,
  type MusinsaProductRanking,
  type MusinsaSettlementInfo,
} from './musinsa-partner';
