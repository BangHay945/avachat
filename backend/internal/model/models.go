package model

import "time"

type Tenant struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Plan      string    `json:"plan"`
	CreatedAt time.Time `json:"created_at"`
}

type User struct {
	ID       string `json:"id"`
	TenantID string `json:"tenant_id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Status   string `json:"status"`
}

type Conversation struct {
	ID           string    `json:"id"`
	TenantID     string    `json:"tenant_id"`
	CustomerName string    `json:"customer_name"`
	CustomerID   string    `json:"customer_id,omitempty"`
	Channel      string    `json:"channel"`
	Status       string    `json:"status"`
	AssignedTo   *string   `json:"assigned_to,omitempty"`
	Sentiment    *string   `json:"sentiment,omitempty"`
	LastMessage  *string   `json:"last_message,omitempty"`
	LastMsgAt    time.Time `json:"last_message_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	Sender         string    `json:"sender"`
	SenderName     string    `json:"sender_name,omitempty"`
	Content        string    `json:"content"`
	Type           string    `json:"type"`
	Metadata       string    `json:"metadata,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type Note struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversation_id"`
	AgentID        string    `json:"agent_id"`
	AgentName      string    `json:"agent_name"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

type Contact struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`
	Phone     *string   `json:"phone,omitempty"`
	Email     *string   `json:"email,omitempty"`
	Channel   string    `json:"channel"`
	Segment   string    `json:"segment,omitempty"`
	Tags      []string  `json:"tags,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type AnalyticsSummary struct {
	TotalChats       int               `json:"total_chats"`
	ResolvedChats    int               `json:"resolved_chats"`
	AvgResponseTime  float64           `json:"avg_response_time_seconds"`
	CSAT             float64           `json:"csat"`
	ChannelBreakdown map[string]int    `json:"channel_breakdown"`
	Sentiment        map[string]int    `json:"sentiment"`
	AgentPerformance []AgentMetric     `json:"agent_performance"`
}

type AgentMetric struct {
	Name    string  `json:"name"`
	Chats   int     `json:"chats"`
	Resolved int    `json:"resolved"`
	AvgTime float64 `json:"avg_time_seconds"`
	CSAT    float64 `json:"csat"`
}
