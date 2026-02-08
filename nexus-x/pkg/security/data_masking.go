// Package security provides sensitive data masking for NEXUS-X platform.
//
// Data Classification:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    Sensitive Data Classification                            │
// ├─────────────────────────────────────────────────────────────────────────────┤
// │                                                                             │
// │  Level 1 - CRITICAL (Full Masking)                                         │
// │  ├── API Keys & Secrets                                                    │
// │  ├── Private Keys                                                          │
// │  ├── MFA Secrets                                                           │
// │  └── Database Credentials                                                  │
// │                                                                             │
// │  Level 2 - SENSITIVE (Partial Masking)                                     │
// │  ├── Wallet Addresses         0x1234...5678                               │
// │  ├── Email Addresses          j***@example.com                            │
// │  ├── Phone Numbers            +82-10-****-1234                            │
// │  └── Account Numbers          ****-****-****-1234                         │
// │                                                                             │
// │  Level 3 - INTERNAL (Logged but Redacted in UI)                           │
// │  ├── IP Addresses                                                          │
// │  ├── Transaction Hashes                                                    │
// │  └── Session IDs                                                           │
// │                                                                             │
// │  Level 4 - PUBLIC (No Masking)                                             │
// │  ├── Market Prices                                                         │
// │  ├── Public Statistics                                                     │
// │  └── Timestamps                                                            │
// │                                                                             │
// └─────────────────────────────────────────────────────────────────────────────┘
package security

import (
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"sync"
	"unicode/utf8"
)

// MaskLevel defines the sensitivity level
type MaskLevel int

const (
	MaskLevelCritical  MaskLevel = 1 // Full masking
	MaskLevelSensitive MaskLevel = 2 // Partial masking
	MaskLevelInternal  MaskLevel = 3 // Logged but redacted
	MaskLevelPublic    MaskLevel = 4 // No masking
)

// DataMasker handles sensitive data masking
type DataMasker struct {
	patterns     map[string]*regexp.Regexp
	fieldRules   map[string]MaskLevel
	defaultLevel MaskLevel
	mu           sync.RWMutex
}

// NewDataMasker creates a new data masker with default patterns
func NewDataMasker() *DataMasker {
	dm := &DataMasker{
		patterns:     make(map[string]*regexp.Regexp),
		fieldRules:   make(map[string]MaskLevel),
		defaultLevel: MaskLevelPublic,
	}

	// Initialize patterns
	dm.patterns["email"] = regexp.MustCompile(`([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})`)
	dm.patterns["phone_kr"] = regexp.MustCompile(`(\+82|0)[-\s]?(\d{2,3})[-\s]?(\d{3,4})[-\s]?(\d{4})`)
	dm.patterns["phone_intl"] = regexp.MustCompile(`\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}`)
	dm.patterns["wallet_eth"] = regexp.MustCompile(`0x[a-fA-F0-9]{40}`)
	dm.patterns["wallet_btc"] = regexp.MustCompile(`(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}`)
	dm.patterns["credit_card"] = regexp.MustCompile(`\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}`)
	dm.patterns["api_key"] = regexp.MustCompile(`(?i)(api[_-]?key|apikey|api_secret|secret[_-]?key|auth[_-]?token)[\s]*[:=][\s]*["']?([a-zA-Z0-9_\-]{20,})["']?`)
	dm.patterns["jwt"] = regexp.MustCompile(`eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*`)
	dm.patterns["private_key"] = regexp.MustCompile(`(?i)(-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----)`)
	dm.patterns["ip_address"] = regexp.MustCompile(`\b(?:\d{1,3}\.){3}\d{1,3}\b`)
	dm.patterns["ssn"] = regexp.MustCompile(`\d{3}[-\s]?\d{2}[-\s]?\d{4}`)
	dm.patterns["tx_hash"] = regexp.MustCompile(`0x[a-fA-F0-9]{64}`)

	// Initialize field rules
	dm.fieldRules = map[string]MaskLevel{
		// Critical fields
		"api_key":          MaskLevelCritical,
		"apiKey":           MaskLevelCritical,
		"secret":           MaskLevelCritical,
		"password":         MaskLevelCritical,
		"private_key":      MaskLevelCritical,
		"privateKey":       MaskLevelCritical,
		"mfa_secret":       MaskLevelCritical,
		"mfaSecret":        MaskLevelCritical,
		"refresh_token":    MaskLevelCritical,
		"refreshToken":     MaskLevelCritical,
		"access_token":     MaskLevelCritical,
		"accessToken":      MaskLevelCritical,
		"jwt":              MaskLevelCritical,
		"authorization":    MaskLevelCritical,
		"db_password":      MaskLevelCritical,
		"encryption_key":   MaskLevelCritical,

		// Sensitive fields
		"email":            MaskLevelSensitive,
		"phone":            MaskLevelSensitive,
		"phone_number":     MaskLevelSensitive,
		"phoneNumber":      MaskLevelSensitive,
		"wallet_address":   MaskLevelSensitive,
		"walletAddress":    MaskLevelSensitive,
		"address":          MaskLevelSensitive,
		"account_number":   MaskLevelSensitive,
		"accountNumber":    MaskLevelSensitive,
		"card_number":      MaskLevelSensitive,
		"cardNumber":       MaskLevelSensitive,
		"ssn":              MaskLevelSensitive,
		"bank_account":     MaskLevelSensitive,
		"iban":             MaskLevelSensitive,

		// Internal fields
		"ip":               MaskLevelInternal,
		"ip_address":       MaskLevelInternal,
		"ipAddress":        MaskLevelInternal,
		"session_id":       MaskLevelInternal,
		"sessionId":        MaskLevelInternal,
		"user_id":          MaskLevelInternal,
		"userId":           MaskLevelInternal,
		"tx_hash":          MaskLevelInternal,
		"txHash":           MaskLevelInternal,
		"transaction_hash": MaskLevelInternal,
	}

	return dm
}

// MaskString masks sensitive data in a string
func (dm *DataMasker) MaskString(input string) string {
	result := input

	// Mask API keys and secrets (full mask)
	result = dm.patterns["api_key"].ReplaceAllStringFunc(result, func(match string) string {
		parts := strings.SplitN(match, ":", 2)
		if len(parts) == 2 {
			return parts[0] + ": [REDACTED]"
		}
		parts = strings.SplitN(match, "=", 2)
		if len(parts) == 2 {
			return parts[0] + "=[REDACTED]"
		}
		return "[REDACTED]"
	})

	// Mask JWT tokens (full mask)
	result = dm.patterns["jwt"].ReplaceAllString(result, "[JWT_REDACTED]")

	// Mask private keys (full mask)
	result = dm.patterns["private_key"].ReplaceAllString(result, "[PRIVATE_KEY_REDACTED]")

	// Mask emails (partial mask)
	result = dm.patterns["email"].ReplaceAllStringFunc(result, dm.maskEmail)

	// Mask phone numbers (partial mask)
	result = dm.patterns["phone_kr"].ReplaceAllStringFunc(result, dm.maskPhoneKR)
	result = dm.patterns["phone_intl"].ReplaceAllStringFunc(result, dm.maskPhoneIntl)

	// Mask wallet addresses (partial mask)
	result = dm.patterns["wallet_eth"].ReplaceAllStringFunc(result, dm.maskWalletAddress)
	result = dm.patterns["wallet_btc"].ReplaceAllStringFunc(result, dm.maskWalletAddress)

	// Mask credit card numbers (partial mask)
	result = dm.patterns["credit_card"].ReplaceAllStringFunc(result, dm.maskCreditCard)

	// Mask SSN (partial mask)
	result = dm.patterns["ssn"].ReplaceAllStringFunc(result, dm.maskSSN)

	// Mask transaction hashes (partial mask for internal)
	result = dm.patterns["tx_hash"].ReplaceAllStringFunc(result, dm.maskTxHash)

	return result
}

// maskEmail masks email addresses: j***@example.com
func (dm *DataMasker) maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "[EMAIL_REDACTED]"
	}

	local := parts[0]
	domain := parts[1]

	if len(local) <= 1 {
		return "*@" + domain
	}

	return string(local[0]) + strings.Repeat("*", minInt(3, len(local)-1)) + "@" + domain
}

// maskPhoneKR masks Korean phone numbers: +82-10-****-1234
func (dm *DataMasker) maskPhoneKR(phone string) string {
	// Remove all separators
	cleaned := regexp.MustCompile(`[-\s]`).ReplaceAllString(phone, "")

	if len(cleaned) < 4 {
		return "[PHONE_REDACTED]"
	}

	// Keep last 4 digits
	lastFour := cleaned[len(cleaned)-4:]

	// Mask middle part
	if strings.HasPrefix(cleaned, "+82") {
		return "+82-**-****-" + lastFour
	}
	return "0**-****-" + lastFour
}

// maskPhoneIntl masks international phone numbers
func (dm *DataMasker) maskPhoneIntl(phone string) string {
	cleaned := regexp.MustCompile(`[-\s]`).ReplaceAllString(phone, "")

	if len(cleaned) < 4 {
		return "[PHONE_REDACTED]"
	}

	// Keep country code and last 4 digits
	lastFour := cleaned[len(cleaned)-4:]

	// Find country code (1-3 digits after +)
	if strings.HasPrefix(cleaned, "+") {
		return cleaned[:4] + "-****-" + lastFour
	}

	return "****-" + lastFour
}

// maskWalletAddress masks wallet addresses: 0x1234...5678
func (dm *DataMasker) maskWalletAddress(address string) string {
	if len(address) < 10 {
		return "[WALLET_REDACTED]"
	}

	prefix := address[:6]
	suffix := address[len(address)-4:]
	return prefix + "..." + suffix
}

// maskCreditCard masks credit card numbers: ****-****-****-1234
func (dm *DataMasker) maskCreditCard(card string) string {
	cleaned := regexp.MustCompile(`[-\s]`).ReplaceAllString(card, "")

	if len(cleaned) < 4 {
		return "[CARD_REDACTED]"
	}

	lastFour := cleaned[len(cleaned)-4:]
	return "****-****-****-" + lastFour
}

// maskSSN masks social security numbers: ***-**-1234
func (dm *DataMasker) maskSSN(ssn string) string {
	cleaned := regexp.MustCompile(`[-\s]`).ReplaceAllString(ssn, "")

	if len(cleaned) < 4 {
		return "[SSN_REDACTED]"
	}

	lastFour := cleaned[len(cleaned)-4:]
	return "***-**-" + lastFour
}

// maskTxHash masks transaction hashes: 0x1234...5678
func (dm *DataMasker) maskTxHash(hash string) string {
	if len(hash) < 14 {
		return "[HASH_REDACTED]"
	}

	prefix := hash[:10]
	suffix := hash[len(hash)-4:]
	return prefix + "..." + suffix
}

// MaskJSON masks sensitive fields in JSON
func (dm *DataMasker) MaskJSON(data []byte) ([]byte, error) {
	var obj interface{}
	if err := json.Unmarshal(data, &obj); err != nil {
		return nil, err
	}

	masked := dm.maskValue(obj, "")
	return json.Marshal(masked)
}

// maskValue recursively masks sensitive values
func (dm *DataMasker) maskValue(v interface{}, fieldName string) interface{} {
	if v == nil {
		return nil
	}

	// Check if field should be masked
	level := dm.getFieldLevel(fieldName)

	switch val := v.(type) {
	case map[string]interface{}:
		result := make(map[string]interface{})
		for k, v := range val {
			result[k] = dm.maskValue(v, k)
		}
		return result

	case []interface{}:
		result := make([]interface{}, len(val))
		for i, item := range val {
			result[i] = dm.maskValue(item, fieldName)
		}
		return result

	case string:
		switch level {
		case MaskLevelCritical:
			return "[REDACTED]"
		case MaskLevelSensitive:
			return dm.partialMask(val, fieldName)
		case MaskLevelInternal:
			return dm.MaskString(val)
		default:
			return dm.MaskString(val) // Still apply pattern-based masking
		}

	default:
		return v
	}
}

// partialMask applies partial masking based on field type
func (dm *DataMasker) partialMask(value, fieldName string) string {
	lowerField := strings.ToLower(fieldName)

	if strings.Contains(lowerField, "email") {
		return dm.maskEmail(value)
	}
	if strings.Contains(lowerField, "phone") {
		if dm.patterns["phone_kr"].MatchString(value) {
			return dm.maskPhoneKR(value)
		}
		return dm.maskPhoneIntl(value)
	}
	if strings.Contains(lowerField, "wallet") || strings.Contains(lowerField, "address") {
		if dm.patterns["wallet_eth"].MatchString(value) || dm.patterns["wallet_btc"].MatchString(value) {
			return dm.maskWalletAddress(value)
		}
	}
	if strings.Contains(lowerField, "card") || strings.Contains(lowerField, "account") {
		if dm.patterns["credit_card"].MatchString(value) {
			return dm.maskCreditCard(value)
		}
	}
	if strings.Contains(lowerField, "ssn") {
		return dm.maskSSN(value)
	}

	// Default partial mask: show first and last character
	if len(value) <= 2 {
		return strings.Repeat("*", len(value))
	}

	return string(value[0]) + strings.Repeat("*", len(value)-2) + string(value[len(value)-1])
}

// getFieldLevel returns the mask level for a field name
func (dm *DataMasker) getFieldLevel(fieldName string) MaskLevel {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	lowerField := strings.ToLower(fieldName)

	// Check exact match
	if level, ok := dm.fieldRules[fieldName]; ok {
		return level
	}

	// Check lowercase match
	if level, ok := dm.fieldRules[lowerField]; ok {
		return level
	}

	// Check partial match
	for key, level := range dm.fieldRules {
		if strings.Contains(lowerField, strings.ToLower(key)) {
			return level
		}
	}

	return dm.defaultLevel
}

// AddFieldRule adds a custom field masking rule
func (dm *DataMasker) AddFieldRule(fieldName string, level MaskLevel) {
	dm.mu.Lock()
	defer dm.mu.Unlock()
	dm.fieldRules[fieldName] = level
}

// MaskStruct masks sensitive fields in a struct using reflection
func (dm *DataMasker) MaskStruct(v interface{}) interface{} {
	return dm.maskReflect(reflect.ValueOf(v), "")
}

func (dm *DataMasker) maskReflect(v reflect.Value, fieldName string) interface{} {
	if !v.IsValid() {
		return nil
	}

	switch v.Kind() {
	case reflect.Ptr:
		if v.IsNil() {
			return nil
		}
		return dm.maskReflect(v.Elem(), fieldName)

	case reflect.Interface:
		if v.IsNil() {
			return nil
		}
		return dm.maskReflect(v.Elem(), fieldName)

	case reflect.Struct:
		t := v.Type()
		result := make(map[string]interface{})

		for i := 0; i < v.NumField(); i++ {
			field := t.Field(i)
			fieldValue := v.Field(i)

			// Check if field is exported
			if !field.IsExported() {
				continue
			}

			// Get JSON tag name if available
			jsonTag := field.Tag.Get("json")
			name := field.Name
			if jsonTag != "" {
				parts := strings.Split(jsonTag, ",")
				if parts[0] != "-" {
					name = parts[0]
				}
			}

			// Check for mask tag
			maskTag := field.Tag.Get("mask")
			if maskTag == "skip" {
				result[name] = dm.maskReflect(fieldValue, name)
			} else if maskTag == "full" {
				result[name] = "[REDACTED]"
			} else {
				result[name] = dm.maskReflect(fieldValue, name)
			}
		}
		return result

	case reflect.Map:
		result := make(map[string]interface{})
		for _, key := range v.MapKeys() {
			keyStr := fmt.Sprintf("%v", key.Interface())
			result[keyStr] = dm.maskReflect(v.MapIndex(key), keyStr)
		}
		return result

	case reflect.Slice, reflect.Array:
		result := make([]interface{}, v.Len())
		for i := 0; i < v.Len(); i++ {
			result[i] = dm.maskReflect(v.Index(i), fieldName)
		}
		return result

	case reflect.String:
		str := v.String()
		level := dm.getFieldLevel(fieldName)

		switch level {
		case MaskLevelCritical:
			return "[REDACTED]"
		case MaskLevelSensitive:
			return dm.partialMask(str, fieldName)
		default:
			return dm.MaskString(str)
		}

	default:
		if v.CanInterface() {
			return v.Interface()
		}
		return nil
	}
}

// LogSafeString returns a string safe for logging
func (dm *DataMasker) LogSafeString(input string) string {
	return dm.MaskString(input)
}

// LogSafeJSON returns JSON safe for logging
func (dm *DataMasker) LogSafeJSON(data []byte) string {
	masked, err := dm.MaskJSON(data)
	if err != nil {
		return "[INVALID_JSON]"
	}
	return string(masked)
}

// Helper function
func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// MaskForRole masks data based on user role
func (dm *DataMasker) MaskForRole(data interface{}, role string) interface{} {
	// CEO and Admin can see more data
	if role == "CEO" || role == "ADMIN" {
		// Still mask critical data like passwords
		dm.mu.Lock()
		originalRules := make(map[string]MaskLevel)
		for k, v := range dm.fieldRules {
			originalRules[k] = v
		}
		// Temporarily adjust rules
		for k, v := range dm.fieldRules {
			if v == MaskLevelSensitive {
				dm.fieldRules[k] = MaskLevelPublic
			}
		}
		dm.mu.Unlock()

		result := dm.MaskStruct(data)

		// Restore rules
		dm.mu.Lock()
		dm.fieldRules = originalRules
		dm.mu.Unlock()

		return result
	}

	// Regular masking for other roles
	return dm.MaskStruct(data)
}

// ResponseMasker wraps http.ResponseWriter to mask sensitive data
type ResponseMasker struct {
	http.ResponseWriter
	masker *DataMasker
}

// NewResponseMasker creates a response masker
func NewResponseMasker(w http.ResponseWriter, masker *DataMasker) *ResponseMasker {
	return &ResponseMasker{
		ResponseWriter: w,
		masker:        masker,
	}
}

// Write masks sensitive data before writing
func (rm *ResponseMasker) Write(data []byte) (int, error) {
	contentType := rm.Header().Get("Content-Type")

	// Only mask JSON responses
	if strings.Contains(contentType, "application/json") {
		masked, err := rm.masker.MaskJSON(data)
		if err == nil {
			return rm.ResponseWriter.Write(masked)
		}
	}

	// For non-JSON, do string masking
	maskedStr := rm.masker.MaskString(string(data))
	return rm.ResponseWriter.Write([]byte(maskedStr))
}

// MaskingMiddleware creates an HTTP middleware that masks sensitive data in responses
func (dm *DataMasker) MaskingMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			maskedWriter := NewResponseMasker(w, dm)
			next.ServeHTTP(maskedWriter, r)
		})
	}
}
