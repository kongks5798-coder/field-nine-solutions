// Package killswitch provides emergency system lockdown capabilities
// for the NEXUS-X trading platform.
//
// Lockdown Architecture:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    NEXUS-X Kill Switch System                               │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │  ┌───────────────────────────────────────────────────────────────────────┐ │
// │  │                        Lockdown Levels                                 │ │
// │  │                                                                        │ │
// │  │  Level 0: NORMAL          ████████████████████████████  Full Operation│ │
// │  │  Level 1: CAUTION         ██████████████████░░░░░░░░░░  Reduced Limits│ │
// │  │  Level 2: WARNING         █████████████░░░░░░░░░░░░░░░  New Trades Off│ │
// │  │  Level 3: CRITICAL        ████████░░░░░░░░░░░░░░░░░░░░  Positions Only│ │
// │  │  Level 4: LOCKDOWN        ████░░░░░░░░░░░░░░░░░░░░░░░░  Read Only     │ │
// │  │  Level 5: EMERGENCY       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Full Shutdown │ │
// │  │                                                                        │ │
// │  └───────────────────────────────────────────────────────────────────────┘ │
// │                                                                             │
// │  Automatic Triggers:                                                        │
// │  ├── Daily Loss > $1M        → Level 3 (CRITICAL)                         │
// │  ├── Weekly Loss > $2M       → Level 4 (LOCKDOWN)                         │
// │  ├── Security Breach         → Level 5 (EMERGENCY)                        │
// │  ├── API Anomaly Detected    → Level 2 (WARNING)                          │
// │  ├── ZKP Fraud Detected      → Level 4 (LOCKDOWN)                         │
// │  └── Circuit Breaker Trip    → Level 1-3 (Based on severity)              │
// │                                                                             │
// │  Manual Overrides:                                                          │
// │  ├── CEO: All Levels                                                       │
// │  ├── Admin: Levels 0-3                                                     │
// │  └── System: Auto-escalation only                                          │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package killswitch

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"
)

var (
	ErrInsufficientPrivilege = errors.New("insufficient privilege for this lockdown level")
	ErrAlreadyAtLevel        = errors.New("system already at this lockdown level")
	ErrCannotDowngrade       = errors.New("cannot downgrade without CEO approval")
	ErrInvalidLevel          = errors.New("invalid lockdown level")
)

// LockdownLevel defines system operation levels
type LockdownLevel int32

const (
	LevelNormal    LockdownLevel = 0 // Full operation
	LevelCaution   LockdownLevel = 1 // Reduced position limits
	LevelWarning   LockdownLevel = 2 // No new trades, existing orders only
	LevelCritical  LockdownLevel = 3 // Position management only
	LevelLockdown  LockdownLevel = 4 // Read-only mode
	LevelEmergency LockdownLevel = 5 // Full system shutdown
)

func (l LockdownLevel) String() string {
	switch l {
	case LevelNormal:
		return "NORMAL"
	case LevelCaution:
		return "CAUTION"
	case LevelWarning:
		return "WARNING"
	case LevelCritical:
		return "CRITICAL"
	case LevelLockdown:
		return "LOCKDOWN"
	case LevelEmergency:
		return "EMERGENCY"
	default:
		return "UNKNOWN"
	}
}

// Color returns the dashboard color for this level
func (l LockdownLevel) Color() string {
	switch l {
	case LevelNormal:
		return "#2D5A27" // Green
	case LevelCaution:
		return "#F5A623" // Yellow
	case LevelWarning:
		return "#F5A623" // Orange
	case LevelCritical:
		return "#E74C3C" // Red
	case LevelLockdown:
		return "#C0392B" // Dark Red
	case LevelEmergency:
		return "#000000" // Black
	default:
		return "#808080" // Gray
	}
}

// TriggerType defines what caused the lockdown
type TriggerType string

const (
	TriggerManual          TriggerType = "MANUAL"
	TriggerDailyLoss       TriggerType = "DAILY_LOSS"
	TriggerWeeklyLoss      TriggerType = "WEEKLY_LOSS"
	TriggerSecurityBreach  TriggerType = "SECURITY_BREACH"
	TriggerAPIAnomaly      TriggerType = "API_ANOMALY"
	TriggerZKPFraud        TriggerType = "ZKP_FRAUD"
	TriggerCircuitBreaker  TriggerType = "CIRCUIT_BREAKER"
	TriggerRateLimitBreach TriggerType = "RATE_LIMIT_BREACH"
	TriggerPriceSpike      TriggerType = "PRICE_SPIKE"
	TriggerSystemOverload  TriggerType = "SYSTEM_OVERLOAD"
)

// UserRole for authorization
type UserRole string

const (
	RoleCEO    UserRole = "CEO"
	RoleAdmin  UserRole = "ADMIN"
	RoleTrader UserRole = "TRADER"
	RoleSystem UserRole = "SYSTEM"
)

// LockdownEvent represents a lockdown state change
type LockdownEvent struct {
	ID           string        `json:"id"`
	Timestamp    time.Time     `json:"timestamp"`
	PrevLevel    LockdownLevel `json:"prev_level"`
	NewLevel     LockdownLevel `json:"new_level"`
	Trigger      TriggerType   `json:"trigger"`
	TriggerValue interface{}   `json:"trigger_value,omitempty"`
	InitiatedBy  string        `json:"initiated_by"`
	Role         UserRole      `json:"role"`
	Reason       string        `json:"reason"`
	AutoRecover  bool          `json:"auto_recover"`
	RecoverAt    *time.Time    `json:"recover_at,omitempty"`
}

// LevelCapabilities defines what's allowed at each level
type LevelCapabilities struct {
	AllowNewTrades       bool    `json:"allow_new_trades"`
	AllowOrderModify     bool    `json:"allow_order_modify"`
	AllowPositionClose   bool    `json:"allow_position_close"`
	AllowWithdrawals     bool    `json:"allow_withdrawals"`
	AllowAPIAccess       bool    `json:"allow_api_access"`
	AllowSettlements     bool    `json:"allow_settlements"`
	PositionLimitPercent float64 `json:"position_limit_percent"` // 100 = full, 50 = half
	MaxOrderSize         float64 `json:"max_order_size"`         // In MWh
}

// DefaultCapabilities returns capabilities for each level
var DefaultCapabilities = map[LockdownLevel]*LevelCapabilities{
	LevelNormal: {
		AllowNewTrades:       true,
		AllowOrderModify:     true,
		AllowPositionClose:   true,
		AllowWithdrawals:     true,
		AllowAPIAccess:       true,
		AllowSettlements:     true,
		PositionLimitPercent: 100,
		MaxOrderSize:         1000, // MWh
	},
	LevelCaution: {
		AllowNewTrades:       true,
		AllowOrderModify:     true,
		AllowPositionClose:   true,
		AllowWithdrawals:     true,
		AllowAPIAccess:       true,
		AllowSettlements:     true,
		PositionLimitPercent: 50,
		MaxOrderSize:         500,
	},
	LevelWarning: {
		AllowNewTrades:       false,
		AllowOrderModify:     true,
		AllowPositionClose:   true,
		AllowWithdrawals:     true,
		AllowAPIAccess:       true,
		AllowSettlements:     true,
		PositionLimitPercent: 25,
		MaxOrderSize:         0,
	},
	LevelCritical: {
		AllowNewTrades:       false,
		AllowOrderModify:     false,
		AllowPositionClose:   true,
		AllowWithdrawals:     true,
		AllowAPIAccess:       true,
		AllowSettlements:     true,
		PositionLimitPercent: 0,
		MaxOrderSize:         0,
	},
	LevelLockdown: {
		AllowNewTrades:       false,
		AllowOrderModify:     false,
		AllowPositionClose:   false,
		AllowWithdrawals:     false,
		AllowAPIAccess:       true, // Read-only
		AllowSettlements:     false,
		PositionLimitPercent: 0,
		MaxOrderSize:         0,
	},
	LevelEmergency: {
		AllowNewTrades:       false,
		AllowOrderModify:     false,
		AllowPositionClose:   false,
		AllowWithdrawals:     false,
		AllowAPIAccess:       false,
		AllowSettlements:     false,
		PositionLimitPercent: 0,
		MaxOrderSize:         0,
	},
}

// TriggerThresholds for automatic lockdown
type TriggerThresholds struct {
	DailyLossLevel1   float64 // Caution
	DailyLossLevel2   float64 // Warning
	DailyLossLevel3   float64 // Critical
	DailyLossLevel4   float64 // Lockdown
	WeeklyLossLevel4  float64 // Lockdown
	WeeklyLossLevel5  float64 // Emergency
	ZKPFraudCount     int     // Number of fraud attempts
	APIErrorRate      float64 // Percentage
	PriceSpikePercent float64 // Price change percentage
	CPUUsagePercent   float64 // System overload
}

// DefaultThresholds returns production thresholds
func DefaultThresholds() *TriggerThresholds {
	return &TriggerThresholds{
		DailyLossLevel1:   250000,   // $250K → Caution
		DailyLossLevel2:   500000,   // $500K → Warning
		DailyLossLevel3:   1000000,  // $1M → Critical
		DailyLossLevel4:   2000000,  // $2M → Lockdown
		WeeklyLossLevel4:  2000000,  // $2M → Lockdown
		WeeklyLossLevel5:  5000000,  // $5M → Emergency
		ZKPFraudCount:     3,        // 3 fraud attempts → Lockdown
		APIErrorRate:      10.0,     // 10% error rate → Warning
		PriceSpikePercent: 200.0,    // 200% price spike → Critical
		CPUUsagePercent:   95.0,     // 95% CPU → Warning
	}
}

// KillSwitch manages system lockdown
type KillSwitch struct {
	level           int32 // atomic: LockdownLevel
	logger          *zap.Logger
	thresholds      *TriggerThresholds
	eventHistory    []LockdownEvent
	eventChannel    chan LockdownEvent
	webhooks        []WebhookConfig
	mu              sync.RWMutex
	lastEscalation  time.Time
	autoRecoverTask *time.Timer
	ctx             context.Context
	cancel          context.CancelFunc
}

// WebhookConfig for external notifications
type WebhookConfig struct {
	URL         string   `json:"url"`
	MinLevel    LockdownLevel `json:"min_level"`
	Headers     map[string]string `json:"headers"`
	Events      []TriggerType `json:"events"`
}

// Config for KillSwitch
type Config struct {
	Thresholds         *TriggerThresholds
	Webhooks           []WebhookConfig
	AutoRecoverTimeout time.Duration
	EventBufferSize    int
}

// DefaultConfig returns production defaults
func DefaultConfig() *Config {
	return &Config{
		Thresholds:         DefaultThresholds(),
		AutoRecoverTimeout: 30 * time.Minute,
		EventBufferSize:    1000,
	}
}

// NewKillSwitch creates a new kill switch instance
func NewKillSwitch(config *Config, logger *zap.Logger) *KillSwitch {
	if config == nil {
		config = DefaultConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	ks := &KillSwitch{
		level:        int32(LevelNormal),
		logger:       logger.Named("kill-switch"),
		thresholds:   config.Thresholds,
		eventHistory: make([]LockdownEvent, 0, config.EventBufferSize),
		eventChannel: make(chan LockdownEvent, config.EventBufferSize),
		webhooks:     config.Webhooks,
		ctx:          ctx,
		cancel:       cancel,
	}

	// Start event processor
	go ks.processEvents()

	return ks
}

// GetLevel returns the current lockdown level
func (ks *KillSwitch) GetLevel() LockdownLevel {
	return LockdownLevel(atomic.LoadInt32(&ks.level))
}

// GetCapabilities returns current system capabilities
func (ks *KillSwitch) GetCapabilities() *LevelCapabilities {
	level := ks.GetLevel()
	if caps, ok := DefaultCapabilities[level]; ok {
		return caps
	}
	return DefaultCapabilities[LevelEmergency]
}

// SetLevel manually sets the lockdown level
func (ks *KillSwitch) SetLevel(newLevel LockdownLevel, userID string, role UserRole, reason string) error {
	currentLevel := ks.GetLevel()

	// Validate level
	if newLevel < LevelNormal || newLevel > LevelEmergency {
		return ErrInvalidLevel
	}

	// Check privilege
	if !ks.canSetLevel(role, currentLevel, newLevel) {
		return ErrInsufficientPrivilege
	}

	// Same level check
	if currentLevel == newLevel {
		return ErrAlreadyAtLevel
	}

	// Execute level change
	ks.executeLevel Change(newLevel, TriggerManual, nil, userID, role, reason, false)

	return nil
}

// Escalate increases lockdown level by trigger
func (ks *KillSwitch) Escalate(trigger TriggerType, triggerValue interface{}, reason string) error {
	currentLevel := ks.GetLevel()

	// Determine new level based on trigger
	newLevel := ks.determineEscalationLevel(trigger, triggerValue, currentLevel)

	if newLevel <= currentLevel {
		return nil // No escalation needed
	}

	// Rate limit escalations (max 1 per minute for non-security events)
	if trigger != TriggerSecurityBreach && trigger != TriggerZKPFraud {
		ks.mu.RLock()
		if time.Since(ks.lastEscalation) < time.Minute {
			ks.mu.RUnlock()
			return nil
		}
		ks.mu.RUnlock()
	}

	ks.executeLevelChange(newLevel, trigger, triggerValue, "SYSTEM", RoleSystem, reason, true)

	return nil
}

// DeEscalate decreases lockdown level (CEO only for manual)
func (ks *KillSwitch) DeEscalate(targetLevel LockdownLevel, userID string, role UserRole, reason string) error {
	currentLevel := ks.GetLevel()

	if targetLevel >= currentLevel {
		return ErrAlreadyAtLevel
	}

	// Only CEO can manually de-escalate from Critical or higher
	if currentLevel >= LevelCritical && role != RoleCEO {
		return ErrCannotDowngrade
	}

	ks.executeLevelChange(targetLevel, TriggerManual, nil, userID, role, reason, false)

	return nil
}

// executeLevelChange performs the level change
func (ks *KillSwitch) executeLevelChange(newLevel LockdownLevel, trigger TriggerType, triggerValue interface{}, userID string, role UserRole, reason string, autoRecover bool) {
	currentLevel := ks.GetLevel()

	// Atomic level change
	atomic.StoreInt32(&ks.level, int32(newLevel))

	// Update last escalation time
	ks.mu.Lock()
	ks.lastEscalation = time.Now()

	// Create event
	event := LockdownEvent{
		ID:           fmt.Sprintf("LDE-%d", time.Now().UnixNano()),
		Timestamp:    time.Now(),
		PrevLevel:    currentLevel,
		NewLevel:     newLevel,
		Trigger:      trigger,
		TriggerValue: triggerValue,
		InitiatedBy:  userID,
		Role:         role,
		Reason:       reason,
		AutoRecover:  autoRecover,
	}

	// Set auto-recover time if applicable
	if autoRecover && newLevel < LevelLockdown {
		recoverTime := time.Now().Add(30 * time.Minute)
		event.RecoverAt = &recoverTime
		ks.scheduleAutoRecover(recoverTime, currentLevel)
	}

	ks.eventHistory = append(ks.eventHistory, event)
	ks.mu.Unlock()

	// Log the event
	ks.logger.Warn("LOCKDOWN LEVEL CHANGED",
		zap.String("prev_level", currentLevel.String()),
		zap.String("new_level", newLevel.String()),
		zap.String("trigger", string(trigger)),
		zap.String("initiated_by", userID),
		zap.String("reason", reason))

	// Send to event channel (non-blocking)
	select {
	case ks.eventChannel <- event:
	default:
		ks.logger.Warn("Event channel full, dropping event")
	}
}

// determineEscalationLevel determines the appropriate level for a trigger
func (ks *KillSwitch) determineEscalationLevel(trigger TriggerType, value interface{}, currentLevel LockdownLevel) LockdownLevel {
	switch trigger {
	case TriggerDailyLoss:
		loss := value.(float64)
		if loss >= ks.thresholds.DailyLossLevel4 {
			return LevelLockdown
		}
		if loss >= ks.thresholds.DailyLossLevel3 {
			return LevelCritical
		}
		if loss >= ks.thresholds.DailyLossLevel2 {
			return LevelWarning
		}
		if loss >= ks.thresholds.DailyLossLevel1 {
			return LevelCaution
		}

	case TriggerWeeklyLoss:
		loss := value.(float64)
		if loss >= ks.thresholds.WeeklyLossLevel5 {
			return LevelEmergency
		}
		if loss >= ks.thresholds.WeeklyLossLevel4 {
			return LevelLockdown
		}

	case TriggerSecurityBreach:
		return LevelEmergency

	case TriggerZKPFraud:
		count := value.(int)
		if count >= ks.thresholds.ZKPFraudCount {
			return LevelLockdown
		}
		return LevelCritical

	case TriggerAPIAnomaly:
		errorRate := value.(float64)
		if errorRate >= ks.thresholds.APIErrorRate {
			return LevelWarning
		}

	case TriggerPriceSpike:
		spikePercent := value.(float64)
		if spikePercent >= ks.thresholds.PriceSpikePercent {
			return LevelCritical
		}
		if spikePercent >= 100 {
			return LevelWarning
		}

	case TriggerSystemOverload:
		cpuUsage := value.(float64)
		if cpuUsage >= ks.thresholds.CPUUsagePercent {
			return LevelWarning
		}

	case TriggerCircuitBreaker:
		// Circuit breaker triggers based on severity (1-3)
		severity := value.(int)
		return LockdownLevel(severity)
	}

	return currentLevel
}

// canSetLevel checks if a role can set a specific level
func (ks *KillSwitch) canSetLevel(role UserRole, currentLevel, newLevel LockdownLevel) bool {
	switch role {
	case RoleCEO:
		return true // CEO can do anything

	case RoleAdmin:
		// Admin can escalate up to Critical, de-escalate from Warning and below
		if newLevel > currentLevel {
			return newLevel <= LevelCritical
		}
		return currentLevel <= LevelWarning

	case RoleTrader:
		// Traders can only escalate to Caution
		return newLevel == LevelCaution && newLevel > currentLevel

	case RoleSystem:
		// System can only auto-escalate
		return newLevel > currentLevel

	default:
		return false
	}
}

// scheduleAutoRecover schedules automatic recovery
func (ks *KillSwitch) scheduleAutoRecover(recoverAt time.Time, targetLevel LockdownLevel) {
	// Cancel existing timer
	if ks.autoRecoverTask != nil {
		ks.autoRecoverTask.Stop()
	}

	duration := time.Until(recoverAt)
	ks.autoRecoverTask = time.AfterFunc(duration, func() {
		currentLevel := ks.GetLevel()
		if currentLevel > targetLevel && currentLevel < LevelLockdown {
			ks.executeLevelChange(targetLevel, TriggerManual, nil, "SYSTEM", RoleSystem, "Auto-recovery", false)
			ks.logger.Info("Auto-recovery executed",
				zap.String("to_level", targetLevel.String()))
		}
	})
}

// CheckOperation verifies if an operation is allowed
func (ks *KillSwitch) CheckOperation(operation string) bool {
	caps := ks.GetCapabilities()

	switch operation {
	case "new_trade":
		return caps.AllowNewTrades
	case "modify_order":
		return caps.AllowOrderModify
	case "close_position":
		return caps.AllowPositionClose
	case "withdrawal":
		return caps.AllowWithdrawals
	case "api_access":
		return caps.AllowAPIAccess
	case "settlement":
		return caps.AllowSettlements
	default:
		return ks.GetLevel() == LevelNormal
	}
}

// GetStatus returns the current system status
func (ks *KillSwitch) GetStatus() map[string]interface{} {
	level := ks.GetLevel()
	caps := ks.GetCapabilities()

	return map[string]interface{}{
		"level":        level,
		"level_name":   level.String(),
		"level_color":  level.Color(),
		"capabilities": caps,
		"is_lockdown":  level >= LevelLockdown,
		"is_critical":  level >= LevelCritical,
		"timestamp":    time.Now().UTC(),
	}
}

// GetEventHistory returns recent lockdown events
func (ks *KillSwitch) GetEventHistory(limit int) []LockdownEvent {
	ks.mu.RLock()
	defer ks.mu.RUnlock()

	if limit <= 0 || limit > len(ks.eventHistory) {
		limit = len(ks.eventHistory)
	}

	// Return most recent events
	start := len(ks.eventHistory) - limit
	if start < 0 {
		start = 0
	}

	result := make([]LockdownEvent, limit)
	copy(result, ks.eventHistory[start:])
	return result
}

// Events returns the event channel for subscribers
func (ks *KillSwitch) Events() <-chan LockdownEvent {
	return ks.eventChannel
}

// processEvents handles event distribution and webhooks
func (ks *KillSwitch) processEvents() {
	for {
		select {
		case <-ks.ctx.Done():
			return
		case event := <-ks.eventChannel:
			// Send webhooks
			for _, webhook := range ks.webhooks {
				if event.NewLevel >= webhook.MinLevel {
					go ks.sendWebhook(webhook, event)
				}
			}
		}
	}
}

// sendWebhook sends event to external webhook
func (ks *KillSwitch) sendWebhook(webhook WebhookConfig, event LockdownEvent) {
	// Implementation would use http client to POST event
	ks.logger.Info("Sending webhook",
		zap.String("url", webhook.URL),
		zap.String("level", event.NewLevel.String()))
}

// Shutdown cleanly shuts down the kill switch
func (ks *KillSwitch) Shutdown() {
	ks.cancel()
	if ks.autoRecoverTask != nil {
		ks.autoRecoverTask.Stop()
	}
	close(ks.eventChannel)
}

// MarshalJSON returns JSON representation of status
func (ks *KillSwitch) MarshalJSON() ([]byte, error) {
	return json.Marshal(ks.GetStatus())
}

// EmergencyShutdown triggers immediate emergency lockdown
func (ks *KillSwitch) EmergencyShutdown(userID string, role UserRole, reason string) error {
	if role != RoleCEO && role != RoleSystem {
		return ErrInsufficientPrivilege
	}

	ks.executeLevelChange(LevelEmergency, TriggerSecurityBreach, nil, userID, role, reason, false)

	ks.logger.Error("EMERGENCY SHUTDOWN ACTIVATED",
		zap.String("initiated_by", userID),
		zap.String("reason", reason))

	return nil
}
