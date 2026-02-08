/**
 * K-AUS SOVEREIGN API
 *
 * Unified API for K-AUS - The Global Energy Reserve Currency
 */

import { NextRequest, NextResponse } from 'next/server';
import { kausTokenomics, KAUS_CONFIG, getKausSupply, getKausBurnStats, getHalvingSchedule } from '@/lib/kaus/kaus-tokenomics';
import { poeMining, getPoEStats, getDynamicPoEAlgorithm, type EnergySource, type Region } from '@/lib/kaus/poe-mining';
import { stakingPriority, getStakingStats, getAvailableRWAAssets, type LockPeriod } from '@/lib/kaus/staking-priority';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');
  const action = searchParams.get('action');

  // TOKENOMICS MODULE
  if (module === 'tokenomics') {
    switch (action) {
      case 'supply': {
        const supply = getKausSupply();
        return NextResponse.json({
          supply,
          config: {
            maxSupply: KAUS_CONFIG.MAX_SUPPLY,
            burnRate: KAUS_CONFIG.FEE_BURN_RATE,
            distribution: KAUS_CONFIG.DISTRIBUTION,
          },
        });
      }

      case 'burns': {
        const stats = getKausBurnStats();
        const recentBurns = kausTokenomics.getRecentBurns(20);
        return NextResponse.json({
          stats,
          recentBurns,
          message: `${stats.totalBurned.toFixed(4)} K-AUS burned (${stats.deflationRate.toFixed(4)}% of supply)`,
        });
      }

      case 'halving': {
        const schedule = getHalvingSchedule();
        const currentEpoch = kausTokenomics.getCurrentEpoch();
        return NextResponse.json({
          schedule,
          currentEpoch,
          nextHalvingYear: (currentEpoch + 1) * KAUS_CONFIG.HALVING_INTERVAL_YEARS,
        });
      }

      case 'fees': {
        const feeStats = kausTokenomics.getFeeStats();
        return NextResponse.json({
          feeStructure: KAUS_CONFIG.FEES,
          stats: feeStats,
        });
      }
    }
  }

  // POE MINING MODULE
  if (module === 'poe') {
    switch (action) {
      case 'stats': {
        const stats = getPoEStats();
        return NextResponse.json({
          stats,
          status: 'POE_MINING_ACTIVE',
        });
      }

      case 'algorithm': {
        const algorithm = getDynamicPoEAlgorithm();
        return NextResponse.json({
          algorithm,
          description: 'Dynamic Proof-of-Energy reward calculation',
        });
      }

      case 'difficulty': {
        const difficulty = poeMining.getDifficulty();
        return NextResponse.json({
          difficulty,
          targetBlockTime: `${10} seconds`,
        });
      }

      case 'rewards': {
        const recentRewards = poeMining.getRecentRewards(50);
        return NextResponse.json({
          rewards: recentRewards,
          count: recentRewards.length,
        });
      }

      case 'recycling': {
        const history = poeMining.getRecyclingHistory(20);
        return NextResponse.json({
          recyclingRate: '30%',
          allocation: {
            liquidityProvision: '50%',
            nodeConstruction: '30%',
            ecosystemGrants: '20%',
          },
          history,
        });
      }
    }
  }

  // STAKING MODULE
  if (module === 'staking') {
    switch (action) {
      case 'tiers': {
        const tiers = stakingPriority.getAllTiers();
        return NextResponse.json({
          tiers,
          lockPeriods: {
            FLEXIBLE: '0 days (1x multiplier)',
            SHORT: '30 days (1.1x multiplier)',
            MEDIUM: '90 days (1.25x multiplier)',
            LONG: '180 days (1.5x multiplier)',
            ULTRA: '365 days (2x multiplier)',
          },
        });
      }

      case 'stats': {
        const stats = getStakingStats();
        return NextResponse.json({
          stats,
          status: 'STAKING_ACTIVE',
        });
      }

      case 'assets': {
        const assets = getAvailableRWAAssets();
        return NextResponse.json({
          assets,
          count: assets.length,
        });
      }
    }
  }

  // PRICE & MARKET MODULE
  if (module === 'market') {
    switch (action) {
      case 'price': {
        // Simulated price based on supply dynamics
        const supply = getKausSupply();
        const burnStats = getKausBurnStats();

        const basePrice = KAUS_CONFIG.GENESIS_PRICE_USD;
        const scarcityMultiplier = KAUS_CONFIG.MAX_SUPPLY / supply.circulatingSupply;
        const burnPremium = 1 + (burnStats.deflationRate / 100);

        const currentPrice = basePrice * scarcityMultiplier * burnPremium;

        return NextResponse.json({
          price: {
            usd: currentPrice,
            krw: currentPrice * 1320.50,
            btc: currentPrice / 95000,
            eth: currentPrice / 3200,
          },
          change24h: (Math.random() - 0.3) * 10,
          marketCap: currentPrice * supply.circulatingSupply,
          volume24h: currentPrice * supply.circulatingSupply * 0.05,
        });
      }

      case 'energy-index': {
        // K-AUS vs Global Energy Index
        return NextResponse.json({
          kausIndex: 127.5,
          globalEnergyIndex: 100,
          ratio: 1.275,
          correlation: 0.87,
          outperformance: '+27.5%',
        });
      }
    }
  }

  // Default: API overview
  return NextResponse.json({
    api: 'K-AUS Sovereign API',
    version: '1.0',
    description: 'The Global Energy Reserve Currency',
    tagline: '전 세계 모든 에너지 노드가 카우스를 갈구하게 하라',
    modules: {
      tokenomics: {
        description: 'K-AUS Tokenomics & Deflationary Engine',
        endpoints: [
          'GET ?module=tokenomics&action=supply',
          'GET ?module=tokenomics&action=burns',
          'GET ?module=tokenomics&action=halving',
          'GET ?module=tokenomics&action=fees',
        ],
      },
      poe: {
        description: 'Proof-of-Energy Mining',
        endpoints: [
          'GET ?module=poe&action=stats',
          'GET ?module=poe&action=algorithm',
          'GET ?module=poe&action=difficulty',
          'GET ?module=poe&action=rewards',
          'GET ?module=poe&action=recycling',
        ],
      },
      staking: {
        description: 'Staking-to-Asset Priority System',
        endpoints: [
          'GET ?module=staking&action=tiers',
          'GET ?module=staking&action=stats',
          'GET ?module=staking&action=assets',
        ],
      },
      market: {
        description: 'Price & Market Data',
        endpoints: [
          'GET ?module=market&action=price',
          'GET ?module=market&action=energy-index',
        ],
      },
    },
    tokenConfig: {
      maxSupply: '120,000,000 K-AUS',
      halvingInterval: '4 years (100-year total)',
      burnRate: '10% of all fees',
      genesisPriceUSD: '$0.10',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, action } = body;

    // TOKENOMICS MODULE
    if (module === 'tokenomics') {
      switch (action) {
        case 'process-fee': {
          const { feeType, transactionValue } = body;
          const result = kausTokenomics.processFeeBurn(feeType, transactionValue);

          return NextResponse.json({
            success: true,
            result,
            message: `Fee processed: ${result.amount.toFixed(6)} K-AUS (${result.burned.toFixed(6)} burned)`,
          });
        }

        case 'simulate-supply': {
          const { years, annualBurnRate } = body;
          const simulation = kausTokenomics.simulateSupply(years || 5, annualBurnRate || 0.02);

          return NextResponse.json({
            success: true,
            simulation,
            summary: {
              startCirculating: simulation[0].circulatingSupply,
              endCirculating: simulation[simulation.length - 1].circulatingSupply,
              totalBurned: simulation[simulation.length - 1].burnedSupply,
            },
          });
        }
      }
    }

    // POE MODULE
    if (module === 'poe') {
      switch (action) {
        case 'verify-mint': {
          const { nodeId, kwhProduced, source, region, verificationHash, meterReadingId } = body;

          const reward = await poeMining.verifyAndMint({
            nodeId,
            timestamp: Date.now(),
            kwhProduced,
            source: source as EnergySource,
            region: region as Region,
            verificationHash: verificationHash || `0x${Date.now().toString(16)}`,
            meterReadingId: meterReadingId || `METER-${Date.now()}`,
          });

          return NextResponse.json({
            success: true,
            reward,
            message: `Minted ${reward.totalReward.toFixed(6)} K-AUS for ${kwhProduced} kWh (${source})`,
          });
        }

        case 'recycle': {
          const { protocolRevenue } = body;
          const allocation = poeMining.executeRecycling(protocolRevenue);

          return NextResponse.json({
            success: true,
            allocation,
            message: `Recycled ${allocation.recycledAmount.toFixed(2)} K-AUS (30% of ${protocolRevenue})`,
          });
        }

        case 'simulate-rewards': {
          const { dailyKwhProduction, source, region, days } = body;
          const simulation = poeMining.simulatePoERewards({
            dailyKwhProduction: dailyKwhProduction || 10000,
            source: source || 'solar',
            region: region || 'KR',
            days: days || 365,
          });

          return NextResponse.json({
            success: true,
            simulation,
            summary: {
              totalKwh: simulation.reduce((sum, d) => sum + d.kwhProduced, 0),
              totalKausEarned: simulation[simulation.length - 1].cumulativeKaus,
            },
          });
        }
      }
    }

    // STAKING MODULE
    if (module === 'staking') {
      switch (action) {
        case 'stake': {
          const { userId, amount, lockPeriod } = body;
          const position = stakingPriority.stake(userId, amount, lockPeriod as LockPeriod);

          return NextResponse.json({
            success: true,
            position,
            message: `Staked ${amount} K-AUS (${position.tier} tier, ${lockPeriod} lock)`,
          });
        }

        case 'check-eligibility': {
          const { userId, assetId } = body;
          const eligibility = stakingPriority.checkEligibility(userId, assetId);

          return NextResponse.json({
            eligibility,
            message: eligibility.eligible
              ? `Eligible to invest up to $${eligibility.maxInvestment.toLocaleString()}`
              : eligibility.reason,
          });
        }

        case 'allocate': {
          const { userId, assetId, amount } = body;
          const allocation = stakingPriority.allocateInvestment(userId, assetId, amount);

          if (!allocation) {
            return NextResponse.json({ success: false, error: 'Not eligible for this asset' }, { status: 400 });
          }

          return NextResponse.json({
            success: true,
            allocation,
            message: `Allocated $${allocation.allocatedAmount.toLocaleString()} to ${assetId}`,
          });
        }

        case 'user-info': {
          const { userId } = body;
          const info = stakingPriority.getUserStakingInfo(userId);

          return NextResponse.json({
            success: true,
            info,
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Unknown module/action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[K-AUS API Error]', error);
    return NextResponse.json(
      { error: 'Operation failed', details: String(error) },
      { status: 500 }
    );
  }
}
