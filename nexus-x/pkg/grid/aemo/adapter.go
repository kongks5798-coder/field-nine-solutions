// Package aemo provides the Australian Energy Market Operator (AEMO) adapter
// for NEXUS-X global energy trading platform.
//
// AEMO operates:
// - NEM (National Electricity Market): QLD, NSW, VIC, SA, TAS
// - WEM (Wholesale Electricity Market): WA
// - Gas markets: DWGM, STTM
//
// Architecture:
// ┌─────────────────────────────────────────────────────────────────┐
// │                     AEMO Market Adapter                         │
// ├─────────────────────────────────────────────────────────────────┤
// │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
// │  │ NEM 5-min   │  │ WEM 30-min  │  │ FCAS (Frequency Control)│ │
// │  │ Dispatch    │  │ Balancing   │  │ Ancillary Services      │ │
// │  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
// │         │                │                      │              │
// │         └────────────────┼──────────────────────┘              │
// │                          ▼                                     │
// │              ┌───────────────────────┐                         │
// │              │  Unified Price Stream │                         │
// │              │  (gRPC/WebSocket)     │                         │
// │              └───────────────────────┘                         │
// └─────────────────────────────────────────────────────────────────┘
package aemo

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

// Region represents AEMO NEM regions
type Region string

const (
	RegionNSW Region = "NSW1"
	RegionQLD Region = "QLD1"
	RegionVIC Region = "VIC1"
	RegionSA  Region = "SA1"
	RegionTAS Region = "TAS1"
)

// MarketType represents different AEMO markets
type MarketType string

const (
	MarketNEM  MarketType = "NEM"  // National Electricity Market
	MarketWEM  MarketType = "WEM"  // Wholesale Electricity Market (WA)
	MarketFCAS MarketType = "FCAS" // Frequency Control Ancillary Services
)

// FCASType represents FCAS market types
type FCASType string

const (
	FCASRaiseReg   FCASType = "RAISE_REG"   // Raise Regulation
	FCASLowerReg   FCASType = "LOWER_REG"   // Lower Regulation
	FCASRaise6Sec  FCASType = "RAISE_6SEC"  // Raise 6 Second
	FCASRaise60Sec FCASType = "RAISE_60SEC" // Raise 60 Second
	FCASRaise5Min  FCASType = "RAISE_5MIN"  // Raise 5 Minute
	FCASLower6Sec  FCASType = "LOWER_6SEC"  // Lower 6 Second
	FCASLower60Sec FCASType = "LOWER_60SEC" // Lower 60 Second
	FCASLower5Min  FCASType = "LOWER_5MIN"  // Lower 5 Minute
)

// NEMPrice represents real-time NEM dispatch price
type NEMPrice struct {
	Region           Region    `json:"region"`
	SettlementDate   time.Time `json:"settlement_date"`
	DispatchInterval int       `json:"dispatch_interval"` // 5-minute intervals (1-288)
	RRP              float64   `json:"rrp"`               // Regional Reference Price ($/MWh)
	EEP              float64   `json:"eep"`               // Energy Export Price
	ROP              float64   `json:"rop"`               // Regional Offer Price
	TotalDemand      float64   `json:"total_demand"`      // MW
	AvailableGen     float64   `json:"available_gen"`     // MW
	NetInterchange   float64   `json:"net_interchange"`   // MW (positive = import)
	SemiScheduledGen float64   `json:"semi_scheduled_gen"`
	Timestamp        time.Time `json:"timestamp"`
}

// FCASPrice represents FCAS market prices
type FCASPrice struct {
	Region       Region    `json:"region"`
	FCASType     FCASType  `json:"fcas_type"`
	Price        float64   `json:"price"`         // $/MW
	Availability float64   `json:"availability"`  // MW
	Requirement  float64   `json:"requirement"`   // MW
	Timestamp    time.Time `json:"timestamp"`
}

// PredispatchPrice represents pre-dispatch price forecast
type PredispatchPrice struct {
	Region           Region    `json:"region"`
	ForecastTime     time.Time `json:"forecast_time"`
	PredictedRRP     float64   `json:"predicted_rrp"`
	LowerBound       float64   `json:"lower_bound"`
	UpperBound       float64   `json:"upper_bound"`
	Confidence       float64   `json:"confidence"` // 0-1
	TotalDemand      float64   `json:"total_demand"`
	ScheduledGen     float64   `json:"scheduled_gen"`
	SemiScheduledGen float64   `json:"semi_scheduled_gen"`
	Timestamp        time.Time `json:"timestamp"`
}

// BidOffer represents a bid/offer in the NEM
type BidOffer struct {
	DUID           string     `json:"duid"`            // Dispatchable Unit ID
	Region         Region     `json:"region"`
	OfferType      string     `json:"offer_type"`      // ENERGY, FCAS
	PriceBand      int        `json:"price_band"`      // 1-10
	BandAvail      float64    `json:"band_avail"`      // MW availability in band
	MaxAvail       float64    `json:"max_avail"`       // Maximum availability
	RampRateUp     float64    `json:"ramp_rate_up"`    // MW/min
	RampRateDown   float64    `json:"ramp_rate_down"`  // MW/min
	SubmissionTime time.Time  `json:"submission_time"`
}

// ConstraintBinding represents a network constraint
type ConstraintBinding struct {
	ConstraintID    string    `json:"constraint_id"`
	ConstraintType  string    `json:"constraint_type"` // THERMAL, VOLTAGE, STABILITY
	LimitType       string    `json:"limit_type"`      // <=, >=, =
	LimitValue      float64   `json:"limit_value"`
	MarginalValue   float64   `json:"marginal_value"` // $/MW
	AffectedRegions []Region  `json:"affected_regions"`
	Binding         bool      `json:"binding"`
	Timestamp       time.Time `json:"timestamp"`
}

// Config holds AEMO adapter configuration
type Config struct {
	APIEndpoint       string        `json:"api_endpoint"`
	WebSocketEndpoint string        `json:"websocket_endpoint"`
	APIKey            string        `json:"api_key"`
	Regions           []Region      `json:"regions"`
	PollInterval      time.Duration `json:"poll_interval"`
	ReconnectDelay    time.Duration `json:"reconnect_delay"`
	MaxRetries        int           `json:"max_retries"`
	EnableFCAS        bool          `json:"enable_fcas"`
	EnablePredispatch bool          `json:"enable_predispatch"`
}

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		APIEndpoint:       "https://aemo.com.au/aemo/apps/api",
		WebSocketEndpoint: "wss://aemo.com.au/ws/nem/dispatch",
		Regions:           []Region{RegionNSW, RegionQLD, RegionVIC, RegionSA, RegionTAS},
		PollInterval:      5 * time.Second,
		ReconnectDelay:    5 * time.Second,
		MaxRetries:        3,
		EnableFCAS:        true,
		EnablePredispatch: true,
	}
}

// Adapter implements the AEMO market adapter
type Adapter struct {
	config     *Config
	logger     *zap.Logger
	httpClient *http.Client
	wsConn     *websocket.Conn

	// Channels for price streams
	nemPrices        chan *NEMPrice
	fcasPrices       chan *FCASPrice
	predispatchPrice chan *PredispatchPrice
	constraints      chan *ConstraintBinding

	// Internal state
	mu              sync.RWMutex
	latestPrices    map[Region]*NEMPrice
	latestFCAS      map[Region]map[FCASType]*FCASPrice
	bindingConstraints []*ConstraintBinding

	// Control
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewAdapter creates a new AEMO adapter
func NewAdapter(config *Config, logger *zap.Logger) *Adapter {
	if config == nil {
		config = DefaultConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Adapter{
		config: config,
		logger: logger.Named("aemo-adapter"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		nemPrices:        make(chan *NEMPrice, 100),
		fcasPrices:       make(chan *FCASPrice, 100),
		predispatchPrice: make(chan *PredispatchPrice, 100),
		constraints:      make(chan *ConstraintBinding, 50),
		latestPrices:     make(map[Region]*NEMPrice),
		latestFCAS:       make(map[Region]map[FCASType]*FCASPrice),
		ctx:              ctx,
		cancel:           cancel,
	}
}

// Start begins the AEMO adapter
func (a *Adapter) Start() error {
	a.logger.Info("Starting AEMO adapter",
		zap.Strings("regions", regionStrings(a.config.Regions)),
		zap.Bool("fcas_enabled", a.config.EnableFCAS),
		zap.Bool("predispatch_enabled", a.config.EnablePredispatch))

	// Start WebSocket connection
	a.wg.Add(1)
	go a.runWebSocket()

	// Start REST API poller for supplementary data
	a.wg.Add(1)
	go a.runRESTPoller()

	// Start predispatch fetcher if enabled
	if a.config.EnablePredispatch {
		a.wg.Add(1)
		go a.runPredispatchFetcher()
	}

	// Start constraint monitor
	a.wg.Add(1)
	go a.runConstraintMonitor()

	return nil
}

// Stop gracefully stops the adapter
func (a *Adapter) Stop() error {
	a.logger.Info("Stopping AEMO adapter")
	a.cancel()

	// Close WebSocket
	if a.wsConn != nil {
		a.wsConn.Close()
	}

	a.wg.Wait()
	close(a.nemPrices)
	close(a.fcasPrices)
	close(a.predispatchPrice)
	close(a.constraints)

	a.logger.Info("AEMO adapter stopped")
	return nil
}

// NEMPrices returns the NEM price channel
func (a *Adapter) NEMPrices() <-chan *NEMPrice {
	return a.nemPrices
}

// FCASPrices returns the FCAS price channel
func (a *Adapter) FCASPrices() <-chan *FCASPrice {
	return a.fcasPrices
}

// PredispatchPrices returns the predispatch price channel
func (a *Adapter) PredispatchPrices() <-chan *PredispatchPrice {
	return a.predispatchPrice
}

// Constraints returns the constraint binding channel
func (a *Adapter) Constraints() <-chan *ConstraintBinding {
	return a.constraints
}

// GetLatestPrice returns the latest price for a region
func (a *Adapter) GetLatestPrice(region Region) (*NEMPrice, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	price, ok := a.latestPrices[region]
	if !ok {
		return nil, fmt.Errorf("no price available for region %s", region)
	}
	return price, nil
}

// GetLatestFCASPrice returns the latest FCAS price
func (a *Adapter) GetLatestFCASPrice(region Region, fcasType FCASType) (*FCASPrice, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	regionFCAS, ok := a.latestFCAS[region]
	if !ok {
		return nil, fmt.Errorf("no FCAS data for region %s", region)
	}

	price, ok := regionFCAS[fcasType]
	if !ok {
		return nil, fmt.Errorf("no FCAS price for type %s in region %s", fcasType, region)
	}

	return price, nil
}

// SubmitBid submits a bid to the NEM
func (a *Adapter) SubmitBid(bid *BidOffer) error {
	a.logger.Info("Submitting bid to AEMO",
		zap.String("duid", bid.DUID),
		zap.String("region", string(bid.Region)),
		zap.Float64("max_avail", bid.MaxAvail))

	// Validate bid
	if err := a.validateBid(bid); err != nil {
		return fmt.Errorf("bid validation failed: %w", err)
	}

	// Prepare request
	payload, err := json.Marshal(bid)
	if err != nil {
		return fmt.Errorf("failed to marshal bid: %w", err)
	}

	req, err := http.NewRequestWithContext(a.ctx, "POST",
		fmt.Sprintf("%s/bidding/submit", a.config.APIEndpoint),
		nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", a.config.APIKey))
	req.Header.Set("X-Bid-Payload", string(payload))

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("bid submission failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("bid rejected: %s", string(body))
	}

	a.logger.Info("Bid submitted successfully",
		zap.String("duid", bid.DUID))

	return nil
}

// runWebSocket manages the WebSocket connection
func (a *Adapter) runWebSocket() {
	defer a.wg.Done()

	for {
		select {
		case <-a.ctx.Done():
			return
		default:
			if err := a.connectWebSocket(); err != nil {
				a.logger.Error("WebSocket connection failed", zap.Error(err))
				time.Sleep(a.config.ReconnectDelay)
				continue
			}

			a.readWebSocket()
		}
	}
}

func (a *Adapter) connectWebSocket() error {
	header := http.Header{}
	header.Set("Authorization", fmt.Sprintf("Bearer %s", a.config.APIKey))
	header.Set("X-Regions", joinRegions(a.config.Regions))

	conn, _, err := websocket.DefaultDialer.DialContext(a.ctx, a.config.WebSocketEndpoint, header)
	if err != nil {
		return fmt.Errorf("websocket dial failed: %w", err)
	}

	a.wsConn = conn
	a.logger.Info("WebSocket connected to AEMO")

	// Subscribe to regions
	subscribeMsg := map[string]interface{}{
		"action":  "subscribe",
		"regions": a.config.Regions,
		"types":   []string{"dispatch", "predispatch"},
	}
	if a.config.EnableFCAS {
		subscribeMsg["types"] = append(subscribeMsg["types"].([]string), "fcas")
	}

	return conn.WriteJSON(subscribeMsg)
}

func (a *Adapter) readWebSocket() {
	for {
		select {
		case <-a.ctx.Done():
			return
		default:
			_, message, err := a.wsConn.ReadMessage()
			if err != nil {
				a.logger.Warn("WebSocket read error", zap.Error(err))
				return
			}

			a.processWebSocketMessage(message)
		}
	}
}

func (a *Adapter) processWebSocketMessage(message []byte) {
	var baseMsg struct {
		Type string `json:"type"`
	}

	if err := json.Unmarshal(message, &baseMsg); err != nil {
		a.logger.Warn("Failed to parse message type", zap.Error(err))
		return
	}

	switch baseMsg.Type {
	case "dispatch":
		var price NEMPrice
		if err := json.Unmarshal(message, &price); err != nil {
			a.logger.Warn("Failed to parse dispatch price", zap.Error(err))
			return
		}
		price.Timestamp = time.Now()
		a.updateLatestPrice(&price)
		select {
		case a.nemPrices <- &price:
		default:
			a.logger.Warn("NEM price channel full")
		}

	case "fcas":
		var price FCASPrice
		if err := json.Unmarshal(message, &price); err != nil {
			a.logger.Warn("Failed to parse FCAS price", zap.Error(err))
			return
		}
		price.Timestamp = time.Now()
		a.updateLatestFCAS(&price)
		select {
		case a.fcasPrices <- &price:
		default:
			a.logger.Warn("FCAS price channel full")
		}

	case "predispatch":
		var price PredispatchPrice
		if err := json.Unmarshal(message, &price); err != nil {
			a.logger.Warn("Failed to parse predispatch price", zap.Error(err))
			return
		}
		price.Timestamp = time.Now()
		select {
		case a.predispatchPrice <- &price:
		default:
			a.logger.Warn("Predispatch price channel full")
		}

	case "constraint":
		var constraint ConstraintBinding
		if err := json.Unmarshal(message, &constraint); err != nil {
			a.logger.Warn("Failed to parse constraint", zap.Error(err))
			return
		}
		constraint.Timestamp = time.Now()
		select {
		case a.constraints <- &constraint:
		default:
			a.logger.Warn("Constraint channel full")
		}
	}
}

func (a *Adapter) updateLatestPrice(price *NEMPrice) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.latestPrices[price.Region] = price
}

func (a *Adapter) updateLatestFCAS(price *FCASPrice) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if _, ok := a.latestFCAS[price.Region]; !ok {
		a.latestFCAS[price.Region] = make(map[FCASType]*FCASPrice)
	}
	a.latestFCAS[price.Region][price.FCASType] = price
}

// runRESTPoller polls REST API for supplementary data
func (a *Adapter) runRESTPoller() {
	defer a.wg.Done()

	ticker := time.NewTicker(a.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchDispatchData()
			if a.config.EnableFCAS {
				a.fetchFCASData()
			}
		}
	}
}

func (a *Adapter) fetchDispatchData() {
	for _, region := range a.config.Regions {
		url := fmt.Sprintf("%s/dispatch/price?region=%s", a.config.APIEndpoint, region)

		req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
		if err != nil {
			a.logger.Warn("Failed to create dispatch request", zap.Error(err))
			continue
		}
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", a.config.APIKey))

		resp, err := a.httpClient.Do(req)
		if err != nil {
			a.logger.Warn("Dispatch fetch failed", zap.String("region", string(region)), zap.Error(err))
			continue
		}

		var price NEMPrice
		if err := json.NewDecoder(resp.Body).Decode(&price); err != nil {
			resp.Body.Close()
			a.logger.Warn("Failed to decode dispatch response", zap.Error(err))
			continue
		}
		resp.Body.Close()

		price.Timestamp = time.Now()
		a.updateLatestPrice(&price)
	}
}

func (a *Adapter) fetchFCASData() {
	for _, region := range a.config.Regions {
		url := fmt.Sprintf("%s/fcas/prices?region=%s", a.config.APIEndpoint, region)

		req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
		if err != nil {
			a.logger.Warn("Failed to create FCAS request", zap.Error(err))
			continue
		}
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", a.config.APIKey))

		resp, err := a.httpClient.Do(req)
		if err != nil {
			a.logger.Warn("FCAS fetch failed", zap.String("region", string(region)), zap.Error(err))
			continue
		}

		var prices []FCASPrice
		if err := json.NewDecoder(resp.Body).Decode(&prices); err != nil {
			resp.Body.Close()
			a.logger.Warn("Failed to decode FCAS response", zap.Error(err))
			continue
		}
		resp.Body.Close()

		for _, price := range prices {
			price.Timestamp = time.Now()
			a.updateLatestFCAS(&price)
		}
	}
}

// runPredispatchFetcher fetches predispatch forecasts
func (a *Adapter) runPredispatchFetcher() {
	defer a.wg.Done()

	// Predispatch is published every 30 minutes
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()

	// Initial fetch
	a.fetchPredispatch()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchPredispatch()
		}
	}
}

func (a *Adapter) fetchPredispatch() {
	url := fmt.Sprintf("%s/predispatch/prices", a.config.APIEndpoint)

	req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
	if err != nil {
		a.logger.Warn("Failed to create predispatch request", zap.Error(err))
		return
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", a.config.APIKey))

	resp, err := a.httpClient.Do(req)
	if err != nil {
		a.logger.Warn("Predispatch fetch failed", zap.Error(err))
		return
	}
	defer resp.Body.Close()

	var forecasts []PredispatchPrice
	if err := json.NewDecoder(resp.Body).Decode(&forecasts); err != nil {
		a.logger.Warn("Failed to decode predispatch response", zap.Error(err))
		return
	}

	for _, forecast := range forecasts {
		forecast.Timestamp = time.Now()
		select {
		case a.predispatchPrice <- &forecast:
		default:
		}
	}

	a.logger.Debug("Predispatch data updated", zap.Int("forecasts", len(forecasts)))
}

// runConstraintMonitor monitors network constraints
func (a *Adapter) runConstraintMonitor() {
	defer a.wg.Done()

	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchConstraints()
		}
	}
}

func (a *Adapter) fetchConstraints() {
	url := fmt.Sprintf("%s/constraints/binding", a.config.APIEndpoint)

	req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
	if err != nil {
		a.logger.Warn("Failed to create constraints request", zap.Error(err))
		return
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", a.config.APIKey))

	resp, err := a.httpClient.Do(req)
	if err != nil {
		a.logger.Warn("Constraints fetch failed", zap.Error(err))
		return
	}
	defer resp.Body.Close()

	var constraints []ConstraintBinding
	if err := json.NewDecoder(resp.Body).Decode(&constraints); err != nil {
		a.logger.Warn("Failed to decode constraints response", zap.Error(err))
		return
	}

	a.mu.Lock()
	a.bindingConstraints = make([]*ConstraintBinding, len(constraints))
	for i := range constraints {
		constraints[i].Timestamp = time.Now()
		a.bindingConstraints[i] = &constraints[i]
		select {
		case a.constraints <- &constraints[i]:
		default:
		}
	}
	a.mu.Unlock()

	a.logger.Debug("Constraints updated", zap.Int("binding", len(constraints)))
}

// GetBindingConstraints returns current binding constraints
func (a *Adapter) GetBindingConstraints() []*ConstraintBinding {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.bindingConstraints
}

// validateBid validates a bid before submission
func (a *Adapter) validateBid(bid *BidOffer) error {
	if bid.DUID == "" {
		return fmt.Errorf("DUID is required")
	}
	if bid.PriceBand < 1 || bid.PriceBand > 10 {
		return fmt.Errorf("price band must be between 1 and 10")
	}
	if bid.MaxAvail < 0 {
		return fmt.Errorf("max availability cannot be negative")
	}
	if bid.BandAvail < 0 || bid.BandAvail > bid.MaxAvail {
		return fmt.Errorf("band availability must be between 0 and max availability")
	}
	return nil
}

// Helper functions
func regionStrings(regions []Region) []string {
	strs := make([]string, len(regions))
	for i, r := range regions {
		strs[i] = string(r)
	}
	return strs
}

func joinRegions(regions []Region) string {
	strs := regionStrings(regions)
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += ","
		}
		result += s
	}
	return result
}
