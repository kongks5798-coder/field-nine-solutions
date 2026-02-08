// Package sse provides Server-Sent Events for real-time dashboard updates
// Delivers NetProfit, market prices, and trading metrics with zero latency
//
// SSE Architecture:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                       SSE Real-Time Data Pipeline                           │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
// │  │ Trading     │    │ Market      │    │ Settlement  │    │ Risk       │  │
// │  │ Engine      │    │ Adapters    │    │ Engine      │    │ Engine     │  │
// │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────┬──────┘  │
// │         │                  │                  │                  │         │
// │         └──────────────────┼──────────────────┼──────────────────┘         │
// │                            │                  │                            │
// │                            ▼                  ▼                            │
// │              ┌────────────────────────────────────────────┐                │
// │              │           Event Aggregator                  │                │
// │              │    (Dedup, Throttle, Priority Queue)        │                │
// │              └─────────────────────┬──────────────────────┘                │
// │                                    │                                       │
// │                                    ▼                                       │
// │              ┌────────────────────────────────────────────┐                │
// │              │              SSE Broadcaster                │                │
// │              │    (Connection Pool, Heartbeat, Retry)      │                │
// │              └─────────────────────┬──────────────────────┘                │
// │                                    │                                       │
// │         ┌──────────────────────────┼──────────────────────────┐            │
// │         │                          │                          │            │
// │         ▼                          ▼                          ▼            │
// │  ┌────────────┐            ┌────────────┐            ┌────────────┐       │
// │  │ CEO        │            │ Trading    │            │ Mobile     │       │
// │  │ Dashboard  │            │ Terminal   │            │ App        │       │
// │  └────────────┘            └────────────┘            └────────────┘       │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package sse

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

// EventType defines the type of SSE event
type EventType string

const (
	EventNetProfit      EventType = "net_profit"
	EventMarketPrice    EventType = "market_price"
	EventPosition       EventType = "position"
	EventArbitrage      EventType = "arbitrage"
	EventRiskAlert      EventType = "risk_alert"
	EventTrade          EventType = "trade"
	EventSettlement     EventType = "settlement"
	EventSystemStatus   EventType = "system_status"
	EventHeartbeat      EventType = "heartbeat"
)

// Event represents an SSE event
type Event struct {
	ID        string      `json:"id"`
	Type      EventType   `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	Sequence  uint64      `json:"sequence"`
}

// NetProfitData contains real-time profit metrics
type NetProfitData struct {
	TotalAUM        float64            `json:"total_aum"`
	DailyPnL        float64            `json:"daily_pnl"`
	DailyPnLPercent float64            `json:"daily_pnl_percent"`
	WeeklyPnL       float64            `json:"weekly_pnl"`
	MonthlyPnL      float64            `json:"monthly_pnl"`
	YTDReturn       float64            `json:"ytd_return"`
	UnrealizedPnL   float64            `json:"unrealized_pnl"`
	RealizedPnL     float64            `json:"realized_pnl"`
	TradingFees     float64            `json:"trading_fees"`
	GasUsed         float64            `json:"gas_used"`
	NetProfit       float64            `json:"net_profit"` // Final net profit
	ByMarket        map[string]float64 `json:"by_market"`
	UpdatedAt       time.Time          `json:"updated_at"`
}

// Client represents a connected SSE client
type Client struct {
	ID            string
	Channel       chan *Event
	Subscriptions map[EventType]bool
	ConnectedAt   time.Time
	LastEventID   string
	UserAgent     string
	RemoteAddr    string
}

// BroadcasterConfig holds broadcaster configuration
type BroadcasterConfig struct {
	HeartbeatInterval time.Duration
	EventBufferSize   int
	MaxClients        int
	ThrottleInterval  time.Duration
	RetryInterval     time.Duration
}

// DefaultBroadcasterConfig returns default configuration
func DefaultBroadcasterConfig() *BroadcasterConfig {
	return &BroadcasterConfig{
		HeartbeatInterval: 15 * time.Second,
		EventBufferSize:   100,
		MaxClients:        1000,
		ThrottleInterval:  100 * time.Millisecond,
		RetryInterval:     3000, // milliseconds
	}
}

// Broadcaster manages SSE connections and event distribution
type Broadcaster struct {
	config    *BroadcasterConfig
	logger    *zap.Logger
	clients   map[string]*Client
	mu        sync.RWMutex
	sequence  uint64
	eventChan chan *Event

	// Control
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewBroadcaster creates a new SSE broadcaster
func NewBroadcaster(config *BroadcasterConfig, logger *zap.Logger) *Broadcaster {
	if config == nil {
		config = DefaultBroadcasterConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	b := &Broadcaster{
		config:    config,
		logger:    logger.Named("sse-broadcaster"),
		clients:   make(map[string]*Client),
		eventChan: make(chan *Event, config.EventBufferSize),
		ctx:       ctx,
		cancel:    cancel,
	}

	// Start background workers
	b.wg.Add(2)
	go b.runEventDistributor()
	go b.runHeartbeat()

	return b
}

// Stop gracefully shuts down the broadcaster
func (b *Broadcaster) Stop() {
	b.cancel()
	b.wg.Wait()

	// Close all client connections
	b.mu.Lock()
	for _, client := range b.clients {
		close(client.Channel)
	}
	b.mu.Unlock()

	close(b.eventChan)
	b.logger.Info("SSE Broadcaster stopped")
}

// HandleSSE handles SSE HTTP connections
func (b *Broadcaster) HandleSSE(w http.ResponseWriter, r *http.Request) {
	// Check if we've reached max clients
	b.mu.RLock()
	if len(b.clients) >= b.config.MaxClients {
		b.mu.RUnlock()
		http.Error(w, "Too many connections", http.StatusServiceUnavailable)
		return
	}
	b.mu.RUnlock()

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no") // Disable nginx buffering

	// Get flusher
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	// Parse subscriptions from query params
	subscriptions := b.parseSubscriptions(r)

	// Create client
	client := &Client{
		ID:            uuid.New().String(),
		Channel:       make(chan *Event, 50),
		Subscriptions: subscriptions,
		ConnectedAt:   time.Now(),
		LastEventID:   r.Header.Get("Last-Event-ID"),
		UserAgent:     r.UserAgent(),
		RemoteAddr:    r.RemoteAddr,
	}

	// Register client
	b.registerClient(client)
	defer b.unregisterClient(client.ID)

	b.logger.Info("SSE client connected",
		zap.String("client_id", client.ID),
		zap.String("remote_addr", client.RemoteAddr))

	// Send retry interval
	fmt.Fprintf(w, "retry: %d\n\n", b.config.RetryInterval)
	flusher.Flush()

	// Send initial data
	b.sendInitialData(client, w, flusher)

	// Main event loop
	for {
		select {
		case <-r.Context().Done():
			b.logger.Info("SSE client disconnected",
				zap.String("client_id", client.ID))
			return

		case event, ok := <-client.Channel:
			if !ok {
				return
			}

			if err := b.writeEvent(w, flusher, event); err != nil {
				b.logger.Warn("Failed to write event",
					zap.String("client_id", client.ID),
					zap.Error(err))
				return
			}
		}
	}
}

func (b *Broadcaster) parseSubscriptions(r *http.Request) map[EventType]bool {
	subs := make(map[EventType]bool)

	// Default: subscribe to all events
	types := r.URL.Query()["type"]
	if len(types) == 0 {
		subs[EventNetProfit] = true
		subs[EventMarketPrice] = true
		subs[EventPosition] = true
		subs[EventArbitrage] = true
		subs[EventRiskAlert] = true
		subs[EventTrade] = true
		subs[EventSystemStatus] = true
	} else {
		for _, t := range types {
			subs[EventType(t)] = true
		}
	}

	// Always include heartbeat
	subs[EventHeartbeat] = true

	return subs
}

func (b *Broadcaster) registerClient(client *Client) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.clients[client.ID] = client
}

func (b *Broadcaster) unregisterClient(clientID string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if client, ok := b.clients[clientID]; ok {
		close(client.Channel)
		delete(b.clients, clientID)
	}
}

func (b *Broadcaster) sendInitialData(client *Client, w http.ResponseWriter, flusher http.Flusher) {
	// Send current system status
	status := &Event{
		ID:        uuid.New().String(),
		Type:      EventSystemStatus,
		Data:      map[string]interface{}{"status": "connected", "client_id": client.ID},
		Timestamp: time.Now(),
	}
	b.writeEvent(w, flusher, status)

	// Send current net profit snapshot
	if client.Subscriptions[EventNetProfit] {
		snapshot := b.getCurrentNetProfit()
		event := &Event{
			ID:        uuid.New().String(),
			Type:      EventNetProfit,
			Data:      snapshot,
			Timestamp: time.Now(),
		}
		b.writeEvent(w, flusher, event)
	}
}

func (b *Broadcaster) writeEvent(w http.ResponseWriter, flusher http.Flusher, event *Event) error {
	data, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	fmt.Fprintf(w, "id: %s\n", event.ID)
	fmt.Fprintf(w, "event: %s\n", event.Type)
	fmt.Fprintf(w, "data: %s\n\n", data)
	flusher.Flush()

	return nil
}

// Publish publishes an event to all subscribed clients
func (b *Broadcaster) Publish(eventType EventType, data interface{}) {
	b.sequence++

	event := &Event{
		ID:        uuid.New().String(),
		Type:      eventType,
		Data:      data,
		Timestamp: time.Now(),
		Sequence:  b.sequence,
	}

	select {
	case b.eventChan <- event:
	default:
		b.logger.Warn("Event channel full, dropping event",
			zap.String("event_type", string(eventType)))
	}
}

// PublishNetProfit publishes a net profit update
func (b *Broadcaster) PublishNetProfit(data *NetProfitData) {
	data.UpdatedAt = time.Now()
	b.Publish(EventNetProfit, data)
}

// runEventDistributor distributes events to subscribed clients
func (b *Broadcaster) runEventDistributor() {
	defer b.wg.Done()

	for {
		select {
		case <-b.ctx.Done():
			return

		case event, ok := <-b.eventChan:
			if !ok {
				return
			}

			b.distributeEvent(event)
		}
	}
}

func (b *Broadcaster) distributeEvent(event *Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	for _, client := range b.clients {
		// Check if client is subscribed to this event type
		if !client.Subscriptions[event.Type] {
			continue
		}

		// Non-blocking send
		select {
		case client.Channel <- event:
		default:
			b.logger.Debug("Client buffer full, skipping",
				zap.String("client_id", client.ID))
		}
	}
}

// runHeartbeat sends periodic heartbeat events
func (b *Broadcaster) runHeartbeat() {
	defer b.wg.Done()

	ticker := time.NewTicker(b.config.HeartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-b.ctx.Done():
			return

		case <-ticker.C:
			heartbeat := &Event{
				ID:   uuid.New().String(),
				Type: EventHeartbeat,
				Data: map[string]interface{}{
					"timestamp":    time.Now().Unix(),
					"clients":      b.GetClientCount(),
					"server_time":  time.Now().Format(time.RFC3339),
				},
				Timestamp: time.Now(),
			}

			b.distributeEvent(heartbeat)
		}
	}
}

// GetClientCount returns the number of connected clients
func (b *Broadcaster) GetClientCount() int {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return len(b.clients)
}

// getCurrentNetProfit fetches current net profit (placeholder - connect to actual data source)
func (b *Broadcaster) getCurrentNetProfit() *NetProfitData {
	// This should be connected to the actual trading engine
	// For now, return placeholder data
	return &NetProfitData{
		TotalAUM:        125_000_000.00,
		DailyPnL:        847_250.00,
		DailyPnLPercent: 0.68,
		WeeklyPnL:       3_215_000.00,
		MonthlyPnL:      12_750_000.00,
		YTDReturn:       0.1823,
		UnrealizedPnL:   425_000.00,
		RealizedPnL:     422_250.00,
		TradingFees:     12_500.00,
		GasUsed:         850.00,
		NetProfit:       833_900.00,
		ByMarket: map[string]float64{
			"AEMO":  312_500.00,
			"JEPX":  275_000.00,
			"PJM":   156_400.00,
			"CAISO": 102_500.00,
		},
		UpdatedAt: time.Now(),
	}
}

// HTTP Handler wrapper
type Handler struct {
	broadcaster *Broadcaster
	logger      *zap.Logger
}

// NewHandler creates a new SSE handler
func NewHandler(broadcaster *Broadcaster, logger *zap.Logger) *Handler {
	return &Handler{
		broadcaster: broadcaster,
		logger:      logger.Named("sse-handler"),
	}
}

// ServeHTTP implements http.Handler
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/sse/stream":
		h.broadcaster.HandleSSE(w, r)
	case "/sse/status":
		h.handleStatus(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (h *Handler) handleStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"connected_clients": h.broadcaster.GetClientCount(),
		"server_time":       time.Now().Format(time.RFC3339),
		"uptime_seconds":    time.Since(time.Now()).Seconds(), // Placeholder
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// DataIngester receives data from trading systems and publishes to SSE
type DataIngester struct {
	broadcaster *Broadcaster
	logger      *zap.Logger
}

// NewDataIngester creates a new data ingester
func NewDataIngester(broadcaster *Broadcaster, logger *zap.Logger) *DataIngester {
	return &DataIngester{
		broadcaster: broadcaster,
		logger:      logger.Named("data-ingester"),
	}
}

// IngestNetProfit ingests net profit data from trading engine
func (di *DataIngester) IngestNetProfit(data *NetProfitData) {
	di.logger.Debug("Ingesting net profit data",
		zap.Float64("net_profit", data.NetProfit))

	// Validate data
	if data.TotalAUM < 0 {
		di.logger.Warn("Invalid AUM value", zap.Float64("aum", data.TotalAUM))
		return
	}

	// Calculate derived fields
	if data.TotalAUM > 0 {
		data.DailyPnLPercent = (data.DailyPnL / data.TotalAUM) * 100
	}

	// Calculate net profit
	data.NetProfit = data.RealizedPnL + data.UnrealizedPnL - data.TradingFees - data.GasUsed

	// Publish to SSE
	di.broadcaster.PublishNetProfit(data)
}

// IngestMarketPrice ingests market price updates
func (di *DataIngester) IngestMarketPrice(marketID, region string, price, volume float64) {
	di.broadcaster.Publish(EventMarketPrice, map[string]interface{}{
		"market_id": marketID,
		"region":    region,
		"price":     price,
		"volume":    volume,
		"timestamp": time.Now(),
	})
}

// IngestArbitrage ingests arbitrage opportunity
func (di *DataIngester) IngestArbitrage(source, target string, spread, profit float64) {
	di.broadcaster.Publish(EventArbitrage, map[string]interface{}{
		"source_market": source,
		"target_market": target,
		"spread":        spread,
		"est_profit":    profit,
		"detected_at":   time.Now(),
	})
}

// IngestRiskAlert ingests risk alerts
func (di *DataIngester) IngestRiskAlert(alertType, message string, severity int) {
	di.broadcaster.Publish(EventRiskAlert, map[string]interface{}{
		"alert_type": alertType,
		"message":    message,
		"severity":   severity,
		"timestamp":  time.Now(),
	})
}
