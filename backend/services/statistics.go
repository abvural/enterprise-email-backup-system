package services

import (
	"fmt"
	"time"

	"emailprojectv2/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StatisticsService struct {
	DB *gorm.DB
}

func NewStatisticsService(db *gorm.DB) *StatisticsService {
	return &StatisticsService{DB: db}
}

// ===== SYSTEM STATISTICS (ADMIN) =====

type SystemStats struct {
	TotalUsers         int64                    `json:"total_users"`
	ActiveUsers        int64                    `json:"active_users"`
	TotalOrganizations int64                    `json:"total_organizations"`
	TotalEmailAccounts int64                    `json:"total_email_accounts"`
	TotalEmails        int64                    `json:"total_emails"`
	TotalStorageBytes  int64                    `json:"total_storage_bytes"`
	TotalStorageGB     float64                  `json:"total_storage_gb"`
	OrganizationCounts map[string]int64         `json:"organization_counts"`
	RoleCounts         map[string]int64         `json:"role_counts"`
	ProviderCounts     map[string]int64         `json:"provider_counts"`
	RecentActivity     []SystemActivityItem     `json:"recent_activity"`
	GrowthMetrics      *SystemGrowthMetrics     `json:"growth_metrics"`
}

type SystemActivityItem struct {
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

type SystemGrowthMetrics struct {
	UsersGrowth         []MonthlyGrowthPoint `json:"users_growth"`
	OrganizationsGrowth []MonthlyGrowthPoint `json:"organizations_growth"`
	EmailsGrowth        []MonthlyGrowthPoint `json:"emails_growth"`
	StorageGrowth       []MonthlyGrowthPoint `json:"storage_growth"`
}

type MonthlyGrowthPoint struct {
	Month string `json:"month"`
	Count int64  `json:"count"`
	Size  int64  `json:"size,omitempty"` // For storage growth
}

type TopOrganization struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	UserCount     int64     `json:"user_count"`
	EmailCount    int64     `json:"email_count"`
	StorageBytes  int64     `json:"storage_bytes"`
	StorageGB     float64   `json:"storage_gb"`
	LastActivity  time.Time `json:"last_activity"`
	IsActive      bool      `json:"is_active"`
}

func (ss *StatisticsService) GetSystemStats() (*SystemStats, error) {
	stats := &SystemStats{
		OrganizationCounts: make(map[string]int64),
		RoleCounts:         make(map[string]int64),
		ProviderCounts:     make(map[string]int64),
	}

	// Total users
	if err := ss.DB.Model(&database.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %v", err)
	}

	// Active users (users with email accounts or recent activity)
	var activeUserQuery = `
		SELECT COUNT(DISTINCT u.id) 
		FROM users u 
		WHERE EXISTS (
			SELECT 1 FROM email_accounts ea WHERE ea.user_id = u.id AND ea.is_active = true
		)
	`
	if err := ss.DB.Raw(activeUserQuery).Scan(&stats.ActiveUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count active users: %v", err)
	}

	// Total organizations
	if err := ss.DB.Model(&database.Organization{}).Where("is_active = ?", true).Count(&stats.TotalOrganizations).Error; err != nil {
		return nil, fmt.Errorf("failed to count organizations: %v", err)
	}

	// Total email accounts
	if err := ss.DB.Model(&database.EmailAccount{}).Where("is_active = ?", true).Count(&stats.TotalEmailAccounts).Error; err != nil {
		return nil, fmt.Errorf("failed to count email accounts: %v", err)
	}

	// Total emails
	if err := ss.DB.Table("email_indices").Count(&stats.TotalEmails).Error; err != nil {
		return nil, fmt.Errorf("failed to count emails: %v", err)
	}

	// Total storage
	if err := ss.DB.Table("email_indices").Select("COALESCE(SUM(email_size), 0)").Scan(&stats.TotalStorageBytes).Error; err != nil {
		return nil, fmt.Errorf("failed to calculate total storage: %v", err)
	}
	stats.TotalStorageGB = float64(stats.TotalStorageBytes) / (1024 * 1024 * 1024)

	// Organization counts by type
	var orgCounts []struct {
		Type  string `json:"type"`
		Count int64  `json:"count"`
	}
	if err := ss.DB.Model(&database.Organization{}).
		Select("type, count(*) as count").
		Where("is_active = ?", true).
		Group("type").
		Scan(&orgCounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get organization counts: %v", err)
	}
	for _, oc := range orgCounts {
		stats.OrganizationCounts[oc.Type] = oc.Count
	}

	// Role counts
	var roleCounts []struct {
		Name  string `json:"name"`
		Count int64  `json:"count"`
	}
	if err := ss.DB.Table("user_organizations uo").
		Select("r.name, count(*) as count").
		Joins("JOIN roles r ON r.id = uo.role_id").
		Group("r.name").
		Scan(&roleCounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get role counts: %v", err)
	}
	for _, rc := range roleCounts {
		stats.RoleCounts[rc.Name] = rc.Count
	}

	// Provider counts
	var providerCounts []struct {
		Provider string `json:"provider"`
		Count    int64  `json:"count"`
	}
	if err := ss.DB.Model(&database.EmailAccount{}).
		Select("provider, count(*) as count").
		Where("is_active = ?", true).
		Group("provider").
		Scan(&providerCounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get provider counts: %v", err)
	}
	for _, pc := range providerCounts {
		stats.ProviderCounts[pc.Provider] = pc.Count
	}

	// Recent activity (last 10 activities)
	stats.RecentActivity = ss.getRecentSystemActivity()

	// Growth metrics
	growthMetrics, err := ss.getSystemGrowthMetrics()
	if err != nil {
		return nil, fmt.Errorf("failed to get growth metrics: %v", err)
	}
	stats.GrowthMetrics = growthMetrics

	return stats, nil
}

func (ss *StatisticsService) GetTopOrganizations(limit int) ([]TopOrganization, error) {
	var topOrgs []TopOrganization

	query := `
		WITH org_stats AS (
			SELECT 
				o.id,
				o.name,
				o.type,
				o.is_active,
				o.updated_at as last_activity,
				COUNT(DISTINCT uo.user_id) as user_count,
				COUNT(DISTINCT ea.id) as email_account_count,
				COUNT(DISTINCT ei.id) as email_count,
				COALESCE(SUM(ei.email_size), 0) as storage_bytes
			FROM organizations o
			LEFT JOIN user_organizations uo ON uo.organization_id = o.id
			LEFT JOIN email_accounts ea ON ea.user_id = uo.user_id AND ea.is_active = true
			LEFT JOIN email_indices ei ON ei.account_id = ea.id
			WHERE o.is_active = true AND o.type != 'system'
			GROUP BY o.id, o.name, o.type, o.is_active, o.updated_at
		)
		SELECT 
			id,
			name,
			type,
			user_count,
			email_count,
			storage_bytes,
			last_activity,
			is_active
		FROM org_stats
		ORDER BY email_count DESC, storage_bytes DESC, user_count DESC
		LIMIT ?
	`

	rows, err := ss.DB.Raw(query, limit).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to get top organizations: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var org TopOrganization
		err := rows.Scan(
			&org.ID,
			&org.Name,
			&org.Type,
			&org.UserCount,
			&org.EmailCount,
			&org.StorageBytes,
			&org.LastActivity,
			&org.IsActive,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan organization: %v", err)
		}
		org.StorageGB = float64(org.StorageBytes) / (1024 * 1024 * 1024)
		topOrgs = append(topOrgs, org)
	}

	return topOrgs, nil
}

func (ss *StatisticsService) getRecentSystemActivity() []SystemActivityItem {
	var activities []SystemActivityItem

	// Get recent users
	var recentUsers []database.User
	ss.DB.Order("created_at desc").Limit(3).Find(&recentUsers)
	for _, user := range recentUsers {
		activities = append(activities, SystemActivityItem{
			Type:      "user_created",
			Message:   fmt.Sprintf("New user registered: %s", user.Email),
			Timestamp: user.CreatedAt,
		})
	}

	// Get recent organizations
	var recentOrgs []database.Organization
	ss.DB.Where("is_active = ?", true).Order("created_at desc").Limit(3).Find(&recentOrgs)
	for _, org := range recentOrgs {
		activities = append(activities, SystemActivityItem{
			Type:      "organization_created",
			Message:   fmt.Sprintf("New %s organization: %s", org.Type, org.Name),
			Timestamp: org.CreatedAt,
		})
	}

	// Get recent email accounts
	var recentAccounts []database.EmailAccount
	ss.DB.Where("is_active = ?", true).Order("created_at desc").Limit(3).Find(&recentAccounts)
	for _, account := range recentAccounts {
		activities = append(activities, SystemActivityItem{
			Type:      "email_account_added",
			Message:   fmt.Sprintf("New %s account added: %s", account.Provider, account.Email),
			Timestamp: account.CreatedAt,
		})
	}

	// Sort by timestamp descending
	for i := 0; i < len(activities)-1; i++ {
		for j := i + 1; j < len(activities); j++ {
			if activities[i].Timestamp.Before(activities[j].Timestamp) {
				activities[i], activities[j] = activities[j], activities[i]
			}
		}
	}

	// Return top 10
	if len(activities) > 10 {
		activities = activities[:10]
	}

	return activities
}

func (ss *StatisticsService) getSystemGrowthMetrics() (*SystemGrowthMetrics, error) {
	metrics := &SystemGrowthMetrics{}

	// Get growth data for the last 12 months
	endDate := time.Now()
	startDate := endDate.AddDate(0, -12, 0)

	// Users growth
	usersGrowth, err := ss.getMonthlyGrowthData("users", "created_at", startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get users growth: %v", err)
	}
	metrics.UsersGrowth = usersGrowth

	// Organizations growth
	orgsGrowth, err := ss.getMonthlyGrowthData("organizations", "created_at", startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get organizations growth: %v", err)
	}
	metrics.OrganizationsGrowth = orgsGrowth

	// Email accounts growth (as proxy for emails growth)
	emailsGrowth, err := ss.getMonthlyGrowthData("email_accounts", "created_at", startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get emails growth: %v", err)
	}
	metrics.EmailsGrowth = emailsGrowth

	// Storage growth is more complex - we'll use a simplified version
	storageGrowth, err := ss.getMonthlyStorageGrowth(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage growth: %v", err)
	}
	metrics.StorageGrowth = storageGrowth

	return metrics, nil
}

func (ss *StatisticsService) getMonthlyGrowthData(table, dateColumn string, startDate, endDate time.Time) ([]MonthlyGrowthPoint, error) {
	var results []MonthlyGrowthPoint

	query := fmt.Sprintf(`
		SELECT 
			TO_CHAR(DATE_TRUNC('month', %s), 'YYYY-MM') as month,
			COUNT(*) as count
		FROM %s 
		WHERE %s >= ? AND %s <= ?
		GROUP BY DATE_TRUNC('month', %s)
		ORDER BY month
	`, dateColumn, table, dateColumn, dateColumn, dateColumn)

	rows, err := ss.DB.Raw(query, startDate, endDate).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var point MonthlyGrowthPoint
		if err := rows.Scan(&point.Month, &point.Count); err != nil {
			return nil, err
		}
		results = append(results, point)
	}

	return results, nil
}

func (ss *StatisticsService) getMonthlyStorageGrowth(startDate, endDate time.Time) ([]MonthlyGrowthPoint, error) {
	var results []MonthlyGrowthPoint

	query := `
		SELECT 
			TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
			COUNT(*) as count,
			COALESCE(SUM(email_size), 0) as size
		FROM email_indices
		WHERE created_at >= ? AND created_at <= ?
		GROUP BY DATE_TRUNC('month', created_at)
		ORDER BY month
	`

	rows, err := ss.DB.Raw(query, startDate, endDate).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var point MonthlyGrowthPoint
		if err := rows.Scan(&point.Month, &point.Count, &point.Size); err != nil {
			return nil, err
		}
		results = append(results, point)
	}

	return results, nil
}

// ===== NETWORK STATISTICS (DISTRIBUTOR) =====

type NetworkStats struct {
	TotalDealers       int64                    `json:"total_dealers"`
	TotalClients       int64                    `json:"total_clients"`
	TotalEndUsers      int64                    `json:"total_end_users"`
	TotalEmailAccounts int64                    `json:"total_email_accounts"`
	NetworkStorageBytes int64                   `json:"network_storage_bytes"`
	NetworkStorageGB    float64                 `json:"network_storage_gb"`
	ActiveDealers      int64                    `json:"active_dealers"`
	DealerPerformance  []DealerPerformanceItem `json:"dealer_performance"`
	ClientDistribution []ClientDistributionItem `json:"client_distribution"`
	RecentActivity     []NetworkActivityItem    `json:"recent_activity"`
	GrowthTrends       *NetworkGrowthTrends     `json:"growth_trends"`
}

type DealerPerformanceItem struct {
	DealerID        uuid.UUID `json:"dealer_id"`
	DealerName      string    `json:"dealer_name"`
	ClientCount     int64     `json:"client_count"`
	UserCount       int64     `json:"user_count"`
	EmailCount      int64     `json:"email_count"`
	StorageBytes    int64     `json:"storage_bytes"`
	StorageGB       float64   `json:"storage_gb"`
	LastActivity    time.Time `json:"last_activity"`
	IsActive        bool      `json:"is_active"`
}

type ClientDistributionItem struct {
	DealerName  string `json:"dealer_name"`
	ClientCount int64  `json:"client_count"`
}

type NetworkActivityItem struct {
	Type         string    `json:"type"`
	Message      string    `json:"message"`
	Timestamp    time.Time `json:"timestamp"`
	DealerName   string    `json:"dealer_name,omitempty"`
	ClientName   string    `json:"client_name,omitempty"`
}

type NetworkGrowthTrends struct {
	DealersGrowth []MonthlyGrowthPoint `json:"dealers_growth"`
	ClientsGrowth []MonthlyGrowthPoint `json:"clients_growth"`
	UsersGrowth   []MonthlyGrowthPoint `json:"users_growth"`
	StorageGrowth []MonthlyGrowthPoint `json:"storage_growth"`
}

func (ss *StatisticsService) GetNetworkStats(distributorID uuid.UUID) (*NetworkStats, error) {
	stats := &NetworkStats{}

	// Get all child organizations recursively
	childOrgs, err := ss.getChildOrganizations(distributorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get child organizations: %v", err)
	}

	if len(childOrgs) == 0 {
		return stats, nil // Empty network
	}

	// Build IN clause for child org IDs
	orgIDs := make([]uuid.UUID, len(childOrgs))
	for i, org := range childOrgs {
		orgIDs[i] = org.ID
	}

	// Count dealers (direct children)
	if err := ss.DB.Model(&database.Organization{}).
		Where("parent_org_id = ? AND type = ? AND is_active = ?", distributorID, "dealer", true).
		Count(&stats.TotalDealers).Error; err != nil {
		return nil, fmt.Errorf("failed to count dealers: %v", err)
	}

	// Count clients (all clients in network)
	if err := ss.DB.Model(&database.Organization{}).
		Where("id IN ? AND type = ? AND is_active = ?", orgIDs, "client", true).
		Count(&stats.TotalClients).Error; err != nil {
		return nil, fmt.Errorf("failed to count clients: %v", err)
	}

	// Count end users in network
	if err := ss.DB.Table("user_organizations").
		Where("organization_id IN ?", orgIDs).
		Count(&stats.TotalEndUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count end users: %v", err)
	}

	// Count email accounts in network
	networkAccountsQuery := `
		SELECT COUNT(DISTINCT ea.id)
		FROM email_accounts ea
		JOIN user_organizations uo ON uo.user_id = ea.user_id
		WHERE uo.organization_id IN ? AND ea.is_active = true
	`
	if err := ss.DB.Raw(networkAccountsQuery, orgIDs).Scan(&stats.TotalEmailAccounts).Error; err != nil {
		return nil, fmt.Errorf("failed to count network email accounts: %v", err)
	}

	// Calculate network storage
	networkStorageQuery := `
		SELECT COALESCE(SUM(ei.email_size), 0)
		FROM email_indices ei
		JOIN email_accounts ea ON ea.id = ei.account_id
		JOIN user_organizations uo ON uo.user_id = ea.user_id
		WHERE uo.organization_id IN ?
	`
	if err := ss.DB.Raw(networkStorageQuery, orgIDs).Scan(&stats.NetworkStorageBytes).Error; err != nil {
		return nil, fmt.Errorf("failed to calculate network storage: %v", err)
	}
	stats.NetworkStorageGB = float64(stats.NetworkStorageBytes) / (1024 * 1024 * 1024)

	// Active dealers (dealers with recent activity or users)
	activeDealersQuery := `
		SELECT COUNT(DISTINCT o.id)
		FROM organizations o
		WHERE o.parent_org_id = ? AND o.type = 'dealer' AND o.is_active = true
		AND EXISTS (
			SELECT 1 FROM user_organizations uo 
			WHERE uo.organization_id = o.id
		)
	`
	if err := ss.DB.Raw(activeDealersQuery, distributorID).Scan(&stats.ActiveDealers).Error; err != nil {
		return nil, fmt.Errorf("failed to count active dealers: %v", err)
	}

	// Dealer performance
	dealerPerformance, err := ss.getDealerPerformance(distributorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get dealer performance: %v", err)
	}
	stats.DealerPerformance = dealerPerformance

	// Client distribution
	clientDistribution, err := ss.getClientDistribution(distributorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get client distribution: %v", err)
	}
	stats.ClientDistribution = clientDistribution

	// Recent network activity
	recentActivity, err := ss.getNetworkActivity(distributorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get network activity: %v", err)
	}
	stats.RecentActivity = recentActivity

	// Growth trends
	growthTrends, err := ss.getNetworkGrowthTrends(distributorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get growth trends: %v", err)
	}
	stats.GrowthTrends = growthTrends

	return stats, nil
}

func (ss *StatisticsService) getChildOrganizations(parentID uuid.UUID) ([]database.Organization, error) {
	var childOrgs []database.Organization

	// Use recursive CTE to get all descendants
	query := `
		WITH RECURSIVE org_tree AS (
			SELECT id, name, type, parent_org_id, is_active 
			FROM organizations 
			WHERE parent_org_id = ? AND is_active = true
			
			UNION ALL
			
			SELECT o.id, o.name, o.type, o.parent_org_id, o.is_active
			FROM organizations o
			JOIN org_tree ot ON o.parent_org_id = ot.id
			WHERE o.is_active = true
		)
		SELECT id, name, type, parent_org_id, is_active FROM org_tree
	`

	if err := ss.DB.Raw(query, parentID).Scan(&childOrgs).Error; err != nil {
		return nil, err
	}

	return childOrgs, nil
}

func (ss *StatisticsService) getDealerPerformance(distributorID uuid.UUID) ([]DealerPerformanceItem, error) {
	var dealers []DealerPerformanceItem

	query := `
		WITH dealer_stats AS (
			SELECT 
				d.id as dealer_id,
				d.name as dealer_name,
				d.updated_at as last_activity,
				d.is_active,
				COUNT(DISTINCT c.id) as client_count,
				COUNT(DISTINCT uo.user_id) as user_count,
				COUNT(DISTINCT ei.id) as email_count,
				COALESCE(SUM(ei.email_size), 0) as storage_bytes
			FROM organizations d
			LEFT JOIN organizations c ON c.parent_org_id = d.id AND c.type = 'client' AND c.is_active = true
			LEFT JOIN user_organizations uo ON uo.organization_id = c.id OR uo.organization_id = d.id
			LEFT JOIN email_accounts ea ON ea.user_id = uo.user_id AND ea.is_active = true
			LEFT JOIN email_indices ei ON ei.account_id = ea.id
			WHERE d.parent_org_id = ? AND d.type = 'dealer' AND d.is_active = true
			GROUP BY d.id, d.name, d.updated_at, d.is_active
		)
		SELECT 
			dealer_id,
			dealer_name,
			client_count,
			user_count,
			email_count,
			storage_bytes,
			last_activity,
			is_active
		FROM dealer_stats
		ORDER BY email_count DESC, storage_bytes DESC, client_count DESC
	`

	rows, err := ss.DB.Raw(query, distributorID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var dealer DealerPerformanceItem
		err := rows.Scan(
			&dealer.DealerID,
			&dealer.DealerName,
			&dealer.ClientCount,
			&dealer.UserCount,
			&dealer.EmailCount,
			&dealer.StorageBytes,
			&dealer.LastActivity,
			&dealer.IsActive,
		)
		if err != nil {
			return nil, err
		}
		dealer.StorageGB = float64(dealer.StorageBytes) / (1024 * 1024 * 1024)
		dealers = append(dealers, dealer)
	}

	return dealers, nil
}

func (ss *StatisticsService) getClientDistribution(distributorID uuid.UUID) ([]ClientDistributionItem, error) {
	var distribution []ClientDistributionItem

	query := `
		SELECT 
			d.name as dealer_name,
			COUNT(c.id) as client_count
		FROM organizations d
		LEFT JOIN organizations c ON c.parent_org_id = d.id AND c.type = 'client' AND c.is_active = true
		WHERE d.parent_org_id = ? AND d.type = 'dealer' AND d.is_active = true
		GROUP BY d.id, d.name
		ORDER BY client_count DESC
	`

	if err := ss.DB.Raw(query, distributorID).Scan(&distribution).Error; err != nil {
		return nil, err
	}

	return distribution, nil
}

func (ss *StatisticsService) getNetworkActivity(distributorID uuid.UUID) ([]NetworkActivityItem, error) {
	var activities []NetworkActivityItem

	// Get recent organizations in network
	networkOrgsQuery := `
		WITH RECURSIVE org_tree AS (
			SELECT id, name, type, parent_org_id, created_at, updated_at
			FROM organizations 
			WHERE parent_org_id = ? AND is_active = true
			
			UNION ALL
			
			SELECT o.id, o.name, o.type, o.parent_org_id, o.created_at, o.updated_at
			FROM organizations o
			JOIN org_tree ot ON o.parent_org_id = ot.id
			WHERE o.is_active = true
		)
		SELECT id, name, type, created_at FROM org_tree
		ORDER BY created_at DESC LIMIT 10
	`

	rows, err := ss.DB.Raw(networkOrgsQuery, distributorID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id uuid.UUID
		var name, orgType string
		var createdAt time.Time

		if err := rows.Scan(&id, &name, &orgType, &createdAt); err != nil {
			continue
		}

		activities = append(activities, NetworkActivityItem{
			Type:      fmt.Sprintf("%s_created", orgType),
			Message:   fmt.Sprintf("New %s: %s", orgType, name),
			Timestamp: createdAt,
		})
	}

	// Sort by timestamp descending
	for i := 0; i < len(activities)-1; i++ {
		for j := i + 1; j < len(activities); j++ {
			if activities[i].Timestamp.Before(activities[j].Timestamp) {
				activities[i], activities[j] = activities[j], activities[i]
			}
		}
	}

	return activities, nil
}

func (ss *StatisticsService) getNetworkGrowthTrends(distributorID uuid.UUID) (*NetworkGrowthTrends, error) {
	trends := &NetworkGrowthTrends{}

	// This is a simplified version - in production you'd want more sophisticated queries
	// For now, we'll return empty trends as a placeholder
	trends.DealersGrowth = []MonthlyGrowthPoint{}
	trends.ClientsGrowth = []MonthlyGrowthPoint{}
	trends.UsersGrowth = []MonthlyGrowthPoint{}
	trends.StorageGrowth = []MonthlyGrowthPoint{}

	return trends, nil
}

// ===== CLIENT STATISTICS (DEALER) =====

type ClientStats struct {
	TotalClients        int64                    `json:"total_clients"`
	ActiveClients       int64                    `json:"active_clients"`
	TotalEndUsers       int64                    `json:"total_end_users"`
	TotalEmailAccounts  int64                    `json:"total_email_accounts"`
	ClientStorageBytes  int64                    `json:"client_storage_bytes"`
	ClientStorageGB     float64                  `json:"client_storage_gb"`
	ClientPerformance   []ClientPerformanceItem `json:"client_performance"`
	UserDistribution    []UserDistributionItem  `json:"user_distribution"`
	RecentClientActivity []ClientActivityItem   `json:"recent_client_activity"`
	ClientGrowthTrends  *ClientGrowthTrends     `json:"client_growth_trends"`
}

type ClientPerformanceItem struct {
	ClientID      uuid.UUID `json:"client_id"`
	ClientName    string    `json:"client_name"`
	UserCount     int64     `json:"user_count"`
	EmailCount    int64     `json:"email_count"`
	StorageBytes  int64     `json:"storage_bytes"`
	StorageGB     float64   `json:"storage_gb"`
	LastActivity  time.Time `json:"last_activity"`
	IsActive      bool      `json:"is_active"`
	HealthScore   float64   `json:"health_score"`
}

type UserDistributionItem struct {
	ClientName string `json:"client_name"`
	UserCount  int64  `json:"user_count"`
}

type ClientActivityItem struct {
	Type       string    `json:"type"`
	Message    string    `json:"message"`
	Timestamp  time.Time `json:"timestamp"`
	ClientName string    `json:"client_name"`
}

type ClientGrowthTrends struct {
	ClientsGrowth []MonthlyGrowthPoint `json:"clients_growth"`
	UsersGrowth   []MonthlyGrowthPoint `json:"users_growth"`
	EmailsGrowth  []MonthlyGrowthPoint `json:"emails_growth"`
	StorageGrowth []MonthlyGrowthPoint `json:"storage_growth"`
}

func (ss *StatisticsService) GetClientStats(dealerID uuid.UUID) (*ClientStats, error) {
	stats := &ClientStats{}

	// Total clients
	if err := ss.DB.Model(&database.Organization{}).
		Where("parent_org_id = ? AND type = ? AND is_active = ?", dealerID, "client", true).
		Count(&stats.TotalClients).Error; err != nil {
		return nil, fmt.Errorf("failed to count clients: %v", err)
	}

	// Get client IDs for further queries
	var clientIDs []uuid.UUID
	if err := ss.DB.Model(&database.Organization{}).
		Where("parent_org_id = ? AND type = ? AND is_active = ?", dealerID, "client", true).
		Pluck("id", &clientIDs).Error; err != nil {
		return nil, fmt.Errorf("failed to get client IDs: %v", err)
	}

	if len(clientIDs) == 0 {
		return stats, nil // No clients yet
	}

	// Active clients (clients with users)
	activeClientsQuery := `
		SELECT COUNT(DISTINCT o.id)
		FROM organizations o
		WHERE o.parent_org_id = ? AND o.type = 'client' AND o.is_active = true
		AND EXISTS (
			SELECT 1 FROM user_organizations uo 
			WHERE uo.organization_id = o.id
		)
	`
	if err := ss.DB.Raw(activeClientsQuery, dealerID).Scan(&stats.ActiveClients).Error; err != nil {
		return nil, fmt.Errorf("failed to count active clients: %v", err)
	}

	// Total end users
	if err := ss.DB.Table("user_organizations").
		Where("organization_id IN ?", clientIDs).
		Count(&stats.TotalEndUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count end users: %v", err)
	}

	// Total email accounts
	clientAccountsQuery := `
		SELECT COUNT(DISTINCT ea.id)
		FROM email_accounts ea
		JOIN user_organizations uo ON uo.user_id = ea.user_id
		WHERE uo.organization_id IN ? AND ea.is_active = true
	`
	if err := ss.DB.Raw(clientAccountsQuery, clientIDs).Scan(&stats.TotalEmailAccounts).Error; err != nil {
		return nil, fmt.Errorf("failed to count client email accounts: %v", err)
	}

	// Client storage
	clientStorageQuery := `
		SELECT COALESCE(SUM(ei.email_size), 0)
		FROM email_indices ei
		JOIN email_accounts ea ON ea.id = ei.account_id
		JOIN user_organizations uo ON uo.user_id = ea.user_id
		WHERE uo.organization_id IN ?
	`
	if err := ss.DB.Raw(clientStorageQuery, clientIDs).Scan(&stats.ClientStorageBytes).Error; err != nil {
		return nil, fmt.Errorf("failed to calculate client storage: %v", err)
	}
	stats.ClientStorageGB = float64(stats.ClientStorageBytes) / (1024 * 1024 * 1024)

	// Client performance
	clientPerformance, err := ss.getClientPerformance(dealerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get client performance: %v", err)
	}
	stats.ClientPerformance = clientPerformance

	// User distribution
	userDistribution, err := ss.getUserDistribution(dealerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user distribution: %v", err)
	}
	stats.UserDistribution = userDistribution

	// Recent client activity
	recentActivity, err := ss.getClientActivity(dealerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get client activity: %v", err)
	}
	stats.RecentClientActivity = recentActivity

	return stats, nil
}

func (ss *StatisticsService) getClientPerformance(dealerID uuid.UUID) ([]ClientPerformanceItem, error) {
	var clients []ClientPerformanceItem

	query := `
		WITH client_stats AS (
			SELECT 
				c.id as client_id,
				c.name as client_name,
				c.updated_at as last_activity,
				c.is_active,
				COUNT(DISTINCT uo.user_id) as user_count,
				COUNT(DISTINCT ei.id) as email_count,
				COALESCE(SUM(ei.email_size), 0) as storage_bytes
			FROM organizations c
			LEFT JOIN user_organizations uo ON uo.organization_id = c.id
			LEFT JOIN email_accounts ea ON ea.user_id = uo.user_id AND ea.is_active = true
			LEFT JOIN email_indices ei ON ei.account_id = ea.id
			WHERE c.parent_org_id = ? AND c.type = 'client' AND c.is_active = true
			GROUP BY c.id, c.name, c.updated_at, c.is_active
		)
		SELECT 
			client_id,
			client_name,
			user_count,
			email_count,
			storage_bytes,
			last_activity,
			is_active
		FROM client_stats
		ORDER BY email_count DESC, storage_bytes DESC, user_count DESC
	`

	rows, err := ss.DB.Raw(query, dealerID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var client ClientPerformanceItem
		err := rows.Scan(
			&client.ClientID,
			&client.ClientName,
			&client.UserCount,
			&client.EmailCount,
			&client.StorageBytes,
			&client.LastActivity,
			&client.IsActive,
		)
		if err != nil {
			return nil, err
		}
		client.StorageGB = float64(client.StorageBytes) / (1024 * 1024 * 1024)
		
		// Calculate health score based on activity and usage
		client.HealthScore = ss.calculateClientHealthScore(client.UserCount, client.EmailCount, client.LastActivity)
		
		clients = append(clients, client)
	}

	return clients, nil
}

func (ss *StatisticsService) calculateClientHealthScore(userCount, emailCount int64, lastActivity time.Time) float64 {
	score := 0.0
	
	// Base score from user count
	if userCount > 0 {
		score += 30.0
		if userCount >= 5 {
			score += 20.0
		}
	}
	
	// Score from email activity
	if emailCount > 0 {
		score += 30.0
		if emailCount >= 100 {
			score += 10.0
		}
		if emailCount >= 1000 {
			score += 10.0
		}
	}
	
	// Recent activity bonus
	daysSinceActivity := time.Since(lastActivity).Hours() / 24
	if daysSinceActivity <= 7 {
		score += 20.0
	} else if daysSinceActivity <= 30 {
		score += 10.0
	}
	
	return score
}

func (ss *StatisticsService) getUserDistribution(dealerID uuid.UUID) ([]UserDistributionItem, error) {
	var distribution []UserDistributionItem

	query := `
		SELECT 
			c.name as client_name,
			COUNT(uo.user_id) as user_count
		FROM organizations c
		LEFT JOIN user_organizations uo ON uo.organization_id = c.id
		WHERE c.parent_org_id = ? AND c.type = 'client' AND c.is_active = true
		GROUP BY c.id, c.name
		ORDER BY user_count DESC
	`

	if err := ss.DB.Raw(query, dealerID).Scan(&distribution).Error; err != nil {
		return nil, err
	}

	return distribution, nil
}

func (ss *StatisticsService) getClientActivity(dealerID uuid.UUID) ([]ClientActivityItem, error) {
	var activities []ClientActivityItem

	// Get recent client registrations
	clientActivitiesQuery := `
		SELECT 
			'client_created' as type,
			CONCAT('New client registered: ', name) as message,
			created_at as timestamp,
			name as client_name
		FROM organizations
		WHERE parent_org_id = ? AND type = 'client' AND is_active = true
		ORDER BY created_at DESC LIMIT 10
	`

	rows, err := ss.DB.Raw(clientActivitiesQuery, dealerID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var activity ClientActivityItem
		if err := rows.Scan(&activity.Type, &activity.Message, &activity.Timestamp, &activity.ClientName); err != nil {
			continue
		}
		activities = append(activities, activity)
	}

	return activities, nil
}

// ===== USER STATISTICS (CLIENT) =====

type UserStats struct {
	TotalUsers          int64                   `json:"total_users"`
	ActiveUsers         int64                   `json:"active_users"`
	TotalEmailAccounts  int64                   `json:"total_email_accounts"`
	TotalEmails         int64                   `json:"total_emails"`
	UserStorageBytes    int64                   `json:"user_storage_bytes"`
	UserStorageGB       float64                 `json:"user_storage_gb"`
	AccountTypes        map[string]int64        `json:"account_types"`
	UserPerformance     []UserPerformanceItem  `json:"user_performance"`
	SyncStatus          []SyncStatusItem       `json:"sync_status"`
	RecentUserActivity  []UserActivityItem     `json:"recent_user_activity"`
	StorageQuotaUsage   *StorageQuotaUsage     `json:"storage_quota_usage"`
}

type UserPerformanceItem struct {
	UserID       uuid.UUID `json:"user_id"`
	UserEmail    string    `json:"user_email"`
	EmailCount   int64     `json:"email_count"`
	StorageBytes int64     `json:"storage_bytes"`
	StorageGB    float64   `json:"storage_gb"`
	AccountCount int       `json:"account_count"`
	LastSyncDate *time.Time `json:"last_sync_date"`
	IsActive     bool      `json:"is_active"`
}

type SyncStatusItem struct {
	AccountID    uuid.UUID  `json:"account_id"`
	Email        string     `json:"email"`
	Provider     string     `json:"provider"`
	LastSyncDate *time.Time `json:"last_sync_date"`
	IsActive     bool       `json:"is_active"`
	SyncStatus   string     `json:"sync_status"`
}

type UserActivityItem struct {
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	UserEmail string    `json:"user_email"`
}

type StorageQuotaUsage struct {
	UsedBytes     int64   `json:"used_bytes"`
	UsedGB        float64 `json:"used_gb"`
	QuotaBytes    *int64  `json:"quota_bytes"`
	QuotaGB       *float64 `json:"quota_gb"`
	UsagePercent  float64 `json:"usage_percent"`
}

func (ss *StatisticsService) GetUserStats(clientID uuid.UUID) (*UserStats, error) {
	stats := &UserStats{
		AccountTypes: make(map[string]int64),
	}

	// Total users in client organization
	if err := ss.DB.Table("user_organizations").
		Where("organization_id = ?", clientID).
		Count(&stats.TotalUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %v", err)
	}

	// Get user IDs for further queries
	var userIDs []uuid.UUID
	if err := ss.DB.Table("user_organizations").
		Where("organization_id = ?", clientID).
		Pluck("user_id", &userIDs).Error; err != nil {
		return nil, fmt.Errorf("failed to get user IDs: %v", err)
	}

	if len(userIDs) == 0 {
		return stats, nil // No users yet
	}

	// Active users (users with email accounts)
	activeUsersQuery := `
		SELECT COUNT(DISTINCT ea.user_id)
		FROM email_accounts ea
		WHERE ea.user_id IN ? AND ea.is_active = true
	`
	if err := ss.DB.Raw(activeUsersQuery, userIDs).Scan(&stats.ActiveUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count active users: %v", err)
	}

	// Total email accounts
	if err := ss.DB.Model(&database.EmailAccount{}).
		Where("user_id IN ? AND is_active = ?", userIDs, true).
		Count(&stats.TotalEmailAccounts).Error; err != nil {
		return nil, fmt.Errorf("failed to count email accounts: %v", err)
	}

	// Total emails
	userEmailsQuery := `
		SELECT COUNT(DISTINCT ei.id)
		FROM email_indices ei
		JOIN email_accounts ea ON ea.id = ei.account_id
		WHERE ea.user_id IN ?
	`
	if err := ss.DB.Raw(userEmailsQuery, userIDs).Scan(&stats.TotalEmails).Error; err != nil {
		return nil, fmt.Errorf("failed to count emails: %v", err)
	}

	// User storage
	userStorageQuery := `
		SELECT COALESCE(SUM(ei.email_size), 0)
		FROM email_indices ei
		JOIN email_accounts ea ON ea.id = ei.account_id
		WHERE ea.user_id IN ?
	`
	if err := ss.DB.Raw(userStorageQuery, userIDs).Scan(&stats.UserStorageBytes).Error; err != nil {
		return nil, fmt.Errorf("failed to calculate user storage: %v", err)
	}
	stats.UserStorageGB = float64(stats.UserStorageBytes) / (1024 * 1024 * 1024)

	// Account types distribution
	var providerCounts []struct {
		Provider string `json:"provider"`
		Count    int64  `json:"count"`
	}
	if err := ss.DB.Model(&database.EmailAccount{}).
		Select("provider, count(*) as count").
		Where("user_id IN ? AND is_active = ?", userIDs, true).
		Group("provider").
		Scan(&providerCounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get provider counts: %v", err)
	}
	for _, pc := range providerCounts {
		stats.AccountTypes[pc.Provider] = pc.Count
	}

	// User performance
	userPerformance, err := ss.getUserPerformance(clientID, userIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get user performance: %v", err)
	}
	stats.UserPerformance = userPerformance

	// Sync status
	syncStatus, err := ss.getSyncStatus(userIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get sync status: %v", err)
	}
	stats.SyncStatus = syncStatus

	// Recent user activity
	recentActivity, err := ss.getUserActivity(userIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get user activity: %v", err)
	}
	stats.RecentUserActivity = recentActivity

	// Storage quota usage
	storageQuota, err := ss.getStorageQuotaUsage(clientID, stats.UserStorageBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to get storage quota usage: %v", err)
	}
	stats.StorageQuotaUsage = storageQuota

	return stats, nil
}

func (ss *StatisticsService) getUserPerformance(clientID uuid.UUID, userIDs []uuid.UUID) ([]UserPerformanceItem, error) {
	var users []UserPerformanceItem

	query := `
		WITH user_stats AS (
			SELECT 
				u.id as user_id,
				u.email as user_email,
				COUNT(DISTINCT ea.id) as account_count,
				COUNT(DISTINCT ei.id) as email_count,
				COALESCE(SUM(ei.email_size), 0) as storage_bytes,
				MAX(ea.last_sync_date) as last_sync_date
			FROM users u
			LEFT JOIN email_accounts ea ON ea.user_id = u.id AND ea.is_active = true
			LEFT JOIN email_indices ei ON ei.account_id = ea.id
			WHERE u.id IN ?
			GROUP BY u.id, u.email
		)
		SELECT 
			user_id,
			user_email,
			account_count,
			email_count,
			storage_bytes,
			last_sync_date
		FROM user_stats
		ORDER BY email_count DESC, storage_bytes DESC
	`

	rows, err := ss.DB.Raw(query, userIDs).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user UserPerformanceItem
		err := rows.Scan(
			&user.UserID,
			&user.UserEmail,
			&user.AccountCount,
			&user.EmailCount,
			&user.StorageBytes,
			&user.LastSyncDate,
		)
		if err != nil {
			return nil, err
		}
		user.StorageGB = float64(user.StorageBytes) / (1024 * 1024 * 1024)
		user.IsActive = user.AccountCount > 0
		users = append(users, user)
	}

	return users, nil
}

func (ss *StatisticsService) getSyncStatus(userIDs []uuid.UUID) ([]SyncStatusItem, error) {
	var syncItems []SyncStatusItem

	query := `
		SELECT 
			ea.id as account_id,
			ea.email,
			ea.provider,
			ea.last_sync_date,
			ea.is_active
		FROM email_accounts ea
		WHERE ea.user_id IN ?
		ORDER BY ea.last_sync_date DESC NULLS LAST
	`

	rows, err := ss.DB.Raw(query, userIDs).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item SyncStatusItem
		err := rows.Scan(
			&item.AccountID,
			&item.Email,
			&item.Provider,
			&item.LastSyncDate,
			&item.IsActive,
		)
		if err != nil {
			return nil, err
		}

		// Determine sync status
		if !item.IsActive {
			item.SyncStatus = "inactive"
		} else if item.LastSyncDate == nil {
			item.SyncStatus = "never_synced"
		} else if time.Since(*item.LastSyncDate).Hours() > 24 {
			item.SyncStatus = "needs_sync"
		} else {
			item.SyncStatus = "up_to_date"
		}

		syncItems = append(syncItems, item)
	}

	return syncItems, nil
}

func (ss *StatisticsService) getUserActivity(userIDs []uuid.UUID) ([]UserActivityItem, error) {
	var activities []UserActivityItem

	// Get recent email account additions
	accountActivitiesQuery := `
		SELECT 
			'email_account_added' as type,
			CONCAT('Email account added: ', email, ' (', provider, ')') as message,
			created_at as timestamp,
			(SELECT email FROM users WHERE id = ea.user_id) as user_email
		FROM email_accounts ea
		WHERE ea.user_id IN ?
		ORDER BY created_at DESC LIMIT 10
	`

	rows, err := ss.DB.Raw(accountActivitiesQuery, userIDs).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var activity UserActivityItem
		if err := rows.Scan(&activity.Type, &activity.Message, &activity.Timestamp, &activity.UserEmail); err != nil {
			continue
		}
		activities = append(activities, activity)
	}

	return activities, nil
}

func (ss *StatisticsService) getStorageQuotaUsage(clientID uuid.UUID, usedBytes int64) (*StorageQuotaUsage, error) {
	quota := &StorageQuotaUsage{
		UsedBytes: usedBytes,
		UsedGB:    float64(usedBytes) / (1024 * 1024 * 1024),
	}

	// Get organization storage limits
	var org database.Organization
	if err := ss.DB.First(&org, clientID).Error; err != nil {
		return quota, nil // Return basic info if org not found
	}

	if org.MaxStorageGB != nil && *org.MaxStorageGB > 0 {
		quotaBytes := int64(*org.MaxStorageGB) * 1024 * 1024 * 1024
		quotaGB := float64(*org.MaxStorageGB)
		
		quota.QuotaBytes = &quotaBytes
		quota.QuotaGB = &quotaGB
		quota.UsagePercent = (float64(usedBytes) / float64(quotaBytes)) * 100
	}

	return quota, nil
}