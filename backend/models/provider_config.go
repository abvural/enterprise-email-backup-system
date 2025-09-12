package models

// ProviderType represents different email provider types
type ProviderType string

const (
	ProviderGmail     ProviderType = "gmail"
	ProviderExchange  ProviderType = "exchange"
	ProviderOffice365 ProviderType = "office365"
	ProviderYahoo     ProviderType = "yahoo"
	ProviderOutlook   ProviderType = "outlook"
	ProviderCustomIMAP ProviderType = "custom_imap"
)

// AuthMethod represents different authentication methods
type AuthMethod string

const (
	AuthPassword  AuthMethod = "password"
	AuthOAuth2    AuthMethod = "oauth2"
	AuthXOAUTH2   AuthMethod = "xoauth2"
	AuthAppPassword AuthMethod = "app_password"
	AuthNTLM      AuthMethod = "ntlm"
)

// ProviderConfig holds configuration for different email providers
type ProviderConfig struct {
	Type          ProviderType `json:"type"`
	Name          string       `json:"name"`
	DisplayName   string       `json:"display_name"`
	
	// IMAP Configuration
	IMAPServer    string `json:"imap_server"`
	IMAPPort      int    `json:"imap_port"`
	IMAPSecurity  string `json:"imap_security"` // "SSL", "TLS", "STARTTLS", "NONE"
	
	// SMTP Configuration (for future use)
	SMTPServer    string `json:"smtp_server,omitempty"`
	SMTPPort      int    `json:"smtp_port,omitempty"`
	SMTPSecurity  string `json:"smtp_security,omitempty"`
	
	// Authentication
	AuthMethod    AuthMethod `json:"auth_method"`
	RequiresDomain bool      `json:"requires_domain"`
	
	// OAuth2 Configuration
	OAuth2Config  *OAuth2Config `json:"oauth2_config,omitempty"`
	
	// Custom settings
	IsCustom      bool `json:"is_custom"`
	SupportedFeatures []string `json:"supported_features"`
}

// OAuth2Config holds OAuth2 configuration for providers
type OAuth2Config struct {
	AuthURL      string   `json:"auth_url"`
	TokenURL     string   `json:"token_url"`
	ClientID     string   `json:"client_id"`
	ClientSecret string   `json:"client_secret"`
	Scopes       []string `json:"scopes"`
	RedirectURL  string   `json:"redirect_url"`
}

// GetProviderConfigs returns predefined configurations for supported providers
func GetProviderConfigs() map[ProviderType]ProviderConfig {
	return map[ProviderType]ProviderConfig{
		ProviderGmail: {
			Type:         ProviderGmail,
			Name:         "gmail",
			DisplayName:  "Gmail",
			IMAPServer:   "imap.gmail.com",
			IMAPPort:     993,
			IMAPSecurity: "SSL",
			AuthMethod:   AuthAppPassword,
			OAuth2Config: &OAuth2Config{
				AuthURL:  "https://accounts.google.com/o/oauth2/auth",
				TokenURL: "https://oauth2.googleapis.com/token",
				Scopes:   []string{"https://mail.google.com/"},
			},
			SupportedFeatures: []string{"incremental_sync", "labels", "attachments"},
		},
		ProviderExchange: {
			Type:         ProviderExchange,
			Name:         "exchange",
			DisplayName:  "Exchange Server",
			AuthMethod:   AuthNTLM,
			RequiresDomain: true,
			SupportedFeatures: []string{"incremental_sync", "folders", "attachments"},
		},
		ProviderOffice365: {
			Type:         ProviderOffice365,
			Name:         "office365",
			DisplayName:  "Office 365 / Microsoft 365",
			AuthMethod:   AuthOAuth2,
			OAuth2Config: &OAuth2Config{
				AuthURL:  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
				TokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
				Scopes:   []string{"https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/Mail.ReadWrite", "offline_access"},
			},
			SupportedFeatures: []string{"graph_api", "incremental_sync", "folders", "attachments", "delta_query"},
		},
		ProviderYahoo: {
			Type:         ProviderYahoo,
			Name:         "yahoo",
			DisplayName:  "Yahoo Mail",
			IMAPServer:   "imap.mail.yahoo.com",
			IMAPPort:     993,
			IMAPSecurity: "SSL",
			AuthMethod:   AuthAppPassword,
			OAuth2Config: &OAuth2Config{
				AuthURL:  "https://api.login.yahoo.com/oauth2/request_auth",
				TokenURL: "https://api.login.yahoo.com/oauth2/get_token",
				Scopes:   []string{"mail-r", "mail-w"},
			},
			SupportedFeatures: []string{"incremental_sync", "folders", "attachments"},
		},
		ProviderOutlook: {
			Type:         ProviderOutlook,
			Name:         "outlook",
			DisplayName:  "Outlook.com",
			IMAPServer:   "outlook.office365.com",
			IMAPPort:     993,
			IMAPSecurity: "SSL",
			AuthMethod:   AuthOAuth2,
			OAuth2Config: &OAuth2Config{
				AuthURL:  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
				TokenURL: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
				Scopes:   []string{"https://outlook.office.com/IMAP.AccessAsUser.All", "offline_access"},
			},
			SupportedFeatures: []string{"oauth2_imap", "incremental_sync", "folders", "attachments"},
		},
		ProviderCustomIMAP: {
			Type:         ProviderCustomIMAP,
			Name:         "custom_imap",
			DisplayName:  "Custom IMAP Server",
			AuthMethod:   AuthPassword,
			IsCustom:     true,
			SupportedFeatures: []string{"basic_imap", "attachments"},
		},
	}
}

// GetProviderConfig returns configuration for a specific provider
func GetProviderConfig(providerType ProviderType) (ProviderConfig, bool) {
	configs := GetProviderConfigs()
	config, exists := configs[providerType]
	return config, exists
}

// ValidateProviderType checks if a provider type is supported
func ValidateProviderType(providerType string) bool {
	_, exists := GetProviderConfigs()[ProviderType(providerType)]
	return exists
}

// GetSupportedProviders returns a list of all supported provider types
func GetSupportedProviders() []ProviderType {
	providers := make([]ProviderType, 0, len(GetProviderConfigs()))
	for providerType := range GetProviderConfigs() {
		providers = append(providers, providerType)
	}
	return providers
}