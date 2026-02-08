/**
 * 블록체인 통합 서비스
 * IPFS + Polygon을 사용한 분산 저장 및 검증
 */

// Ethers (선택사항 - 블록체인 기능이 필요할 때만)
let ethers: any = null;
try {
  ethers = require('ethers');
} catch (e) {
  console.warn('ethers가 설치되지 않았습니다. 블록체인 기능을 사용할 수 없습니다.');
}

// IPFS 설정
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// Polygon 설정
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

/**
 * 데이터를 IPFS에 업로드
 */
export async function uploadToIPFS(data: any): Promise<string> {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.warn('[Blockchain] Pinata API 키가 설정되지 않았습니다. 로컬 모드로 실행됩니다.');
      // 개발 환경에서는 로컬 해시 반환
      return `local-hash-${Date.now()}`;
    }

    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('file', blob, 'data.json');

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS 업로드 실패: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('[Blockchain] IPFS 업로드 오류:', error);
    throw error;
  }
}

/**
 * IPFS에서 데이터 다운로드
 */
export async function downloadFromIPFS(hash: string): Promise<any> {
  try {
    const response = await fetch(`${IPFS_GATEWAY}${hash}`);
    
    if (!response.ok) {
      throw new Error(`IPFS 다운로드 실패: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Blockchain] IPFS 다운로드 오류:', error);
    throw error;
  }
}

/**
 * 데이터 해시 생성
 */
export function createHash(data: any): string {
  const dataString = JSON.stringify(data);
  // 실제로는 crypto.subtle.digest 사용 권장
  // 여기서는 간단한 해시 함수 사용
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `0x${Math.abs(hash).toString(16)}`;
}

/**
 * 블록체인에 해시 저장 (Polygon)
 */
export async function storeHashOnBlockchain(hash: string, metadata?: string): Promise<string> {
  try {
    if (!ethers) {
      console.warn('[Blockchain] ethers 패키지가 설치되지 않았습니다. 로컬 모드로 실행됩니다.');
      return `local-tx-${Date.now()}`;
    }

    if (!WALLET_PRIVATE_KEY || !CONTRACT_ADDRESS) {
      console.warn('[Blockchain] 블록체인 설정이 완료되지 않았습니다. 로컬 모드로 실행됩니다.');
      return `local-tx-${Date.now()}`;
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

    // 간단한 트랜잭션 (실제로는 Smart Contract 호출)
    const tx = await wallet.sendTransaction({
      to: CONTRACT_ADDRESS,
      value: 0,
      data: ethers.hexlify(ethers.toUtf8Bytes(hash)),
    });

    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('[Blockchain] 블록체인 저장 오류:', error);
    throw error;
  }
}

/**
 * 인증 기록을 블록체인에 저장
 */
export async function storeAuthRecord(
  userId: string,
  action: 'login' | 'logout' | 'signup',
  metadata?: Record<string, any>
): Promise<{ ipfsHash: string; txHash?: string }> {
  try {
    const record = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    // IPFS에 저장
    const ipfsHash = await uploadToIPFS(record);

    // 해시 생성
    const hash = createHash(record);

    // 블록체인에 해시 저장 (선택사항)
    let txHash: string | undefined;
    try {
      txHash = await storeHashOnBlockchain(hash, JSON.stringify(record));
    } catch (error) {
      console.warn('[Blockchain] 블록체인 저장 실패, IPFS 해시만 반환:', error);
    }

    return { ipfsHash, txHash };
  } catch (error) {
    console.error('[Blockchain] 인증 기록 저장 오류:', error);
    throw error;
  }
}

/**
 * 회원 정보 변경 이력을 블록체인에 저장
 */
export async function storeProfileChange(
  userId: string,
  changes: Record<string, { old: any; new: any }>,
  metadata?: Record<string, any>
): Promise<{ ipfsHash: string; txHash?: string }> {
  try {
    const record = {
      userId,
      type: 'profile_change',
      changes,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    const ipfsHash = await uploadToIPFS(record);
    const hash = createHash(record);

    let txHash: string | undefined;
    try {
      txHash = await storeHashOnBlockchain(hash, JSON.stringify(record));
    } catch (error) {
      console.warn('[Blockchain] 블록체인 저장 실패:', error);
    }

    return { ipfsHash, txHash };
  } catch (error) {
    console.error('[Blockchain] 프로필 변경 기록 저장 오류:', error);
    throw error;
  }
}

/**
 * 주문 기록을 블록체인에 저장
 */
export async function storeOrderRecord(
  orderId: string,
  userId: string,
  orderData: Record<string, any>
): Promise<{ ipfsHash: string; txHash?: string }> {
  try {
    const record = {
      orderId,
      userId,
      type: 'order',
      data: orderData,
      timestamp: new Date().toISOString(),
    };

    const ipfsHash = await uploadToIPFS(record);
    const hash = createHash(record);

    let txHash: string | undefined;
    try {
      txHash = await storeHashOnBlockchain(hash, JSON.stringify(record));
    } catch (error) {
      console.warn('[Blockchain] 블록체인 저장 실패:', error);
    }

    return { ipfsHash, txHash };
  } catch (error) {
    console.error('[Blockchain] 주문 기록 저장 오류:', error);
    throw error;
  }
}

/**
 * 블록체인 기록 검증
 */
export async function verifyRecord(ipfsHash: string, expectedHash?: string): Promise<boolean> {
  try {
    const data = await downloadFromIPFS(ipfsHash);
    const calculatedHash = createHash(data);

    if (expectedHash) {
      return calculatedHash === expectedHash;
    }

    return true; // IPFS 해시만으로도 검증 가능
  } catch (error) {
    console.error('[Blockchain] 기록 검증 오류:', error);
    return false;
  }
}
