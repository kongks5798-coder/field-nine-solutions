// Package secrets provides secure credential management for NEXUS-X
// using Google Cloud Secret Manager with automatic rotation and caching.
//
// Architecture:
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                   Secret Management Architecture                        │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                                                                         │
// │  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
// │  │ AEMO Adapter    │     │ JEPX Adapter    │     │ Settlement Eng  │  │
// │  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘  │
// │           │                       │                       │           │
// │           └───────────────────────┼───────────────────────┘           │
// │                                   │                                    │
// │                                   ▼                                    │
// │              ┌─────────────────────────────────────────┐               │
// │              │        SecretManager (Cached)           │               │
// │              │  ┌────────────┐  ┌────────────────────┐ │               │
// │              │  │ In-Memory  │  │ Background Refresh │ │               │
// │              │  │ Cache      │  │ (TTL-based)        │ │               │
// │              │  └────────────┘  └────────────────────┘ │               │
// │              └─────────────────────┬───────────────────┘               │
// │                                    │                                   │
// │                                    ▼                                   │
// │              ┌─────────────────────────────────────────┐               │
// │              │     Google Cloud Secret Manager         │               │
// │              │  ┌────────────┐  ┌────────────────────┐ │               │
// │              │  │ Versioned  │  │ IAM-Protected      │ │               │
// │              │  │ Secrets    │  │ Access             │ │               │
// │              │  └────────────┘  └────────────────────┘ │               │
// │              └─────────────────────────────────────────┘               │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
package secrets

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"go.uber.org/zap"
)

// SecretType defines the type of secret
type SecretType string

const (
	SecretTypeAEMO       SecretType = "aemo"
	SecretTypeJEPX       SecretType = "jepx"
	SecretTypePolygon    SecretType = "polygon"
	SecretTypeNXUSD      SecretType = "nxusd"
	SecretTypeJWT        SecretType = "jwt"
	SecretTypeEncryption SecretType = "encryption"
)

// AEMOCredentials holds AEMO API credentials
type AEMOCredentials struct {
	APIKey            string `json:"api_key"`
	APISecret         string `json:"api_secret"`
	ParticipantID     string `json:"participant_id"`
	CertificatePath   string `json:"certificate_path"`
	CertificateBase64 string `json:"certificate_base64"`
	Environment       string `json:"environment"` // production, sandbox
}

// JEPXCredentials holds JEPX API credentials
type JEPXCredentials struct {
	APIKey        string `json:"api_key"`
	APISecret     string `json:"api_secret"`
	ParticipantID string `json:"participant_id"` // JEPX会員ID
	TradingID     string `json:"trading_id"`
	Environment   string `json:"environment"` // production, sandbox
}

// PolygonCredentials holds Polygon network credentials
type PolygonCredentials struct {
	PrivateKey     string `json:"private_key"`
	AlchemyAPIKey  string `json:"alchemy_api_key"`
	InfuraAPIKey   string `json:"infura_api_key"`
	WalletAddress  string `json:"wallet_address"`
	NetworkID      int64  `json:"network_id"` // 137 for mainnet, 80001 for Mumbai
}

// CachedSecret represents a cached secret with metadata
type CachedSecret struct {
	Value      []byte
	FetchedAt  time.Time
	ExpiresAt  time.Time
	Version    string
}

// Config holds Secret Manager configuration
type Config struct {
	ProjectID      string        `json:"project_id"`
	CacheTTL       time.Duration `json:"cache_ttl"`
	RefreshBuffer  time.Duration `json:"refresh_buffer"`  // Time before expiry to refresh
	MaxRetries     int           `json:"max_retries"`
	RetryDelay     time.Duration `json:"retry_delay"`
	EnableRotation bool          `json:"enable_rotation"`
}

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		CacheTTL:       5 * time.Minute,
		RefreshBuffer:  1 * time.Minute,
		MaxRetries:     3,
		RetryDelay:     1 * time.Second,
		EnableRotation: true,
	}
}

// Manager handles secure secret retrieval and caching
type Manager struct {
	config *Config
	logger *zap.Logger
	client *secretmanager.Client

	// Cache
	mu    sync.RWMutex
	cache map[string]*CachedSecret

	// Background refresh
	ctx    context.Context
	cancel context.CancelFunc
	wg     sync.WaitGroup

	// Secret paths mapping
	secretPaths map[SecretType]string
}

// NewManager creates a new Secret Manager
func NewManager(ctx context.Context, config *Config, logger *zap.Logger) (*Manager, error) {
	if config == nil {
		config = DefaultConfig()
	}

	client, err := secretmanager.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create secret manager client: %w", err)
	}

	mgrCtx, cancel := context.WithCancel(ctx)

	m := &Manager{
		config:      config,
		logger:      logger.Named("secret-manager"),
		client:      client,
		cache:       make(map[string]*CachedSecret),
		ctx:         mgrCtx,
		cancel:      cancel,
		secretPaths: make(map[SecretType]string),
	}

	// Register default secret paths
	m.registerDefaultPaths()

	// Start background refresh
	if config.EnableRotation {
		m.wg.Add(1)
		go m.runBackgroundRefresh()
	}

	return m, nil
}

func (m *Manager) registerDefaultPaths() {
	m.secretPaths = map[SecretType]string{
		SecretTypeAEMO:       "nexus-x-aemo-credentials",
		SecretTypeJEPX:       "nexus-x-jepx-credentials",
		SecretTypePolygon:    "nexus-x-polygon-credentials",
		SecretTypeNXUSD:      "nexus-x-nxusd-signing-key",
		SecretTypeJWT:        "nexus-x-jwt-secret",
		SecretTypeEncryption: "nexus-x-encryption-key",
	}
}

// Close gracefully shuts down the manager
func (m *Manager) Close() error {
	m.cancel()
	m.wg.Wait()
	return m.client.Close()
}

// GetAEMOCredentials retrieves AEMO API credentials
func (m *Manager) GetAEMOCredentials(ctx context.Context) (*AEMOCredentials, error) {
	data, err := m.getSecret(ctx, SecretTypeAEMO)
	if err != nil {
		return nil, fmt.Errorf("failed to get AEMO credentials: %w", err)
	}

	var creds AEMOCredentials
	if err := json.Unmarshal(data, &creds); err != nil {
		return nil, fmt.Errorf("failed to unmarshal AEMO credentials: %w", err)
	}

	m.logger.Debug("Retrieved AEMO credentials",
		zap.String("participant_id", creds.ParticipantID),
		zap.String("environment", creds.Environment))

	return &creds, nil
}

// GetJEPXCredentials retrieves JEPX API credentials
func (m *Manager) GetJEPXCredentials(ctx context.Context) (*JEPXCredentials, error) {
	data, err := m.getSecret(ctx, SecretTypeJEPX)
	if err != nil {
		return nil, fmt.Errorf("failed to get JEPX credentials: %w", err)
	}

	var creds JEPXCredentials
	if err := json.Unmarshal(data, &creds); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JEPX credentials: %w", err)
	}

	m.logger.Debug("Retrieved JEPX credentials",
		zap.String("participant_id", creds.ParticipantID),
		zap.String("environment", creds.Environment))

	return &creds, nil
}

// GetPolygonCredentials retrieves Polygon network credentials
func (m *Manager) GetPolygonCredentials(ctx context.Context) (*PolygonCredentials, error) {
	data, err := m.getSecret(ctx, SecretTypePolygon)
	if err != nil {
		return nil, fmt.Errorf("failed to get Polygon credentials: %w", err)
	}

	var creds PolygonCredentials
	if err := json.Unmarshal(data, &creds); err != nil {
		return nil, fmt.Errorf("failed to unmarshal Polygon credentials: %w", err)
	}

	m.logger.Debug("Retrieved Polygon credentials",
		zap.String("wallet_address", creds.WalletAddress),
		zap.Int64("network_id", creds.NetworkID))

	return &creds, nil
}

// GetRawSecret retrieves a raw secret by type
func (m *Manager) GetRawSecret(ctx context.Context, secretType SecretType) ([]byte, error) {
	return m.getSecret(ctx, secretType)
}

// getSecret retrieves a secret with caching
func (m *Manager) getSecret(ctx context.Context, secretType SecretType) ([]byte, error) {
	secretPath, ok := m.secretPaths[secretType]
	if !ok {
		return nil, fmt.Errorf("unknown secret type: %s", secretType)
	}

	// Check cache first
	m.mu.RLock()
	cached, exists := m.cache[secretPath]
	m.mu.RUnlock()

	if exists && time.Now().Before(cached.ExpiresAt) {
		m.logger.Debug("Secret cache hit", zap.String("secret", secretPath))
		return cached.Value, nil
	}

	// Fetch from Secret Manager
	m.logger.Debug("Fetching secret from Secret Manager", zap.String("secret", secretPath))

	var lastErr error
	for i := 0; i < m.config.MaxRetries; i++ {
		data, version, err := m.fetchSecret(ctx, secretPath)
		if err == nil {
			// Update cache
			m.mu.Lock()
			m.cache[secretPath] = &CachedSecret{
				Value:     data,
				FetchedAt: time.Now(),
				ExpiresAt: time.Now().Add(m.config.CacheTTL),
				Version:   version,
			}
			m.mu.Unlock()

			m.logger.Info("Secret fetched and cached",
				zap.String("secret", secretPath),
				zap.String("version", version))

			return data, nil
		}

		lastErr = err
		m.logger.Warn("Secret fetch attempt failed",
			zap.String("secret", secretPath),
			zap.Int("attempt", i+1),
			zap.Error(err))

		time.Sleep(m.config.RetryDelay)
	}

	return nil, fmt.Errorf("failed to fetch secret after %d retries: %w", m.config.MaxRetries, lastErr)
}

func (m *Manager) fetchSecret(ctx context.Context, secretID string) ([]byte, string, error) {
	name := fmt.Sprintf("projects/%s/secrets/%s/versions/latest", m.config.ProjectID, secretID)

	result, err := m.client.AccessSecretVersion(ctx, &secretmanagerpb.AccessSecretVersionRequest{
		Name: name,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to access secret version: %w", err)
	}

	// Extract version from name (format: projects/xxx/secrets/xxx/versions/N)
	version := result.Name

	return result.Payload.Data, version, nil
}

// runBackgroundRefresh refreshes secrets before they expire
func (m *Manager) runBackgroundRefresh() {
	defer m.wg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.refreshExpiringSecrets()
		}
	}
}

func (m *Manager) refreshExpiringSecrets() {
	m.mu.RLock()
	secretsToRefresh := make([]string, 0)
	refreshThreshold := time.Now().Add(m.config.RefreshBuffer)

	for secretPath, cached := range m.cache {
		if cached.ExpiresAt.Before(refreshThreshold) {
			secretsToRefresh = append(secretsToRefresh, secretPath)
		}
	}
	m.mu.RUnlock()

	for _, secretPath := range secretsToRefresh {
		m.logger.Info("Proactively refreshing expiring secret", zap.String("secret", secretPath))

		data, version, err := m.fetchSecret(m.ctx, secretPath)
		if err != nil {
			m.logger.Error("Failed to refresh secret", zap.String("secret", secretPath), zap.Error(err))
			continue
		}

		m.mu.Lock()
		m.cache[secretPath] = &CachedSecret{
			Value:     data,
			FetchedAt: time.Now(),
			ExpiresAt: time.Now().Add(m.config.CacheTTL),
			Version:   version,
		}
		m.mu.Unlock()

		m.logger.Info("Secret refreshed successfully",
			zap.String("secret", secretPath),
			zap.String("version", version))
	}
}

// InvalidateCache invalidates all cached secrets
func (m *Manager) InvalidateCache() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.cache = make(map[string]*CachedSecret)
	m.logger.Info("Secret cache invalidated")
}

// InvalidateSecret invalidates a specific secret
func (m *Manager) InvalidateSecret(secretType SecretType) {
	secretPath, ok := m.secretPaths[secretType]
	if !ok {
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.cache, secretPath)
	m.logger.Info("Secret invalidated", zap.String("secret", secretPath))
}

// RotateSecret triggers a secret rotation (for secrets we control)
func (m *Manager) RotateSecret(ctx context.Context, secretType SecretType, newValue []byte) error {
	secretPath, ok := m.secretPaths[secretType]
	if !ok {
		return fmt.Errorf("unknown secret type: %s", secretType)
	}

	parent := fmt.Sprintf("projects/%s/secrets/%s", m.config.ProjectID, secretPath)

	_, err := m.client.AddSecretVersion(ctx, &secretmanagerpb.AddSecretVersionRequest{
		Parent: parent,
		Payload: &secretmanagerpb.SecretPayload{
			Data: newValue,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to add new secret version: %w", err)
	}

	// Invalidate cache to force fetch of new version
	m.InvalidateSecret(secretType)

	m.logger.Info("Secret rotated successfully", zap.String("secret", secretPath))
	return nil
}

// HealthCheck verifies Secret Manager connectivity
func (m *Manager) HealthCheck(ctx context.Context) error {
	// Try to list secrets (limited to 1) to verify connectivity
	parent := fmt.Sprintf("projects/%s", m.config.ProjectID)

	req := &secretmanagerpb.ListSecretsRequest{
		Parent:   parent,
		PageSize: 1,
	}

	it := m.client.ListSecrets(ctx, req)
	_, err := it.Next()
	if err != nil && err.Error() != "no more items in iterator" {
		return fmt.Errorf("secret manager health check failed: %w", err)
	}

	return nil
}

// SecretInjector provides secrets to adapters
type SecretInjector struct {
	manager *Manager
	logger  *zap.Logger
}

// NewSecretInjector creates a new secret injector
func NewSecretInjector(manager *Manager, logger *zap.Logger) *SecretInjector {
	return &SecretInjector{
		manager: manager,
		logger:  logger.Named("secret-injector"),
	}
}

// InjectAEMOConfig injects AEMO credentials into adapter config
func (si *SecretInjector) InjectAEMOConfig(ctx context.Context, config interface{}) error {
	creds, err := si.manager.GetAEMOCredentials(ctx)
	if err != nil {
		return err
	}

	// Use reflection or type assertion to inject
	type AEMOConfigurable interface {
		SetCredentials(apiKey, apiSecret, participantID string)
	}

	if configurable, ok := config.(AEMOConfigurable); ok {
		configurable.SetCredentials(creds.APIKey, creds.APISecret, creds.ParticipantID)
		si.logger.Info("AEMO credentials injected successfully")
	}

	return nil
}

// InjectJEPXConfig injects JEPX credentials into adapter config
func (si *SecretInjector) InjectJEPXConfig(ctx context.Context, config interface{}) error {
	creds, err := si.manager.GetJEPXCredentials(ctx)
	if err != nil {
		return err
	}

	type JEPXConfigurable interface {
		SetCredentials(apiKey, apiSecret, participantID, tradingID string)
	}

	if configurable, ok := config.(JEPXConfigurable); ok {
		configurable.SetCredentials(creds.APIKey, creds.APISecret, creds.ParticipantID, creds.TradingID)
		si.logger.Info("JEPX credentials injected successfully")
	}

	return nil
}
