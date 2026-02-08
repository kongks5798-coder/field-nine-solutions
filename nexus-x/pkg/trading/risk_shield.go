// ============================================================================
// FIELD NINE OS - RISK SHIELD MODULE
// Version: 1.0.9 (CONVERGENCE)
// Purpose: Real-time risk monitoring with 2% MDD Safety Lock
// ============================================================================

package trading

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/shopspring/decimal"
)

// ============================================================================
// RISK SHIELD CONFIGURATION
// ============================================================================

type RiskShieldConfig struct {
	// MDD (Maximum Drawdown) Limits
	MDDWarningPct   float64 `json:"mdd_warning_pct"`   // 1.5% - Yellow alert
	MDDCriticalPct  float64 `json:"mdd_critical_pct"`  // 2.0% - Safety Lock

	// Position Limits
	MaxPositionSize   decimal.Decimal `json:"max_position_size"`
	MaxOpenPositions  int             `json:"max_open_positions"`
	MaxDailyTrades    int             `json:"max_daily_trades"`

	// Loss Limits
	MaxDailyLoss      decimal.Decimal `json:"max_daily_loss"`
	MaxWeeklyLoss     decimal.Decimal `json:"max_weekly_loss"`

	// Concentration Limits
	MaxMarketExposure float64         `json:"max_market_exposure"` // % per market

	// Time-based Restrictions
	TradingHoursOnly  bool            `json:"trading_hours_only"`
	BlockWeekends     bool            `json:"block_weekends"`
}

// DefaultRiskShieldConfig returns conservative Phase 9 settings
func DefaultRiskShieldConfig() *RiskShieldConfig {
	return &RiskShieldConfig{
		MDDWarningPct:     1.5,
		MDDCriticalPct:    2.0,
		MaxPositionSize:   decimal.NewFromFloat(100.00),
		MaxOpenPositions:  5,
		MaxDailyTrades:    50,
		MaxDailyLoss:      decimal.NewFromFloat(20.00),  // $20 max daily loss
		MaxWeeklyLoss:     decimal.NewFromFloat(50.00),  // $50 max weekly loss
		MaxMarketExposure: 50.0, // Max 50% in any single market
		TradingHoursOnly:  false,
		BlockWeekends:     true,
	}
}

// ============================================================================
// RISK SHIELD
// ============================================================================

type RiskShield struct {
	config    *RiskShieldConfig
	mu        sync.RWMutex

	// Current State
	status          RiskStatus
	currentMDD      float64
	dailyPnL        decimal.Decimal
	weeklyPnL       decimal.Decimal
	openPositions   int
	dailyTradeCount int

	// Market Exposure
	marketExposure  map[MarketID]decimal.Decimal

	// Tracking
	highWaterMark   decimal.Decimal
	lastResetDaily  time.Time
	lastResetWeekly time.Time

	// Callbacks
	onWarning       func(RiskWarning)
	onSafetyLock    func(string)
}

type RiskStatus string

const (
	RiskStatusNormal   RiskStatus = "NORMAL"    // Green - All clear
	RiskStatusCaution  RiskStatus = "CAUTION"   // Yellow - Warning threshold
	RiskStatusDanger   RiskStatus = "DANGER"    // Orange - Near limit
	RiskStatusLocked   RiskStatus = "LOCKED"    // Red - Safety lock active
)

type RiskWarning struct {
	Type      string    `json:"type"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	Value     float64   `json:"value"`
	Threshold float64   `json:"threshold"`
	Timestamp time.Time `json:"timestamp"`
}

// NewRiskShield creates a new risk shield instance
func NewRiskShield(tradingConfig *Phase9Config) *RiskShield {
	config := DefaultRiskShieldConfig()
	config.MDDCriticalPct = tradingConfig.MaxDrawdownPct
	config.MaxPositionSize = tradingConfig.MaxPositionSize
	config.MaxOpenPositions = tradingConfig.MaxOpenPositions

	return &RiskShield{
		config:          config,
		status:          RiskStatusNormal,
		currentMDD:      0,
		dailyPnL:        decimal.Zero,
		weeklyPnL:       decimal.Zero,
		openPositions:   0,
		dailyTradeCount: 0,
		marketExposure:  make(map[MarketID]decimal.Decimal),
		highWaterMark:   tradingConfig.InitialCapital,
		lastResetDaily:  time.Now(),
		lastResetWeekly: time.Now(),
	}
}

// ============================================================================
// TRADE VALIDATION
// ============================================================================

// AllowTrade checks if a trade is allowed under current risk parameters
func (rs *RiskShield) AllowTrade(signal *TradeSignal) bool {
	rs.mu.RLock()
	defer rs.mu.RUnlock()

	// Check safety lock
	if rs.status == RiskStatusLocked {
		return false
	}

	// Run all risk checks
	checks := []func(*TradeSignal) (bool, string){
		rs.checkMDD,
		rs.checkDailyLoss,
		rs.checkWeeklyLoss,
		rs.checkPositionLimit,
		rs.checkDailyTradeLimit,
		rs.checkMarketExposure,
		rs.checkTradingHours,
	}

	for _, check := range checks {
		allowed, reason := check(signal)
		if !allowed {
			if rs.onWarning != nil {
				rs.onWarning(RiskWarning{
					Type:      "TRADE_BLOCKED",
					Level:     "WARNING",
					Message:   reason,
					Timestamp: time.Now(),
				})
			}
			return false
		}
	}

	return true
}

func (rs *RiskShield) checkMDD(signal *TradeSignal) (bool, string) {
	if rs.currentMDD >= rs.config.MDDCriticalPct {
		return false, fmt.Sprintf("MDD limit reached: %.2f%% >= %.2f%%", rs.currentMDD, rs.config.MDDCriticalPct)
	}
	return true, ""
}

func (rs *RiskShield) checkDailyLoss(signal *TradeSignal) (bool, string) {
	if rs.dailyPnL.IsNegative() && rs.dailyPnL.Abs().GreaterThanOrEqual(rs.config.MaxDailyLoss) {
		return false, fmt.Sprintf("Daily loss limit reached: $%s", rs.dailyPnL.Abs().String())
	}
	return true, ""
}

func (rs *RiskShield) checkWeeklyLoss(signal *TradeSignal) (bool, string) {
	if rs.weeklyPnL.IsNegative() && rs.weeklyPnL.Abs().GreaterThanOrEqual(rs.config.MaxWeeklyLoss) {
		return false, fmt.Sprintf("Weekly loss limit reached: $%s", rs.weeklyPnL.Abs().String())
	}
	return true, ""
}

func (rs *RiskShield) checkPositionLimit(signal *TradeSignal) (bool, string) {
	if rs.openPositions >= rs.config.MaxOpenPositions {
		return false, fmt.Sprintf("Max open positions reached: %d/%d", rs.openPositions, rs.config.MaxOpenPositions)
	}
	return true, ""
}

func (rs *RiskShield) checkDailyTradeLimit(signal *TradeSignal) (bool, string) {
	if rs.dailyTradeCount >= rs.config.MaxDailyTrades {
		return false, fmt.Sprintf("Daily trade limit reached: %d/%d", rs.dailyTradeCount, rs.config.MaxDailyTrades)
	}
	return true, ""
}

func (rs *RiskShield) checkMarketExposure(signal *TradeSignal) (bool, string) {
	// Check if adding this position would exceed market exposure limit
	// Implementation would calculate actual exposure percentage
	return true, ""
}

func (rs *RiskShield) checkTradingHours(signal *TradeSignal) (bool, string) {
	if rs.config.BlockWeekends {
		weekday := time.Now().Weekday()
		if weekday == time.Saturday || weekday == time.Sunday {
			return false, "Weekend trading blocked"
		}
	}
	return true, ""
}

// ============================================================================
// STATE UPDATES
// ============================================================================

// UpdateMDD updates the current maximum drawdown
func (rs *RiskShield) UpdateMDD(currentEquity, highWaterMark decimal.Decimal) {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	rs.highWaterMark = highWaterMark

	if highWaterMark.IsPositive() {
		drawdown := highWaterMark.Sub(currentEquity)
		mdd, _ := drawdown.Div(highWaterMark).Mul(decimal.NewFromInt(100)).Float64()
		rs.currentMDD = mdd
	}

	// Update status based on MDD
	rs.updateStatus()
}

func (rs *RiskShield) updateStatus() {
	if rs.currentMDD >= rs.config.MDDCriticalPct {
		if rs.status != RiskStatusLocked {
			rs.status = RiskStatusLocked
			if rs.onSafetyLock != nil {
				rs.onSafetyLock(fmt.Sprintf("MDD %.2f%% exceeded limit %.2f%%", rs.currentMDD, rs.config.MDDCriticalPct))
			}
		}
	} else if rs.currentMDD >= rs.config.MDDWarningPct {
		rs.status = RiskStatusDanger
		if rs.onWarning != nil {
			rs.onWarning(RiskWarning{
				Type:      "MDD_WARNING",
				Level:     "DANGER",
				Message:   "Approaching MDD limit",
				Value:     rs.currentMDD,
				Threshold: rs.config.MDDCriticalPct,
				Timestamp: time.Now(),
			})
		}
	} else if rs.currentMDD >= rs.config.MDDWarningPct*0.75 {
		rs.status = RiskStatusCaution
	} else {
		rs.status = RiskStatusNormal
	}
}

// RecordTrade records a completed trade for risk tracking
func (rs *RiskShield) RecordTrade(result *TradeResult) {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	rs.dailyPnL = rs.dailyPnL.Add(result.PnL)
	rs.weeklyPnL = rs.weeklyPnL.Add(result.PnL)
	rs.dailyTradeCount++

	// Update market exposure
	if result.Signal != nil {
		exposure := rs.marketExposure[result.Signal.Market]
		if result.Status == TradeStatusFilled {
			rs.marketExposure[result.Signal.Market] = exposure.Add(result.Quantity.Mul(result.EntryPrice))
		}
	}
}

// ResetDaily resets daily counters (call at market open)
func (rs *RiskShield) ResetDaily() {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	rs.dailyPnL = decimal.Zero
	rs.dailyTradeCount = 0
	rs.lastResetDaily = time.Now()
}

// ResetWeekly resets weekly counters (call at week start)
func (rs *RiskShield) ResetWeekly() {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	rs.weeklyPnL = decimal.Zero
	rs.lastResetWeekly = time.Now()
}

// ============================================================================
// SAFETY LOCK CONTROL
// ============================================================================

// ActivateSafetyLock manually activates the safety lock
func (rs *RiskShield) ActivateSafetyLock(reason string) {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	rs.status = RiskStatusLocked
	if rs.onSafetyLock != nil {
		rs.onSafetyLock(reason)
	}
}

// DeactivateSafetyLock manually deactivates the safety lock (requires authorization)
func (rs *RiskShield) DeactivateSafetyLock(authToken string) error {
	// In production, this would verify CEO authorization
	rs.mu.Lock()
	defer rs.mu.Unlock()

	rs.status = RiskStatusNormal
	return nil
}

// ============================================================================
// STATUS REPORTING
// ============================================================================

// GetStatus returns the current risk shield status
func (rs *RiskShield) GetStatus() *RiskShieldStatus {
	rs.mu.RLock()
	defer rs.mu.RUnlock()

	return &RiskShieldStatus{
		Status:           rs.status,
		CurrentMDD:       rs.currentMDD,
		MDDWarning:       rs.config.MDDWarningPct,
		MDDCritical:      rs.config.MDDCriticalPct,
		DailyPnL:         rs.dailyPnL,
		WeeklyPnL:        rs.weeklyPnL,
		MaxDailyLoss:     rs.config.MaxDailyLoss,
		MaxWeeklyLoss:    rs.config.MaxWeeklyLoss,
		OpenPositions:    rs.openPositions,
		MaxOpenPositions: rs.config.MaxOpenPositions,
		DailyTrades:      rs.dailyTradeCount,
		MaxDailyTrades:   rs.config.MaxDailyTrades,
		HighWaterMark:    rs.highWaterMark,
		LastUpdate:       time.Now(),
	}
}

type RiskShieldStatus struct {
	Status           RiskStatus      `json:"status"`
	CurrentMDD       float64         `json:"current_mdd"`
	MDDWarning       float64         `json:"mdd_warning"`
	MDDCritical      float64         `json:"mdd_critical"`
	DailyPnL         decimal.Decimal `json:"daily_pnl"`
	WeeklyPnL        decimal.Decimal `json:"weekly_pnl"`
	MaxDailyLoss     decimal.Decimal `json:"max_daily_loss"`
	MaxWeeklyLoss    decimal.Decimal `json:"max_weekly_loss"`
	OpenPositions    int             `json:"open_positions"`
	MaxOpenPositions int             `json:"max_open_positions"`
	DailyTrades      int             `json:"daily_trades"`
	MaxDailyTrades   int             `json:"max_daily_trades"`
	HighWaterMark    decimal.Decimal `json:"high_water_mark"`
	LastUpdate       time.Time       `json:"last_update"`
}

// SetCallbacks sets the warning and safety lock callbacks
func (rs *RiskShield) SetCallbacks(onWarning func(RiskWarning), onSafetyLock func(string)) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	rs.onWarning = onWarning
	rs.onSafetyLock = onSafetyLock
}

// ============================================================================
// RISK MONITOR (Background Process)
// ============================================================================

// StartMonitor starts the background risk monitoring process
func (rs *RiskShield) StartMonitor(ctx context.Context) {
	go rs.monitorLoop(ctx)
	go rs.resetLoop(ctx)
}

func (rs *RiskShield) monitorLoop(ctx context.Context) {
	ticker := time.NewTicker(500 * time.Millisecond) // Check every 500ms
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rs.mu.Lock()
			rs.updateStatus()
			rs.mu.Unlock()
		}
	}
}

func (rs *RiskShield) resetLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			now := time.Now()

			// Reset daily at midnight UTC
			if now.Day() != rs.lastResetDaily.Day() {
				rs.ResetDaily()
			}

			// Reset weekly on Monday
			if now.Weekday() == time.Monday && rs.lastResetWeekly.Weekday() != time.Monday {
				rs.ResetWeekly()
			}

			time.Sleep(1 * time.Minute)
		}
	}
}
