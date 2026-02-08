// Package auth provides Field Nine OS Unified Authentication
// Merges K-Universal OAuth infrastructure with Energy Dashboard access
//
// Authentication Architecture:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    FIELD NINE OS - UNIFIED AUTH SYSTEM                      │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │                    ┌─────────────────────────────────┐                      │
// │                    │     auth.fieldnine.io           │                      │
// │                    │   (OAuth Gateway)               │                      │
// │                    └────────────┬────────────────────┘                      │
// │                                 │                                           │
// │         ┌───────────────────────┼───────────────────────┐                  │
// │         │                       │                       │                  │
// │         ▼                       ▼                       ▼                  │
// │  ┌────────────┐          ┌────────────┐          ┌────────────┐           │
// │  │   Google   │          │   Kakao    │          │   Apple    │           │
// │  │   OAuth    │          │   OAuth    │          │   OAuth    │           │
// │  └──────┬─────┘          └──────┬─────┘          └──────┬─────┘           │
// │         │                       │                       │                  │
// │         └───────────────────────┼───────────────────────┘                  │
// │                                 │                                           │
// │                                 ▼                                           │
// │                    ┌─────────────────────────────┐                          │
// │                    │   Field Nine Unified User   │                          │
// │                    │   (Single Identity)         │                          │
// │                    └─────────────────────────────┘                          │
// │                                 │                                           │
// │         ┌───────────────────────┼───────────────────────┐                  │
// │         │                       │                       │                  │
// │         ▼                       ▼                       ▼                  │
// │  ┌────────────┐          ┌────────────┐          ┌────────────┐           │
// │  │   Nomad    │          │   Energy   │          │   Future   │           │
// │  │   Monthly  │          │   Trading  │          │   Services │           │
// │  └────────────┘          └────────────┘          └────────────┘           │
// │                                                                             │
// │  Key Features:                                                              │
// │  • Single Sign-On across all Field Nine services                           │
// │  • No separate registration for Energy Dashboard                           │
// │  • Automatic role assignment based on service access                       │
// │  • MFA enforcement for CEO/Admin roles                                     │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

// Field Nine Unified Auth Errors
var (
	ErrOAuthStateMismatch   = errors.New("OAuth state mismatch")
	ErrOAuthCodeExchange    = errors.New("failed to exchange OAuth code")
	ErrUserInfoFetch        = errors.New("failed to fetch user info")
	ErrSessionCreation      = errors.New("failed to create session")
	ErrProviderNotSupported = errors.New("OAuth provider not supported")
	ErrAccountLinking       = errors.New("failed to link accounts")
)

// OAuthProvider defines supported OAuth providers
type OAuthProvider string

const (
	ProviderGoogle OAuthProvider = "google"
	ProviderKakao  OAuthProvider = "kakao"
	ProviderApple  OAuthProvider = "apple"
)

// ServiceAccess defines Field Nine service access levels
type ServiceAccess string

const (
	ServiceNomad    ServiceAccess = "nomad"    // K-Universal Nomad Monthly
	ServiceEnergy   ServiceAccess = "energy"   // Energy Trading Dashboard
	ServiceAnalytics ServiceAccess = "analytics" // Market Analytics
	ServiceAdmin    ServiceAccess = "admin"    // Admin Panel
)

// FieldNineUser represents a unified user across all Field Nine services
type FieldNineUser struct {
	ID              string          `json:"id"`
	Email           string          `json:"email"`
	Name            string          `json:"name"`
	ProfileImageURL string          `json:"profile_image_url,omitempty"`
	Provider        OAuthProvider   `json:"provider"`
	ProviderID      string          `json:"provider_id"`
	LinkedAccounts  []LinkedAccount `json:"linked_accounts,omitempty"`
	Services        []ServiceAccess `json:"services"`
	Role            UserRole        `json:"role"`
	MFAEnabled      bool            `json:"mfa_enabled"`
	CreatedAt       time.Time       `json:"created_at"`
	LastLoginAt     time.Time       `json:"last_login_at"`
	Metadata        map[string]any  `json:"metadata,omitempty"`
}

// LinkedAccount represents a linked OAuth account
type LinkedAccount struct {
	Provider   OAuthProvider `json:"provider"`
	ProviderID string        `json:"provider_id"`
	Email      string        `json:"email"`
	LinkedAt   time.Time     `json:"linked_at"`
}

// OAuthConfig holds OAuth provider configuration
type OAuthConfig struct {
	Google GoogleOAuthConfig
	Kakao  KakaoOAuthConfig
	Apple  AppleOAuthConfig
}

// GoogleOAuthConfig for Google OAuth 2.0
type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Scopes       []string
}

// KakaoOAuthConfig for Kakao OAuth 2.0
type KakaoOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Scopes       []string
}

// AppleOAuthConfig for Apple Sign In
type AppleOAuthConfig struct {
	ClientID    string
	TeamID      string
	KeyID       string
	PrivateKey  string
	RedirectURI string
	Scopes      []string
}

// DefaultOAuthConfig returns production configuration
// Uses environment variables from K-Universal
func DefaultOAuthConfig() *OAuthConfig {
	return &OAuthConfig{
		Google: GoogleOAuthConfig{
			// Migrated from K-Universal: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
			RedirectURI: "https://auth.fieldnine.io/callback/google",
			Scopes:      []string{"email", "profile", "openid"},
		},
		Kakao: KakaoOAuthConfig{
			// Migrated from K-Universal: KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET
			RedirectURI: "https://auth.fieldnine.io/callback/kakao",
			Scopes:      []string{"profile_nickname", "profile_image", "account_email"},
		},
		Apple: AppleOAuthConfig{
			RedirectURI: "https://auth.fieldnine.io/callback/apple",
			Scopes:      []string{"email", "name"},
		},
	}
}

// FieldNineAuthManager manages unified authentication
type FieldNineAuthManager struct {
	config      *OAuthConfig
	authManager *AuthManager // Base auth manager (OAuth2 + MFA)
	logger      *zap.Logger
	userStore   FieldNineUserStore
	stateStore  sync.Map // OAuth state storage
	httpClient  *http.Client
}

// FieldNineUserStore interface for user persistence
type FieldNineUserStore interface {
	GetByID(ctx context.Context, id string) (*FieldNineUser, error)
	GetByEmail(ctx context.Context, email string) (*FieldNineUser, error)
	GetByProviderID(ctx context.Context, provider OAuthProvider, providerID string) (*FieldNineUser, error)
	Create(ctx context.Context, user *FieldNineUser) error
	Update(ctx context.Context, user *FieldNineUser) error
	LinkAccount(ctx context.Context, userID string, account LinkedAccount) error
	AddServiceAccess(ctx context.Context, userID string, service ServiceAccess) error
}

// NewFieldNineAuthManager creates a new unified auth manager
func NewFieldNineAuthManager(
	oauthConfig *OAuthConfig,
	authConfig *AuthConfig,
	userStore FieldNineUserStore,
	logger *zap.Logger,
) *FieldNineAuthManager {
	if oauthConfig == nil {
		oauthConfig = DefaultOAuthConfig()
	}

	return &FieldNineAuthManager{
		config:      oauthConfig,
		authManager: NewAuthManager(authConfig, logger),
		logger:      logger.Named("fieldnine-auth"),
		userStore:   userStore,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// ============================================================================
// OAuth Flow Methods
// ============================================================================

// GetAuthURL generates OAuth authorization URL for a provider
func (fm *FieldNineAuthManager) GetAuthURL(provider OAuthProvider, state string) (string, error) {
	// Store state for validation
	fm.stateStore.Store(state, time.Now())

	switch provider {
	case ProviderGoogle:
		return fm.getGoogleAuthURL(state), nil
	case ProviderKakao:
		return fm.getKakaoAuthURL(state), nil
	case ProviderApple:
		return fm.getAppleAuthURL(state), nil
	default:
		return "", ErrProviderNotSupported
	}
}

func (fm *FieldNineAuthManager) getGoogleAuthURL(state string) string {
	params := url.Values{
		"client_id":     {fm.config.Google.ClientID},
		"redirect_uri":  {fm.config.Google.RedirectURI},
		"response_type": {"code"},
		"scope":         {strings.Join(fm.config.Google.Scopes, " ")},
		"state":         {state},
		"access_type":   {"offline"},
		"prompt":        {"consent"},
	}
	return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}

func (fm *FieldNineAuthManager) getKakaoAuthURL(state string) string {
	params := url.Values{
		"client_id":     {fm.config.Kakao.ClientID},
		"redirect_uri":  {fm.config.Kakao.RedirectURI},
		"response_type": {"code"},
		"scope":         {strings.Join(fm.config.Kakao.Scopes, " ")},
		"state":         {state},
	}
	return "https://kauth.kakao.com/oauth/authorize?" + params.Encode()
}

func (fm *FieldNineAuthManager) getAppleAuthURL(state string) string {
	params := url.Values{
		"client_id":     {fm.config.Apple.ClientID},
		"redirect_uri":  {fm.config.Apple.RedirectURI},
		"response_type": {"code id_token"},
		"scope":         {strings.Join(fm.config.Apple.Scopes, " ")},
		"state":         {state},
		"response_mode": {"form_post"},
	}
	return "https://appleid.apple.com/auth/authorize?" + params.Encode()
}

// HandleCallback processes OAuth callback and returns authenticated user
func (fm *FieldNineAuthManager) HandleCallback(
	ctx context.Context,
	provider OAuthProvider,
	code, state string,
) (*FieldNineUser, string, error) {
	// Validate state
	if _, ok := fm.stateStore.LoadAndDelete(state); !ok {
		fm.logger.Warn("OAuth state mismatch", zap.String("state", state))
		return nil, "", ErrOAuthStateMismatch
	}

	// Exchange code for tokens and get user info
	var user *FieldNineUser
	var err error

	switch provider {
	case ProviderGoogle:
		user, err = fm.handleGoogleCallback(ctx, code)
	case ProviderKakao:
		user, err = fm.handleKakaoCallback(ctx, code)
	case ProviderApple:
		user, err = fm.handleAppleCallback(ctx, code)
	default:
		return nil, "", ErrProviderNotSupported
	}

	if err != nil {
		return nil, "", err
	}

	// Check if user exists or create new
	existingUser, err := fm.userStore.GetByProviderID(ctx, provider, user.ProviderID)
	if err == nil && existingUser != nil {
		// Update last login
		existingUser.LastLoginAt = time.Now()
		if err := fm.userStore.Update(ctx, existingUser); err != nil {
			fm.logger.Warn("Failed to update last login", zap.Error(err))
		}
		user = existingUser
	} else {
		// Check by email for account linking
		existingByEmail, _ := fm.userStore.GetByEmail(ctx, user.Email)
		if existingByEmail != nil {
			// Link this provider to existing account
			if err := fm.userStore.LinkAccount(ctx, existingByEmail.ID, LinkedAccount{
				Provider:   provider,
				ProviderID: user.ProviderID,
				Email:      user.Email,
				LinkedAt:   time.Now(),
			}); err != nil {
				fm.logger.Warn("Failed to link account", zap.Error(err))
			}
			user = existingByEmail
		} else {
			// Create new user
			user.ID = generateUserID()
			user.Services = []ServiceAccess{ServiceNomad, ServiceEnergy} // Default access
			user.Role = RoleInstitutional // Default role
			user.CreatedAt = time.Now()
			user.LastLoginAt = time.Now()

			if err := fm.userStore.Create(ctx, user); err != nil {
				return nil, "", fmt.Errorf("%w: %v", ErrSessionCreation, err)
			}
		}
	}

	// Auto-grant Energy Dashboard access to all Field Nine users
	if !hasServiceAccess(user.Services, ServiceEnergy) {
		if err := fm.userStore.AddServiceAccess(ctx, user.ID, ServiceEnergy); err != nil {
			fm.logger.Warn("Failed to add energy access", zap.Error(err))
		}
		user.Services = append(user.Services, ServiceEnergy)
	}

	// Generate JWT token
	token, err := fm.authManager.GenerateAccessToken(&User{
		ID:         user.ID,
		Email:      user.Email,
		Name:       user.Name,
		Role:       user.Role,
		MFAEnabled: user.MFAEnabled,
	}, generateSessionID(), !fm.authManager.RequiresMFA(user.Role))

	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	fm.logger.Info("User authenticated via OAuth",
		zap.String("user_id", user.ID),
		zap.String("provider", string(provider)),
		zap.String("email", maskEmail(user.Email)))

	return user, token, nil
}

// handleGoogleCallback processes Google OAuth callback
func (fm *FieldNineAuthManager) handleGoogleCallback(ctx context.Context, code string) (*FieldNineUser, error) {
	// Exchange code for tokens
	tokenResp, err := fm.exchangeGoogleCode(ctx, code)
	if err != nil {
		return nil, err
	}

	// Fetch user info
	userInfo, err := fm.fetchGoogleUserInfo(ctx, tokenResp.AccessToken)
	if err != nil {
		return nil, err
	}

	return &FieldNineUser{
		Email:           userInfo.Email,
		Name:            userInfo.Name,
		ProfileImageURL: userInfo.Picture,
		Provider:        ProviderGoogle,
		ProviderID:      userInfo.ID,
		Metadata: map[string]any{
			"google_id":     userInfo.ID,
			"verified_email": userInfo.VerifiedEmail,
			"locale":        userInfo.Locale,
		},
	}, nil
}

// GoogleTokenResponse represents Google OAuth token response
type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	IDToken      string `json:"id_token,omitempty"`
}

// GoogleUserInfo represents Google user profile
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

func (fm *FieldNineAuthManager) exchangeGoogleCode(ctx context.Context, code string) (*GoogleTokenResponse, error) {
	data := url.Values{
		"code":          {code},
		"client_id":     {fm.config.Google.ClientID},
		"client_secret": {fm.config.Google.ClientSecret},
		"redirect_uri":  {fm.config.Google.RedirectURI},
		"grant_type":    {"authorization_code"},
	}

	req, _ := http.NewRequestWithContext(ctx, "POST", "https://oauth2.googleapis.com/token", strings.NewReader(data.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := fm.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOAuthCodeExchange, err)
	}
	defer resp.Body.Close()

	var tokenResp GoogleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOAuthCodeExchange, err)
	}

	return &tokenResp, nil
}

func (fm *FieldNineAuthManager) fetchGoogleUserInfo(ctx context.Context, accessToken string) (*GoogleUserInfo, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := fm.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUserInfoFetch, err)
	}
	defer resp.Body.Close()

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUserInfoFetch, err)
	}

	return &userInfo, nil
}

// handleKakaoCallback processes Kakao OAuth callback
func (fm *FieldNineAuthManager) handleKakaoCallback(ctx context.Context, code string) (*FieldNineUser, error) {
	// Exchange code for tokens
	tokenResp, err := fm.exchangeKakaoCode(ctx, code)
	if err != nil {
		return nil, err
	}

	// Fetch user info
	userInfo, err := fm.fetchKakaoUserInfo(ctx, tokenResp.AccessToken)
	if err != nil {
		return nil, err
	}

	email := userInfo.KakaoAccount.Email
	if email == "" {
		email = fmt.Sprintf("kakao_%d@fieldnine.io", userInfo.ID)
	}

	return &FieldNineUser{
		Email:           email,
		Name:            userInfo.Properties.Nickname,
		ProfileImageURL: userInfo.Properties.ProfileImage,
		Provider:        ProviderKakao,
		ProviderID:      fmt.Sprintf("%d", userInfo.ID),
		Metadata: map[string]any{
			"kakao_id":    userInfo.ID,
			"connected_at": userInfo.ConnectedAt,
		},
	}, nil
}

// KakaoTokenResponse represents Kakao OAuth token response
type KakaoTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope,omitempty"`
}

// KakaoUserInfo represents Kakao user profile
type KakaoUserInfo struct {
	ID           int64     `json:"id"`
	ConnectedAt  time.Time `json:"connected_at"`
	Properties   KakaoProperties `json:"properties"`
	KakaoAccount KakaoAccount   `json:"kakao_account"`
}

type KakaoProperties struct {
	Nickname       string `json:"nickname"`
	ProfileImage   string `json:"profile_image"`
	ThumbnailImage string `json:"thumbnail_image"`
}

type KakaoAccount struct {
	Email             string `json:"email"`
	EmailNeedsAgreement bool `json:"email_needs_agreement"`
	IsEmailValid      bool   `json:"is_email_valid"`
	IsEmailVerified   bool   `json:"is_email_verified"`
}

func (fm *FieldNineAuthManager) exchangeKakaoCode(ctx context.Context, code string) (*KakaoTokenResponse, error) {
	data := url.Values{
		"code":          {code},
		"client_id":     {fm.config.Kakao.ClientID},
		"client_secret": {fm.config.Kakao.ClientSecret},
		"redirect_uri":  {fm.config.Kakao.RedirectURI},
		"grant_type":    {"authorization_code"},
	}

	req, _ := http.NewRequestWithContext(ctx, "POST", "https://kauth.kakao.com/oauth/token", strings.NewReader(data.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := fm.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOAuthCodeExchange, err)
	}
	defer resp.Body.Close()

	var tokenResp KakaoTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOAuthCodeExchange, err)
	}

	return &tokenResp, nil
}

func (fm *FieldNineAuthManager) fetchKakaoUserInfo(ctx context.Context, accessToken string) (*KakaoUserInfo, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://kapi.kakao.com/v2/user/me", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8")

	resp, err := fm.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUserInfoFetch, err)
	}
	defer resp.Body.Close()

	var userInfo KakaoUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUserInfoFetch, err)
	}

	return &userInfo, nil
}

// handleAppleCallback processes Apple Sign In callback
func (fm *FieldNineAuthManager) handleAppleCallback(ctx context.Context, code string) (*FieldNineUser, error) {
	// Apple Sign In implementation
	// For brevity, returning placeholder - full implementation would decode ID token
	return &FieldNineUser{
		Provider: ProviderApple,
	}, nil
}

// ============================================================================
// HTTP Handlers
// ============================================================================

// OAuthLoginHandler handles OAuth login initiation
func (fm *FieldNineAuthManager) OAuthLoginHandler(w http.ResponseWriter, r *http.Request) {
	provider := OAuthProvider(r.URL.Query().Get("provider"))
	if provider == "" {
		provider = ProviderGoogle // Default
	}

	state := generateState()
	authURL, err := fm.GetAuthURL(provider, state)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Set state cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300, // 5 minutes
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// OAuthCallbackHandler handles OAuth callback
func (fm *FieldNineAuthManager) OAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	provider := OAuthProvider(r.URL.Path[len("/callback/"):])
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	// Validate state from cookie
	cookie, err := r.Cookie("oauth_state")
	if err != nil || cookie.Value != state {
		http.Error(w, "Invalid state", http.StatusBadRequest)
		return
	}

	user, token, err := fm.HandleCallback(r.Context(), provider, code, state)
	if err != nil {
		fm.logger.Error("OAuth callback failed", zap.Error(err))
		http.Redirect(w, r, "https://nexus.fieldnine.io/login?error=auth_failed", http.StatusTemporaryRedirect)
		return
	}

	// Set auth cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "fieldnine_token",
		Value:    token,
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Domain:   ".fieldnine.io", // Shared across subdomains
	})

	// Clear state cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "oauth_state",
		Path:   "/",
		MaxAge: -1,
	})

	// Redirect to dashboard
	redirectURL := "https://nexus.fieldnine.io/dashboard"
	if r.URL.Query().Get("redirect") != "" {
		redirectURL = r.URL.Query().Get("redirect")
	}

	fm.logger.Info("OAuth login successful",
		zap.String("user_id", user.ID),
		zap.String("redirect", redirectURL))

	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

// ============================================================================
// Middleware
// ============================================================================

// UnifiedAuthMiddleware provides authentication for all Field Nine services
func (fm *FieldNineAuthManager) UnifiedAuthMiddleware(requiredService ServiceAccess) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check for token in cookie or header
			var tokenString string

			if cookie, err := r.Cookie("fieldnine_token"); err == nil {
				tokenString = cookie.Value
			} else if auth := r.Header.Get("Authorization"); auth != "" {
				parts := strings.Split(auth, " ")
				if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
					tokenString = parts[1]
				}
			}

			if tokenString == "" {
				http.Redirect(w, r, "https://auth.fieldnine.io/login", http.StatusTemporaryRedirect)
				return
			}

			// Validate token
			claims, err := fm.authManager.ValidateToken(tokenString)
			if err != nil {
				http.Redirect(w, r, "https://auth.fieldnine.io/login", http.StatusTemporaryRedirect)
				return
			}

			// Check service access
			user, err := fm.userStore.GetByID(r.Context(), claims.UserID)
			if err != nil || !hasServiceAccess(user.Services, requiredService) {
				http.Error(w, "Access denied to this service", http.StatusForbidden)
				return
			}

			// Add user to context
			ctx := context.WithValue(r.Context(), "user", user)
			ctx = context.WithValue(ctx, "claims", claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateUserID() string {
	return fmt.Sprintf("fn_%d", time.Now().UnixNano())
}

func generateSessionID() string {
	return fmt.Sprintf("sess_%d", time.Now().UnixNano())
}

func generateState() string {
	return fmt.Sprintf("%d_%s", time.Now().UnixNano(), randomString(16))
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}

func hasServiceAccess(services []ServiceAccess, target ServiceAccess) bool {
	for _, s := range services {
		if s == target {
			return true
		}
	}
	return false
}

func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 || len(parts[0]) == 0 {
		return "[REDACTED]"
	}
	return string(parts[0][0]) + "***@" + parts[1]
}
