// Package jepx provides the Japan Electric Power Exchange (JEPX) adapter
// for NEXUS-X global energy trading platform.
//
// JEPX operates:
// - Spot Market (스팟시장): Day-Ahead market
// - Intraday Market (시간내시장): Same-day adjustments
// - Forward Market (선도시장): Weekly/Monthly contracts
// - Balancing Market (수급조정시장): Real-time balancing
//
// Architecture:
// ┌─────────────────────────────────────────────────────────────────┐
// │                     JEPX Market Adapter                         │
// ├─────────────────────────────────────────────────────────────────┤
// │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
// │  │ Spot Market │  │ Intraday    │  │ Balancing Market        │ │
// │  │ (Day-Ahead) │  │ Market      │  │ (Real-time 3分)          │ │
// │  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
// │         │                │                      │              │
// │         └────────────────┼──────────────────────┘              │
// │                          ▼                                     │
// │    ┌───────────────────────────────────────────────────────┐   │
// │    │ Japan 10 Areas: Hokkaido, Tohoku, Tokyo, Chubu,       │   │
// │    │ Hokuriku, Kansai, Chugoku, Shikoku, Kyushu, Okinawa   │   │
// │    └───────────────────────────────────────────────────────┘   │
// └─────────────────────────────────────────────────────────────────┘
package jepx

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

// Area represents JEPX electricity areas (10 areas covering Japan)
type Area string

const (
	AreaHokkaido Area = "HOKKAIDO" // 北海道
	AreaTohoku   Area = "TOHOKU"   // 東北
	AreaTokyo    Area = "TOKYO"    // 東京
	AreaChubu    Area = "CHUBU"    // 中部
	AreaHokuriku Area = "HOKURIKU" // 北陸
	AreaKansai   Area = "KANSAI"   // 関西
	AreaChugoku  Area = "CHUGOKU"  // 中国
	AreaShikoku  Area = "SHIKOKU"  // 四国
	AreaKyushu   Area = "KYUSHU"   // 九州
	AreaOkinawa  Area = "OKINAWA"  // 沖縄
)

// MarketType represents different JEPX markets
type MarketType string

const (
	MarketSpot      MarketType = "SPOT"      // スポット市場 (Day-Ahead)
	MarketIntraday  MarketType = "INTRADAY"  // 時間前市場
	MarketForward   MarketType = "FORWARD"   // 先渡市場
	MarketBalancing MarketType = "BALANCING" // 需給調整市場
)

// ProductType represents trading product types
type ProductType string

const (
	ProductDaytime   ProductType = "DAYTIME"    // 昼間 (08:00-22:00)
	ProductNighttime ProductType = "NIGHTTIME"  // 夜間 (22:00-08:00)
	Product24H       ProductType = "24H"        // 24時間
	ProductPeakload  ProductType = "PEAKLOAD"   // ピーク (13:00-16:00)
	ProductBaseload  ProductType = "BASELOAD"   // ベース
)

// SpotPrice represents JEPX spot market price
type SpotPrice struct {
	Area            Area      `json:"area"`
	TradingDate     time.Time `json:"trading_date"`     // 取引日
	DeliveryDate    time.Time `json:"delivery_date"`    // 受渡日
	DeliveryPeriod  int       `json:"delivery_period"`  // 時間帯 (1-48, 30分コマ)
	SystemPrice     float64   `json:"system_price"`     // システムプライス (円/kWh)
	AreaPrice       float64   `json:"area_price"`       // エリアプライス (円/kWh)
	SellVolume      float64   `json:"sell_volume"`      // 売り約定量 (MWh)
	BuyVolume       float64   `json:"buy_volume"`       // 買い約定量 (MWh)
	TotalVolume     float64   `json:"total_volume"`     // 約定総量 (MWh)
	BlockTradeVol   float64   `json:"block_trade_vol"`  // ブロック取引量
	Timestamp       time.Time `json:"timestamp"`
}

// IntradayPrice represents JEPX intraday market price
type IntradayPrice struct {
	Area            Area      `json:"area"`
	TradingDate     time.Time `json:"trading_date"`
	GateClosureTime time.Time `json:"gate_closure_time"` // ゲートクローズ時刻
	DeliveryPeriod  int       `json:"delivery_period"`   // 時間帯 (1-48)
	Price           float64   `json:"price"`             // 約定価格 (円/kWh)
	Volume          float64   `json:"volume"`            // 約定量 (MWh)
	BidAsk          float64   `json:"bid_ask_spread"`    // スプレッド
	Timestamp       time.Time `json:"timestamp"`
}

// BalancingPrice represents real-time balancing market price
type BalancingPrice struct {
	Area             Area      `json:"area"`
	BalancingPeriod  time.Time `json:"balancing_period"` // 3分コマ
	ImbalancePrice   float64   `json:"imbalance_price"`  // インバランス価格 (円/kWh)
	ImbalanceVolume  float64   `json:"imbalance_volume"` // インバランス量 (MWh)
	SystemFrequency  float64   `json:"system_frequency"` // 系統周波数 (Hz)
	ACEValue         float64   `json:"ace_value"`        // Area Control Error
	RegulationUp     float64   `json:"regulation_up"`    // 上げ調整力 (MW)
	RegulationDown   float64   `json:"regulation_down"`  // 下げ調整力 (MW)
	Timestamp        time.Time `json:"timestamp"`
}

// ForwardContract represents forward market contract
type ForwardContract struct {
	ContractID     string      `json:"contract_id"`
	Area           Area        `json:"area"`
	ProductType    ProductType `json:"product_type"`
	DeliveryStart  time.Time   `json:"delivery_start"`
	DeliveryEnd    time.Time   `json:"delivery_end"`
	Price          float64     `json:"price"`         // 約定価格 (円/kWh)
	ContractVolume float64     `json:"contract_volume"` // 契約電力量 (MWh)
	OpenInterest   float64     `json:"open_interest"`   // 建玉 (MW)
	Timestamp      time.Time   `json:"timestamp"`
}

// Order represents a trading order
type Order struct {
	OrderID        string      `json:"order_id"`
	Area           Area        `json:"area"`
	MarketType     MarketType  `json:"market_type"`
	ProductType    ProductType `json:"product_type"`
	DeliveryPeriod int         `json:"delivery_period"` // 1-48
	Side           string      `json:"side"`            // BUY or SELL
	Price          float64     `json:"price"`           // 円/kWh
	Quantity       float64     `json:"quantity"`        // MWh
	MinFillQty     float64     `json:"min_fill_qty"`    // 最小約定数量
	OrderType      string      `json:"order_type"`      // LIMIT, MARKET
	ValidUntil     time.Time   `json:"valid_until"`
	Status         string      `json:"status"`
	FilledQty      float64     `json:"filled_qty"`
	AvgFillPrice   float64     `json:"avg_fill_price"`
	CreatedAt      time.Time   `json:"created_at"`
}

// AreaDemand represents area demand/supply data
type AreaDemand struct {
	Area            Area      `json:"area"`
	TotalDemand     float64   `json:"total_demand"`      // 総需要 (MW)
	TotalSupply     float64   `json:"total_supply"`      // 総供給 (MW)
	NuclearGen      float64   `json:"nuclear_gen"`       // 原子力
	ThermalGen      float64   `json:"thermal_gen"`       // 火力
	HydroGen        float64   `json:"hydro_gen"`         // 水力
	SolarGen        float64   `json:"solar_gen"`         // 太陽光
	WindGen         float64   `json:"wind_gen"`          // 風力
	InterRegionFlow float64   `json:"inter_region_flow"` // 地域間連系線潮流
	Reserve         float64   `json:"reserve"`           // 予備力 (MW)
	Timestamp       time.Time `json:"timestamp"`
}

// Config holds JEPX adapter configuration
type Config struct {
	APIEndpoint       string        `json:"api_endpoint"`
	WebSocketEndpoint string        `json:"websocket_endpoint"`
	APIKey            string        `json:"api_key"`
	APISecret         string        `json:"api_secret"`
	ParticipantID     string        `json:"participant_id"` // JEPX会員ID
	Areas             []Area        `json:"areas"`
	PollInterval      time.Duration `json:"poll_interval"`
	ReconnectDelay    time.Duration `json:"reconnect_delay"`
	MaxRetries        int           `json:"max_retries"`
	EnableBalancing   bool          `json:"enable_balancing"`
	EnableForward     bool          `json:"enable_forward"`
}

// DefaultConfig returns default configuration for JEPX
func DefaultConfig() *Config {
	return &Config{
		APIEndpoint:       "https://jepx.org/api/v2",
		WebSocketEndpoint: "wss://jepx.org/ws/market",
		Areas: []Area{
			AreaHokkaido, AreaTohoku, AreaTokyo, AreaChubu,
			AreaHokuriku, AreaKansai, AreaChugoku, AreaShikoku,
			AreaKyushu, AreaOkinawa,
		},
		PollInterval:    30 * time.Second,
		ReconnectDelay:  5 * time.Second,
		MaxRetries:      3,
		EnableBalancing: true,
		EnableForward:   true,
	}
}

// Adapter implements the JEPX market adapter
type Adapter struct {
	config     *Config
	logger     *zap.Logger
	httpClient *http.Client
	wsConn     *websocket.Conn

	// Channels for price streams
	spotPrices      chan *SpotPrice
	intradayPrices  chan *IntradayPrice
	balancingPrices chan *BalancingPrice
	forwardPrices   chan *ForwardContract
	demandData      chan *AreaDemand

	// Internal state
	mu               sync.RWMutex
	latestSpot       map[Area]map[int]*SpotPrice // Area -> Period -> Price
	latestIntraday   map[Area]map[int]*IntradayPrice
	latestBalancing  map[Area]*BalancingPrice
	latestDemand     map[Area]*AreaDemand
	activeOrders     map[string]*Order

	// Control
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

// NewAdapter creates a new JEPX adapter
func NewAdapter(config *Config, logger *zap.Logger) *Adapter {
	if config == nil {
		config = DefaultConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Adapter{
		config: config,
		logger: logger.Named("jepx-adapter"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		spotPrices:      make(chan *SpotPrice, 500),
		intradayPrices:  make(chan *IntradayPrice, 200),
		balancingPrices: make(chan *BalancingPrice, 200),
		forwardPrices:   make(chan *ForwardContract, 50),
		demandData:      make(chan *AreaDemand, 100),
		latestSpot:      make(map[Area]map[int]*SpotPrice),
		latestIntraday:  make(map[Area]map[int]*IntradayPrice),
		latestBalancing: make(map[Area]*BalancingPrice),
		latestDemand:    make(map[Area]*AreaDemand),
		activeOrders:    make(map[string]*Order),
		ctx:             ctx,
		cancel:          cancel,
	}
}

// Start begins the JEPX adapter
func (a *Adapter) Start() error {
	a.logger.Info("Starting JEPX adapter",
		zap.Strings("areas", areaStrings(a.config.Areas)),
		zap.Bool("balancing_enabled", a.config.EnableBalancing),
		zap.Bool("forward_enabled", a.config.EnableForward))

	// Start WebSocket connection
	a.wg.Add(1)
	go a.runWebSocket()

	// Start spot market poller
	a.wg.Add(1)
	go a.runSpotMarketPoller()

	// Start intraday market poller
	a.wg.Add(1)
	go a.runIntradayMarketPoller()

	// Start balancing market poller if enabled
	if a.config.EnableBalancing {
		a.wg.Add(1)
		go a.runBalancingMarketPoller()
	}

	// Start demand data fetcher
	a.wg.Add(1)
	go a.runDemandDataFetcher()

	return nil
}

// Stop gracefully stops the adapter
func (a *Adapter) Stop() error {
	a.logger.Info("Stopping JEPX adapter")
	a.cancel()

	// Close WebSocket
	if a.wsConn != nil {
		a.wsConn.Close()
	}

	a.wg.Wait()
	close(a.spotPrices)
	close(a.intradayPrices)
	close(a.balancingPrices)
	close(a.forwardPrices)
	close(a.demandData)

	a.logger.Info("JEPX adapter stopped")
	return nil
}

// SpotPrices returns the spot price channel
func (a *Adapter) SpotPrices() <-chan *SpotPrice {
	return a.spotPrices
}

// IntradayPrices returns the intraday price channel
func (a *Adapter) IntradayPrices() <-chan *IntradayPrice {
	return a.intradayPrices
}

// BalancingPrices returns the balancing price channel
func (a *Adapter) BalancingPrices() <-chan *BalancingPrice {
	return a.balancingPrices
}

// ForwardContracts returns the forward contract channel
func (a *Adapter) ForwardContracts() <-chan *ForwardContract {
	return a.forwardPrices
}

// DemandData returns the demand data channel
func (a *Adapter) DemandData() <-chan *AreaDemand {
	return a.demandData
}

// GetLatestSpotPrice returns the latest spot price
func (a *Adapter) GetLatestSpotPrice(area Area, period int) (*SpotPrice, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	areaPrices, ok := a.latestSpot[area]
	if !ok {
		return nil, fmt.Errorf("no spot data for area %s", area)
	}

	price, ok := areaPrices[period]
	if !ok {
		return nil, fmt.Errorf("no spot price for period %d in area %s", period, area)
	}

	return price, nil
}

// GetLatestBalancingPrice returns the latest balancing price
func (a *Adapter) GetLatestBalancingPrice(area Area) (*BalancingPrice, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	price, ok := a.latestBalancing[area]
	if !ok {
		return nil, fmt.Errorf("no balancing data for area %s", area)
	}
	return price, nil
}

// GetAreaDemand returns the latest demand data for an area
func (a *Adapter) GetAreaDemand(area Area) (*AreaDemand, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	demand, ok := a.latestDemand[area]
	if !ok {
		return nil, fmt.Errorf("no demand data for area %s", area)
	}
	return demand, nil
}

// SubmitOrder submits a new order
func (a *Adapter) SubmitOrder(order *Order) error {
	a.logger.Info("Submitting order to JEPX",
		zap.String("area", string(order.Area)),
		zap.String("side", order.Side),
		zap.Float64("price", order.Price),
		zap.Float64("quantity", order.Quantity))

	// Validate order
	if err := a.validateOrder(order); err != nil {
		return fmt.Errorf("order validation failed: %w", err)
	}

	// Prepare request
	payload, err := json.Marshal(order)
	if err != nil {
		return fmt.Errorf("failed to marshal order: %w", err)
	}

	req, err := http.NewRequestWithContext(a.ctx, "POST",
		fmt.Sprintf("%s/orders/submit", a.config.APIEndpoint),
		nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// JEPX uses different auth headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", a.config.APIKey)
	req.Header.Set("X-API-Secret", a.config.APISecret)
	req.Header.Set("X-Participant-ID", a.config.ParticipantID)
	req.Header.Set("X-Order-Payload", string(payload))

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("order submission failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("order rejected: %s", string(body))
	}

	// Parse response to get order ID
	var result struct {
		OrderID string `json:"order_id"`
		Status  string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("failed to parse order response: %w", err)
	}

	order.OrderID = result.OrderID
	order.Status = result.Status
	order.CreatedAt = time.Now()

	// Track active order
	a.mu.Lock()
	a.activeOrders[order.OrderID] = order
	a.mu.Unlock()

	a.logger.Info("Order submitted successfully",
		zap.String("order_id", order.OrderID),
		zap.String("status", order.Status))

	return nil
}

// CancelOrder cancels an active order
func (a *Adapter) CancelOrder(orderID string) error {
	a.logger.Info("Cancelling order", zap.String("order_id", orderID))

	req, err := http.NewRequestWithContext(a.ctx, "DELETE",
		fmt.Sprintf("%s/orders/%s", a.config.APIEndpoint, orderID),
		nil)
	if err != nil {
		return fmt.Errorf("failed to create cancel request: %w", err)
	}

	req.Header.Set("X-API-Key", a.config.APIKey)
	req.Header.Set("X-API-Secret", a.config.APISecret)
	req.Header.Set("X-Participant-ID", a.config.ParticipantID)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("cancel request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("cancel rejected: %s", string(body))
	}

	a.mu.Lock()
	delete(a.activeOrders, orderID)
	a.mu.Unlock()

	a.logger.Info("Order cancelled", zap.String("order_id", orderID))
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
	header.Set("X-API-Key", a.config.APIKey)
	header.Set("X-Participant-ID", a.config.ParticipantID)

	conn, _, err := websocket.DefaultDialer.DialContext(a.ctx, a.config.WebSocketEndpoint, header)
	if err != nil {
		return fmt.Errorf("websocket dial failed: %w", err)
	}

	a.wsConn = conn
	a.logger.Info("WebSocket connected to JEPX")

	// Subscribe to market data
	subscribeMsg := map[string]interface{}{
		"action":   "subscribe",
		"areas":    a.config.Areas,
		"markets":  []string{"spot", "intraday"},
		"channels": []string{"prices", "orders", "fills"},
	}
	if a.config.EnableBalancing {
		subscribeMsg["markets"] = append(subscribeMsg["markets"].([]string), "balancing")
	}
	if a.config.EnableForward {
		subscribeMsg["markets"] = append(subscribeMsg["markets"].([]string), "forward")
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
		Type   string `json:"type"`
		Market string `json:"market"`
	}

	if err := json.Unmarshal(message, &baseMsg); err != nil {
		a.logger.Warn("Failed to parse message type", zap.Error(err))
		return
	}

	switch baseMsg.Market {
	case "spot":
		var price SpotPrice
		if err := json.Unmarshal(message, &price); err != nil {
			a.logger.Warn("Failed to parse spot price", zap.Error(err))
			return
		}
		price.Timestamp = time.Now()
		a.updateLatestSpot(&price)
		select {
		case a.spotPrices <- &price:
		default:
			a.logger.Warn("Spot price channel full")
		}

	case "intraday":
		var price IntradayPrice
		if err := json.Unmarshal(message, &price); err != nil {
			a.logger.Warn("Failed to parse intraday price", zap.Error(err))
			return
		}
		price.Timestamp = time.Now()
		a.updateLatestIntraday(&price)
		select {
		case a.intradayPrices <- &price:
		default:
			a.logger.Warn("Intraday price channel full")
		}

	case "balancing":
		var price BalancingPrice
		if err := json.Unmarshal(message, &price); err != nil {
			a.logger.Warn("Failed to parse balancing price", zap.Error(err))
			return
		}
		price.Timestamp = time.Now()
		a.updateLatestBalancing(&price)
		select {
		case a.balancingPrices <- &price:
		default:
			a.logger.Warn("Balancing price channel full")
		}

	case "forward":
		var contract ForwardContract
		if err := json.Unmarshal(message, &contract); err != nil {
			a.logger.Warn("Failed to parse forward contract", zap.Error(err))
			return
		}
		contract.Timestamp = time.Now()
		select {
		case a.forwardPrices <- &contract:
		default:
			a.logger.Warn("Forward price channel full")
		}

	case "order_update":
		a.processOrderUpdate(message)

	case "fill":
		a.processFillNotification(message)
	}
}

func (a *Adapter) processOrderUpdate(message []byte) {
	var update struct {
		OrderID string `json:"order_id"`
		Status  string `json:"status"`
	}

	if err := json.Unmarshal(message, &update); err != nil {
		a.logger.Warn("Failed to parse order update", zap.Error(err))
		return
	}

	a.mu.Lock()
	if order, ok := a.activeOrders[update.OrderID]; ok {
		order.Status = update.Status
		if update.Status == "FILLED" || update.Status == "CANCELLED" {
			delete(a.activeOrders, update.OrderID)
		}
	}
	a.mu.Unlock()

	a.logger.Info("Order status updated",
		zap.String("order_id", update.OrderID),
		zap.String("status", update.Status))
}

func (a *Adapter) processFillNotification(message []byte) {
	var fill struct {
		OrderID    string  `json:"order_id"`
		FillPrice  float64 `json:"fill_price"`
		FillQty    float64 `json:"fill_qty"`
		TotalFilled float64 `json:"total_filled"`
	}

	if err := json.Unmarshal(message, &fill); err != nil {
		a.logger.Warn("Failed to parse fill notification", zap.Error(err))
		return
	}

	a.mu.Lock()
	if order, ok := a.activeOrders[fill.OrderID]; ok {
		order.FilledQty = fill.TotalFilled
		order.AvgFillPrice = fill.FillPrice // Simplified, should be weighted average
	}
	a.mu.Unlock()

	a.logger.Info("Order filled",
		zap.String("order_id", fill.OrderID),
		zap.Float64("fill_price", fill.FillPrice),
		zap.Float64("fill_qty", fill.FillQty))
}

func (a *Adapter) updateLatestSpot(price *SpotPrice) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if _, ok := a.latestSpot[price.Area]; !ok {
		a.latestSpot[price.Area] = make(map[int]*SpotPrice)
	}
	a.latestSpot[price.Area][price.DeliveryPeriod] = price
}

func (a *Adapter) updateLatestIntraday(price *IntradayPrice) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if _, ok := a.latestIntraday[price.Area]; !ok {
		a.latestIntraday[price.Area] = make(map[int]*IntradayPrice)
	}
	a.latestIntraday[price.Area][price.DeliveryPeriod] = price
}

func (a *Adapter) updateLatestBalancing(price *BalancingPrice) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.latestBalancing[price.Area] = price
}

// runSpotMarketPoller polls spot market data
func (a *Adapter) runSpotMarketPoller() {
	defer a.wg.Done()

	ticker := time.NewTicker(a.config.PollInterval)
	defer ticker.Stop()

	// Initial fetch
	a.fetchSpotPrices()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchSpotPrices()
		}
	}
}

func (a *Adapter) fetchSpotPrices() {
	for _, area := range a.config.Areas {
		url := fmt.Sprintf("%s/spot/prices?area=%s&date=%s",
			a.config.APIEndpoint, area, time.Now().Format("2006-01-02"))

		req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
		if err != nil {
			a.logger.Warn("Failed to create spot request", zap.Error(err))
			continue
		}
		req.Header.Set("X-API-Key", a.config.APIKey)

		resp, err := a.httpClient.Do(req)
		if err != nil {
			a.logger.Warn("Spot fetch failed", zap.String("area", string(area)), zap.Error(err))
			continue
		}

		var prices []SpotPrice
		if err := json.NewDecoder(resp.Body).Decode(&prices); err != nil {
			resp.Body.Close()
			a.logger.Warn("Failed to decode spot response", zap.Error(err))
			continue
		}
		resp.Body.Close()

		for _, price := range prices {
			price.Timestamp = time.Now()
			a.updateLatestSpot(&price)
		}
	}
}

// runIntradayMarketPoller polls intraday market data
func (a *Adapter) runIntradayMarketPoller() {
	defer a.wg.Done()

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchIntradayPrices()
		}
	}
}

func (a *Adapter) fetchIntradayPrices() {
	for _, area := range a.config.Areas {
		url := fmt.Sprintf("%s/intraday/prices?area=%s", a.config.APIEndpoint, area)

		req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
		if err != nil {
			a.logger.Warn("Failed to create intraday request", zap.Error(err))
			continue
		}
		req.Header.Set("X-API-Key", a.config.APIKey)

		resp, err := a.httpClient.Do(req)
		if err != nil {
			a.logger.Warn("Intraday fetch failed", zap.String("area", string(area)), zap.Error(err))
			continue
		}

		var prices []IntradayPrice
		if err := json.NewDecoder(resp.Body).Decode(&prices); err != nil {
			resp.Body.Close()
			a.logger.Warn("Failed to decode intraday response", zap.Error(err))
			continue
		}
		resp.Body.Close()

		for _, price := range prices {
			price.Timestamp = time.Now()
			a.updateLatestIntraday(&price)
		}
	}
}

// runBalancingMarketPoller polls balancing market data (3-minute intervals)
func (a *Adapter) runBalancingMarketPoller() {
	defer a.wg.Done()

	ticker := time.NewTicker(3 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchBalancingPrices()
		}
	}
}

func (a *Adapter) fetchBalancingPrices() {
	for _, area := range a.config.Areas {
		url := fmt.Sprintf("%s/balancing/prices?area=%s", a.config.APIEndpoint, area)

		req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
		if err != nil {
			a.logger.Warn("Failed to create balancing request", zap.Error(err))
			continue
		}
		req.Header.Set("X-API-Key", a.config.APIKey)

		resp, err := a.httpClient.Do(req)
		if err != nil {
			a.logger.Warn("Balancing fetch failed", zap.String("area", string(area)), zap.Error(err))
			continue
		}

		var price BalancingPrice
		if err := json.NewDecoder(resp.Body).Decode(&price); err != nil {
			resp.Body.Close()
			a.logger.Warn("Failed to decode balancing response", zap.Error(err))
			continue
		}
		resp.Body.Close()

		price.Timestamp = time.Now()
		a.updateLatestBalancing(&price)

		select {
		case a.balancingPrices <- &price:
		default:
		}
	}
}

// runDemandDataFetcher fetches area demand/supply data
func (a *Adapter) runDemandDataFetcher() {
	defer a.wg.Done()

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	// Initial fetch
	a.fetchDemandData()

	for {
		select {
		case <-a.ctx.Done():
			return
		case <-ticker.C:
			a.fetchDemandData()
		}
	}
}

func (a *Adapter) fetchDemandData() {
	for _, area := range a.config.Areas {
		url := fmt.Sprintf("%s/demand?area=%s", a.config.APIEndpoint, area)

		req, err := http.NewRequestWithContext(a.ctx, "GET", url, nil)
		if err != nil {
			a.logger.Warn("Failed to create demand request", zap.Error(err))
			continue
		}
		req.Header.Set("X-API-Key", a.config.APIKey)

		resp, err := a.httpClient.Do(req)
		if err != nil {
			a.logger.Warn("Demand fetch failed", zap.String("area", string(area)), zap.Error(err))
			continue
		}

		var demand AreaDemand
		if err := json.NewDecoder(resp.Body).Decode(&demand); err != nil {
			resp.Body.Close()
			a.logger.Warn("Failed to decode demand response", zap.Error(err))
			continue
		}
		resp.Body.Close()

		demand.Timestamp = time.Now()
		a.mu.Lock()
		a.latestDemand[area] = &demand
		a.mu.Unlock()

		select {
		case a.demandData <- &demand:
		default:
		}
	}
}

// validateOrder validates an order before submission
func (a *Adapter) validateOrder(order *Order) error {
	if order.Area == "" {
		return fmt.Errorf("area is required")
	}
	if order.Side != "BUY" && order.Side != "SELL" {
		return fmt.Errorf("side must be BUY or SELL")
	}
	if order.Quantity <= 0 {
		return fmt.Errorf("quantity must be positive")
	}
	if order.DeliveryPeriod < 1 || order.DeliveryPeriod > 48 {
		return fmt.Errorf("delivery period must be between 1 and 48")
	}
	if order.OrderType == "LIMIT" && order.Price <= 0 {
		return fmt.Errorf("limit order requires positive price")
	}
	return nil
}

// GetActiveOrders returns all active orders
func (a *Adapter) GetActiveOrders() []*Order {
	a.mu.RLock()
	defer a.mu.RUnlock()

	orders := make([]*Order, 0, len(a.activeOrders))
	for _, order := range a.activeOrders {
		orders = append(orders, order)
	}
	return orders
}

// Helper functions
func areaStrings(areas []Area) []string {
	strs := make([]string, len(areas))
	for i, a := range areas {
		strs[i] = string(a)
	}
	return strs
}
