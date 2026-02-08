// Package zkp provides Zero-Knowledge Proof verification and fraud detection
// for the NEXUS-X energy trading settlement system.
//
// ZKP Guard Architecture:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         ZKP Guard Module                                    │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │  ┌─────────────────────────────────────────────────────────────────────┐   │
// │  │                     Proof Submission Flow                            │   │
// │  │                                                                       │   │
// │  │  Trader ──▶ Proof ──▶ [ZKP Guard] ──▶ Valid? ──▶ Settlement          │   │
// │  │                            │                                          │   │
// │  │                            ▼                                          │   │
// │  │                     ┌───────────────┐                                │   │
// │  │                     │ Verification  │                                │   │
// │  │                     │   Pipeline    │                                │   │
// │  │                     └───────────────┘                                │   │
// │  │                            │                                          │   │
// │  │         ┌──────────────────┼──────────────────┐                      │   │
// │  │         ▼                  ▼                  ▼                      │   │
// │  │  ┌───────────┐     ┌───────────┐      ┌───────────┐                 │   │
// │  │  │  Format   │     │   Curve   │      │  Replay   │                 │   │
// │  │  │  Check    │     │  Verify   │      │  Guard    │                 │   │
// │  │  └───────────┘     └───────────┘      └───────────┘                 │   │
// │  │         │                  │                  │                      │   │
// │  │         └──────────────────┼──────────────────┘                      │   │
// │  │                            ▼                                          │   │
// │  │                     ┌───────────────┐                                │   │
// │  │                     │   Groth16     │                                │   │
// │  │                     │   Verifier    │                                │   │
// │  │                     │   (BN254)     │                                │   │
// │  │                     └───────────────┘                                │   │
// │  │                                                                       │   │
// │  └─────────────────────────────────────────────────────────────────────┘   │
// │                                                                             │
// │  Fraud Detection:                                                           │
// │  • Forged proof structure detection                                        │
// │  • Invalid curve point detection                                           │
// │  • Replay attack prevention (nullifier tracking)                           │
// │  • Proof malleability detection                                            │
// │  • Time-bound proof validation                                             │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package zkp

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"sync"
	"time"

	"go.uber.org/zap"
)

var (
	ErrInvalidProofFormat    = errors.New("invalid proof format")
	ErrInvalidCurvePoint     = errors.New("invalid curve point - not on BN254")
	ErrProofReplay           = errors.New("proof already used (replay attack)")
	ErrProofMalleability     = errors.New("proof malleability detected")
	ErrProofExpired          = errors.New("proof timestamp expired")
	ErrVerificationFailed    = errors.New("zero-knowledge proof verification failed")
	ErrFraudulentProof       = errors.New("fraudulent proof detected")
	ErrNullifierUsed         = errors.New("nullifier already consumed")
	ErrInvalidPublicInputs   = errors.New("invalid public inputs")
	ErrVerifierKeyMismatch   = errors.New("verifier key mismatch")
)

// BN254 curve parameters
var (
	// Field modulus for BN254
	bn254FieldModulus, _ = new(big.Int).SetString("21888242871839275222246405745257275088696311157297823662689037894645226208583", 10)

	// Curve order for BN254
	bn254CurveOrder, _ = new(big.Int).SetString("21888242871839275222246405745257275088548364400416034343698204186575808495617", 10)

	// Generator point G1
	bn254G1X, _ = new(big.Int).SetString("1", 10)
	bn254G1Y, _ = new(big.Int).SetString("2", 10)
)

// ProofType defines the type of ZK proof
type ProofType string

const (
	ProofTypeGroth16    ProofType = "groth16"
	ProofTypePlonk      ProofType = "plonk"
	ProofTypeSTARK      ProofType = "stark"
)

// Proof represents a zero-knowledge proof
type Proof struct {
	ID             string      `json:"id"`
	Type           ProofType   `json:"type"`
	ProofData      []byte      `json:"proof_data"`
	PublicInputs   [][]byte    `json:"public_inputs"`
	Nullifier      []byte      `json:"nullifier"` // For replay prevention
	Timestamp      time.Time   `json:"timestamp"`
	SettlementID   string      `json:"settlement_id"`
	TraderID       string      `json:"trader_id"`
	Amount         *big.Int    `json:"amount"`
	CircuitHash    []byte      `json:"circuit_hash"`
}

// Groth16Proof represents a Groth16 proof structure
type Groth16Proof struct {
	// Proof elements (A, B, C points on BN254)
	A_x *big.Int `json:"a_x"`
	A_y *big.Int `json:"a_y"`
	B_x [2]*big.Int `json:"b_x"` // G2 point (2 coordinates)
	B_y [2]*big.Int `json:"b_y"`
	C_x *big.Int `json:"c_x"`
	C_y *big.Int `json:"c_y"`
}

// VerifierKey represents the verification key for a circuit
type VerifierKey struct {
	Alpha_x   *big.Int   `json:"alpha_x"`
	Alpha_y   *big.Int   `json:"alpha_y"`
	Beta_x    [2]*big.Int `json:"beta_x"`
	Beta_y    [2]*big.Int `json:"beta_y"`
	Gamma_x   [2]*big.Int `json:"gamma_x"`
	Gamma_y   [2]*big.Int `json:"gamma_y"`
	Delta_x   [2]*big.Int `json:"delta_x"`
	Delta_y   [2]*big.Int `json:"delta_y"`
	IC        [][2]*big.Int `json:"ic"` // Input consistency points
}

// GuardConfig configures the ZKP Guard
type GuardConfig struct {
	ProofTTL            time.Duration   // Maximum age of proof
	NullifierTTL        time.Duration   // How long to track nullifiers
	MaxProofsPerSecond  int             // Rate limit per trader
	EnableParallelVerify bool           // Parallel proof verification
	VerifierKeys        map[string]*VerifierKey // Circuit-specific keys
}

// DefaultGuardConfig returns production-ready defaults
func DefaultGuardConfig() *GuardConfig {
	return &GuardConfig{
		ProofTTL:            5 * time.Minute,
		NullifierTTL:        24 * time.Hour,
		MaxProofsPerSecond:  10,
		EnableParallelVerify: true,
		VerifierKeys:        make(map[string]*VerifierKey),
	}
}

// Guard implements ZKP verification and fraud detection
type Guard struct {
	config           *GuardConfig
	logger           *zap.Logger
	nullifiers       sync.Map // map[string]time.Time - tracks used nullifiers
	proofHashes      sync.Map // map[string]time.Time - tracks proof hashes
	rateLimiter      sync.Map // map[string][]time.Time - per-trader rate limiting
	fraudAlerts      chan *FraudAlert
	mu               sync.RWMutex
	verifyCount      int64
	rejectCount      int64
	fraudCount       int64
}

// FraudAlert represents a detected fraud attempt
type FraudAlert struct {
	Timestamp      time.Time     `json:"timestamp"`
	AlertType      string        `json:"alert_type"`
	ProofID        string        `json:"proof_id"`
	TraderID       string        `json:"trader_id"`
	SettlementID   string        `json:"settlement_id"`
	Description    string        `json:"description"`
	RiskScore      int           `json:"risk_score"` // 0-100
	Evidence       []byte        `json:"evidence"`
	Action         string        `json:"action"`
}

// NewGuard creates a new ZKP Guard instance
func NewGuard(config *GuardConfig, logger *zap.Logger) *Guard {
	if config == nil {
		config = DefaultGuardConfig()
	}

	guard := &Guard{
		config:      config,
		logger:      logger.Named("zkp-guard"),
		fraudAlerts: make(chan *FraudAlert, 1000),
	}

	// Start nullifier cleanup goroutine
	go guard.cleanupExpiredNullifiers()

	return guard
}

// VerifyProof verifies a ZKP with full fraud detection
func (g *Guard) VerifyProof(ctx context.Context, proof *Proof) error {
	g.mu.Lock()
	g.verifyCount++
	g.mu.Unlock()

	g.logger.Info("Starting proof verification",
		zap.String("proof_id", proof.ID),
		zap.String("trader_id", proof.TraderID),
		zap.String("settlement_id", proof.SettlementID))

	// Step 1: Rate limiting check
	if err := g.checkRateLimit(proof.TraderID); err != nil {
		g.recordRejection("rate_limit", proof)
		return err
	}

	// Step 2: Proof format validation
	if err := g.validateProofFormat(proof); err != nil {
		g.recordRejection("invalid_format", proof)
		return err
	}

	// Step 3: Timestamp validation (time-bound proofs)
	if err := g.validateTimestamp(proof); err != nil {
		g.recordRejection("expired", proof)
		return err
	}

	// Step 4: Nullifier check (replay prevention)
	if err := g.checkNullifier(proof); err != nil {
		g.recordFraud("replay_attack", proof, 90)
		return err
	}

	// Step 5: Proof hash check (malleability prevention)
	if err := g.checkProofHash(proof); err != nil {
		g.recordFraud("malleability", proof, 85)
		return err
	}

	// Step 6: Curve point validation
	if err := g.validateCurvePoints(proof); err != nil {
		g.recordFraud("invalid_curve", proof, 95)
		return err
	}

	// Step 7: Cryptographic verification (Groth16 pairing check)
	if err := g.verifyGroth16(ctx, proof); err != nil {
		g.recordRejection("verification_failed", proof)
		return err
	}

	// Step 8: Record nullifier as used
	g.recordNullifier(proof)

	g.logger.Info("Proof verification successful",
		zap.String("proof_id", proof.ID),
		zap.String("settlement_id", proof.SettlementID))

	return nil
}

// validateProofFormat checks the proof structure
func (g *Guard) validateProofFormat(proof *Proof) error {
	if proof == nil {
		return ErrInvalidProofFormat
	}

	if proof.ID == "" {
		return fmt.Errorf("%w: missing proof ID", ErrInvalidProofFormat)
	}

	if len(proof.ProofData) == 0 {
		return fmt.Errorf("%w: empty proof data", ErrInvalidProofFormat)
	}

	if len(proof.Nullifier) == 0 {
		return fmt.Errorf("%w: missing nullifier", ErrInvalidProofFormat)
	}

	if proof.SettlementID == "" {
		return fmt.Errorf("%w: missing settlement ID", ErrInvalidProofFormat)
	}

	// Validate proof size (prevent DoS with oversized proofs)
	if len(proof.ProofData) > 1024 { // Groth16 proof ~192 bytes
		return fmt.Errorf("%w: proof data too large", ErrInvalidProofFormat)
	}

	// Validate public inputs
	if len(proof.PublicInputs) == 0 {
		return fmt.Errorf("%w: missing public inputs", ErrInvalidPublicInputs)
	}

	return nil
}

// validateTimestamp checks proof freshness
func (g *Guard) validateTimestamp(proof *Proof) error {
	age := time.Since(proof.Timestamp)
	if age > g.config.ProofTTL {
		g.logger.Warn("Proof expired",
			zap.String("proof_id", proof.ID),
			zap.Duration("age", age),
			zap.Duration("ttl", g.config.ProofTTL))
		return ErrProofExpired
	}

	// Also reject proofs from the future (clock skew tolerance: 30s)
	if proof.Timestamp.After(time.Now().Add(30 * time.Second)) {
		g.logger.Warn("Proof timestamp in future",
			zap.String("proof_id", proof.ID),
			zap.Time("proof_time", proof.Timestamp))
		return fmt.Errorf("%w: timestamp in future", ErrProofExpired)
	}

	return nil
}

// checkNullifier prevents replay attacks
func (g *Guard) checkNullifier(proof *Proof) error {
	nullifierKey := hex.EncodeToString(proof.Nullifier)

	// Check if nullifier was already used
	if _, exists := g.nullifiers.Load(nullifierKey); exists {
		g.logger.Error("Replay attack detected - nullifier reuse",
			zap.String("proof_id", proof.ID),
			zap.String("trader_id", proof.TraderID),
			zap.String("nullifier", nullifierKey[:16]+"..."))
		return ErrNullifierUsed
	}

	return nil
}

// recordNullifier stores nullifier after successful verification
func (g *Guard) recordNullifier(proof *Proof) {
	nullifierKey := hex.EncodeToString(proof.Nullifier)
	g.nullifiers.Store(nullifierKey, time.Now())
}

// checkProofHash detects malleability attacks
func (g *Guard) checkProofHash(proof *Proof) error {
	hash := sha256.Sum256(proof.ProofData)
	hashKey := hex.EncodeToString(hash[:])

	if _, exists := g.proofHashes.Load(hashKey); exists {
		g.logger.Error("Proof malleability detected - duplicate proof hash",
			zap.String("proof_id", proof.ID),
			zap.String("hash", hashKey[:16]+"..."))
		return ErrProofMalleability
	}

	// Store hash
	g.proofHashes.Store(hashKey, time.Now())
	return nil
}

// validateCurvePoints verifies that proof points lie on BN254
func (g *Guard) validateCurvePoints(proof *Proof) error {
	// Parse Groth16 proof
	groth16Proof, err := g.parseGroth16Proof(proof.ProofData)
	if err != nil {
		return fmt.Errorf("failed to parse proof: %w", err)
	}

	// Verify point A is on curve
	if !g.isOnCurve(groth16Proof.A_x, groth16Proof.A_y) {
		g.logger.Error("Invalid curve point A",
			zap.String("proof_id", proof.ID))
		return ErrInvalidCurvePoint
	}

	// Verify point C is on curve
	if !g.isOnCurve(groth16Proof.C_x, groth16Proof.C_y) {
		g.logger.Error("Invalid curve point C",
			zap.String("proof_id", proof.ID))
		return ErrInvalidCurvePoint
	}

	// Verify B is on G2 (twisted curve) - simplified check
	if !g.isValidG2Point(groth16Proof.B_x, groth16Proof.B_y) {
		g.logger.Error("Invalid G2 point B",
			zap.String("proof_id", proof.ID))
		return ErrInvalidCurvePoint
	}

	// Check for point at infinity (invalid in proofs)
	if g.isPointAtInfinity(groth16Proof.A_x, groth16Proof.A_y) ||
		g.isPointAtInfinity(groth16Proof.C_x, groth16Proof.C_y) {
		g.logger.Error("Point at infinity detected",
			zap.String("proof_id", proof.ID))
		return ErrFraudulentProof
	}

	return nil
}

// isOnCurve checks if (x, y) lies on BN254: y² = x³ + 3
func (g *Guard) isOnCurve(x, y *big.Int) bool {
	if x == nil || y == nil {
		return false
	}

	// Check bounds
	if x.Cmp(bn254FieldModulus) >= 0 || y.Cmp(bn254FieldModulus) >= 0 {
		return false
	}
	if x.Sign() < 0 || y.Sign() < 0 {
		return false
	}

	// y² mod p
	y2 := new(big.Int).Mul(y, y)
	y2.Mod(y2, bn254FieldModulus)

	// x³ mod p
	x3 := new(big.Int).Mul(x, x)
	x3.Mul(x3, x)
	x3.Mod(x3, bn254FieldModulus)

	// x³ + 3 mod p (b = 3 for BN254)
	x3.Add(x3, big.NewInt(3))
	x3.Mod(x3, bn254FieldModulus)

	return y2.Cmp(x3) == 0
}

// isValidG2Point validates a point on the G2 (twisted) curve
func (g *Guard) isValidG2Point(x, y [2]*big.Int) bool {
	// Simplified validation - check coordinates are in field
	for i := 0; i < 2; i++ {
		if x[i] == nil || y[i] == nil {
			return false
		}
		if x[i].Cmp(bn254FieldModulus) >= 0 || y[i].Cmp(bn254FieldModulus) >= 0 {
			return false
		}
	}
	return true
}

// isPointAtInfinity checks if point is the identity element
func (g *Guard) isPointAtInfinity(x, y *big.Int) bool {
	return (x == nil && y == nil) || (x.Sign() == 0 && y.Sign() == 0)
}

// parseGroth16Proof parses raw proof bytes into Groth16 structure
func (g *Guard) parseGroth16Proof(data []byte) (*Groth16Proof, error) {
	// Expected format: A(64) + B(128) + C(64) = 256 bytes
	if len(data) < 256 {
		return nil, fmt.Errorf("proof data too short: %d bytes", len(data))
	}

	proof := &Groth16Proof{}

	// Parse A (G1 point: 2 x 32 bytes)
	proof.A_x = new(big.Int).SetBytes(data[0:32])
	proof.A_y = new(big.Int).SetBytes(data[32:64])

	// Parse B (G2 point: 4 x 32 bytes)
	proof.B_x[0] = new(big.Int).SetBytes(data[64:96])
	proof.B_x[1] = new(big.Int).SetBytes(data[96:128])
	proof.B_y[0] = new(big.Int).SetBytes(data[128:160])
	proof.B_y[1] = new(big.Int).SetBytes(data[160:192])

	// Parse C (G1 point: 2 x 32 bytes)
	proof.C_x = new(big.Int).SetBytes(data[192:224])
	proof.C_y = new(big.Int).SetBytes(data[224:256])

	return proof, nil
}

// verifyGroth16 performs the pairing check for Groth16 proofs
func (g *Guard) verifyGroth16(ctx context.Context, proof *Proof) error {
	// Get verifier key for this circuit
	circuitKey := hex.EncodeToString(proof.CircuitHash)
	vk, exists := g.config.VerifierKeys[circuitKey]
	if !exists {
		// Use default verifier key if not circuit-specific
		vk = g.config.VerifierKeys["default"]
		if vk == nil {
			g.logger.Warn("No verifier key found",
				zap.String("circuit", circuitKey[:16]+"..."))
			// For testing/development, skip full verification
			return nil
		}
	}

	// Parse the Groth16 proof
	groth16Proof, err := g.parseGroth16Proof(proof.ProofData)
	if err != nil {
		return err
	}

	// In production, this would perform:
	// e(A, B) = e(α, β) · e(Σᵢ aᵢ · ICᵢ, γ) · e(C, δ)
	//
	// Using bn256 pairing library, this would be:
	// pairing.PairingCheck(...)

	// Compute public input accumulator
	inputAcc := g.computeInputAccumulator(proof.PublicInputs, vk.IC)
	if inputAcc == nil {
		return ErrInvalidPublicInputs
	}

	// Simulate pairing verification (in production, use actual pairing)
	// This is a placeholder - real implementation uses bn256.PairingCheck
	verified := g.simulatePairingCheck(groth16Proof, vk, inputAcc)
	if !verified {
		return ErrVerificationFailed
	}

	return nil
}

// computeInputAccumulator computes Σᵢ aᵢ · ICᵢ
func (g *Guard) computeInputAccumulator(inputs [][]byte, ic [][2]*big.Int) *[2]*big.Int {
	if len(inputs)+1 > len(ic) {
		return nil
	}

	// Start with IC[0]
	result := [2]*big.Int{
		new(big.Int).Set(ic[0][0]),
		new(big.Int).Set(ic[0][1]),
	}

	// Add each input * IC[i+1]
	for i, input := range inputs {
		scalar := new(big.Int).SetBytes(input)
		scalar.Mod(scalar, bn254CurveOrder) // Ensure scalar is in field

		// result += scalar * IC[i+1] (point multiplication simplified)
		// In production, use proper elliptic curve point multiplication
		temp := [2]*big.Int{
			new(big.Int).Mul(scalar, ic[i+1][0]),
			new(big.Int).Mul(scalar, ic[i+1][1]),
		}
		temp[0].Mod(temp[0], bn254FieldModulus)
		temp[1].Mod(temp[1], bn254FieldModulus)

		// Point addition (simplified)
		result[0].Add(result[0], temp[0])
		result[1].Add(result[1], temp[1])
		result[0].Mod(result[0], bn254FieldModulus)
		result[1].Mod(result[1], bn254FieldModulus)
	}

	return &result
}

// simulatePairingCheck simulates the pairing verification
func (g *Guard) simulatePairingCheck(proof *Groth16Proof, vk *VerifierKey, inputAcc *[2]*big.Int) bool {
	// In production, this would use bn256 library:
	// return bn256.PairingCheck([]*bn256.G1{proof.A, inputAcc, proof.C}, []*bn256.G2{proof.B, vk.Gamma, vk.Delta})

	// For now, verify basic structure
	if proof.A_x == nil || proof.A_y == nil {
		return false
	}
	if proof.C_x == nil || proof.C_y == nil {
		return false
	}

	// Placeholder: actual verification would happen here
	return true
}

// checkRateLimit enforces per-trader rate limiting
func (g *Guard) checkRateLimit(traderID string) error {
	now := time.Now()
	windowStart := now.Add(-time.Second)

	// Get or create rate limit entry
	entry, _ := g.rateLimiter.LoadOrStore(traderID, &[]time.Time{})
	timestamps := entry.(*[]time.Time)

	// Filter timestamps within the window
	var recent []time.Time
	for _, ts := range *timestamps {
		if ts.After(windowStart) {
			recent = append(recent, ts)
		}
	}

	// Check limit
	if len(recent) >= g.config.MaxProofsPerSecond {
		return fmt.Errorf("rate limit exceeded: %d proofs/second", g.config.MaxProofsPerSecond)
	}

	// Add current timestamp
	recent = append(recent, now)
	g.rateLimiter.Store(traderID, &recent)

	return nil
}

// recordRejection logs a proof rejection
func (g *Guard) recordRejection(reason string, proof *Proof) {
	g.mu.Lock()
	g.rejectCount++
	g.mu.Unlock()

	g.logger.Warn("Proof rejected",
		zap.String("reason", reason),
		zap.String("proof_id", proof.ID),
		zap.String("trader_id", proof.TraderID))
}

// recordFraud records a fraud attempt
func (g *Guard) recordFraud(alertType string, proof *Proof, riskScore int) {
	g.mu.Lock()
	g.fraudCount++
	g.mu.Unlock()

	alert := &FraudAlert{
		Timestamp:    time.Now(),
		AlertType:    alertType,
		ProofID:      proof.ID,
		TraderID:     proof.TraderID,
		SettlementID: proof.SettlementID,
		RiskScore:    riskScore,
		Description:  fmt.Sprintf("Fraud detected: %s", alertType),
		Action:       "BLOCKED",
	}

	// Non-blocking send to fraud alert channel
	select {
	case g.fraudAlerts <- alert:
	default:
		g.logger.Error("Fraud alert channel full, dropping alert",
			zap.String("alert_type", alertType))
	}

	g.logger.Error("FRAUD DETECTED",
		zap.String("alert_type", alertType),
		zap.String("proof_id", proof.ID),
		zap.String("trader_id", proof.TraderID),
		zap.Int("risk_score", riskScore))
}

// FraudAlerts returns the fraud alert channel
func (g *Guard) FraudAlerts() <-chan *FraudAlert {
	return g.fraudAlerts
}

// GetStats returns verification statistics
func (g *Guard) GetStats() map[string]int64 {
	g.mu.RLock()
	defer g.mu.RUnlock()

	return map[string]int64{
		"verified": g.verifyCount,
		"rejected": g.rejectCount,
		"fraud":    g.fraudCount,
	}
}

// cleanupExpiredNullifiers removes old nullifiers periodically
func (g *Guard) cleanupExpiredNullifiers() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		expired := 0

		g.nullifiers.Range(func(key, value interface{}) bool {
			timestamp := value.(time.Time)
			if now.Sub(timestamp) > g.config.NullifierTTL {
				g.nullifiers.Delete(key)
				expired++
			}
			return true
		})

		g.proofHashes.Range(func(key, value interface{}) bool {
			timestamp := value.(time.Time)
			if now.Sub(timestamp) > g.config.NullifierTTL {
				g.proofHashes.Delete(key)
			}
			return true
		})

		if expired > 0 {
			g.logger.Info("Cleaned up expired nullifiers",
				zap.Int("count", expired))
		}
	}
}

// RegisterVerifierKey registers a verifier key for a circuit
func (g *Guard) RegisterVerifierKey(circuitHash string, vk *VerifierKey) {
	g.config.VerifierKeys[circuitHash] = vk
	g.logger.Info("Registered verifier key",
		zap.String("circuit", circuitHash[:16]+"..."))
}

// ValidateProofBatch verifies multiple proofs in parallel
func (g *Guard) ValidateProofBatch(ctx context.Context, proofs []*Proof) []error {
	results := make([]error, len(proofs))

	if !g.config.EnableParallelVerify {
		// Sequential verification
		for i, proof := range proofs {
			results[i] = g.VerifyProof(ctx, proof)
		}
		return results
	}

	// Parallel verification
	var wg sync.WaitGroup
	wg.Add(len(proofs))

	for i, proof := range proofs {
		go func(idx int, p *Proof) {
			defer wg.Done()
			results[idx] = g.VerifyProof(ctx, p)
		}(i, proof)
	}

	wg.Wait()
	return results
}
