# PLAN.md — AvaChat Development Plan

## Architecture Decision Records (ADR)

### ADR-1: Backend Technology — Node.js (Express) vs Go

**Decision**: Gunakan **Node.js/Express** sebagai backend utama, **Go backend dihentikan**.

**Rationale**:
- Node.js backend (`backend-node/`) sudah 80%+ feature-complete untuk seluruh fitur Fase 1–3
- Go backend (`backend/`) hanya 15% feature (auth, conversations, messages, WS basic)
- Go backend sudah tertinggal jauh: tidak ada CRM, AI, campaigns, subscriptions, channels
- Menulis ulang semua fitur Node.js ke Go akan butuh 3–4 bulan ekstra tanpa benefit jelas
- PRD menyebut Go, namun load aktual (ribuan tenant, ratusan agent) masih bisa ditangani Node.js dengan arsitektur yang benar

**Rencana migrasi ke Go (opsional future)**:
- Jika kelak dibutuhkan performa lebih tinggi, migrate service per service (strangler pattern)
- Mulai dari service paling CPU-intensive: AI summarization, sentiment, message ingestion

### ADR-2: Frontend — Tetap Pages Router

**Decision**: Tetap gunakan **Pages Router**, tidak migrasi ke App Router.

**Rationale**:
- Seluruh frontend sudah dibangun dengan Pages Router
- Fitur sudah komplit untuk semua 3 fase
- Migrasi ke App Router akan butuh rewrite besar (layout, data fetching, server components)
- PRD menyebut "App Router" tapi tidak ada deadline — prioritas sekarang delivery, bukan migrasi
- Migrasi bisa dilakukan di Fase 3 (prioritas rendah)

### ADR-3: Arsitektur Backend — Refactor Monolith ke Layered Architecture

**Decision**: Refactor `server.ts` (1634 lines) menjadi modular layered architecture.

**Rationale**:
- Saat ini semua logic ada di 1 file — tidak maintainable
- Harus dipisah menjadi routes, controllers, services, repositories
- Ikuti pola Go backend yang sudah clean

### ADR-4: Database & Infrastructure

**Decision**: 
- PostgreSQL 16 + Redis 7 (sesuai docker-compose.yml — sudah benar)
- Semua environment pakai Docker Compose
- **Production: Self-managed VPS** (no cloud provider lock-in)
- Deployment: Docker Compose + Nginx reverse proxy on VPS
- Auto-migration saat startup
- CI/CD: GitHub Actions → build image → deploy to VPS via SSH

### ADR-5: Channel Integration Priority

**Decision**:
- WhatsApp, Instagram, Facebook Messenger **ditunda** — butuh Meta approval + BSP
- Fase 1 fokus pada channel yang **tanpa approval**: **Live Chat Web** + **Telegram Bot**
- Channel WhatsApp/Instagram masuk Fase 2

---

## Current State Audit

### Node.js Backend (`backend-node/`) — Current State

| Fitur | Status | Kualitas |
|-------|--------|----------|
| Auth (login, register, JWT) | Done | Baik |
| Multi-tenant | Done | Baik |
| Conversations CRUD | Done | Baik |
| Messages (send/receive) | Done | Baik |
| WebSocket real-time | Done | Baik |
| Handoff / Transfer | Done | Baik |
| Internal Notes | Done | Baik |
| Collision Detection | Done | Baik |
| Canned Responses | Done | Baik |
| AI Sentiment (keyword) | Done | Basic (no LLM) |
| AI Auto-Reply (FAQ match) | Done | Basic (no LLM) |
| AI Summarization | Done | Basic (no LLM) |
| AI Suggestions / Recommendations | Done | Basic (no LLM) |
| CRM Contacts & Deals | Done | Baik |
| Campaigns (Broadcast) | Done | Baik |
| Analytics | Done | Baik |
| Subscription (Basic/Pro/Enterprise) | Done | Baik |
| White Label | Done | Baik |
| Channel Management | Done | UI only |
| Webhook Simulator | Done | Baik |
| Seed Data (demo) | Done | Baik |

**Masalah yang perlu diperbaiki**:
- [ ] Monolithic `server.ts` — harus di-split (HIGH)
- [ ] Tidak ada unit/integration test (HIGH)
- [ ] Tidak ada input validation library (Joi/Zod) (MEDIUM)
- [ ] Tidak ada rate limiting (MEDIUM)
- [ ] Tidak ada request logging terstruktur (MEDIUM)
- [ ] AI masih keyword-based, bukan LLM (Fase 2)
- [ ] Channel integration masih simulasi (Fase 1/2)
- [ ] Tidak ada email service (verification, notification) (MEDIUM)
- [ ] Tidak ada file upload (attachments) (MEDIUM)
- [ ] Tidak ada health check endpoint (LOW)

### Next.js Frontend (`frontend/`) — Current State

| Fitur | Status | Kualitas |
|-------|--------|----------|
| Landing Page | Done | Baik |
| Login / Register | Done | Baik |
| Dashboard (Inbox) | Done | Sangat Baik |
| Contacts (CRM) | Done | Baik |
| Deals Pipeline | Done | Baik |
| Analytics Dashboard | Done | Baik |
| Broadcast Campaigns | Done | Baik |
| Admin Panel | Done | Baik |
| Settings (10 tabs) | Done | Baik |
| Onboarding Wizard | Done | Baik |
| Simulator | Done | Baik |

**Masalah yang perlu diperbaiki**:
- [ ] Pages Router, bukan App Router (WONTFIX — lihat ADR-2)
- [ ] Dashboard.tsx terlalu besar (1686 lines) — perlu di-split (MEDIUM)
- [ ] Settings.tsx terlalu besar (1574 lines) — perlu di-split (MEDIUM)
- [ ] Tidak ada test (HIGH)
- [ ] Error handling API belum robust (MEDIUM)
- [ ] Tidak ada loading/empty/error state yang konsisten (MEDIUM)
- [ ] Belum ada responsive testing untuk mobile (MEDIUM)
- [ ] Belum ada a11y testing (LOW)

### Go Backend (`backend/`) — STATUS: ARCHIVED

- **DIPERTAHANKAN sebagai reference architecture** untuk Node.js refactor
- Arsitekturnya (config/handler/middleware/model/repository) sudah baik
- Node.js backend akan di-refactor mengikuti pola yang sama
- Tidak akan dikembangkan lebih lanjut

---

## Fase 1 — MVP (Must Have)

**Goal**: Platform omnichannel chat yang bisa digunakan untuk early adopter, dengan multi-tenant SaaS, real-time messaging, dan subscription.

**Estimasi**: 8–12 minggu

### 1.1 Backend Refactor & Stabilisasi (Minggu 1–3)

#### 1.1.1 Modularisasi Backend
- [ ] Split `server.ts` menjadi struktur:
  ```
  src/
  ├── config/
  │   └── env.ts
  ├── middleware/
  │   ├── auth.ts
  │   ├── rbac.ts
  │   ├── validation.ts
  │   └── ratelimit.ts
  ├── models/
  │   └── types.ts
  ├── repositories/
  │   ├── auth.ts
  │   ├── conversation.ts
  │   ├── message.ts
  │   ├── contact.ts
  │   ├── deal.ts
  │   ├── campaign.ts
  │   ├── canned.ts
  │   ├── ai.ts
  │   ├── subscription.ts
  │   └── channel.ts
  ├── services/
  │   ├── auth.ts
  │   ├── conversation.ts
  │   ├── message.ts
  │   ├── ai.ts
  │   ├── crm.ts
  │   ├── campaign.ts
  │   └── billing.ts
  ├── routes/
  │   ├── auth.ts
  │   ├── user.ts
  │   ├── conversation.ts
  │   ├── message.ts
  │   ├── handoff.ts
  │   ├── canned.ts
  │   ├── ai.ts
  │   ├── analytics.ts
  │   ├── crm.ts
  │   ├── campaign.ts
  │   ├── whitelabel.ts
  │   ├── subscription.ts
  │   ├── channel.ts
  │   ├── webhook.ts
  │   └── ws.ts
  ├── websocket/
  │   ├── hub.ts
  │   └── handlers.ts
  ├── db/
  │   ├── db.ts
  │   ├── redis.ts
  │   ├── migrate.ts
  │   └── seed.ts
  ├── utils/
  │   ├── jwt.ts
  │   ├── crypto.ts
  │   └── response.ts
  └── server.ts  (hanya wiring + startup)
  ```

#### 1.1.2 Input Validation
- [ ] Install Zod untuk schema validation
- [ ] Validasi di semua endpoint:
  - Email format, password strength (min 8, alphanumeric)
  - UUID untuk ID
  - Enum untuk status, role, channel type
  - Length limits (message max 5000 chars, name max 100)
  - Sanitize input (XSS prevention)

#### 1.1.3 Error Handling
- [ ] Global error handler middleware
- [ ] Consistent error response format: `{ error: { code, message, details? } }`
- [ ] HTTP status codes yang tepat (400, 401, 403, 404, 409, 429, 500)
- [ ] Logging errors dengan structured logger (Pino)

#### 1.1.4 Rate Limiting
- [ ] `express-rate-limit` — general API: 100 req/menit per IP
- [ ] Auth endpoints: 5 req/menit per IP (brute-force protection)
- [ ] AI endpoints: 20 req/menit per user (cost control)

#### 1.1.5 Security Hardening
- [ ] Helmet.js untuk security headers
- [ ] CORS strict origin (dari env, bukan wildcard)
- [ ] WebSocket origin validation
- [ ] Password hashing cost factor 12 (bcrypt)
- [ ] JWT expiry: 24h access, 7d refresh token
- [ ] Refresh token rotation

#### 1.1.6 Testing
- [ ] Vitest untuk test runner
- [ ] Unit tests untuk semua services
- [ ] Integration tests untuk semua API endpoints
- [ ] WebSocket tests
- [ ] Target coverage: 80%+

### 1.2 Channel Integrations (Minggu 3–5)

**Platform yang harus terintegrasi (Must Have — Fase 1)**:
- [ ] **Live Chat Web** — SDK / widget
  - Embeddable chat widget (JS snippet) untuk website customer
  - File attachment (image, document)
  - Pre-chat form (name, email, phone)
  - Offline form (di luar business hours)
  - Customizable appearance (warna, posisi, logo)
- [ ] **Telegram** — Bot API
  - Webhook receive messages
  - Send text + media (image, document)
  - Inline keyboard (quick replies)
  - Bot command support (/start, /help)
  - Channel callback → conversation routing

**Ditunda ke Fase 2 (butuh approval Meta + BSP)**:
- [ ] WhatsApp Business API
- [ ] Instagram DM
- [ ] Facebook Messenger

#### Architecture per Channel:
```
Channel Adapter Pattern:
  TelegramAdapter implements ChannelAdapter {
    sendMessage(), receiveWebhook(), getProfile()
  }
  WebChatAdapter implements ChannelAdapter { ... }
```

### 1.3 MVP Feature Completion (Minggu 5–8)

#### 1.3.1 Subscription & Billing (REAL)
- [ ] Payment gateway integration: Midtrans (prioritas, karena target Indonesia)
- [ ] Plan: Trial (14-30 hari), Basic, Pro, Enterprise
- [ ] Auto-create subscription saat register (trial)
- [ ] Auto-downgrade/block saat trial habis
- [ ] Invoice generation (PDF)
- [ ] Billing history
- [ ] Usage tracking (message count, agent count)

#### 1.3.2 Notification System
- [ ] Email notifications (Nodemailer)
  - Welcome email
  - Password reset
  - Trial expiry warning
  - Payment receipt
- [ ] In-app notifications (WebSocket push)
  - New chat assigned
  - Handoff request
  - SLA warning
  - Collision alert

#### 1.3.3 Search & Pagination
- [ ] Full-text search conversations (PostgreSQL `tsvector`)
  - Search by customer name, message content
  - Filter by channel, status, date range
- [ ] Pagination untuk list endpoints (cursor-based)
  - `/conversations?cursor=xxx&limit=25`
  - `/messages?cursor=xxx&limit=50`
- [ ] Search contacts, deals, campaigns

#### 1.3.4 Canned Responses Enhancement
- [ ] Categories & folders
- [ ] Variable interpolation (`{customer_name}`, `{agent_name}`)
- [ ] Shortcut keys (e.g., `/thanks`, `/greeting`)
- [ ] Import/export CSV

#### 1.3.5 SLA Tracking (REAL)
- [ ] First response time (menit dari message pertama customer)
- [ ] Resolution time (menit dari open → resolved)
- [ ] Business hours awareness
- [ ] SLA breach alerts (visual + WebSocket)
- [ ] SLA reporting in analytics

### 1.4 Frontend Finishing (Minggu 8–10)

#### 1.4.1 Refactor Large Components
- [ ] Split `dashboard.tsx` (1686 lines) menjadi:
  - `ConversationList.tsx`
  - `ChatPanel.tsx`
  - `ChatHeader.tsx`
  - `MessageBubble.tsx`
  - `MessageInput.tsx`
  - `ChatInfoSheet.tsx`
  - `CannedResponsePanel.tsx`
  - `AiSuggestionsPanel.tsx`
  - `useChatState.ts` (custom hook)
  - `useWebSocket.ts` (custom hook)
- [ ] Split `settings.tsx` (1574 lines) menjadi 10 komponen per tab
- [ ] Split `contacts.tsx` (518 lines) jika perlu

#### 1.4.2 Real API Integration
- [ ] Ganti semua mock data dengan real API calls
- [ ] Error handling & retry logic
- [ ] Loading skeletons & empty states yang konsisten
- [ ] Optimistic updates untuk UX yang responsif
- [ ] React Query (TanStack Query) untuk data fetching + caching

#### 1.4.3 Mobile Responsiveness
- [ ] Test semua halaman di mobile (iOS Safari + Android Chrome)
- [ ] Fix layout issues di mobile
- [ ] Touch-friendly interactions (swipe, tap)
- [ ] Mobile-specific navigation patterns

#### 1.4.4 E2E Testing
- [ ] Playwright untuk E2E tests
- [ ] Critical paths: Register → Login → Dashboard → Chat → Resolve
- [ ] Subscription flow: Trial → Upgrade → Payment
- [ ] Channel connection flow

### 1.5 DevOps & Infrastructure (Minggu 10–12)

#### 1.5.1 CI/CD Pipeline
- [ ] GitHub Actions workflow:
  - Lint & typecheck on PR
  - Unit + integration tests on PR
  - E2E tests on PR
  - Build & push Docker images on merge to main
  - Deploy to staging on merge to main
  - Deploy to production on tag

#### 1.5.2 Production Readiness (VPS)
- [ ] Docker Compose production setup on VPS
  - Nginx reverse proxy (HTTPS termination via Let's Encrypt)
  - PostgreSQL production config (tuning, WAL, backup)
  - Redis production config (persistence, maxmemory)
  - Node.js PM2 cluster mode (multi-core)
- [ ] Database backup strategy (pg_dump cron to external storage)
- [ ] Redis backup (RDB + AOF)
- [ ] Health check + readiness probe endpoints
- [ ] Monitoring: basic metrics (API latency, error rate, WS connections)
- [ ] Log aggregation (structured JSON logs, Docker log driver)
- [ ] UFW firewall + fail2ban for SSH protection

#### 1.5.3 Security
- [ ] SSL/TLS (Let's Encrypt via Certbot)
- [ ] Database encryption at-rest (TDE)
- [ ] Secrets management (env vars atau vault)
- [ ] Security audit dependencies (npm audit, Snyk)
- [ ] CORS strict configuration
- [ ] CSP headers
- [ ] Penetration testing basic

---

## Fase 2 — Should Have (AI + CRM)

**Goal**: AI-powered customer service, advanced CRM, additional channels.

**Estimasi**: 6–8 minggu (setelah Fase 1 selesai)

### 2.1 AI Integration dengan LLM (BYOK)
- [ ] Integrasi dengan OpenAI API
- [ ] Integrasi dengan Google Gemini API
- [ ] Support custom endpoint (sesuai OpenAI API spec)
- [ ] Tenant input API key sendiri (BYOK) — tersimpan terenkripsi
- [ ] AI Auto-Reply FAQ **dengan LLM** (bukan keyword)
  - Context dari FAQ knowledge base
  - Tone & style diatur tenant
  - Handoff ke human CS jika confidence rendah
- [ ] AI Sentiment Analysis **dengan LLM**
  - Analisis per message
  - Trend sentiment per conversation
  - Alert untuk sentiment negatif (3 message berturut-turut)
- [ ] AI Chat Summarization **dengan LLM**
  - Summary saat transfer ke agent lain
  - Summary saat conversation resolved
  - Format terstruktur: issue, actions taken, resolution, next steps
- [ ] AI-Powered Suggestions saat agent mengetik
- [ ] Smart Reply untuk quick actions (shortcut)
- [ ] Token usage tracking per tenant

### 2.2 Advanced CRM
- [ ] Two-way sync dengan CRM (custom)
  - Webhook outbound: contact created/updated, chat resolved
  - Webhook inbound: contact updated, deal stage changed
  - Conflict resolution strategy
- [ ] Customer Segmentation engine
  - Berdasarkan channel, frekuensi, sentimen, tags
  - Auto-tagging berdasarkan AI analysis
  - Segment-based automation rules
- [ ] Enhanced Deals Pipeline
  - Deal probability AI
  - Activity timeline
  - Reminder & follow-up task
  - Revenue forecasting

### 2.3 Additional Channels
- [ ] **WhatsApp Business API** — Meta Graph API langsung
  - Webhook receive messages
  - Send text/messages
  - Template messages
  - Profile info
- [ ] **Instagram DM** — Meta Graph API
- [ ] Facebook Messenger — Meta Graph API
- [ ] TikTok DM — TikTok API (jika tersedia/feasible)

### 2.4 Collision Detection Enhancement
- [ ] Real-time typing indicator lintas agent
- [ ] "Agent X is viewing" notification
- [ ] Lock conversation saat agent mulai mengetik (optimistic lock)

### 2.5 Analytics Enhancement
- [ ] Custom date ranges
- [ ] Multi-tenant aggregate analytics (admin view)
- [ ] Export reports (CSV, PDF)
- [ ] Scheduled report emails

---

## Fase 3 — Could Have (Scale & Polish)

**Goal**: White label, marketing tools, mobile app.

**Estimasi**: 8–10 minggu (setelah Fase 2 selesai)

### 3.1 White Label (Full)
- [ ] Custom domain per tenant (CNAME)
- [ ] Custom CSS/styling
- [ ] Custom email templates
- [ ] Custom chat widget branding

### 3.2 Marketing Tools
- [ ] Broadcast Message engine
  - Template system
  - Personalization (merge tags dari CRM)
  - Scheduling
  - Rate limiting per channel (WhatsApp API limits)
  - Delivery tracking
- [ ] Campaign Tracking
  - UTM parameter generation
  - Click tracking
  - Conversion attribution
  - A/B testing

### 3.3 Mobile Apps (React Native atau Native)
- [ ] Agent app: dashboard, conversations, push notifications
- [ ] Admin app: analytics, subscription management
- [ ] Live Chat SDK untuk customer

### 3.4 Additional Channels (Long Tail)
- [ ] Email — SMTP/IMAP integration
- [ ] Line — Line Messaging API

### 3.5 Platform Features
- [ ] SSO — Google / Microsoft OAuth login
- [ ] Audit log (full, searchable)
- [ ] API rate limiting per tenant
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Webhook for 3rd party integrations
- [ ] Migration to Go backend (opsional, evaluasi di akhir Fase 3)

---

## Timeline Summary

| Fase | Scope | Estimasi | Deliverable |
|------|-------|----------|-------------|
| **Fase 1** | MVP + Live Chat Web + Telegram + Production Ready | 12 minggu | Platform live, bisa terima tenant |
| **Fase 2** | AI (LLM) + CRM Advanced + 2 Channels | 6–8 minggu | AI-powered platform |
| **Fase 3** | White Label + Marketing + Mobile | 8–10 minggu | Full platform |

**Total**: ~26–30 minggu untuk full platform

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Midtrans API integration delay | Low | Medium | Mode sandbox sudah tersedia; tim sudah familiar dengan Midtrans |
| VPS server maintenance overhead | Low | Low | Setup script + ansible/docker compose untuk auto-deploy |
| LLM cost membengkak (BYOK) | Low | Medium | Token limit per tenant; cost tracking dashboard |
| Team size/bandwidth terbatas | Medium | High | Focus pada MVP dulu; skip nice-to-have |
| Telegram API rate limits | Low | Low | Queue system untuk outbound messages |

---

## Open Items (RESOLVED)

- [x] **Payment gateway**: Midtrans (diputuskan)
- [x] **Cloud provider**: VPS self-managed (diputuskan)
- [x] **WhatsApp path**: Ditunda ke Fase 2 (Meta langsung tanpa BSP)

## Open Items (BELUM RESOLVED)

- [ ] Data residency / PDI compliance (konsultasi legal)
- [ ] Revenue model detail: harga per tier
- [ ] Email service provider (SendGrid / Resend / AWS SES)

---

## Immediate Next Actions (Minggu Ini)

1. [x] ~~DECIDE payment gateway~~ → **Midtrans**
2. [x] ~~DECIDE cloud provider~~ → **VPS self-managed**
3. [x] ~~DECIDE WhatsApp path~~ → **Ditunda ke Fase 2**
4. [ ] **START** Backend refactor (task 1.1.1)
5. [ ] **START** Zod validation (task 1.1.2)
6. [ ] **START** Vitest testing setup (task 1.1.6)
7. [ ] **START** Live Chat Web widget (task 1.2)
