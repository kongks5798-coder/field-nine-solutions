// ============================================================================
// FIELD NINE OS - REAL-TIME TRADING LOGGER
// Version: 1.0.9 (CONVERGENCE)
// Purpose: Logs trades to Dashboard SSE, Google Sheets, and local storage
// ============================================================================

package trading

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/shopspring/decimal"
)

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

type TradingLoggerConfig struct {
	// Google Sheets
	SpreadsheetID    string `json:"spreadsheet_id"`
	SheetName        string `json:"sheet_name"`
	ServiceAccountPath string `json:"service_account_path"`

	// SSE Dashboard
	DashboardSSEURL  string `json:"dashboard_sse_url"`

	// Local Storage
	LogFilePath      string `json:"log_file_path"`
	EnableLocalLog   bool   `json:"enable_local_log"`

	// Buffer Settings
	BufferSize       int    `json:"buffer_size"`
	FlushInterval    time.Duration `json:"flush_interval"`
}

// DefaultTradingLoggerConfig returns production settings
func DefaultTradingLoggerConfig() *TradingLoggerConfig {
	return &TradingLoggerConfig{
		SheetName:        "Phase9_Trades",
		DashboardSSEURL:  "https://nexus.fieldnine.io/api/sse/trades",
		LogFilePath:      "/var/log/fieldnine/trades.jsonl",
		EnableLocalLog:   true,
		BufferSize:       100,
		FlushInterval:    5 * time.Second,
	}
}

// ============================================================================
// TRADING LOGGER
// ============================================================================

type TradingLogger struct {
	config     *TradingLoggerConfig
	mu         sync.Mutex

	// Buffers
	tradeBuffer   []*TradeLog
	eventBuffer   []*LogEvent

	// Channels
	tradeChan     chan *TradeLog
	eventChan     chan *LogEvent
	stopChan      chan struct{}

	// HTTP Client
	httpClient    *http.Client

	// Local file
	logFile       *os.File

	// Google Sheets client (placeholder)
	sheetsClient  interface{}
}

type TradeLog struct {
	ID            string          `json:"id"`
	Timestamp     time.Time       `json:"timestamp"`
	Market        MarketID        `json:"market"`
	Type          string          `json:"type"`
	Side          string          `json:"side"`
	EntryPrice    decimal.Decimal `json:"entry_price"`
	ExitPrice     decimal.Decimal `json:"exit_price"`
	Quantity      decimal.Decimal `json:"quantity"`
	GrossPnL      decimal.Decimal `json:"gross_pnl"`
	Fees          decimal.Decimal `json:"fees"`
	NetPnL        decimal.Decimal `json:"net_pnl"`
	CumulativePnL decimal.Decimal `json:"cumulative_pnl"`
	Status        TradeStatus     `json:"status"`
	SettlementTx  string          `json:"settlement_tx,omitempty"`
	Notes         string          `json:"notes,omitempty"`
}

type LogEventType string

const (
	EventEngineStart   LogEventType = "ENGINE_START"
	EventEngineStop    LogEventType = "ENGINE_STOP"
	EventTradeExecuted LogEventType = "TRADE_EXECUTED"
	EventTradeRejected LogEventType = "TRADE_REJECTED"
	EventSafetyLock    LogEventType = "SAFETY_LOCK"
	EventRiskWarning   LogEventType = "RISK_WARNING"
	EventSettlement    LogEventType = "SETTLEMENT"
	EventError         LogEventType = "ERROR"
	EventInfo          LogEventType = "INFO"
)

type LogEvent struct {
	Type      LogEventType           `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

// NewTradingLogger creates a new trading logger
func NewTradingLogger() *TradingLogger {
	config := DefaultTradingLoggerConfig()

	logger := &TradingLogger{
		config:      config,
		tradeBuffer: make([]*TradeLog, 0, config.BufferSize),
		eventBuffer: make([]*LogEvent, 0, config.BufferSize),
		tradeChan:   make(chan *TradeLog, config.BufferSize),
		eventChan:   make(chan *LogEvent, config.BufferSize),
		stopChan:    make(chan struct{}),
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}

	// Start background processors
	go logger.processLoop()

	return logger
}

// NewTradingLoggerWithConfig creates a logger with custom config
func NewTradingLoggerWithConfig(config *TradingLoggerConfig) *TradingLogger {
	logger := &TradingLogger{
		config:      config,
		tradeBuffer: make([]*TradeLog, 0, config.BufferSize),
		eventBuffer: make([]*LogEvent, 0, config.BufferSize),
		tradeChan:   make(chan *TradeLog, config.BufferSize),
		eventChan:   make(chan *LogEvent, config.BufferSize),
		stopChan:    make(chan struct{}),
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}

	if config.EnableLocalLog && config.LogFilePath != "" {
		if f, err := os.OpenFile(config.LogFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644); err == nil {
			logger.logFile = f
		}
	}

	go logger.processLoop()

	return logger
}

// ============================================================================
// LOGGING METHODS
// ============================================================================

// LogTrade logs a trade result
func (tl *TradingLogger) LogTrade(result *TradeResult) {
	tradeLog := &TradeLog{
		ID:           result.ID,
		Timestamp:    result.ExecutedAt,
		Market:       result.Signal.Market,
		Type:         string(result.Signal.Type),
		Side:         "ARBITRAGE",
		EntryPrice:   result.EntryPrice,
		ExitPrice:    result.ExitPrice,
		Quantity:     result.Quantity,
		Fees:         result.Fees,
		NetPnL:       result.PnL,
		Status:       result.Status,
		SettlementTx: result.SettlementTx,
	}

	// Calculate gross PnL
	spread := result.ExitPrice.Sub(result.EntryPrice)
	tradeLog.GrossPnL = spread.Mul(result.Quantity)

	select {
	case tl.tradeChan <- tradeLog:
	default:
		fmt.Printf("[LOGGER] Trade buffer full, dropping trade: %s\n", result.ID)
	}
}

// LogEvent logs a system event
func (tl *TradingLogger) LogEvent(event LogEvent) {
	select {
	case tl.eventChan <- &event:
	default:
		fmt.Printf("[LOGGER] Event buffer full, dropping event: %s\n", event.Type)
	}
}

// ============================================================================
// BACKGROUND PROCESSING
// ============================================================================

func (tl *TradingLogger) processLoop() {
	ticker := time.NewTicker(tl.config.FlushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-tl.stopChan:
			tl.flush()
			return

		case trade := <-tl.tradeChan:
			tl.mu.Lock()
			tl.tradeBuffer = append(tl.tradeBuffer, trade)
			tl.mu.Unlock()

			// Send to SSE immediately for real-time updates
			go tl.sendToSSE(trade)

			// If buffer is full, flush
			if len(tl.tradeBuffer) >= tl.config.BufferSize {
				tl.flush()
			}

		case event := <-tl.eventChan:
			tl.mu.Lock()
			tl.eventBuffer = append(tl.eventBuffer, event)
			tl.mu.Unlock()

			// Send important events to SSE immediately
			if event.Type == EventSafetyLock || event.Type == EventEngineStart || event.Type == EventEngineStop {
				go tl.sendEventToSSE(event)
			}

		case <-ticker.C:
			tl.flush()
		}
	}
}

func (tl *TradingLogger) flush() {
	tl.mu.Lock()
	trades := tl.tradeBuffer
	events := tl.eventBuffer
	tl.tradeBuffer = make([]*TradeLog, 0, tl.config.BufferSize)
	tl.eventBuffer = make([]*LogEvent, 0, tl.config.BufferSize)
	tl.mu.Unlock()

	// Write to Google Sheets
	if len(trades) > 0 && tl.config.SpreadsheetID != "" {
		go tl.writeToGoogleSheets(trades)
	}

	// Write to local file
	if tl.config.EnableLocalLog && tl.logFile != nil {
		go tl.writeToLocalFile(trades, events)
	}
}

// ============================================================================
// SSE (Server-Sent Events) - Real-time Dashboard Updates
// ============================================================================

func (tl *TradingLogger) sendToSSE(trade *TradeLog) {
	if tl.config.DashboardSSEURL == "" {
		return
	}

	payload := map[string]interface{}{
		"type":      "TRADE_UPDATE",
		"data":      trade,
		"timestamp": time.Now().Unix(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("[SSE] Marshal error: %v\n", err)
		return
	}

	// POST to dashboard SSE endpoint
	resp, err := tl.httpClient.Post(
		tl.config.DashboardSSEURL,
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		fmt.Printf("[SSE] Send error: %v\n", err)
		return
	}
	defer resp.Body.Close()
}

func (tl *TradingLogger) sendEventToSSE(event *LogEvent) {
	if tl.config.DashboardSSEURL == "" {
		return
	}

	payload := map[string]interface{}{
		"type":      "SYSTEM_EVENT",
		"data":      event,
		"timestamp": time.Now().Unix(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	resp, err := tl.httpClient.Post(
		tl.config.DashboardSSEURL+"/events",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return
	}
	defer resp.Body.Close()
}

// ============================================================================
// GOOGLE SHEETS INTEGRATION
// ============================================================================

func (tl *TradingLogger) writeToGoogleSheets(trades []*TradeLog) {
	// This would use Google Sheets API v4
	// For now, we'll use a webhook approach that can be connected to Google Apps Script

	webhookURL := os.Getenv("GOOGLE_SHEETS_WEBHOOK_URL")
	if webhookURL == "" {
		// Log locally if webhook not configured
		fmt.Printf("[SHEETS] Would write %d trades to spreadsheet %s\n", len(trades), tl.config.SpreadsheetID)
		return
	}

	for _, trade := range trades {
		row := map[string]interface{}{
			"spreadsheet_id": tl.config.SpreadsheetID,
			"sheet_name":     tl.config.SheetName,
			"values": []interface{}{
				trade.Timestamp.Format(time.RFC3339),
				trade.ID,
				string(trade.Market),
				trade.Type,
				trade.EntryPrice.String(),
				trade.ExitPrice.String(),
				trade.Quantity.String(),
				trade.GrossPnL.String(),
				trade.Fees.String(),
				trade.NetPnL.String(),
				string(trade.Status),
				trade.SettlementTx,
			},
		}

		body, _ := json.Marshal(row)
		resp, err := tl.httpClient.Post(webhookURL, "application/json", bytes.NewBuffer(body))
		if err != nil {
			fmt.Printf("[SHEETS] Error writing to sheets: %v\n", err)
			continue
		}
		resp.Body.Close()
	}
}

// ============================================================================
// LOCAL FILE LOGGING
// ============================================================================

func (tl *TradingLogger) writeToLocalFile(trades []*TradeLog, events []*LogEvent) {
	if tl.logFile == nil {
		return
	}

	// Write trades
	for _, trade := range trades {
		entry := map[string]interface{}{
			"type":      "trade",
			"timestamp": trade.Timestamp,
			"data":      trade,
		}
		if line, err := json.Marshal(entry); err == nil {
			tl.logFile.Write(line)
			tl.logFile.Write([]byte("\n"))
		}
	}

	// Write events
	for _, event := range events {
		entry := map[string]interface{}{
			"type":      "event",
			"timestamp": event.Timestamp,
			"data":      event,
		}
		if line, err := json.Marshal(entry); err == nil {
			tl.logFile.Write(line)
			tl.logFile.Write([]byte("\n"))
		}
	}
}

// ============================================================================
// QUERY METHODS
// ============================================================================

// GetRecentTrades returns recent trades from memory buffer
func (tl *TradingLogger) GetRecentTrades(limit int) []*TradeLog {
	tl.mu.Lock()
	defer tl.mu.Unlock()

	if limit > len(tl.tradeBuffer) {
		limit = len(tl.tradeBuffer)
	}

	result := make([]*TradeLog, limit)
	copy(result, tl.tradeBuffer[len(tl.tradeBuffer)-limit:])
	return result
}

// GetRecentEvents returns recent events from memory buffer
func (tl *TradingLogger) GetRecentEvents(limit int) []*LogEvent {
	tl.mu.Lock()
	defer tl.mu.Unlock()

	if limit > len(tl.eventBuffer) {
		limit = len(tl.eventBuffer)
	}

	result := make([]*LogEvent, limit)
	copy(result, tl.eventBuffer[len(tl.eventBuffer)-limit:])
	return result
}

// ============================================================================
// LIFECYCLE
// ============================================================================

// Stop stops the logger gracefully
func (tl *TradingLogger) Stop() {
	close(tl.stopChan)
	if tl.logFile != nil {
		tl.logFile.Close()
	}
}

// SetSpreadsheetID sets the Google Sheets ID
func (tl *TradingLogger) SetSpreadsheetID(id string) {
	tl.mu.Lock()
	defer tl.mu.Unlock()
	tl.config.SpreadsheetID = id
}

// ============================================================================
// PNL REPORT GENERATION
// ============================================================================

type PnLReport struct {
	Period        string          `json:"period"`
	StartTime     time.Time       `json:"start_time"`
	EndTime       time.Time       `json:"end_time"`
	InitialEquity decimal.Decimal `json:"initial_equity"`
	FinalEquity   decimal.Decimal `json:"final_equity"`
	GrossPnL      decimal.Decimal `json:"gross_pnl"`
	TotalFees     decimal.Decimal `json:"total_fees"`
	NetPnL        decimal.Decimal `json:"net_pnl"`
	ROI           float64         `json:"roi"`
	TotalTrades   int             `json:"total_trades"`
	WinningTrades int             `json:"winning_trades"`
	LosingTrades  int             `json:"losing_trades"`
	WinRate       float64         `json:"win_rate"`
	AvgWin        decimal.Decimal `json:"avg_win"`
	AvgLoss       decimal.Decimal `json:"avg_loss"`
	LargestWin    decimal.Decimal `json:"largest_win"`
	LargestLoss   decimal.Decimal `json:"largest_loss"`
	MaxDrawdown   float64         `json:"max_drawdown"`
	SharpeRatio   float64         `json:"sharpe_ratio"`
	ByMarket      map[MarketID]*MarketPnL `json:"by_market"`
	Trades        []*TradeLog     `json:"trades,omitempty"`
}

type MarketPnL struct {
	Market      MarketID        `json:"market"`
	Trades      int             `json:"trades"`
	GrossPnL    decimal.Decimal `json:"gross_pnl"`
	NetPnL      decimal.Decimal `json:"net_pnl"`
	WinRate     float64         `json:"win_rate"`
}

// GeneratePnLReport generates a PnL report for a time period
func (tl *TradingLogger) GeneratePnLReport(ctx context.Context, start, end time.Time, initialEquity decimal.Decimal) (*PnLReport, error) {
	tl.mu.Lock()
	defer tl.mu.Unlock()

	report := &PnLReport{
		Period:        fmt.Sprintf("%s to %s", start.Format("2006-01-02 15:04"), end.Format("2006-01-02 15:04")),
		StartTime:     start,
		EndTime:       end,
		InitialEquity: initialEquity,
		GrossPnL:      decimal.Zero,
		TotalFees:     decimal.Zero,
		NetPnL:        decimal.Zero,
		ByMarket:      make(map[MarketID]*MarketPnL),
		Trades:        make([]*TradeLog, 0),
	}

	var wins, losses int
	var totalWinAmount, totalLossAmount decimal.Decimal
	largestWin := decimal.Zero
	largestLoss := decimal.Zero

	for _, trade := range tl.tradeBuffer {
		if trade.Timestamp.Before(start) || trade.Timestamp.After(end) {
			continue
		}

		report.Trades = append(report.Trades, trade)
		report.TotalTrades++
		report.GrossPnL = report.GrossPnL.Add(trade.GrossPnL)
		report.TotalFees = report.TotalFees.Add(trade.Fees)
		report.NetPnL = report.NetPnL.Add(trade.NetPnL)

		// Win/Loss tracking
		if trade.NetPnL.IsPositive() {
			wins++
			totalWinAmount = totalWinAmount.Add(trade.NetPnL)
			if trade.NetPnL.GreaterThan(largestWin) {
				largestWin = trade.NetPnL
			}
		} else if trade.NetPnL.IsNegative() {
			losses++
			totalLossAmount = totalLossAmount.Add(trade.NetPnL.Abs())
			if trade.NetPnL.Abs().GreaterThan(largestLoss) {
				largestLoss = trade.NetPnL.Abs()
			}
		}

		// Market breakdown
		if _, exists := report.ByMarket[trade.Market]; !exists {
			report.ByMarket[trade.Market] = &MarketPnL{Market: trade.Market}
		}
		report.ByMarket[trade.Market].Trades++
		report.ByMarket[trade.Market].GrossPnL = report.ByMarket[trade.Market].GrossPnL.Add(trade.GrossPnL)
		report.ByMarket[trade.Market].NetPnL = report.ByMarket[trade.Market].NetPnL.Add(trade.NetPnL)
	}

	report.WinningTrades = wins
	report.LosingTrades = losses
	report.LargestWin = largestWin
	report.LargestLoss = largestLoss

	if report.TotalTrades > 0 {
		report.WinRate = float64(wins) / float64(report.TotalTrades) * 100
	}

	if wins > 0 {
		report.AvgWin = totalWinAmount.Div(decimal.NewFromInt(int64(wins)))
	}

	if losses > 0 {
		report.AvgLoss = totalLossAmount.Div(decimal.NewFromInt(int64(losses)))
	}

	report.FinalEquity = initialEquity.Add(report.NetPnL)

	if initialEquity.IsPositive() {
		roi, _ := report.NetPnL.Div(initialEquity).Mul(decimal.NewFromInt(100)).Float64()
		report.ROI = roi
	}

	// Calculate win rate per market
	for _, marketPnL := range report.ByMarket {
		// Simplified - would need to track wins per market
		if marketPnL.Trades > 0 && marketPnL.NetPnL.IsPositive() {
			marketPnL.WinRate = 50.0 // Placeholder
		}
	}

	return report, nil
}
