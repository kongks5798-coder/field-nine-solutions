// Package grid provides the unified Global Grid Manager for NEXUS-X
// coordinating all regional energy market adapters.
//
// Global Coverage:
// ┌────────────────────────────────────────────────────────────────────────┐
// │                    NEXUS-X Global Grid Manager                         │
// ├────────────────────────────────────────────────────────────────────────┤
// │                                                                        │
// │  Americas           │  Europe            │  Asia-Pacific              │
// │  ┌────────────┐     │  ┌────────────┐    │  ┌────────────┐            │
// │  │ PJM (US-E) │     │  │ EPEX Spot  │    │  │ AEMO (AU)  │            │
// │  │ CAISO (CA) │     │  │ NordPool   │    │  │ JEPX (JP)  │            │
// │  │ ERCOT (TX) │     │  └────────────┘    │  │ KPX (KR)   │            │
// │  │ MISO       │     │                    │  └────────────┘            │
// │  └────────────┘     │                    │                            │
// │                     │                    │                            │
// │  ─────────────────────────────────────────────────────────────────── │
// │                         Unified Price Stream                          │
// │                        Arbitrage Detection                            │
// │                        Risk-Adjusted Routing                          │
// └────────────────────────────────────────────────────────────────────────┘
package grid

import (
	"context"
	"fmt"
	"sort"
	"sync"
	"time"

	"go.uber.org/zap"
)

// MarketID identifies a specific energy market
type MarketID string

const (
	// Americas
	MarketPJM   MarketID = "PJM"
	MarketCAISO MarketID = "CAISO"
	MarketERCOT MarketID = "ERCOT"
	MarketMISO  MarketID = "MISO"

	// Europe
	MarketEPEX     MarketID = "EPEX"
	MarketNordPool MarketID = "NORDPOOL"

	// Asia-Pacific
	MarketAEMO MarketID = "AEMO" // Australia
	MarketJEPX MarketID = "JEPX" // Japan
	MarketKPX  MarketID = "KPX"  // Korea
)

// Region represents a trading region within a market
type Region string

// UnifiedPrice represents a normalized price across all markets
type UnifiedPrice struct {
	MarketID     MarketID  `json:"market_id"`
	Region       string    `json:"region"`
	Price        float64   `json:"price"`         // Normalized to USD/MWh
	LocalPrice   float64   `json:"local_price"`   // Original currency
	Currency     string    `json:"currency"`      // Original currency code
	Volume       float64   `json:"volume"`        // Available volume (MWh)
	Timestamp    time.Time `json:"timestamp"`
	Latency      int64     `json:"latency_ms"`    // Data latency in ms
	MarketStatus string    `json:"market_status"` // OPEN, CLOSED, PRE_OPEN
}

// ArbitrageOpportunity represents a cross-market arbitrage opportunity
type ArbitrageOpportunity struct {
	ID              string        `json:"id"`
	SourceMarket    MarketID      `json:"source_market"`
	SourceRegion    string        `json:"source_region"`
	TargetMarket    MarketID      `json:"target_market"`
	TargetRegion    string        `json:"target_region"`
	BuyPrice        float64       `json:"buy_price"`         // USD/MWh
	SellPrice       float64       `json:"sell_price"`        // USD/MWh
	Spread          float64       `json:"spread"`            // USD/MWh
	SpreadPercent   float64       `json:"spread_percent"`    // %
	MaxVolume       float64       `json:"max_volume"`        // MWh
	EstimatedProfit float64       `json:"estimated_profit"`  // USD
	TransferCost    float64       `json:"transfer_cost"`     // USD/MWh
	NetSpread       float64       `json:"net_spread"`        // Spread - Transfer Cost
	RiskScore       float64       `json:"risk_score"`        // 0-1
	ValidUntil      time.Time     `json:"valid_until"`
	DetectedAt      time.Time     `json:"detected_at"`
}

// MarketAdapter interface for all market adapters
type MarketAdapter interface {
	Start() error
	Stop() error
	GetMarketID() MarketID
	GetPrices() <-chan *UnifiedPrice
}

// ExchangeRates holds currency exchange rates
type ExchangeRates struct {
	AUDUSD float64 `json:"aud_usd"`
	JPYUSD float64 `json:"jpy_usd"`
	KRWUSD float64 `json:"krw_usd"`
	EURUSD float64 `json:"eur_usd"`
	GBPUSD float64 `json:"gbp_usd"`
}

// ManagerConfig holds configuration for the Global Grid Manager
type ManagerConfig struct {
	EnableArbitrage      bool          `json:"enable_arbitrage"`
	MinSpreadPercent     float64       `json:"min_spread_percent"`     // Minimum spread to consider (%)
	MinNetSpread         float64       `json:"min_net_spread"`         // Minimum net spread (USD/MWh)
	MaxRiskScore         float64       `json:"max_risk_score"`         // Maximum acceptable risk
	PriceValidityWindow  time.Duration `json:"price_validity_window"`  // How long prices are valid
	ArbitrageCheckInterval time.Duration `json:"arbitrage_check_interval"`
}

// DefaultManagerConfig returns default configuration
func DefaultManagerConfig() *ManagerConfig {
	return &ManagerConfig{
		EnableArbitrage:        true,
		MinSpreadPercent:       0.5,  // 0.5% minimum spread
		MinNetSpread:           2.0,  // $2/MWh minimum net spread
		MaxRiskScore:           0.7,  // 70% max risk
		PriceValidityWindow:    30 * time.Second,
		ArbitrageCheckInterval: 5 * time.Second,
	}
}

// Manager coordinates all market adapters globally
type Manager struct {
	config   *ManagerConfig
	logger   *zap.Logger
	adapters map[MarketID]MarketAdapter

	// Unified price aggregation
	mu           sync.RWMutex
	latestPrices map[string]*UnifiedPrice // key: marketID:region
	exchangeRates *ExchangeRates

	// Channels
	unifiedPrices  chan *UnifiedPrice
	arbitrageOpps  chan *ArbitrageOpportunity

	// Control
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewManager creates a new Global Grid Manager
func NewManager(config *ManagerConfig, logger *zap.Logger) *Manager {
	if config == nil {
		config = DefaultManagerConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Manager{
		config:        config,
		logger:        logger.Named("grid-manager"),
		adapters:      make(map[MarketID]MarketAdapter),
		latestPrices:  make(map[string]*UnifiedPrice),
		exchangeRates: &ExchangeRates{
			AUDUSD: 0.65,  // Default rates, should be fetched dynamically
			JPYUSD: 0.0067,
			KRWUSD: 0.00075,
			EURUSD: 1.08,
			GBPUSD: 1.27,
		},
		unifiedPrices: make(chan *UnifiedPrice, 1000),
		arbitrageOpps: make(chan *ArbitrageOpportunity, 100),
		ctx:           ctx,
		cancel:        cancel,
	}
}

// RegisterAdapter registers a market adapter
func (m *Manager) RegisterAdapter(adapter MarketAdapter) error {
	marketID := adapter.GetMarketID()
	if _, exists := m.adapters[marketID]; exists {
		return fmt.Errorf("adapter for market %s already registered", marketID)
	}
	m.adapters[marketID] = adapter
	m.logger.Info("Registered market adapter", zap.String("market", string(marketID)))
	return nil
}

// Start begins the Global Grid Manager
func (m *Manager) Start() error {
	m.logger.Info("Starting Global Grid Manager",
		zap.Int("adapters", len(m.adapters)),
		zap.Bool("arbitrage_enabled", m.config.EnableArbitrage))

	// Start all adapters
	for marketID, adapter := range m.adapters {
		if err := adapter.Start(); err != nil {
			return fmt.Errorf("failed to start adapter %s: %w", marketID, err)
		}
		m.logger.Info("Started market adapter", zap.String("market", string(marketID)))
	}

	// Start price aggregation
	m.wg.Add(1)
	go m.runPriceAggregator()

	// Start arbitrage detector if enabled
	if m.config.EnableArbitrage {
		m.wg.Add(1)
		go m.runArbitrageDetector()
	}

	// Start exchange rate updater
	m.wg.Add(1)
	go m.runExchangeRateUpdater()

	return nil
}

// Stop gracefully stops the manager
func (m *Manager) Stop() error {
	m.logger.Info("Stopping Global Grid Manager")
	m.cancel()

	// Stop all adapters
	for marketID, adapter := range m.adapters {
		if err := adapter.Stop(); err != nil {
			m.logger.Warn("Failed to stop adapter", zap.String("market", string(marketID)), zap.Error(err))
		}
	}

	m.wg.Wait()
	close(m.unifiedPrices)
	close(m.arbitrageOpps)

	m.logger.Info("Global Grid Manager stopped")
	return nil
}

// UnifiedPrices returns the unified price stream
func (m *Manager) UnifiedPrices() <-chan *UnifiedPrice {
	return m.unifiedPrices
}

// ArbitrageOpportunities returns the arbitrage opportunity stream
func (m *Manager) ArbitrageOpportunities() <-chan *ArbitrageOpportunity {
	return m.arbitrageOpps
}

// GetLatestPrice returns the latest price for a market/region
func (m *Manager) GetLatestPrice(marketID MarketID, region string) (*UnifiedPrice, error) {
	key := fmt.Sprintf("%s:%s", marketID, region)

	m.mu.RLock()
	defer m.mu.RUnlock()

	price, ok := m.latestPrices[key]
	if !ok {
		return nil, fmt.Errorf("no price available for %s", key)
	}

	// Check if price is still valid
	if time.Since(price.Timestamp) > m.config.PriceValidityWindow {
		return nil, fmt.Errorf("price for %s is stale", key)
	}

	return price, nil
}

// GetAllPrices returns all current prices
func (m *Manager) GetAllPrices() []*UnifiedPrice {
	m.mu.RLock()
	defer m.mu.RUnlock()

	prices := make([]*UnifiedPrice, 0, len(m.latestPrices))
	for _, price := range m.latestPrices {
		if time.Since(price.Timestamp) <= m.config.PriceValidityWindow {
			prices = append(prices, price)
		}
	}

	// Sort by price for easy comparison
	sort.Slice(prices, func(i, j int) bool {
		return prices[i].Price < prices[j].Price
	})

	return prices
}

// runPriceAggregator aggregates prices from all adapters
func (m *Manager) runPriceAggregator() {
	defer m.wg.Done()

	// Collect price channels from all adapters
	for marketID, adapter := range m.adapters {
		go func(id MarketID, a MarketAdapter) {
			priceChan := a.GetPrices()
			for {
				select {
				case <-m.ctx.Done():
					return
				case price, ok := <-priceChan:
					if !ok {
						return
					}
					m.processPrice(price)
				}
			}
		}(marketID, adapter)
	}

	<-m.ctx.Done()
}

func (m *Manager) processPrice(price *UnifiedPrice) {
	// Normalize price to USD if needed
	if price.Currency != "USD" {
		price.Price = m.convertToUSD(price.LocalPrice, price.Currency)
	}

	key := fmt.Sprintf("%s:%s", price.MarketID, price.Region)

	m.mu.Lock()
	m.latestPrices[key] = price
	m.mu.Unlock()

	// Forward to unified stream
	select {
	case m.unifiedPrices <- price:
	default:
		m.logger.Warn("Unified price channel full")
	}
}

func (m *Manager) convertToUSD(amount float64, currency string) float64 {
	m.mu.RLock()
	defer m.mu.RUnlock()

	switch currency {
	case "AUD":
		return amount * m.exchangeRates.AUDUSD
	case "JPY":
		return amount * m.exchangeRates.JPYUSD
	case "KRW":
		return amount * m.exchangeRates.KRWUSD
	case "EUR":
		return amount * m.exchangeRates.EURUSD
	case "GBP":
		return amount * m.exchangeRates.GBPUSD
	default:
		return amount // Assume USD
	}
}

// runArbitrageDetector continuously scans for arbitrage opportunities
func (m *Manager) runArbitrageDetector() {
	defer m.wg.Done()

	ticker := time.NewTicker(m.config.ArbitrageCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.detectArbitrage()
		}
	}
}

func (m *Manager) detectArbitrage() {
	prices := m.GetAllPrices()
	if len(prices) < 2 {
		return
	}

	// Compare all price pairs
	for i := 0; i < len(prices); i++ {
		for j := i + 1; j < len(prices); j++ {
			lowPrice := prices[i]
			highPrice := prices[j]

			spread := highPrice.Price - lowPrice.Price
			spreadPercent := (spread / lowPrice.Price) * 100

			// Check if spread meets minimum threshold
			if spreadPercent < m.config.MinSpreadPercent {
				continue
			}

			// Calculate transfer cost (simplified)
			transferCost := m.estimateTransferCost(lowPrice.MarketID, highPrice.MarketID)
			netSpread := spread - transferCost

			if netSpread < m.config.MinNetSpread {
				continue
			}

			// Calculate risk score
			riskScore := m.calculateRiskScore(lowPrice, highPrice)
			if riskScore > m.config.MaxRiskScore {
				continue
			}

			// Calculate maximum volume
			maxVolume := min(lowPrice.Volume, highPrice.Volume)
			if maxVolume <= 0 {
				continue
			}

			opp := &ArbitrageOpportunity{
				ID:              fmt.Sprintf("%s-%s-%d", lowPrice.MarketID, highPrice.MarketID, time.Now().UnixNano()),
				SourceMarket:    lowPrice.MarketID,
				SourceRegion:    lowPrice.Region,
				TargetMarket:    highPrice.MarketID,
				TargetRegion:    highPrice.Region,
				BuyPrice:        lowPrice.Price,
				SellPrice:       highPrice.Price,
				Spread:          spread,
				SpreadPercent:   spreadPercent,
				MaxVolume:       maxVolume,
				EstimatedProfit: netSpread * maxVolume,
				TransferCost:    transferCost,
				NetSpread:       netSpread,
				RiskScore:       riskScore,
				ValidUntil:      time.Now().Add(m.config.PriceValidityWindow),
				DetectedAt:      time.Now(),
			}

			m.logger.Info("Arbitrage opportunity detected",
				zap.String("source", string(opp.SourceMarket)),
				zap.String("target", string(opp.TargetMarket)),
				zap.Float64("spread_percent", opp.SpreadPercent),
				zap.Float64("estimated_profit", opp.EstimatedProfit))

			select {
			case m.arbitrageOpps <- opp:
			default:
				m.logger.Warn("Arbitrage channel full")
			}
		}
	}
}

func (m *Manager) estimateTransferCost(source, target MarketID) float64 {
	// Transfer cost matrix (USD/MWh) - based on grid interconnection costs
	// This is a simplified model; real implementation would consider:
	// - Physical interconnection availability
	// - Congestion charges
	// - Loss factors
	// - Scheduling fees

	costMatrix := map[string]float64{
		// Americas <-> Americas
		"PJM:MISO":   0.5,
		"PJM:CAISO":  3.0,
		"PJM:ERCOT":  5.0,
		"CAISO:ERCOT": 2.5,
		"MISO:ERCOT": 1.5,

		// Asia-Pacific internal
		"AEMO:JEPX":  15.0, // No direct connection, requires virtual trade
		"AEMO:KPX":   12.0,
		"JEPX:KPX":   8.0,

		// Cross-continental (virtual power purchase agreements)
		"PJM:AEMO":   20.0,
		"PJM:JEPX":   18.0,
		"CAISO:JEPX": 15.0,
		"EPEX:AEMO":  22.0,
	}

	// Check both directions
	key1 := fmt.Sprintf("%s:%s", source, target)
	key2 := fmt.Sprintf("%s:%s", target, source)

	if cost, ok := costMatrix[key1]; ok {
		return cost
	}
	if cost, ok := costMatrix[key2]; ok {
		return cost
	}

	// Default high cost for unknown routes
	return 25.0
}

func (m *Manager) calculateRiskScore(source, target *UnifiedPrice) float64 {
	var riskScore float64

	// Latency risk (higher latency = higher risk of price change)
	maxLatency := float64(max(source.Latency, target.Latency))
	latencyRisk := min(maxLatency/1000.0, 0.3) // Max 0.3 from latency

	// Market status risk
	statusRisk := 0.0
	if source.MarketStatus != "OPEN" || target.MarketStatus != "OPEN" {
		statusRisk = 0.4
	}

	// Cross-market risk (different markets = higher execution risk)
	crossMarketRisk := 0.1
	if source.MarketID != target.MarketID {
		crossMarketRisk = 0.2
	}

	// Volume risk (low volume = higher slippage risk)
	minVolume := min(source.Volume, target.Volume)
	volumeRisk := 0.0
	if minVolume < 10 { // Less than 10 MWh
		volumeRisk = 0.3
	} else if minVolume < 50 {
		volumeRisk = 0.15
	}

	// Age risk (older prices = higher risk)
	maxAge := max(time.Since(source.Timestamp), time.Since(target.Timestamp))
	ageRisk := min(float64(maxAge.Seconds())/30.0*0.2, 0.2) // Max 0.2 from age

	riskScore = latencyRisk + statusRisk + crossMarketRisk + volumeRisk + ageRisk
	return min(riskScore, 1.0)
}

// runExchangeRateUpdater updates currency exchange rates
func (m *Manager) runExchangeRateUpdater() {
	defer m.wg.Done()

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.updateExchangeRates()
		}
	}
}

func (m *Manager) updateExchangeRates() {
	// In production, fetch from a currency API (e.g., Open Exchange Rates, Fixer.io)
	// For now, this is a placeholder that would be replaced with actual API calls
	m.logger.Debug("Updating exchange rates")

	// TODO: Implement actual exchange rate API call
	// Example:
	// resp, err := m.httpClient.Get("https://api.exchangerate.host/latest?base=USD")
	// if err != nil { ... }
}

// SetExchangeRates manually sets exchange rates (for testing or override)
func (m *Manager) SetExchangeRates(rates *ExchangeRates) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.exchangeRates = rates
}

// GetMarketStatus returns the operational status of all markets
func (m *Manager) GetMarketStatus() map[MarketID]string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	status := make(map[MarketID]string)
	for marketID := range m.adapters {
		// Check if we have recent prices
		hasRecentPrice := false
		for key, price := range m.latestPrices {
			if price.MarketID == marketID && time.Since(price.Timestamp) < m.config.PriceValidityWindow {
				hasRecentPrice = true
				status[marketID] = price.MarketStatus
				break
			}
			_ = key // Silence unused variable warning
		}
		if !hasRecentPrice {
			status[marketID] = "DISCONNECTED"
		}
	}
	return status
}

// Helper functions
func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func max[T int64 | float64 | time.Duration](a, b T) T {
	if a > b {
		return a
	}
	return b
}
