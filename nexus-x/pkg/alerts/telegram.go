// ============================================================================
// FIELD NINE OS - TELEGRAM ALERT SYSTEM
// Version: 1.0.9 (CONVERGENCE)
// Purpose: Real-time trading alerts and emergency notifications
// ============================================================================

package alerts

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// ============================================================================
// TELEGRAM CONFIGURATION
// ============================================================================

type TelegramConfig struct {
	BotToken       string   `json:"bot_token"`
	CEOChatID      string   `json:"ceo_chat_id"`      // Primary alert target
	AdminChatIDs   []string `json:"admin_chat_ids"`   // Secondary targets
	AlertChannelID string   `json:"alert_channel_id"` // Public channel for non-sensitive alerts

	// Rate Limiting
	MaxAlertsPerMinute int           `json:"max_alerts_per_minute"`
	CooldownDuration   time.Duration `json:"cooldown_duration"`

	// Alert Levels
	EnableInfoAlerts     bool `json:"enable_info_alerts"`
	EnableWarningAlerts  bool `json:"enable_warning_alerts"`
	EnableCriticalAlerts bool `json:"enable_critical_alerts"`
}

// DefaultTelegramConfig returns production settings
func DefaultTelegramConfig() *TelegramConfig {
	return &TelegramConfig{
		MaxAlertsPerMinute:   30,
		CooldownDuration:     2 * time.Second,
		EnableInfoAlerts:     true,
		EnableWarningAlerts:  true,
		EnableCriticalAlerts: true,
	}
}

// ============================================================================
// ALERT LEVELS
// ============================================================================

type AlertLevel string

const (
	AlertInfo     AlertLevel = "INFO"     // 📊 Informational
	AlertSuccess  AlertLevel = "SUCCESS"  // ✅ Trade success, milestones
	AlertWarning  AlertLevel = "WARNING"  // ⚠️ Risk warnings
	AlertCritical AlertLevel = "CRITICAL" // 🚨 Emergency - Safety lock
)

// ============================================================================
// TELEGRAM ALERTER
// ============================================================================

type TelegramAlerter struct {
	config     *TelegramConfig
	httpClient *http.Client
	mu         sync.Mutex

	// Rate limiting
	alertCount    int
	lastAlertTime time.Time
	lastResetTime time.Time

	// Queue for rate-limited alerts
	alertQueue chan *Alert
	stopChan   chan struct{}
}

type Alert struct {
	Level     AlertLevel        `json:"level"`
	Title     string            `json:"title"`
	Message   string            `json:"message"`
	Data      map[string]string `json:"data,omitempty"`
	Timestamp time.Time         `json:"timestamp"`
	Priority  int               `json:"priority"` // 1=highest, 10=lowest
}

// NewTelegramAlerter creates a new Telegram alerter
func NewTelegramAlerter(chatID string) *TelegramAlerter {
	config := DefaultTelegramConfig()
	config.CEOChatID = chatID

	alerter := &TelegramAlerter{
		config:        config,
		httpClient:    &http.Client{Timeout: 10 * time.Second},
		lastResetTime: time.Now(),
		alertQueue:    make(chan *Alert, 100),
		stopChan:      make(chan struct{}),
	}

	// Start background queue processor
	go alerter.processQueue()

	return alerter
}

// NewTelegramAlerterWithConfig creates an alerter with custom config
func NewTelegramAlerterWithConfig(config *TelegramConfig) *TelegramAlerter {
	alerter := &TelegramAlerter{
		config:        config,
		httpClient:    &http.Client{Timeout: 10 * time.Second},
		lastResetTime: time.Now(),
		alertQueue:    make(chan *Alert, 100),
		stopChan:      make(chan struct{}),
	}

	go alerter.processQueue()

	return alerter
}

// ============================================================================
// ALERT SENDING
// ============================================================================

// SendAlert sends an alert to the configured Telegram chat
func (ta *TelegramAlerter) SendAlert(level AlertLevel, title, message string) error {
	alert := &Alert{
		Level:     level,
		Title:     title,
		Message:   message,
		Timestamp: time.Now(),
		Priority:  ta.getPriority(level),
	}

	// Critical alerts bypass queue and send immediately
	if level == AlertCritical {
		return ta.sendImmediate(alert)
	}

	// Queue non-critical alerts
	select {
	case ta.alertQueue <- alert:
		return nil
	default:
		return fmt.Errorf("alert queue full")
	}
}

// SendAlertWithData sends an alert with additional data
func (ta *TelegramAlerter) SendAlertWithData(level AlertLevel, title, message string, data map[string]string) error {
	alert := &Alert{
		Level:     level,
		Title:     title,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
		Priority:  ta.getPriority(level),
	}

	if level == AlertCritical {
		return ta.sendImmediate(alert)
	}

	select {
	case ta.alertQueue <- alert:
		return nil
	default:
		return fmt.Errorf("alert queue full")
	}
}

func (ta *TelegramAlerter) getPriority(level AlertLevel) int {
	switch level {
	case AlertCritical:
		return 1
	case AlertWarning:
		return 3
	case AlertSuccess:
		return 5
	case AlertInfo:
		return 7
	default:
		return 10
	}
}

func (ta *TelegramAlerter) sendImmediate(alert *Alert) error {
	formatted := ta.formatAlert(alert)
	return ta.sendTelegramMessage(ta.config.CEOChatID, formatted)
}

// ============================================================================
// MESSAGE FORMATTING
// ============================================================================

func (ta *TelegramAlerter) formatAlert(alert *Alert) string {
	var icon string
	switch alert.Level {
	case AlertInfo:
		icon = "📊"
	case AlertSuccess:
		icon = "✅"
	case AlertWarning:
		icon = "⚠️"
	case AlertCritical:
		icon = "🚨"
	}

	var buf bytes.Buffer

	// Header
	buf.WriteString(fmt.Sprintf("%s *%s*\n", icon, alert.Title))
	buf.WriteString(fmt.Sprintf("━━━━━━━━━━━━━━━━━━━━\n"))

	// Message
	buf.WriteString(fmt.Sprintf("%s\n", alert.Message))

	// Data (if any)
	if len(alert.Data) > 0 {
		buf.WriteString("\n📋 *Details:*\n")
		for key, value := range alert.Data {
			buf.WriteString(fmt.Sprintf("• %s: `%s`\n", key, value))
		}
	}

	// Footer
	buf.WriteString(fmt.Sprintf("\n⏰ %s", alert.Timestamp.Format("2006-01-02 15:04:05 UTC")))

	return buf.String()
}

// ============================================================================
// TELEGRAM API
// ============================================================================

type telegramMessage struct {
	ChatID    string `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode"`
}

func (ta *TelegramAlerter) sendTelegramMessage(chatID, text string) error {
	if ta.config.BotToken == "" {
		// Log only, don't fail if token not configured
		fmt.Printf("[TELEGRAM] Alert would be sent: %s\n", text)
		return nil
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", ta.config.BotToken)

	msg := telegramMessage{
		ChatID:    chatID,
		Text:      text,
		ParseMode: "Markdown",
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := ta.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("telegram API error: %s - %s", resp.Status, string(respBody))
	}

	return nil
}

// ============================================================================
// QUEUE PROCESSING
// ============================================================================

func (ta *TelegramAlerter) processQueue() {
	ticker := time.NewTicker(ta.config.CooldownDuration)
	defer ticker.Stop()

	for {
		select {
		case <-ta.stopChan:
			return
		case <-ticker.C:
			ta.processNextAlert()
		}
	}
}

func (ta *TelegramAlerter) processNextAlert() {
	ta.mu.Lock()
	defer ta.mu.Unlock()

	// Reset counter every minute
	if time.Since(ta.lastResetTime) >= time.Minute {
		ta.alertCount = 0
		ta.lastResetTime = time.Now()
	}

	// Check rate limit
	if ta.alertCount >= ta.config.MaxAlertsPerMinute {
		return
	}

	// Process next alert from queue
	select {
	case alert := <-ta.alertQueue:
		formatted := ta.formatAlert(alert)
		if err := ta.sendTelegramMessage(ta.config.CEOChatID, formatted); err != nil {
			fmt.Printf("[TELEGRAM] Error sending alert: %v\n", err)
		} else {
			ta.alertCount++
			ta.lastAlertTime = time.Now()
		}
	default:
		// Queue empty
	}
}

// ============================================================================
// PREDEFINED ALERTS
// ============================================================================

// SendTradeAlert sends a trade execution alert
func (ta *TelegramAlerter) SendTradeAlert(tradeID, market string, pnl float64, isProfit bool) error {
	var level AlertLevel
	var icon string
	if isProfit {
		level = AlertSuccess
		icon = "📈"
	} else {
		level = AlertWarning
		icon = "📉"
	}

	return ta.SendAlertWithData(level,
		fmt.Sprintf("%s Trade Executed", icon),
		fmt.Sprintf("Trade completed on %s", market),
		map[string]string{
			"Trade ID": tradeID,
			"Market":   market,
			"PnL":      fmt.Sprintf("$%.2f", pnl),
		},
	)
}

// SendSafetyLockAlert sends emergency safety lock alert
func (ta *TelegramAlerter) SendSafetyLockAlert(reason string, mdd, pnl float64) error {
	return ta.SendAlertWithData(AlertCritical,
		"🚨 SAFETY LOCK ACTIVATED",
		fmt.Sprintf("Trading halted: %s", reason),
		map[string]string{
			"Reason":      reason,
			"Current MDD": fmt.Sprintf("%.2f%%", mdd),
			"Current PnL": fmt.Sprintf("$%.2f", pnl),
			"Action":      "Manual review required",
		},
	)
}

// SendEngineStartAlert sends engine start notification
func (ta *TelegramAlerter) SendEngineStartAlert(capital float64, markets []string) error {
	return ta.SendAlertWithData(AlertInfo,
		"🚀 Trading Engine Started",
		"Phase 9 Conservative Arbitrage Mode Active",
		map[string]string{
			"Capital": fmt.Sprintf("$%.2f", capital),
			"Markets": fmt.Sprintf("%v", markets),
			"Mode":    "CONSERVATIVE_ARBITRAGE",
		},
	)
}

// SendDailyReportAlert sends daily summary
func (ta *TelegramAlerter) SendDailyReportAlert(pnl float64, trades, winRate int) error {
	level := AlertSuccess
	if pnl < 0 {
		level = AlertWarning
	}

	return ta.SendAlertWithData(level,
		"📊 Daily Trading Report",
		"End of day summary",
		map[string]string{
			"Daily PnL":   fmt.Sprintf("$%.2f", pnl),
			"Total Trades": fmt.Sprintf("%d", trades),
			"Win Rate":    fmt.Sprintf("%d%%", winRate),
		},
	)
}

// SendMDDWarningAlert sends MDD warning
func (ta *TelegramAlerter) SendMDDWarningAlert(currentMDD, limit float64) error {
	return ta.SendAlertWithData(AlertWarning,
		"⚠️ MDD Warning",
		"Approaching maximum drawdown limit",
		map[string]string{
			"Current MDD": fmt.Sprintf("%.2f%%", currentMDD),
			"Limit":       fmt.Sprintf("%.2f%%", limit),
			"Status":      "CAUTION",
		},
	)
}

// ============================================================================
// LIFECYCLE
// ============================================================================

// Stop stops the alerter
func (ta *TelegramAlerter) Stop() {
	close(ta.stopChan)
}

// SetBotToken sets the Telegram bot token
func (ta *TelegramAlerter) SetBotToken(token string) {
	ta.mu.Lock()
	defer ta.mu.Unlock()
	ta.config.BotToken = token
}

// SetChatID sets the CEO chat ID
func (ta *TelegramAlerter) SetChatID(chatID string) {
	ta.mu.Lock()
	defer ta.mu.Unlock()
	ta.config.CEOChatID = chatID
}

// ============================================================================
// BATCH ALERTS (for scheduled reports)
// ============================================================================

type BatchAlert struct {
	Alerts    []*Alert
	SendAt    time.Time
	Recipient string
}

// ScheduleBatchAlert schedules multiple alerts to be sent at a specific time
func (ta *TelegramAlerter) ScheduleBatchAlert(ctx context.Context, batch *BatchAlert) {
	go func() {
		timer := time.NewTimer(time.Until(batch.SendAt))
		defer timer.Stop()

		select {
		case <-ctx.Done():
			return
		case <-timer.C:
			for _, alert := range batch.Alerts {
				formatted := ta.formatAlert(alert)
				if err := ta.sendTelegramMessage(batch.Recipient, formatted); err != nil {
					fmt.Printf("[TELEGRAM] Batch alert error: %v\n", err)
				}
				time.Sleep(ta.config.CooldownDuration)
			}
		}
	}()
}
