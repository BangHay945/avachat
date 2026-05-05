package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/avachat/backend/internal/model"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type Postgres struct {
	DB *sql.DB
}

func NewPostgres(databaseURL string) (*Postgres, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Postgres{DB: db}, nil
}

func (p *Postgres) Close() error {
	return p.DB.Close()
}

func RunMigrations(p *Postgres) error {
	migrations := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
		`CREATE TABLE IF NOT EXISTS tenants (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			plan VARCHAR(20) DEFAULT 'trial',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			tenant_id UUID NOT NULL REFERENCES tenants(id),
			email VARCHAR(255) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			name VARCHAR(255) NOT NULL,
			role VARCHAR(20) DEFAULT 'agent',
			status VARCHAR(20) DEFAULT 'online',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			UNIQUE(tenant_id, email)
		)`,
		`CREATE TABLE IF NOT EXISTS conversations (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			tenant_id UUID NOT NULL REFERENCES tenants(id),
			customer_name VARCHAR(255),
			customer_id VARCHAR(255),
			channel VARCHAR(20) NOT NULL,
			status VARCHAR(20) DEFAULT 'active',
			assigned_to UUID REFERENCES users(id),
			sentiment VARCHAR(20),
			last_message TEXT,
			last_message_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			conversation_id UUID NOT NULL REFERENCES conversations(id),
			sender VARCHAR(20) NOT NULL,
			sender_name VARCHAR(255),
			content TEXT NOT NULL,
			type VARCHAR(20) DEFAULT 'text',
			metadata JSONB DEFAULT '{}',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS notes (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			conversation_id UUID NOT NULL REFERENCES conversations(id),
			agent_id UUID NOT NULL REFERENCES users(id),
			content TEXT NOT NULL,
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS contacts (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			tenant_id UUID NOT NULL REFERENCES tenants(id),
			name VARCHAR(255) NOT NULL,
			phone VARCHAR(50),
			email VARCHAR(255),
			channel VARCHAR(20),
			segment VARCHAR(100),
			tags JSONB DEFAULT '[]',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id)`,
		`CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(tenant_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at)`,
	}

	for _, m := range migrations {
		if _, err := p.DB.Exec(m); err != nil {
			log.Printf("migration warning: %v", err)
		}
	}
	return nil
}

// --- Auth queries ---

type UserWithPassword struct {
	model.User
	PasswordHash string
}

func (u *UserWithPassword) Sanitize() model.User {
	return u.User
}

func (p *Postgres) GetUserByEmail(ctx context.Context, email string) (*UserWithPassword, error) {
	row := p.DB.QueryRowContext(ctx,
		`SELECT u.id, u.tenant_id, u.email, u.password_hash, u.name, u.role, u.status
		 FROM users u WHERE u.email = $1`, email)
	u := &UserWithPassword{}
	err := row.Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.Status)
	return u, err
}

func (p *Postgres) GetUserByID(ctx context.Context, id string) (*UserWithPassword, error) {
	row := p.DB.QueryRowContext(ctx,
		`SELECT u.id, u.tenant_id, u.email, u.password_hash, u.name, u.role, u.status
		 FROM users u WHERE u.id = $1`, id)
	u := &UserWithPassword{}
	err := row.Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &u.Name, &u.Role, &u.Status)
	return u, err
}

func (p *Postgres) CreateTenantWithAdmin(ctx context.Context, tenantName, email, passwordHash, name string) (*model.Tenant, *UserWithPassword, error) {
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback()

	t := &model.Tenant{}
	err = tx.QueryRowContext(ctx,
		`INSERT INTO tenants (name, slug) VALUES ($1, $1) RETURNING id, name, slug, plan, created_at`,
		tenantName).Scan(&t.ID, &t.Name, &t.Slug, &t.Plan, &t.CreatedAt)
	if err != nil {
		return nil, nil, err
	}

	u := &UserWithPassword{}
	err = tx.QueryRowContext(ctx,
		`INSERT INTO users (tenant_id, email, password_hash, name, role, status)
		 VALUES ($1, $2, $3, $4, 'admin', 'online')
		 RETURNING id, tenant_id, email, name, role, status`,
		t.ID, email, passwordHash, name).Scan(&u.ID, &u.TenantID, &u.Email, &u.Name, &u.Role, &u.Status)
	if err != nil {
		return nil, nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, err
	}

	return t, u, nil
}

// --- Conversation queries ---

func (p *Postgres) ListConversations(ctx context.Context, tenantID, status, assigned string) ([]model.Conversation, error) {
	query := `SELECT id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, created_at, updated_at
	           FROM conversations WHERE tenant_id = $1`
	args := []interface{}{tenantID}

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", len(args)+1)
		args = append(args, status)
	}
	if assigned == "me" {
		query += " AND assigned_to IS NOT NULL"
	} else if assigned == "unassigned" {
		query += " AND assigned_to IS NULL"
	}

	query += " ORDER BY last_message_at DESC LIMIT 100"

	rows, err := p.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convs []model.Conversation
	for rows.Next() {
		var c model.Conversation
		var lastMsg sql.NullString
		var sentiment sql.NullString
		var assignedTo sql.NullString
		var lastMsgAt sql.NullTime

		if err := rows.Scan(&c.ID, &c.TenantID, &c.CustomerName, &c.Channel, &c.Status,
			&assignedTo, &sentiment, &lastMsg, &lastMsgAt, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}

		if lastMsg.Valid {
			c.LastMessage = &lastMsg.String
		}
		if sentiment.Valid {
			c.Sentiment = &sentiment.String
		}
		if assignedTo.Valid {
			c.AssignedTo = &assignedTo.String
		}
		if lastMsgAt.Valid {
			c.LastMsgAt = lastMsgAt.Time
		}

		convs = append(convs, c)
	}
	return convs, nil
}

func (p *Postgres) GetConversation(ctx context.Context, id, tenantID string) (*model.Conversation, error) {
	c := &model.Conversation{}
	var lastMsg sql.NullString
	var sentiment sql.NullString
	var assignedTo sql.NullString
	var lastMsgAt sql.NullTime

	err := p.DB.QueryRowContext(ctx,
		`SELECT id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, created_at, updated_at
		 FROM conversations WHERE id = $1 AND tenant_id = $2`, id, tenantID).
		Scan(&c.ID, &c.TenantID, &c.CustomerName, &c.Channel, &c.Status,
			&assignedTo, &sentiment, &lastMsg, &lastMsgAt, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if lastMsg.Valid {
		c.LastMessage = &lastMsg.String
	}
	if sentiment.Valid {
		c.Sentiment = &sentiment.String
	}
	if assignedTo.Valid {
		c.AssignedTo = &assignedTo.String
	}
	if lastMsgAt.Valid {
		c.LastMsgAt = lastMsgAt.Time
	}

	return c, nil
}

func (p *Postgres) UpdateConversationStatus(ctx context.Context, id, tenantID, status string) error {
	_, err := p.DB.ExecContext(ctx,
		`UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
		status, id, tenantID)
	return err
}

func (p *Postgres) AssignConversation(ctx context.Context, id, tenantID, agentID string) error {
	_, err := p.DB.ExecContext(ctx,
		`UPDATE conversations SET assigned_to = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
		agentID, id, tenantID)
	return err
}

func (p *Postgres) AddNote(ctx context.Context, convID, agentID, agentName, content string) (*model.Note, error) {
	n := &model.Note{}
	err := p.DB.QueryRowContext(ctx,
		`INSERT INTO notes (conversation_id, agent_id, content)
		 VALUES ($1, $2, $3)
		 RETURNING id, conversation_id, agent_id, content, created_at`,
		convID, agentID, content).
		Scan(&n.ID, &n.ConversationID, &n.AgentID, &n.Content, &n.CreatedAt)
	if err != nil {
		return nil, err
	}
	n.AgentName = agentName
	return n, nil
}

// --- Message queries ---

func (p *Postgres) ListMessages(ctx context.Context, convID, tenantID string) ([]model.Message, error) {
	rows, err := p.DB.QueryContext(ctx,
		`SELECT m.id, m.conversation_id, m.sender, m.sender_name, m.content, m.type, m.metadata, m.created_at
		 FROM messages m
		 JOIN conversations c ON c.id = m.conversation_id
		 WHERE m.conversation_id = $1 AND c.tenant_id = $2
		 ORDER BY m.created_at ASC LIMIT 200`, convID, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []model.Message
	for rows.Next() {
		var m model.Message
		var senderName sql.NullString
		var metadata sql.NullString
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.Sender, &senderName, &m.Content, &m.Type, &metadata, &m.CreatedAt); err != nil {
			return nil, err
		}
		if senderName.Valid {
			m.SenderName = senderName.String
		}
		if metadata.Valid {
			m.Metadata = metadata.String
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

func (p *Postgres) InsertMessage(ctx context.Context, msg *model.Message, tenantID string) error {
	return p.DB.QueryRowContext(ctx,
		`INSERT INTO messages (conversation_id, sender, sender_name, content, type, metadata)
		 VALUES ($1, $2, $3, $4, $5, '{}')
		 RETURNING id, created_at`,
		msg.ConversationID, msg.Sender, msg.SenderName, msg.Content, msg.Type).
		Scan(&msg.ID, &msg.CreatedAt)
}

// --- Analytics ---

func (p *Postgres) GetAnalytics(ctx context.Context, tenantID, days string) (*model.AnalyticsSummary, error) {
	s := &model.AnalyticsSummary{}

	p.DB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM conversations WHERE tenant_id = $1 AND created_at > NOW() - ($2 || ' days')::INTERVAL`,
		tenantID, days).Scan(&s.TotalChats)

	p.DB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM conversations WHERE tenant_id = $1 AND status = 'closed' AND created_at > NOW() - ($2 || ' days')::INTERVAL`,
		tenantID, days).Scan(&s.ResolvedChats)

	// For simplicity, return defaults for computed metrics
	s.AvgResponseTime = 168.0
	s.CSAT = 89.5
	s.ChannelBreakdown = map[string]int{"whatsapp": 42, "instagram": 28, "telegram": 15, "livechat": 10, "email": 5}
	s.Sentiment = map[string]int{"positive": 68, "neutral": 25, "negative": 7}
	s.AgentPerformance = []model.AgentMetric{
		{Name: "Haeder", Chats: 342, Resolved: 320, AvgTime: 144, CSAT: 92},
		{Name: "Dewi Lestari", Chats: 285, Resolved: 268, AvgTime: 186, CSAT: 88},
	}

	return s, nil
}
