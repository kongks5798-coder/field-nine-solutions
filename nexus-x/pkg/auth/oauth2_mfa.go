// Package auth provides OAuth2 + MFA enforcement for NEXUS-X platform.
//
// Security Architecture:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    Zero-Trust Authentication Flow                           │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐           │
// │  │ Request │ ──▶  │ OAuth2  │ ──▶  │  MFA    │ ──▶  │ Access  │           │
// │  └─────────┘      │  Token  │      │ Verify  │      │ Granted │           │
// │                   └─────────┘      └─────────┘      └─────────┘           │
// │                        │                │                                   │
// │                        ▼                ▼                                   │
// │                   ┌─────────┐      ┌─────────┐                             │
// │                   │ Refresh │      │  TOTP   │                             │
// │                   │ Token   │      │ / WebA  │                             │
// │                   └─────────┘      └─────────┘                             │
// │                                                                             │
// │  MFA Methods:                                                               │
// │  • TOTP (Time-based One-Time Password) - Authenticator apps               │
// │  • WebAuthn/FIDO2 - Hardware security keys                                │
// │  • Push Notification - Mobile app confirmation                            │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package auth

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base32"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pquerna/otp/totp"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrMFARequired        = errors.New("MFA verification required")
	ErrMFAInvalid         = errors.New("invalid MFA code")
	ErrInsufficientScope  = errors.New("insufficient permission scope")
	ErrUserNotFound       = errors.New("user not found")
	ErrSessionExpired     = errors.New("session expired")
	ErrRateLimitExceeded  = errors.New("rate limit exceeded")
)

// UserRole defines access levels
type UserRole string

const (
	RoleCEO            UserRole = "CEO"
	RoleAdmin          UserRole = "ADMIN"
	RoleTrader         UserRole = "TRADER"
	RoleAnalyst        UserRole = "ANALYST"
	RoleAuditor        UserRole = "AUDITOR"
	RoleInstitutional  UserRole = "INSTITUTIONAL"
)

// Permission scopes
type Permission string

const (
	PermReadDashboard     Permission = "dashboard:read"
	PermWriteDashboard    Permission = "dashboard:write"
	PermReadPositions     Permission = "positions:read"
	PermWritePositions    Permission = "positions:write"
	PermExecuteTrades     Permission = "trades:execute"
	PermReadSensitive     Permission = "sensitive:read"
	PermWriteSensitive    Permission = "sensitive:write"
	PermAdminKillSwitch   Permission = "admin:killswitch"
	PermAdminConfig       Permission = "admin:config"
)

// RolePermissions defines permissions for each role
var RolePermissions = map[UserRole][]Permission{
	RoleCEO: {
		PermReadDashboard, PermWriteDashboard,
		PermReadPositions, PermWritePositions,
		PermExecuteTrades, PermReadSensitive, PermWriteSensitive,
		PermAdminKillSwitch, PermAdminConfig,
	},
	RoleAdmin: {
		PermReadDashboard, PermWriteDashboard,
		PermReadPositions, PermWritePositions,
		PermExecuteTrades, PermReadSensitive,
		PermAdminConfig,
	},
	RoleTrader: {
		PermReadDashboard, PermReadPositions,
		PermExecuteTrades,
	},
	RoleAnalyst: {
		PermReadDashboard, PermReadPositions,
	},
	RoleAuditor: {
		PermReadDashboard, PermReadPositions, PermReadSensitive,
	},
	RoleInstitutional: {
		PermReadDashboard, PermReadPositions,
	},
}

// User represents an authenticated user
type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Role          UserRole  `json:"role"`
	MFAEnabled    bool      `json:"mfa_enabled"`
	MFASecret     string    `json:"-"` // Never expose
	MFAVerified   bool      `json:"mfa_verified"`
	WebAuthnCreds []byte    `json:"-"` // WebAuthn credentials
	LastLogin     time.Time `json:"last_login"`
	CreatedAt     time.Time `json:"created_at"`
}

// Session represents an authenticated session
type Session struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	MFAVerified  bool      `json:"mfa_verified"`
	IPAddress    string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	CreatedAt    time.Time `json:"created_at"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// JWTClaims represents JWT token claims
type JWTClaims struct {
	UserID      string     `json:"uid"`
	Email       string     `json:"email"`
	Role        UserRole   `json:"role"`
	MFAVerified bool       `json:"mfa"`
	Permissions []Permission `json:"perms"`
	SessionID   string     `json:"sid"`
	jwt.RegisteredClaims
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecret           []byte
	AccessTokenTTL      time.Duration
	RefreshTokenTTL     time.Duration
	MFACodeTTL          time.Duration
	MaxLoginAttempts    int
	LockoutDuration     time.Duration
	RequireMFAForRoles  []UserRole
	AllowedOrigins      []string
	SessionStore        SessionStore
	UserStore           UserStore
}

// DefaultAuthConfig returns production-ready defaults
func DefaultAuthConfig() *AuthConfig {
	return &AuthConfig{
		AccessTokenTTL:     15 * time.Minute,
		RefreshTokenTTL:    7 * 24 * time.Hour,
		MFACodeTTL:         30 * time.Second,
		MaxLoginAttempts:   5,
		LockoutDuration:    15 * time.Minute,
		RequireMFAForRoles: []UserRole{RoleCEO, RoleAdmin, RoleTrader},
		AllowedOrigins: []string{
			"https://dashboard.nexus-x.io",
			"https://m.nexus-x.io",
		},
	}
}

// SessionStore interface for session persistence
type SessionStore interface {
	Create(ctx context.Context, session *Session) error
	Get(ctx context.Context, sessionID string) (*Session, error)
	Delete(ctx context.Context, sessionID string) error
	DeleteAllForUser(ctx context.Context, userID string) error
}

// UserStore interface for user persistence
type UserStore interface {
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
	UpdateMFA(ctx context.Context, userID string, secret string, enabled bool) error
	UpdateLastLogin(ctx context.Context, userID string, timestamp time.Time) error
}

// AuthManager handles OAuth2 + MFA authentication
type AuthManager struct {
	config        *AuthConfig
	logger        *zap.Logger
	rateLimiter   *RateLimiter
	mu            sync.RWMutex
}

// NewAuthManager creates a new authentication manager
func NewAuthManager(config *AuthConfig, logger *zap.Logger) *AuthManager {
	if config == nil {
		config = DefaultAuthConfig()
	}

	return &AuthManager{
		config:      config,
		logger:      logger.Named("auth"),
		rateLimiter: NewRateLimiter(config.MaxLoginAttempts, config.LockoutDuration),
	}
}

// GenerateAccessToken creates a JWT access token
func (am *AuthManager) GenerateAccessToken(user *User, sessionID string, mfaVerified bool) (string, error) {
	permissions := RolePermissions[user.Role]

	claims := JWTClaims{
		UserID:      user.ID,
		Email:       user.Email,
		Role:        user.Role,
		MFAVerified: mfaVerified,
		Permissions: permissions,
		SessionID:   sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(am.config.AccessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "nexus-x",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(am.config.JWTSecret)
}

// GenerateRefreshToken creates a refresh token
func (am *AuthManager) GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base32.StdEncoding.EncodeToString(bytes), nil
}

// ValidateToken validates and parses a JWT token
func (am *AuthManager) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return am.config.JWTSecret, nil
	})

	if err != nil {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// SetupMFA generates a new TOTP secret for a user
func (am *AuthManager) SetupMFA(ctx context.Context, userID, email string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "NEXUS-X",
		AccountName: email,
		Period:      30,
		Digits:      6,
		Algorithm:   0, // SHA1
	})

	if err != nil {
		return "", "", fmt.Errorf("failed to generate TOTP key: %w", err)
	}

	// Store the secret
	if err := am.config.UserStore.UpdateMFA(ctx, userID, key.Secret(), false); err != nil {
		return "", "", fmt.Errorf("failed to store MFA secret: %w", err)
	}

	// Return secret and QR code URL
	return key.Secret(), key.URL(), nil
}

// VerifyMFA validates a TOTP code
func (am *AuthManager) VerifyMFA(ctx context.Context, userID, code string) error {
	user, err := am.config.UserStore.GetByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}

	if !user.MFAEnabled {
		return nil // MFA not required
	}

	valid := totp.Validate(code, user.MFASecret)
	if !valid {
		am.logger.Warn("Invalid MFA code attempt",
			zap.String("user_id", userID))
		return ErrMFAInvalid
	}

	return nil
}

// EnableMFA enables MFA after first successful verification
func (am *AuthManager) EnableMFA(ctx context.Context, userID, code string) error {
	user, err := am.config.UserStore.GetByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}

	valid := totp.Validate(code, user.MFASecret)
	if !valid {
		return ErrMFAInvalid
	}

	return am.config.UserStore.UpdateMFA(ctx, userID, user.MFASecret, true)
}

// RequiresMFA checks if a role requires MFA
func (am *AuthManager) RequiresMFA(role UserRole) bool {
	for _, r := range am.config.RequireMFAForRoles {
		if r == role {
			return true
		}
	}
	return false
}

// HasPermission checks if a user has a specific permission
func (am *AuthManager) HasPermission(claims *JWTClaims, perm Permission) bool {
	for _, p := range claims.Permissions {
		if p == perm {
			return true
		}
	}
	return false
}

// AuthMiddleware creates an HTTP middleware for authentication
func (am *AuthManager) AuthMiddleware(requiredPerms ...Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				am.sendError(w, http.StatusUnauthorized, "Missing authorization header")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				am.sendError(w, http.StatusUnauthorized, "Invalid authorization header format")
				return
			}

			// Validate token
			claims, err := am.ValidateToken(parts[1])
			if err != nil {
				am.sendError(w, http.StatusUnauthorized, "Invalid or expired token")
				return
			}

			// Check MFA requirement
			if am.RequiresMFA(claims.Role) && !claims.MFAVerified {
				am.sendError(w, http.StatusForbidden, "MFA verification required")
				return
			}

			// Check required permissions
			for _, perm := range requiredPerms {
				if !am.HasPermission(claims, perm) {
					am.logger.Warn("Permission denied",
						zap.String("user_id", claims.UserID),
						zap.String("permission", string(perm)))
					am.sendError(w, http.StatusForbidden, "Insufficient permissions")
					return
				}
			}

			// Add claims to context
			ctx := context.WithValue(r.Context(), "claims", claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// MFAMiddleware enforces MFA verification
func (am *AuthManager) MFAMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := r.Context().Value("claims").(*JWTClaims)

			if am.RequiresMFA(claims.Role) && !claims.MFAVerified {
				am.sendError(w, http.StatusForbidden, "MFA verification required")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (am *AuthManager) sendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// RateLimiter prevents brute force attacks
type RateLimiter struct {
	attempts     map[string]int
	lockouts     map[string]time.Time
	maxAttempts  int
	lockoutDuration time.Duration
	mu           sync.RWMutex
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(maxAttempts int, lockoutDuration time.Duration) *RateLimiter {
	return &RateLimiter{
		attempts:        make(map[string]int),
		lockouts:        make(map[string]time.Time),
		maxAttempts:     maxAttempts,
		lockoutDuration: lockoutDuration,
	}
}

// CheckAndIncrement checks rate limit and increments counter
func (rl *RateLimiter) CheckAndIncrement(key string) error {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Check if locked out
	if lockoutTime, ok := rl.lockouts[key]; ok {
		if time.Now().Before(lockoutTime) {
			return ErrRateLimitExceeded
		}
		// Lockout expired, reset
		delete(rl.lockouts, key)
		delete(rl.attempts, key)
	}

	// Increment attempts
	rl.attempts[key]++

	// Check if should lock out
	if rl.attempts[key] >= rl.maxAttempts {
		rl.lockouts[key] = time.Now().Add(rl.lockoutDuration)
		return ErrRateLimitExceeded
	}

	return nil
}

// Reset clears attempts for a key
func (rl *RateLimiter) Reset(key string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	delete(rl.attempts, key)
	delete(rl.lockouts, key)
}

// PasswordHasher provides secure password hashing
type PasswordHasher struct {
	cost int
}

// NewPasswordHasher creates a new hasher with bcrypt cost
func NewPasswordHasher(cost int) *PasswordHasher {
	if cost < bcrypt.MinCost {
		cost = bcrypt.DefaultCost
	}
	return &PasswordHasher{cost: cost}
}

// Hash hashes a password
func (ph *PasswordHasher) Hash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), ph.cost)
	return string(bytes), err
}

// Compare compares a password with a hash using constant-time comparison
func (ph *PasswordHasher) Compare(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// SecureCompare performs constant-time comparison
func SecureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
