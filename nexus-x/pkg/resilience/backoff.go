// Package resilience provides production-grade retry and circuit breaker patterns
// for all NEXUS-X market adapters.
//
// Backoff Strategy:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │              Exponential Backoff with Jitter Strategy                       │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │  Retry   │ Base Delay │ With Jitter (example)  │ Cumulative Wait           │
// │  ────────┼────────────┼────────────────────────┼─────────────────────────  │
// │  1       │ 1s         │ 0.8s - 1.2s            │ ~1s                       │
// │  2       │ 2s         │ 1.6s - 2.4s            │ ~3s                       │
// │  3       │ 4s         │ 3.2s - 4.8s            │ ~7s                       │
// │  4       │ 8s         │ 6.4s - 9.6s            │ ~15s                      │
// │  5       │ 16s        │ 12.8s - 19.2s          │ ~31s                      │
// │  6       │ 32s        │ 25.6s - 38.4s          │ ~63s                      │
// │  7       │ 60s (max)  │ 48s - 72s              │ ~2min                     │
// │                                                                             │
// │  Formula: delay = min(maxDelay, baseDelay * 2^attempt) * (1 ± jitter)      │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package resilience

import (
	"context"
	"errors"
	"math"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"
)

var (
	ErrMaxRetriesExceeded = errors.New("maximum retries exceeded")
	ErrCircuitOpen        = errors.New("circuit breaker is open")
	ErrOperationCancelled = errors.New("operation cancelled")
)

// BackoffConfig configures the exponential backoff strategy
type BackoffConfig struct {
	InitialDelay  time.Duration // Starting delay
	MaxDelay      time.Duration // Maximum delay cap
	Multiplier    float64       // Delay multiplier (typically 2.0)
	JitterFactor  float64       // Random jitter (0.0 - 1.0)
	MaxRetries    int           // Maximum retry attempts (0 = infinite)
	RetryableFunc func(error) bool // Function to determine if error is retryable
}

// DefaultBackoffConfig returns production-ready defaults
func DefaultBackoffConfig() *BackoffConfig {
	return &BackoffConfig{
		InitialDelay: 1 * time.Second,
		MaxDelay:     60 * time.Second,
		Multiplier:   2.0,
		JitterFactor: 0.2, // ±20% jitter
		MaxRetries:   10,
		RetryableFunc: func(err error) bool {
			return true // Retry all errors by default
		},
	}
}

// Backoff implements exponential backoff with jitter
type Backoff struct {
	config   *BackoffConfig
	logger   *zap.Logger
	attempt  int32
	rng      *rand.Rand
	mu       sync.Mutex
}

// NewBackoff creates a new backoff instance
func NewBackoff(config *BackoffConfig, logger *zap.Logger) *Backoff {
	if config == nil {
		config = DefaultBackoffConfig()
	}

	return &Backoff{
		config: config,
		logger: logger.Named("backoff"),
		rng:    rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Next returns the next backoff delay
func (b *Backoff) Next() time.Duration {
	attempt := atomic.AddInt32(&b.attempt, 1) - 1

	// Calculate exponential delay
	delay := float64(b.config.InitialDelay) * math.Pow(b.config.Multiplier, float64(attempt))

	// Cap at max delay
	if delay > float64(b.config.MaxDelay) {
		delay = float64(b.config.MaxDelay)
	}

	// Add jitter
	b.mu.Lock()
	jitter := 1.0 + (b.rng.Float64()*2-1)*b.config.JitterFactor
	b.mu.Unlock()
	delay *= jitter

	return time.Duration(delay)
}

// Reset resets the backoff counter
func (b *Backoff) Reset() {
	atomic.StoreInt32(&b.attempt, 0)
}

// Attempts returns the current attempt count
func (b *Backoff) Attempts() int {
	return int(atomic.LoadInt32(&b.attempt))
}

// RetryableOperation is a function that can be retried
type RetryableOperation func(ctx context.Context) error

// Retry executes an operation with exponential backoff
func (b *Backoff) Retry(ctx context.Context, operation RetryableOperation) error {
	b.Reset()

	for {
		// Check context before attempting
		if ctx.Err() != nil {
			return ErrOperationCancelled
		}

		// Execute operation
		err := operation(ctx)
		if err == nil {
			b.Reset()
			return nil
		}

		// Check if error is retryable
		if b.config.RetryableFunc != nil && !b.config.RetryableFunc(err) {
			return err
		}

		// Check max retries
		if b.config.MaxRetries > 0 && b.Attempts() >= b.config.MaxRetries {
			b.logger.Error("Max retries exceeded",
				zap.Int("attempts", b.Attempts()),
				zap.Error(err))
			return ErrMaxRetriesExceeded
		}

		// Calculate next delay
		delay := b.Next()

		b.logger.Warn("Operation failed, retrying",
			zap.Int("attempt", b.Attempts()),
			zap.Duration("next_delay", delay),
			zap.Error(err))

		// Wait for delay or context cancellation
		select {
		case <-ctx.Done():
			return ErrOperationCancelled
		case <-time.After(delay):
			continue
		}
	}
}

// CircuitState represents the circuit breaker state
type CircuitState int32

const (
	CircuitClosed   CircuitState = iota // Normal operation
	CircuitOpen                         // Failing, reject requests
	CircuitHalfOpen                     // Testing if service recovered
)

func (s CircuitState) String() string {
	switch s {
	case CircuitClosed:
		return "CLOSED"
	case CircuitOpen:
		return "OPEN"
	case CircuitHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}

// CircuitBreakerConfig configures the circuit breaker
type CircuitBreakerConfig struct {
	FailureThreshold   int           // Failures before opening
	SuccessThreshold   int           // Successes in half-open to close
	Timeout            time.Duration // Time to wait before half-open
	HalfOpenMaxCalls   int           // Max calls allowed in half-open state
}

// DefaultCircuitBreakerConfig returns production-ready defaults
func DefaultCircuitBreakerConfig() *CircuitBreakerConfig {
	return &CircuitBreakerConfig{
		FailureThreshold: 5,
		SuccessThreshold: 3,
		Timeout:          30 * time.Second,
		HalfOpenMaxCalls: 3,
	}
}

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	config          *CircuitBreakerConfig
	logger          *zap.Logger
	state           int32 // atomic: CircuitState
	failures        int32 // atomic
	successes       int32 // atomic
	halfOpenCalls   int32 // atomic
	lastFailureTime int64 // atomic: unix nano
	mu              sync.Mutex
}

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(config *CircuitBreakerConfig, logger *zap.Logger) *CircuitBreaker {
	if config == nil {
		config = DefaultCircuitBreakerConfig()
	}

	return &CircuitBreaker{
		config: config,
		logger: logger.Named("circuit-breaker"),
	}
}

// Execute runs an operation through the circuit breaker
func (cb *CircuitBreaker) Execute(ctx context.Context, operation RetryableOperation) error {
	state := cb.State()

	switch state {
	case CircuitOpen:
		// Check if timeout has passed
		if cb.shouldAttemptReset() {
			cb.setState(CircuitHalfOpen)
			atomic.StoreInt32(&cb.halfOpenCalls, 0)
		} else {
			return ErrCircuitOpen
		}

	case CircuitHalfOpen:
		// Limit calls in half-open state
		if atomic.LoadInt32(&cb.halfOpenCalls) >= int32(cb.config.HalfOpenMaxCalls) {
			return ErrCircuitOpen
		}
		atomic.AddInt32(&cb.halfOpenCalls, 1)
	}

	// Execute operation
	err := operation(ctx)

	cb.recordResult(err)

	return err
}

func (cb *CircuitBreaker) recordResult(err error) {
	state := cb.State()

	if err != nil {
		cb.recordFailure()

		if state == CircuitHalfOpen {
			// Any failure in half-open reopens the circuit
			cb.setState(CircuitOpen)
			cb.logger.Warn("Circuit reopened due to failure in half-open state")
		} else if atomic.LoadInt32(&cb.failures) >= int32(cb.config.FailureThreshold) {
			cb.setState(CircuitOpen)
			cb.logger.Warn("Circuit opened due to failure threshold",
				zap.Int32("failures", atomic.LoadInt32(&cb.failures)))
		}
	} else {
		cb.recordSuccess()

		if state == CircuitHalfOpen {
			if atomic.LoadInt32(&cb.successes) >= int32(cb.config.SuccessThreshold) {
				cb.setState(CircuitClosed)
				cb.logger.Info("Circuit closed after successful recovery")
			}
		}
	}
}

func (cb *CircuitBreaker) recordFailure() {
	atomic.AddInt32(&cb.failures, 1)
	atomic.StoreInt64(&cb.lastFailureTime, time.Now().UnixNano())
	atomic.StoreInt32(&cb.successes, 0)
}

func (cb *CircuitBreaker) recordSuccess() {
	atomic.AddInt32(&cb.successes, 1)
	atomic.StoreInt32(&cb.failures, 0)
}

func (cb *CircuitBreaker) shouldAttemptReset() bool {
	lastFailure := time.Unix(0, atomic.LoadInt64(&cb.lastFailureTime))
	return time.Since(lastFailure) >= cb.config.Timeout
}

func (cb *CircuitBreaker) setState(state CircuitState) {
	atomic.StoreInt32((*int32)(&cb.state), int32(state))
}

// State returns the current circuit state
func (cb *CircuitBreaker) State() CircuitState {
	return CircuitState(atomic.LoadInt32((*int32)(&cb.state)))
}

// Reset manually resets the circuit breaker
func (cb *CircuitBreaker) Reset() {
	cb.setState(CircuitClosed)
	atomic.StoreInt32(&cb.failures, 0)
	atomic.StoreInt32(&cb.successes, 0)
	atomic.StoreInt32(&cb.halfOpenCalls, 0)
	cb.logger.Info("Circuit breaker manually reset")
}

// ResilientConnection wraps a connection with retry and circuit breaker logic
type ResilientConnection struct {
	backoff        *Backoff
	circuitBreaker *CircuitBreaker
	logger         *zap.Logger

	// Connection state
	connected int32 // atomic
	mu        sync.RWMutex

	// Callbacks
	onConnect    func(ctx context.Context) error
	onDisconnect func() error
	onReconnect  func() // Called when reconnection succeeds
}

// ResilientConnectionConfig configures a resilient connection
type ResilientConnectionConfig struct {
	BackoffConfig        *BackoffConfig
	CircuitBreakerConfig *CircuitBreakerConfig
	OnConnect            func(ctx context.Context) error
	OnDisconnect         func() error
	OnReconnect          func()
}

// NewResilientConnection creates a new resilient connection
func NewResilientConnection(config *ResilientConnectionConfig, logger *zap.Logger) *ResilientConnection {
	return &ResilientConnection{
		backoff:        NewBackoff(config.BackoffConfig, logger),
		circuitBreaker: NewCircuitBreaker(config.CircuitBreakerConfig, logger),
		logger:         logger.Named("resilient-connection"),
		onConnect:      config.OnConnect,
		onDisconnect:   config.OnDisconnect,
		onReconnect:    config.OnReconnect,
	}
}

// Connect establishes connection with retry logic
func (rc *ResilientConnection) Connect(ctx context.Context) error {
	rc.logger.Info("Initiating connection with retry logic")

	err := rc.backoff.Retry(ctx, func(ctx context.Context) error {
		return rc.circuitBreaker.Execute(ctx, rc.onConnect)
	})

	if err == nil {
		atomic.StoreInt32(&rc.connected, 1)
		rc.logger.Info("Connection established successfully")
		if rc.onReconnect != nil {
			rc.onReconnect()
		}
	}

	return err
}

// Disconnect closes the connection
func (rc *ResilientConnection) Disconnect() error {
	atomic.StoreInt32(&rc.connected, 0)
	if rc.onDisconnect != nil {
		return rc.onDisconnect()
	}
	return nil
}

// IsConnected returns whether the connection is active
func (rc *ResilientConnection) IsConnected() bool {
	return atomic.LoadInt32(&rc.connected) == 1
}

// Reconnect attempts to reconnect with backoff
func (rc *ResilientConnection) Reconnect(ctx context.Context) error {
	rc.logger.Info("Initiating reconnection")

	// Disconnect first
	if err := rc.Disconnect(); err != nil {
		rc.logger.Warn("Error during disconnect", zap.Error(err))
	}

	// Reset backoff for fresh reconnection attempt
	rc.backoff.Reset()

	return rc.Connect(ctx)
}

// GetCircuitState returns the current circuit breaker state
func (rc *ResilientConnection) GetCircuitState() CircuitState {
	return rc.circuitBreaker.State()
}

// GetBackoffAttempts returns the current backoff attempt count
func (rc *ResilientConnection) GetBackoffAttempts() int {
	return rc.backoff.Attempts()
}
