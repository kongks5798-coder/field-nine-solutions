/**
 * Field Nine: BullMQ 동기화 큐
 * 
 * 비동기 데이터 수집 작업 관리
 */
import { Queue, Worker, QueueEvents } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

/**
 * 동기화 작업 큐
 */
export const syncQueue = new Queue('sync-queue', { connection });

/**
 * 플랫폼별 큐 (격리)
 */
export const metaQueue = new Queue('meta-sync', { connection });
export const googleQueue = new Queue('google-sync', { connection });
export const naverQueue = new Queue('naver-sync', { connection });
export const cafe24Queue = new Queue('cafe24-sync', { connection });

/**
 * 동기화 작업 추가
 */
export async function addSyncJob(data: {
  tenantId: string;
  accountId: string;
  platform: string;
  jobType: 'structure' | 'performance';
  dateRange?: { start: string; end: string };
}) {
  const queue = getPlatformQueue(data.platform);
  return await queue.add(`${data.jobType}-${data.platform}`, data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1시간 후 완료된 작업 삭제
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // 24시간 후 실패한 작업 삭제
    },
  });
}

/**
 * 플랫폼별 큐 선택
 */
function getPlatformQueue(platform: string): Queue {
  switch (platform) {
    case 'meta':
      return metaQueue;
    case 'google':
      return googleQueue;
    case 'naver':
      return naverQueue;
    case 'cafe24':
      return cafe24Queue;
    default:
      return syncQueue;
  }
}

/**
 * 큐 이벤트 모니터링
 */
export const queueEvents = new QueueEvents('sync-queue', { connection });
