# PRD - AvaChat

## Project Overview
**Project Name**: AvaChat
**Type**: SaaS Web Application (Omnichannel Chat Platform)
**Tech Stack**: Next.js (Frontend), Go (Backend), Native Android/iOS (Mobile), PostgreSQL (Database), Redis (Message Broker)
**Target**: B2B — UKM s/d Enterprise, Indonesia

## Vision
Aplikasi omnichannel chat yang menggabungkan semua channel (WhatsApp, Instagram, Telegram, Facebook Messenger, TikTok DM, Live Chat Web, Email) ke dalam satu dashboard terpusat dengan dukungan multi-agent (Human CS + AI Agents) dan integrasi CRM.

## Stakeholders
- Pemilik Bisnis
- Tim Customer Service
- Tim Marketing
- Tim IT

---

## Interview Status
- [x] Pemilik Bisnis
- [x] Tim Customer Service
- [x] Tim Marketing
- [x] Tim IT

---

## Interview Results

### 1. Pemilik Bisnis
| Item | Jawaban |
|------|---------|
| Target Pasar | B2B Semua (UKM s/d Enterprise) |
| Target Region | Indonesia |
| Monetisasi | Hybrid (base fee + per agent/message) |
| Payment Gateway | Belum ditentukan — tim IT riset |
| Free Tier | Free Trial 14-30 hari |
| Timeline | Fleksibel (belum ada deadline) |
| Fitur Tambahan | Analytics Dashboard |

### 2. Tim Customer Service
| Item | Jawaban |
|------|---------|
| Channels Prioritas | WhatsApp, Instagram DM, Live Chat Web, Telegram, FB Messenger, TikTok DM |
| Agent per Tenant | Tergantung paket langganan |
| Assignment | Round-Robin |
| Fitur Kritis | Canned Responses, Internal Notes, Collision Detection, SLA Tracking, Chat Transfer, Chat History & Search, Agent Status |
| AI Eskalasi | AI menutup percakapan jika customer tidak membalas |
| AI Summarization | Tampil saat transfer & saat chat selesai (resolved) |

### 3. Tim Marketing
| Item | Jawaban |
|------|---------|
| CRM | Custom CRM |
| Data Sync | Kontak, Chat History, Tags/Segments, Sentiment, AI Summaries, Deals/Pipeline |
| Sync Direction | Dua arah (AvaChat ↔ CRM) |
| Fitur Marketing | Broadcast Message, Campaign Tracking, Customer Segmentation, Marketing Analytics Dashboard, Personalized Message (AI), Product Recommendation (AI) |

### 4. Tim IT
| Item | Jawaban |
|------|---------|
| Backend Framework | Go |
| Database | PostgreSQL |
| Message Broker | Redis (Streams) |
| AI LLM | BYOK — Tenant input API key sendiri (OpenAI / Gemini / custom endpoint) |
| Authentication | OAuth 2.0 + JWT |
| Enkripsi | In-transit (TLS) + At-rest |
| WhatsApp API | Belum ditentukan (BSP vs Meta langsung) |
| Cloud Provider | Belum ditentukan |
| Deployment Model | Belum ditentukan |
| Data Residency | Belum ditentukan (konsultasi legal) |
| CI/CD | Belum ditentukan |

---

## Feature Priority (MoSCoW)

### Must Have — MVP / Fase 1
- **Unified Inbox** — WhatsApp, Instagram DM, Telegram, Live Chat Web
- **Real-time Message Sync** (< 1 detik via Redis)
- **Chat History & Full-text Search**
- **Multi-Tenant SaaS** — Isolasi data per tenant
- **Human CS Assignment** — Round-Robin
- **Agent Status** — Online / Away / Busy
- **Role-Based Access** — Admin, Supervisor, Agent
- **Authentication** — OAuth 2.0 + JWT
- **Encryption** — TLS (in-transit) + Database encryption (at-rest)
- **Subscription Tiers** — Berdasarkan jumlah agent
- **Free Trial 14-30 hari** — Auto konversi ke berbayar
- **Payment Gateway Integration** — Midtrans / Xendit / Stripe (TBD)

### Should Have — Fase 2
- **AI Auto-Reply FAQ** — BYOK, tenant bawa API key sendiri
- **AI Chat Summarization** — Tampil saat transfer & resolved
- **AI Sentiment Analysis** — Alert untuk sentimen negatif
- **Chat Transfer** — Agent ke Agent, Agent ke Supervisor
- **Canned Responses** — Template jawaban cepat
- **Internal Notes** — Catatan internal di chat
- **Collision Detection** — Cegah 2 agent balas chat yang sama
- **SLA Tracking** — Response time & Resolution time
- **CRM Integration** — Custom CRM, sync dua arah
- **Customer Segmentation** — Berdasarkan channel, frekuensi, sentimen, tags
- **Analytics Dashboard** — Business + Marketing metrics
- **Channel: Facebook Messenger**
- **Channel: TikTok DM**

### Could Have — Fase 3
- **White-Label** — Custom branding per tenant
- **Broadcast Message** — Pesan massal ke customer via channel
- **Campaign Tracking** — Link tracking & conversion attribution
- **Personalized Message Suggestions (AI)**
- **Product Recommendation (AI)**
- **Mobile App** — Native Android/iOS
- **SSO** — Google / Microsoft login
- **Channel: Email** (SMTP/IMAP)
- **Channel: Line**

### Won't Have (for now)
- End-to-End Encryption (E2EE)
- LDAP / Active Directory
- Full On-Premise Deployment

---

## Core Features

### 1. Omnichannel Dashboard
- Unified inbox untuk semua channel
- Real-time message sync (< 1s via Redis)
- Chat history & full-text search
- Agent status management (Online/Away/Busy)

### 2. Multi-Agent System
- **Human CS Agents**: Role-based access (Admin, Supervisor, Agent), round-robin assignment, chat transfer
- **AI Agents**: FAQ auto-reply (BYOK), sentiment analysis, chat summarization, auto-close jika customer tidak membalas, eskalasi ke human CS

### 3. SaaS Multi-Tenant
- Isolated tenant data (PostgreSQL Row-Level Security)
- Subscription tiers berdasarkan jumlah agent
- Free trial 14-30 hari
- Payment gateway integration (Midtrans/Xendit/Stripe)
- White-labeling support (Fase 3)

### 4. CRM Integration
- Custom CRM (two-way sync)
- Sync: Kontak, Chat History, Tags/Segments, Sentiment Data, AI Summaries, Deals/Pipeline
- Customer segmentation

### 5. AI Features
- Auto-reply FAQ (BYOK — tenant bawa API key)
- Chat summarization (transfer + resolved)
- Sentiment analysis
- Personalized message suggestions (Marketing)
- Product recommendation
- Auto-close chat jika customer tidak membalas

### 6. Marketing Tools
- Broadcast message ke customer via channel
- Campaign tracking (link click, conversion)
- Customer segmentation
- Marketing analytics dashboard

## Non-Functional Requirements
- Scalability: Support thousands of tenants, hundreds of agents
- Security: TLS in-transit + database encryption at-rest, multi-tenant isolation (RLS), AI data privacy (BYOK)
- Performance: Real-time message delivery < 1s (Redis)
- Availability: 99.9% uptime SLA

## Tech Stack (Finalized)
| Component | Choice | Notes |
|-----------|--------|-------|
| **Frontend** | Next.js (React) | SSR/SSG, App Router |
| **Backend** | Go | High performance, goroutines for concurrent connections |
| **Mobile** | Native Android/iOS | Fase 3 |
| **Database** | PostgreSQL | RLS for multi-tenant, JSONB for flexible message data |
| **Message Broker** | Redis (Streams) | Real-time pub/sub + message persistence |
| **AI / LLM** | BYOK | Tenant input API key sendiri (OpenAI, Gemini, custom endpoint) |
| **Auth** | OAuth 2.0 + JWT | Standard modern, extensible ke SSO |
| **Channels** | WhatsApp Business API, Instagram Graph API, Telegram Bot API, FB Messenger API, TikTok API, Live Chat Web SDK, SMTP/IMAP | To be integrated incrementally per MoSCoW |
| **Payment** | TBD (Midtrans / Xendit / Stripe) | Tim IT riset lebih lanjut |
| **Cloud** | TBD | Tim IT riset lebih lanjut |
| **CRM** | Custom CRM | Two-way sync via API/webhook |

## Timeline
*Fleksibel — belum ada deadline dari Pemilik Bisnis. Delivery per fase sesuai MoSCoW:*

| Fase | Scope | Estimasi |
|------|-------|----------|
| **Fase 1** | Must Have (MVP) | TBD |
| **Fase 2** | Should Have | TBD |
| **Fase 3** | Could Have | TBD |

## Open Items (Pertanyaan Belum Terjawab)
- [ ] Payment gateway final (Midtrans vs Xendit vs Stripe)
- [ ] Cloud provider & deployment model
- [ ] WhatsApp integration path (BSP vs Meta langsung)
- [ ] Data residency / PDI compliance (konsultasi legal)
- [ ] CI/CD pipeline setup
- [ ] Revenue model detail (harga per tier)
