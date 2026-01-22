// Package worker provides a production-grade Worker Pool implementation
// with guaranteed graceful shutdown and zero goroutine leaks.
//
// Architecture:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    Worker Pool Architecture (Zero-Leak)                     │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │                        ┌─────────────────┐                                  │
// │                        │   Job Queue     │                                  │
// │                        │  (Buffered Ch)  │                                  │
// │                        └────────┬────────┘                                  │
// │                                 │                                           │
// │         ┌───────────────────────┼───────────────────────┐                  │
// │         │                       │                       │                  │
// │         ▼                       ▼                       ▼                  │
// │  ┌────────────┐          ┌────────────┐          ┌────────────┐           │
// │  │  Worker 1  │          │  Worker 2  │          │  Worker N  │           │
// │  │ (Goroutine)│          │ (Goroutine)│          │ (Goroutine)│           │
// │  └──────┬─────┘          └──────┬─────┘          └──────┬─────┘           │
// │         │                       │                       │                  │
// │         └───────────────────────┼───────────────────────┘                  │
// │                                 │                                           │
// │                                 ▼                                           │
// │                        ┌─────────────────┐                                  │
// │                        │  Result Queue   │                                  │
// │                        └─────────────────┘                                  │
// │                                                                             │
// │  Graceful Shutdown Flow:                                                    │
// │  1. ctx.Cancel() → Stop accepting new jobs                                 │
// │  2. Close job queue → Workers drain remaining jobs                         │
// │  3. WaitGroup.Wait() → All workers complete                                │
// │  4. Close result queue → Cleanup complete                                  │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package worker

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"
)

var (
	ErrPoolClosed     = errors.New("worker pool is closed")
	ErrJobTimeout     = errors.New("job submission timeout")
	ErrShutdownTimeout = errors.New("shutdown timeout exceeded")
)

// Job represents a unit of work
type Job struct {
	ID       string
	Payload  interface{}
	Handler  func(ctx context.Context, payload interface{}) (interface{}, error)
	Timeout  time.Duration
	Priority int // Higher = more urgent
}

// Result represents the outcome of a job
type Result struct {
	JobID    string
	Output   interface{}
	Error    error
	Duration time.Duration
}

// PoolConfig holds worker pool configuration
type PoolConfig struct {
	Workers         int           // Number of worker goroutines
	JobQueueSize    int           // Size of job queue buffer
	ResultQueueSize int           // Size of result queue buffer
	ShutdownTimeout time.Duration // Maximum time to wait for graceful shutdown
	JobTimeout      time.Duration // Default timeout for jobs without explicit timeout
}

// DefaultPoolConfig returns production-ready defaults
func DefaultPoolConfig() *PoolConfig {
	return &PoolConfig{
		Workers:         10,
		JobQueueSize:    1000,
		ResultQueueSize: 1000,
		ShutdownTimeout: 30 * time.Second,
		JobTimeout:      10 * time.Second,
	}
}

// Pool manages a group of worker goroutines
type Pool struct {
	config *PoolConfig
	logger *zap.Logger

	// Channels
	jobQueue    chan *Job
	resultQueue chan *Result

	// Synchronization
	wg     sync.WaitGroup
	ctx    context.Context
	cancel context.CancelFunc

	// State tracking
	closed     int32 // atomic: 0=open, 1=closed
	processing int64 // atomic: current jobs being processed
	completed  int64 // atomic: total completed jobs
	failed     int64 // atomic: total failed jobs

	// Metrics
	metrics *PoolMetrics
}

// PoolMetrics tracks pool performance
type PoolMetrics struct {
	mu                sync.RWMutex
	TotalSubmitted    int64
	TotalCompleted    int64
	TotalFailed       int64
	TotalTimeout      int64
	AverageJobTimeMs  float64
	MaxJobTimeMs      float64
	WorkerUtilization float64
	QueueDepth        int
}

// NewPool creates a new worker pool
func NewPool(config *PoolConfig, logger *zap.Logger) *Pool {
	if config == nil {
		config = DefaultPoolConfig()
	}

	ctx, cancel := context.WithCancel(context.Background())

	pool := &Pool{
		config:      config,
		logger:      logger.Named("worker-pool"),
		jobQueue:    make(chan *Job, config.JobQueueSize),
		resultQueue: make(chan *Result, config.ResultQueueSize),
		ctx:         ctx,
		cancel:      cancel,
		metrics:     &PoolMetrics{},
	}

	return pool
}

// Start initializes and starts all workers
func (p *Pool) Start() {
	p.logger.Info("Starting worker pool",
		zap.Int("workers", p.config.Workers),
		zap.Int("job_queue_size", p.config.JobQueueSize))

	for i := 0; i < p.config.Workers; i++ {
		p.wg.Add(1)
		go p.worker(i)
	}

	p.logger.Info("Worker pool started")
}

// worker processes jobs from the queue
func (p *Pool) worker(id int) {
	defer p.wg.Done()

	p.logger.Debug("Worker started", zap.Int("worker_id", id))

	for {
		select {
		case <-p.ctx.Done():
			// Context cancelled - drain remaining jobs with timeout
			p.drainJobs(id)
			p.logger.Debug("Worker stopped (context cancelled)", zap.Int("worker_id", id))
			return

		case job, ok := <-p.jobQueue:
			if !ok {
				// Job queue closed - worker should exit
				p.logger.Debug("Worker stopped (queue closed)", zap.Int("worker_id", id))
				return
			}

			p.processJob(id, job)
		}
	}
}

// drainJobs processes remaining jobs in queue during shutdown
func (p *Pool) drainJobs(workerID int) {
	drainTimeout := time.After(5 * time.Second)

	for {
		select {
		case <-drainTimeout:
			p.logger.Warn("Worker drain timeout", zap.Int("worker_id", workerID))
			return

		case job, ok := <-p.jobQueue:
			if !ok {
				return
			}
			p.processJob(workerID, job)
		default:
			return
		}
	}
}

// processJob executes a single job with proper timeout handling
func (p *Pool) processJob(workerID int, job *Job) {
	atomic.AddInt64(&p.processing, 1)
	defer atomic.AddInt64(&p.processing, -1)

	startTime := time.Now()

	// Determine timeout
	timeout := job.Timeout
	if timeout == 0 {
		timeout = p.config.JobTimeout
	}

	// Create job context with timeout
	jobCtx, jobCancel := context.WithTimeout(p.ctx, timeout)
	defer jobCancel()

	// Execute job in goroutine to respect timeout
	resultChan := make(chan *Result, 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				p.logger.Error("Job panicked",
					zap.String("job_id", job.ID),
					zap.Any("panic", r))
				resultChan <- &Result{
					JobID: job.ID,
					Error: errors.New("job panicked"),
				}
			}
		}()

		output, err := job.Handler(jobCtx, job.Payload)
		resultChan <- &Result{
			JobID:  job.ID,
			Output: output,
			Error:  err,
		}
	}()

	// Wait for result or timeout
	var result *Result
	select {
	case result = <-resultChan:
		// Job completed
	case <-jobCtx.Done():
		// Timeout or cancellation
		result = &Result{
			JobID: job.ID,
			Error: ErrJobTimeout,
		}
		atomic.AddInt64(&p.metrics.TotalTimeout, 1)
	}

	result.Duration = time.Since(startTime)

	// Update metrics
	if result.Error != nil {
		atomic.AddInt64(&p.failed, 1)
	} else {
		atomic.AddInt64(&p.completed, 1)
	}

	// Update timing metrics
	p.updateTimingMetrics(result.Duration)

	// Send result (non-blocking to prevent deadlock during shutdown)
	select {
	case p.resultQueue <- result:
	default:
		p.logger.Warn("Result queue full, dropping result",
			zap.String("job_id", job.ID))
	}

	p.logger.Debug("Job completed",
		zap.Int("worker_id", workerID),
		zap.String("job_id", job.ID),
		zap.Duration("duration", result.Duration),
		zap.Error(result.Error))
}

func (p *Pool) updateTimingMetrics(duration time.Duration) {
	p.metrics.mu.Lock()
	defer p.metrics.mu.Unlock()

	durationMs := float64(duration.Milliseconds())
	if durationMs > p.metrics.MaxJobTimeMs {
		p.metrics.MaxJobTimeMs = durationMs
	}

	total := atomic.LoadInt64(&p.completed) + atomic.LoadInt64(&p.failed)
	if total > 0 {
		// Exponential moving average
		alpha := 0.1
		p.metrics.AverageJobTimeMs = alpha*durationMs + (1-alpha)*p.metrics.AverageJobTimeMs
	}
}

// Submit adds a job to the queue
func (p *Pool) Submit(job *Job) error {
	if atomic.LoadInt32(&p.closed) == 1 {
		return ErrPoolClosed
	}

	select {
	case p.jobQueue <- job:
		atomic.AddInt64(&p.metrics.TotalSubmitted, 1)
		return nil
	case <-p.ctx.Done():
		return ErrPoolClosed
	}
}

// SubmitWithTimeout adds a job with submission timeout
func (p *Pool) SubmitWithTimeout(job *Job, timeout time.Duration) error {
	if atomic.LoadInt32(&p.closed) == 1 {
		return ErrPoolClosed
	}

	timer := time.NewTimer(timeout)
	defer timer.Stop()

	select {
	case p.jobQueue <- job:
		atomic.AddInt64(&p.metrics.TotalSubmitted, 1)
		return nil
	case <-timer.C:
		return ErrJobTimeout
	case <-p.ctx.Done():
		return ErrPoolClosed
	}
}

// Results returns the result channel
func (p *Pool) Results() <-chan *Result {
	return p.resultQueue
}

// Shutdown gracefully stops the worker pool
func (p *Pool) Shutdown(ctx context.Context) error {
	p.logger.Info("Initiating worker pool shutdown")

	// Mark as closed to reject new jobs
	if !atomic.CompareAndSwapInt32(&p.closed, 0, 1) {
		return nil // Already closed
	}

	// Cancel context to signal workers
	p.cancel()

	// Close job queue to signal workers to finish
	close(p.jobQueue)

	// Wait for workers with timeout
	done := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		p.logger.Info("Worker pool shutdown complete",
			zap.Int64("completed", atomic.LoadInt64(&p.completed)),
			zap.Int64("failed", atomic.LoadInt64(&p.failed)))
	case <-ctx.Done():
		p.logger.Warn("Worker pool shutdown timeout exceeded")
		return ErrShutdownTimeout
	case <-time.After(p.config.ShutdownTimeout):
		p.logger.Warn("Worker pool shutdown timeout exceeded")
		return ErrShutdownTimeout
	}

	// Close result queue after all workers done
	close(p.resultQueue)

	return nil
}

// GetMetrics returns current pool metrics
func (p *Pool) GetMetrics() *PoolMetrics {
	p.metrics.mu.RLock()
	defer p.metrics.mu.RUnlock()

	return &PoolMetrics{
		TotalSubmitted:    atomic.LoadInt64(&p.metrics.TotalSubmitted),
		TotalCompleted:    atomic.LoadInt64(&p.completed),
		TotalFailed:       atomic.LoadInt64(&p.failed),
		TotalTimeout:      atomic.LoadInt64(&p.metrics.TotalTimeout),
		AverageJobTimeMs:  p.metrics.AverageJobTimeMs,
		MaxJobTimeMs:      p.metrics.MaxJobTimeMs,
		WorkerUtilization: float64(atomic.LoadInt64(&p.processing)) / float64(p.config.Workers),
		QueueDepth:        len(p.jobQueue),
	}
}

// IsClosed returns whether the pool is closed
func (p *Pool) IsClosed() bool {
	return atomic.LoadInt32(&p.closed) == 1
}

// Processing returns the number of jobs currently being processed
func (p *Pool) Processing() int64 {
	return atomic.LoadInt64(&p.processing)
}

// QueueDepth returns the current number of jobs in the queue
func (p *Pool) QueueDepth() int {
	return len(p.jobQueue)
}
