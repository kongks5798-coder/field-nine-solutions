/**
 * Lambda 함수: crypto-arbitrage
 * 암호화폐 차익거래 기회 모니터링 (Binance vs Upbit)
 * 
 * 환경변수 필수:
 * - BINANCE_API_KEY (옵션)
 * - BINANCE_API_SECRET (옵션)
 * - UPBIT_API_KEY (옵션)
 * - UPBIT_API_SECRET (옵션)
 * 
 * 참고: Python 버전이 더 적합하지만, Node.js로도 구현 가능
 */

const axios = require('axios');

// Binance API 엔드포인트
const BINANCE_API = 'https://api.binance.com/api/v3';
// Upbit API 엔드포인트
const UPBIT_API = 'https://api.upbit.com/v1';

// 환율 (USD/KRW) - 실제로는 API에서 가져와야 함
const EXCHANGE_RATE = 1400;

/**
 * Binance 시세 조회
 */
async function getBinanceTicker(symbol = 'BTCUSDT') {
  try {
    const response = await axios.get(`${BINANCE_API}/ticker/price`, {
      params: { symbol },
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error('Binance API 오류:', error.message);
    throw error;
  }
}

/**
 * Upbit 시세 조회
 */
async function getUpbitTicker(market = 'KRW-BTC') {
  try {
    const response = await axios.get(`${UPBIT_API}/ticker`, {
      params: { markets: market },
    });
    return parseFloat(response.data[0].trade_price);
  } catch (error) {
    console.error('Upbit API 오류:', error.message);
    throw error;
  }
}

/**
 * 수익 기회 계산
 */
function calculateProfitOpportunity(binancePrice, upbitPriceKRW, exchangeRate = EXCHANGE_RATE) {
  const upbitPriceUSD = upbitPriceKRW / exchangeRate;
  const priceDiff = binancePrice - upbitPriceUSD;
  
  // 수수료 고려 (Binance 0.1%, Upbit 0.05%)
  const fees = binancePrice * 0.001 + upbitPriceUSD * 0.0005;
  const netProfit = Math.abs(priceDiff) - fees;
  const profitPercent = (netProfit / binancePrice) * 100;
  
  return {
    netProfit,
    profitPercent,
    priceDiff,
    binancePrice,
    upbitPriceUSD,
    upbitPriceKRW,
  };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // CORS 헤더
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // 요청 파라미터
    const minProfit = event.queryStringParameters?.minProfit || 50;
    const minProfitPercent = event.queryStringParameters?.minProfitPercent || 0.5;

    // 시세 조회
    const [binancePrice, upbitPriceKRW] = await Promise.all([
      getBinanceTicker('BTCUSDT'),
      getUpbitTicker('KRW-BTC'),
    ]);

    // 수익 기회 계산
    const opportunity = calculateProfitOpportunity(binancePrice, upbitPriceKRW);

    // 수익 기회 여부 판단
    const hasOpportunity =
      opportunity.netProfit > minProfit && opportunity.profitPercent > minProfitPercent;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        hasOpportunity,
        opportunity: {
          ...opportunity,
          timestamp: new Date().toISOString(),
        },
        thresholds: {
          minProfit,
          minProfitPercent,
        },
      }),
    };
  } catch (error) {
    console.error('Lambda 오류:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '차익거래 기회 조회 중 오류가 발생했습니다.',
        message: error.message,
      }),
    };
  }
};
