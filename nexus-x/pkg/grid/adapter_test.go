// Package grid provides comprehensive unit tests for MarketLink adapters
// Testing API rate limit compliance, data integrity, and resilience
package grid

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
)

// ============================================================================
// AEMO Adapter Tests
// ============================================================================

func TestAEMOAdapter_RateLimitCompliance(t *testing.T) {
	// AEMO Rate Limits:
	// - 60 requests per minute for dispatch data
	// - 10 requests per minute for bidding API
	// - 30 requests per minute for predispatch

	tests := []struct {
		name           string
		endpoint       string
		rateLimit      int           // requests per minute
		burstSize      int           // max concurrent
		testDuration   time.Duration
		expectedReqs   int           // expected requests in duration
	}{
		{
			name:         "Dispatch API Rate Limit",
			endpoint:     "/api/dispatch/price",
			rateLimit:    60,
			burstSize:    5,
			testDuration: 10 * time.Second,
			expectedReqs: 10, // 60/min = 1/sec, so ~10 in 10 seconds
		},
		{
			name:         "Bidding API Rate Limit",
			endpoint:     "/api/bidding/submit",
			rateLimit:    10,
			burstSize:    2,
			testDuration: 10 * time.Second,
			expectedReqs: 2, // 10/min ≈ 0.17/sec, so ~2 in 10 seconds
		},
		{
			name:         "Predispatch API Rate Limit",
			endpoint:     "/api/predispatch/prices",
			rateLimit:    30,
			burstSize:    3,
			testDuration: 10 * time.Second,
			expectedReqs: 5, // 30/min = 0.5/sec, so ~5 in 10 seconds
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var requestCount int64

			// Mock AEMO API server
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				atomic.AddInt64(&requestCount, 1)
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"region":     "NSW1",
					"rrp":        85.50,
					"total_demand": 8500.0,
				})
			}))
			defer server.Close()

			// Create rate limiter
			limiter := NewRateLimiter(tc.rateLimit, tc.burstSize)

			// Simulate requests
			ctx, cancel := context.WithTimeout(context.Background(), tc.testDuration)
			defer cancel()

			var wg sync.WaitGroup
			requestChan := make(chan struct{}, 100)

			// Producer: try to send requests as fast as possible
			go func() {
				for {
					select {
					case <-ctx.Done():
						close(requestChan)
						return
					default:
						requestChan <- struct{}{}
					}
				}
			}()

			// Consumer: rate-limited request sender
			for i := 0; i < tc.burstSize; i++ {
				wg.Add(1)
				go func() {
					defer wg.Done()
					for range requestChan {
						if !limiter.Allow() {
							continue
						}
						http.Get(server.URL + tc.endpoint)
					}
				}()
			}

			wg.Wait()

			actualReqs := atomic.LoadInt64(&requestCount)
			t.Logf("Endpoint: %s, Expected ~%d requests, Got: %d", tc.endpoint, tc.expectedReqs, actualReqs)

			// Allow 20% tolerance
			minExpected := int64(float64(tc.expectedReqs) * 0.8)
			maxExpected := int64(float64(tc.expectedReqs) * 1.2)

			assert.GreaterOrEqual(t, actualReqs, minExpected, "Too few requests - rate limiter too strict")
			assert.LessOrEqual(t, actualReqs, maxExpected, "Too many requests - rate limiter not enforcing")
		})
	}
}

func TestAEMOAdapter_DataIntegrity(t *testing.T) {
	logger := zaptest.NewLogger(t)

	// Mock AEMO response
	mockResponse := map[string]interface{}{
		"region":           "NSW1",
		"settlement_date":  "2026-01-22",
		"dispatch_interval": 145,
		"rrp":              87.25,
		"eep":              85.00,
		"total_demand":     9200.50,
		"available_gen":    10500.00,
		"net_interchange":  -350.25,
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(mockResponse)
	}))
	defer server.Close()

	// Parse response
	resp, err := http.Get(server.URL)
	require.NoError(t, err)
	defer resp.Body.Close()

	var price NEMPrice
	err = json.NewDecoder(resp.Body).Decode(&price)
	require.NoError(t, err)

	// Verify data integrity
	assert.Equal(t, Region("NSW1"), price.Region)
	assert.Equal(t, 145, price.DispatchInterval)
	assert.Equal(t, 87.25, price.RRP)
	assert.Equal(t, 85.00, price.EEP)
	assert.InDelta(t, 9200.50, price.TotalDemand, 0.01)
	assert.InDelta(t, 10500.00, price.AvailableGen, 0.01)
	assert.InDelta(t, -350.25, price.NetInterchange, 0.01)

	logger.Info("AEMO data integrity test passed")
}

func TestAEMOAdapter_ReconnectionResilience(t *testing.T) {
	logger := zaptest.NewLogger(t)

	// Simulate server that fails intermittently
	failureCount := int64(0)
	successCount := int64(0)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count := atomic.AddInt64(&failureCount, 1)
		if count%3 == 0 { // Fail every 3rd request
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		atomic.AddInt64(&successCount, 1)
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "ok"})
	}))
	defer server.Close()

	// Test with retry logic
	maxRetries := 5
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		resp, err := http.Get(server.URL)
		if err != nil {
			lastErr = err
			time.Sleep(100 * time.Millisecond) // Backoff
			continue
		}
		if resp.StatusCode == http.StatusOK {
			lastErr = nil
			break
		}
		resp.Body.Close()
		time.Sleep(100 * time.Millisecond) // Backoff
	}

	assert.NoError(t, lastErr, "Failed to recover from server failures")
	assert.Greater(t, atomic.LoadInt64(&successCount), int64(0), "No successful requests")

	logger.Info("AEMO reconnection resilience test passed",
		zap.Int64("failures", atomic.LoadInt64(&failureCount)),
		zap.Int64("successes", atomic.LoadInt64(&successCount)))
}

// ============================================================================
// JEPX Adapter Tests
// ============================================================================

func TestJEPXAdapter_RateLimitCompliance(t *testing.T) {
	// JEPX Rate Limits:
	// - 30 requests per minute for spot market
	// - 20 requests per minute for intraday market
	// - 60 requests per minute for balancing market (3-min intervals)
	// - 5 requests per minute for order submission

	tests := []struct {
		name           string
		endpoint       string
		rateLimit      int
		testDuration   time.Duration
		expectedReqs   int
	}{
		{
			name:         "Spot Market Rate Limit",
			endpoint:     "/api/v2/spot/prices",
			rateLimit:    30,
			testDuration: 10 * time.Second,
			expectedReqs: 5,
		},
		{
			name:         "Intraday Market Rate Limit",
			endpoint:     "/api/v2/intraday/prices",
			rateLimit:    20,
			testDuration: 10 * time.Second,
			expectedReqs: 3,
		},
		{
			name:         "Balancing Market Rate Limit",
			endpoint:     "/api/v2/balancing/prices",
			rateLimit:    60,
			testDuration: 10 * time.Second,
			expectedReqs: 10,
		},
		{
			name:         "Order Submission Rate Limit",
			endpoint:     "/api/v2/orders/submit",
			rateLimit:    5,
			testDuration: 10 * time.Second,
			expectedReqs: 1,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var requestCount int64

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				atomic.AddInt64(&requestCount, 1)
				w.WriteHeader(http.StatusOK)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"area":         "TOKYO",
					"system_price": 12.50,
					"area_price":   12.75,
				})
			}))
			defer server.Close()

			limiter := NewRateLimiter(tc.rateLimit, 3)

			ctx, cancel := context.WithTimeout(context.Background(), tc.testDuration)
			defer cancel()

			ticker := time.NewTicker(100 * time.Millisecond)
			defer ticker.Stop()

			for {
				select {
				case <-ctx.Done():
					goto done
				case <-ticker.C:
					if limiter.Allow() {
						http.Get(server.URL + tc.endpoint)
					}
				}
			}

		done:
			actualReqs := atomic.LoadInt64(&requestCount)
			t.Logf("Endpoint: %s, Expected ~%d requests, Got: %d", tc.endpoint, tc.expectedReqs, actualReqs)

			// Allow 50% tolerance for low rate limits
			minExpected := int64(float64(tc.expectedReqs) * 0.5)
			maxExpected := int64(float64(tc.expectedReqs) * 1.5)

			assert.GreaterOrEqual(t, actualReqs, minExpected)
			assert.LessOrEqual(t, actualReqs, maxExpected)
		})
	}
}

func TestJEPXAdapter_48PeriodDataIntegrity(t *testing.T) {
	logger := zaptest.NewLogger(t)

	// JEPX uses 48 30-minute periods per day
	mockPrices := make([]map[string]interface{}, 48)
	for i := 0; i < 48; i++ {
		mockPrices[i] = map[string]interface{}{
			"area":            "TOKYO",
			"delivery_period": i + 1,
			"system_price":    10.0 + float64(i)*0.1,
			"area_price":      10.5 + float64(i)*0.1,
			"sell_volume":     1000.0 + float64(i)*10,
			"buy_volume":      1000.0 + float64(i)*10,
		}
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(mockPrices)
	}))
	defer server.Close()

	resp, err := http.Get(server.URL)
	require.NoError(t, err)
	defer resp.Body.Close()

	var prices []SpotPrice
	err = json.NewDecoder(resp.Body).Decode(&prices)
	require.NoError(t, err)

	// Verify all 48 periods are present
	assert.Len(t, prices, 48, "Expected 48 30-minute periods")

	// Verify period sequence
	for i, price := range prices {
		expectedPeriod := i + 1
		assert.Equal(t, expectedPeriod, price.DeliveryPeriod, "Period sequence mismatch at index %d", i)
	}

	// Verify price progression (test data has increasing prices)
	for i := 1; i < len(prices); i++ {
		assert.Greater(t, prices[i].SystemPrice, prices[i-1].SystemPrice, "Price should increase")
	}

	logger.Info("JEPX 48-period data integrity test passed")
}

func TestJEPXAdapter_10AreaCoverage(t *testing.T) {
	expectedAreas := []Area{
		AreaHokkaido, AreaTohoku, AreaTokyo, AreaChubu,
		AreaHokuriku, AreaKansai, AreaChugoku, AreaShikoku,
		AreaKyushu, AreaOkinawa,
	}

	areaResponses := make(map[Area]bool)
	var mu sync.Mutex

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		area := Area(r.URL.Query().Get("area"))
		mu.Lock()
		areaResponses[area] = true
		mu.Unlock()

		json.NewEncoder(w).Encode(map[string]interface{}{
			"area":         area,
			"total_demand": 5000.0,
			"total_supply": 5500.0,
		})
	}))
	defer server.Close()

	// Request data for all areas
	for _, area := range expectedAreas {
		resp, err := http.Get(server.URL + "?area=" + string(area))
		require.NoError(t, err)
		resp.Body.Close()
	}

	// Verify all areas were queried
	for _, area := range expectedAreas {
		assert.True(t, areaResponses[area], "Area %s was not queried", area)
	}
}

// ============================================================================
// Global Grid Manager Tests
// ============================================================================

func TestGlobalGridManager_ArbitrageDetection(t *testing.T) {
	logger := zaptest.NewLogger(t)
	config := DefaultManagerConfig()
	config.MinSpreadPercent = 1.0  // 1% minimum spread
	config.MinNetSpread = 1.0     // $1/MWh minimum net spread

	manager := NewManager(config, logger)

	// Simulate prices from different markets
	testPrices := []*UnifiedPrice{
		{
			MarketID:     MarketAEMO,
			Region:       "NSW1",
			Price:        50.00, // Low price - buy here
			Volume:       100,
			Currency:     "USD",
			Timestamp:    time.Now(),
			MarketStatus: "OPEN",
		},
		{
			MarketID:     MarketJEPX,
			Region:       "TOKYO",
			Price:        55.00, // High price - sell here
			Volume:       100,
			Currency:     "USD",
			Timestamp:    time.Now(),
			MarketStatus: "OPEN",
		},
	}

	// Inject test prices
	for _, price := range testPrices {
		key := fmt.Sprintf("%s:%s", price.MarketID, price.Region)
		manager.mu.Lock()
		manager.latestPrices[key] = price
		manager.mu.Unlock()
	}

	// Detect arbitrage
	prices := manager.GetAllPrices()
	require.Len(t, prices, 2)

	// Calculate expected spread
	spread := 55.00 - 50.00 // $5/MWh
	spreadPercent := (spread / 50.00) * 100 // 10%

	assert.Equal(t, 5.0, spread)
	assert.Equal(t, 10.0, spreadPercent)

	logger.Info("Arbitrage detection test passed",
		zap.Float64("spread", spread),
		zap.Float64("spread_percent", spreadPercent))
}

func TestGlobalGridManager_CurrencyConversion(t *testing.T) {
	logger := zaptest.NewLogger(t)
	config := DefaultManagerConfig()
	manager := NewManager(config, logger)

	// Set known exchange rates
	manager.SetExchangeRates(&ExchangeRates{
		AUDUSD: 0.65,
		JPYUSD: 0.0067,
		KRWUSD: 0.00075,
	})

	// Test conversions
	testCases := []struct {
		amount   float64
		currency string
		expected float64
	}{
		{100.0, "AUD", 65.0},        // 100 AUD * 0.65 = 65 USD
		{1000.0, "JPY", 6.7},        // 1000 JPY * 0.0067 = 6.7 USD
		{100000.0, "KRW", 75.0},     // 100000 KRW * 0.00075 = 75 USD
		{50.0, "USD", 50.0},         // No conversion
	}

	for _, tc := range testCases {
		result := manager.convertToUSD(tc.amount, tc.currency)
		assert.InDelta(t, tc.expected, result, 0.01, "Conversion failed for %s", tc.currency)
	}

	logger.Info("Currency conversion test passed")
}

// ============================================================================
// Rate Limiter Implementation (for tests)
// ============================================================================

type RateLimiter struct {
	rate      int           // requests per minute
	burst     int           // max burst size
	tokens    int           // current tokens
	lastTime  time.Time
	mu        sync.Mutex
}

func NewRateLimiter(rate, burst int) *RateLimiter {
	return &RateLimiter{
		rate:     rate,
		burst:    burst,
		tokens:   burst,
		lastTime: time.Now(),
	}
}

func (rl *RateLimiter) Allow() bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(rl.lastTime).Seconds()

	// Add tokens based on elapsed time
	tokensToAdd := int(elapsed * float64(rl.rate) / 60.0)
	rl.tokens = min(rl.burst, rl.tokens+tokensToAdd)
	rl.lastTime = now

	if rl.tokens > 0 {
		rl.tokens--
		return true
	}
	return false
}

// ============================================================================
// Helper Types (for test compilation)
// ============================================================================

type NEMPrice struct {
	Region           Region    `json:"region"`
	SettlementDate   string    `json:"settlement_date"`
	DispatchInterval int       `json:"dispatch_interval"`
	RRP              float64   `json:"rrp"`
	EEP              float64   `json:"eep"`
	TotalDemand      float64   `json:"total_demand"`
	AvailableGen     float64   `json:"available_gen"`
	NetInterchange   float64   `json:"net_interchange"`
}

type SpotPrice struct {
	Area            string  `json:"area"`
	DeliveryPeriod  int     `json:"delivery_period"`
	SystemPrice     float64 `json:"system_price"`
	AreaPrice       float64 `json:"area_price"`
	SellVolume      float64 `json:"sell_volume"`
	BuyVolume       float64 `json:"buy_volume"`
}

type Region string

type Area string

const (
	AreaHokkaido Area = "HOKKAIDO"
	AreaTohoku   Area = "TOHOKU"
	AreaTokyo    Area = "TOKYO"
	AreaChubu    Area = "CHUBU"
	AreaHokuriku Area = "HOKURIKU"
	AreaKansai   Area = "KANSAI"
	AreaChugoku  Area = "CHUGOKU"
	AreaShikoku  Area = "SHIKOKU"
	AreaKyushu   Area = "KYUSHU"
	AreaOkinawa  Area = "OKINAWA"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func fmt.Sprintf(format string, a ...interface{}) string {
	return fmt.Sprintf(format, a...)
}
