import { query } from "./db";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'agent',
  status VARCHAR(20) NOT NULL DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255),
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  assigned_to UUID REFERENCES users(id),
  sentiment VARCHAR(20) DEFAULT 'neutral',
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL,
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id),
  agent_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  from_agent_id UUID NOT NULL REFERENCES users(id),
  from_agent_name VARCHAR(255) NOT NULL,
  to_agent_id UUID NOT NULL REFERENCES users(id),
  to_agent_name VARCHAR(255) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS handoff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  from_agent_id UUID NOT NULL REFERENCES users(id),
  from_agent_name VARCHAR(255) NOT NULL,
  to_agent_id UUID NOT NULL REFERENCES users(id),
  to_agent_name VARCHAR(255) NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_handoff_to_agent ON handoff_requests(to_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_handoff_conversation ON handoff_requests(conversation_id);

CREATE TABLE IF NOT EXISTS ai_settings (
  tenant_id UUID PRIMARY KEY,
  provider VARCHAR(20) NOT NULL DEFAULT 'openai',
  api_key VARCHAR(255) DEFAULT '',
  custom_endpoint VARCHAR(255) DEFAULT '',
  auto_reply BOOLEAN DEFAULT true,
  sentiment BOOLEAN DEFAULT true,
  summarization BOOLEAN DEFAULT true,
  personalized BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50) NOT NULL,
  category VARCHAR(50) DEFAULT 'umum',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  channel VARCHAR(20) NOT NULL,
  last_contact TIMESTAMPTZ,
  total_chats INTEGER DEFAULT 0,
  sentiment VARCHAR(20) DEFAULT 'neutral',
  tags TEXT[] DEFAULT '{}',
  segment VARCHAR(100) DEFAULT 'Lead',
  location VARCHAR(255),
  source VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  contact_id UUID,
  contact_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  value NUMERIC DEFAULT 0,
  stage VARCHAR(30) DEFAULT 'lead',
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  segment VARCHAR(100) DEFAULT 'All Customers',
  message TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whitelabel_settings (
  tenant_id UUID PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255) DEFAULT '',
  primary_color VARCHAR(20) DEFAULT '#7c3aed',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  tenant_id UUID PRIMARY KEY,
  plan VARCHAR(20) NOT NULL DEFAULT 'trial',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  billing_period VARCHAR(20) DEFAULT 'monthly',
  auto_renew BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  tenant_id UUID NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant ON crm_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant ON crm_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
`;

export async function runMigrations() {
  console.log("🗄️  Running database migrations...");
  await query(SQL);
  console.log("✅ Migrations complete");
}

export async function seedDatabase() {
  const { rows: userCount } = await query("SELECT COUNT(*) FROM users");
  if (parseInt(userCount[0].count) > 0) {
    console.log("🌱 Database already seeded, skipping");
    return;
  }

  console.log("🌱 Seeding database...");

  const now = new Date().toISOString();
  const ago = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

  const tenantId = "a1b1c1d1-e1f1-0000-0000-000000000001";
  const u1 = "a1b1c1d1-0001-0000-0000-000000000001";
  const u2 = "a1b1c1d1-0002-0000-0000-000000000002";
  const u3 = "a1b1c1d1-0003-0000-0000-000000000003";

  const hashedPassword = await bcrypt.hash("password", SALT_ROUNDS);

  await query(
    "INSERT INTO users (id, tenant_id, email, password, name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)",
    [u1, tenantId, "agent@avachat.id", hashedPassword, "Haeder", "admin", "online", now]
  );
  await query(
    "INSERT INTO users (id, tenant_id, email, password, name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)",
    [u2, tenantId, "dewi@avachat.id", hashedPassword, "Dewi Lestari", "supervisor", "online", now]
  );
  await query(
    "INSERT INTO users (id, tenant_id, email, password, name, role, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)",
    [u3, tenantId, "rudi@avachat.id", hashedPassword, "Rudi Hidayat", "agent", "away", now]
  );

  const c1 = "c1a1b1c1-0001-0000-0000-000000000001";
  const c2 = "c1a1b1c1-0002-0000-0000-000000000002";
  const c3 = "c1a1b1c1-0003-0000-0000-000000000003";
  const c4 = "c1a1b1c1-0004-0000-0000-000000000004";
  const c5 = "c1a1b1c1-0005-0000-0000-000000000005";
  const c6 = "c1a1b1c1-0006-0000-0000-000000000006";
  const c7 = "c1a1b1c1-0007-0000-0000-000000000007";

  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at, first_response_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
    [c1, tenantId, "Budi Santoso", "whatsapp", "active", u1, "neutral", "Oh oke, itu sudah termasuk tiket belum ya?", ago(3), "{tour,bali}", ago(240), ago(3), ago(238)]
  );
  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at, first_response_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
    [c2, tenantId, "Siti Rahayu", "instagram", "active", u1, "positive", "Apakah ada diskon untuk pemesanan grup?", ago(15), "{diskon,grup}", ago(180), ago(15), ago(178)]
  );
  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at, first_response_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
    [c3, tenantId, "Agus Wijaya", "telegram", "active", u2, "positive", "Terima kasih infonya, akan saya booking sekarang", ago(45), "{booking}", ago(360), ago(45), ago(358)]
  );
  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
    [c4, tenantId, "Rina Amelia", "livechat", "waiting", null, "negative", "Ini tidak profesional sekali!", ago(5), "{urgent,guide}", ago(60), ago(5)]
  );
  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at, first_response_at, resolved_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
    [c5, tenantId, "Traveloka Support", "email", "closed", null, "neutral", "Konfirmasi booking #AVC-2024-001", ago(120), "{booking,konfirmasi}", ago(480), ago(120), ago(478), ago(120)]
  );
  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at, first_response_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
    [c6, tenantId, "Dian Permata", "facebook", "active", u1, "positive", "Wah romantis banget! Budget-nya berapa ya?", ago(25), "{honeymoon,lombok}", ago(150), ago(25), ago(148)]
  );
  await query(
    "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, assigned_to, sentiment, last_message, last_message_at, tags, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
    [c7, tenantId, "Hendra Gunawan", "tiktok", "active", null, "neutral", "Ini open trip atau private trip ya min?", ago(8), "{trip,info}", ago(90), ago(8)]
  );

  // Messages
  const m = (id: string, convId: string, sender: string, senderName: string, content: string, type: string, createdAt: string) =>
    query("INSERT INTO messages (id, conversation_id, sender, sender_name, content, type, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, convId, sender, senderName, content, type, createdAt]);

  m("aabb0001-0001-0000-0000-000000000001", c1, "customer", "Budi Santoso", "Halo kak, saya mau tanya soal paket tour ke Bali bulan depan", "text", ago(30));
  m("aabb0002-0001-0000-0000-000000000002", c1, "agent", "Haeder", "Halo Pak Budi! Ada yang bisa saya bantu? Kami ada beberapa paket tour ke Bali: 3D2N, 4D3N, dan 5D4N.", "text", ago(28));
  m("aabb0003-0001-0000-0000-000000000003", c1, "customer", "Budi Santoso", "Yang 4D3N berapa ya kak?", "text", ago(25));
  m("aabb0004-0001-0000-0000-000000000004", c1, "ai", "Ava AI", "💡 Suggested Reply: Paket 4D3N Bali mulai dari Rp 2.500.000/pax. Fasilitas: hotel bintang 3, transport, guide lokal, dan makan 3x sehari.", "template", ago(24));
  m("aabb0005-0001-0000-0000-000000000005", c1, "agent", "Haeder", "Untuk paket 4D3N kita ada beberapa pilihan Pak. Mulai dari Rp 2.500.000/pax dengan fasilitas hotel bintang 3, transport, guide lokal, dan makan 3x sehari.", "text", ago(22));
  m("aabb0006-0001-0000-0000-000000000006", c1, "customer", "Budi Santoso", "Oh oke, itu sudah termasuk tiket pesawat belum ya?", "text", ago(3));

  m("aabb0010-0004-0000-0000-000000000001", c4, "customer", "Rina Amelia", "Permisi, saya sudah di bandara Ngurah Rai. Guide-nya di mana ya?", "text", ago(10));
  m("aabb0011-0004-0000-0000-000000000002", c4, "customer", "Rina Amelia", "Saya sudah tunggu 15 menit nih", "text", ago(8));
  m("aabb0012-0004-0000-0000-000000000003", c4, "customer", "Rina Amelia", "Ini tidak profesional sekali!", "text", ago(5));
  m("aabb0013-0004-0000-0000-000000000004", c4, "ai", "Ava AI", "⚠️ Sentiment Alert: Negative sentiment detected.", "template", ago(4));

  m("aabb0020-0002-0000-0000-000000000001", c2, "customer", "Siti Rahayu", "Mau nanya, kalau booking grup untuk 15 orang ada diskon nggak ya?", "text", ago(115));
  m("aabb0021-0002-0000-0000-000000000002", c2, "agent", "Haeder", "Ada Kak! Untuk grup di atas 10 orang kita kasih diskon 10%.", "text", ago(110));

  m("aabb0030-0003-0000-0000-000000000001", c3, "customer", "Agus Wijaya", "Halo, saya tertarik dengan paket Labuan Bajo 3D2N", "text", ago(180));
  m("aabb0031-0003-0000-0000-000000000002", c3, "agent", "Dewi Lestari", "Untuk paket Labuan Bajo 3D2N kita ada keberangkatan setiap Jumat.", "text", ago(175));

  // AI Settings
  await query(
    "INSERT INTO ai_settings (tenant_id, provider, api_key, custom_endpoint, auto_reply, sentiment, summarization, personalized, updated_at) VALUES ($1, 'openai', '', '', true, true, true, true, $2)",
    [tenantId, now]
  );

  // FAQs
  const faq = (id: string, q: string, a: string) =>
    query("INSERT INTO faqs (id, tenant_id, question, answer, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$5)", [id, tenantId, q, a, now]);
  faq("faaa0001-0000-0000-0000-000000000001", "Apa saja paket tour yang tersedia?", "Kami menyediakan paket tour domestik: Bali 3D2N/4D3N/5D4N, Lombok 3D2N, Labuan Bajo 3D2N, Bromo 2D1N, dan Raja Ampat 5D4N.");
  faq("faaa0002-0000-0000-0000-000000000002", "Bagaimana cara booking?", "Booking bisa dilakukan via chat ini, website kami, atau hubungi WhatsApp resmi. Cukup pilih paket dan tanggal, lakukan pembayaran DP 50%.");
  faq("faaa0003-0000-0000-0000-000000000003", "Apakah ada diskon untuk grup?", "Ya! Untuk grup di atas 10 orang dapat diskon 10% dan gratis 1 orang untuk setiap 15 pax.");
  faq("faaa0004-0000-0000-0000-000000000004", "Metode pembayaran apa yang tersedia?", "Kami menerima transfer bank (BCA, Mandiri, BNI), QRIS, GoPay, OVO, dan kartu kredit.");
  faq("faaa0005-0000-0000-0000-000000000005", "Apakah bisa refund atau reschedule?", "Reschedule gratis maksimal H-7. Refund 100% untuk pembatalan H-14, 50% untuk H-7.");
  faq("faaa0006-0000-0000-0000-000000000006", "Jam operasional customer service?", "CS tersedia Senin-Jumat 08:00-20:00 WIB dan Sabtu-Minggu 09:00-17:00 WIB.");

  // Canned Responses
  const cr = (id: string, title: string, content: string, shortcut: string, category: string) =>
    query("INSERT INTO canned_responses (id, tenant_id, title, content, shortcut, category, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$7)", [id, tenantId, title, content, shortcut, category, now]);
  cr("ccaa0001-0000-0000-0000-000000000001", "Greeting", "Halo! Ada yang bisa saya bantu?", "/greeting", "umum");
  cr("ccaa0002-0000-0000-0000-000000000002", "Info Harga", "Untuk info harga dan paket lengkap, bisa dilihat di website kami.", "/harga", "informasi");
  cr("ccaa0003-0000-0000-0000-000000000003", "Follow Up", "Mohon infonya apakah ada yang bisa kami bantu lagi?", "/followup", "umum");
  cr("ccaa0004-0000-0000-0000-000000000004", "Terima Kasih", "Terima kasih telah menghubungi kami!", "/thanks", "umum");
  cr("ccaa0005-0000-0000-0000-000000000005", "Request Callback", "Baik, akan kami jadwalkan untuk tim kami menghubungi Anda.", "/callback", "tindakan");
  cr("ccaa0006-0000-0000-0000-000000000006", "Mohon Maaf", "Mohon maaf atas ketidaknyamanannya.", "/maaf", "komplain");

  // CRM Contacts
  const ct = (id: string, name: string, phone: string | null, email: string | null, channel: string, totalChats: number, sentiment: string, tags: string, segment: string, location: string, source: string, lastContact: string) =>
    query("INSERT INTO crm_contacts (id, tenant_id, name, phone, email, channel, last_contact, total_chats, sentiment, tags, segment, location, source, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)",
      [id, tenantId, name, phone, email, channel, lastContact, totalChats, sentiment, tags, segment, location, source, now]);
  ct("caaa0001-0000-0000-0000-000000000001", "Budi Santoso", "+62812345678", "budi@email.com", "whatsapp", 5, "neutral", "{tour,bali}", "Tour Inquiry", "Jakarta", "Instagram Ad", ago(3));
  ct("caaa0002-0000-0000-0000-000000000002", "Siti Rahayu", "+62823456789", "siti@email.com", "instagram", 3, "positive", "{diskon,grup}", "Group Booking", "Bandung", "Organic", ago(15));
  ct("caaa0003-0000-0000-0000-000000000003", "Agus Wijaya", "+62834567890", null, "telegram", 2, "positive", "{booking}", "Booked", "Surabaya", "Referral", ago(45));
  ct("caaa0004-0000-0000-0000-000000000004", "Rina Amelia", "+62898765432", "rina@email.com", "livechat", 8, "negative", "{urgent,guide}", "Active Customer", "Denpasar", "Website", ago(5));
  ct("caaa0005-0000-0000-0000-000000000005", "Dian Permata", "+62856789012", null, "facebook", 2, "positive", "{honeymoon,lombok}", "Lead", "Yogyakarta", "Facebook Ad", ago(25));
  ct("caaa0006-0000-0000-0000-000000000006", "Hendra Gunawan", "+62867890123", null, "tiktok", 1, "neutral", "{trip,info}", "Lead", "Malang", "TikTok", ago(8));

  // Deals
  const deal = (id: string, contactId: string, contactName: string, title: string, value: number, stage: string, probability: number, notes: string, createdAt: string, updatedAt: string) =>
    query("INSERT INTO crm_deals (id, tenant_id, contact_id, contact_name, title, value, stage, probability, notes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [id, tenantId, contactId, contactName, title, value, stage, probability, notes, createdAt, updatedAt]);
  deal("daaa0001-0000-0000-0000-000000000001", "caaa0001-0000-0000-0000-000000000001", "Budi Santoso", "Bali 4D3N Package", 2500000, "proposal", 60, "Interested in premium package", ago(7200), ago(720));
  deal("daaa0002-0000-0000-0000-000000000002", "caaa0002-0000-0000-0000-000000000002", "Siti Rahayu", "Group Booking 15 pax", 15000000, "negotiation", 80, "Asking for group discount", ago(4320), ago(360));
  deal("daaa0003-0000-0000-0000-000000000003", "caaa0003-0000-0000-0000-000000000003", "Agus Wijaya", "Labuan Bajo 3D2N", 3500000, "closed_won", 100, "Paid in full", ago(10080), ago(7200));

  // Campaigns
  const camp = (id: string, name: string, channel: string, segment: string, message: string, sent: number, delivered: number, opened: number, clicked: number, status: string, createdAt: string) =>
    query("INSERT INTO campaigns (id, tenant_id, name, channel, segment, message, sent, delivered, opened, clicked, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)",
      [id, tenantId, name, channel, segment, message, sent, delivered, opened, clicked, status, createdAt]);
  camp("caaa0001-0000-0000-0000-000000000001", "Promo Akhir Tahun", "whatsapp", "Lead", "🎉 Promo akhir tahun! Diskon 25% all package.", 450, 432, 320, 98, "sent", ago(7200));
  camp("caaa0002-0000-0000-0000-000000000002", "Welcome Back", "email", "Churned", "Kami kangen! Diskon 30% untuk pemesanan kembali.", 180, 175, 88, 22, "sent", ago(4320));
  camp("caaa0003-0000-0000-0000-000000000003", "Honeymoon Promo", "instagram", "Lead", "Special honeymoon package! Private villa + romantic dinner.", 0, 0, 0, 0, "draft", ago(1440));

  // Whitelabel
  await query("INSERT INTO whitelabel_settings (tenant_id, company_name, logo_url, primary_color, updated_at) VALUES ($1, 'Annisatravel', '', '#7c3aed', $2)", [tenantId, now]);

  // Subscription
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  await query("INSERT INTO subscriptions (tenant_id, plan, status, trial_start, trial_end, billing_period, auto_renew, updated_at) VALUES ($1, 'trial', 'active', $2, $3, 'monthly', true, $4)", [tenantId, now, trialEnd.toISOString(), now]);

  // Invoices
  await query("INSERT INTO invoices (id, tenant_id, date, amount, status, description) VALUES ($1,$2,$3,$4,$5,$6)", ["INV-2026-003", tenantId, ago(30), 2500000, "paid", "Langganan Pro - Mei 2026"]);
  await query("INSERT INTO invoices (id, tenant_id, date, amount, status, description) VALUES ($1,$2,$3,$4,$5,$6)", ["INV-2026-002", tenantId, ago(60), 0, "trial", "Masa Trial - Apr 2026"]);
  await query("INSERT INTO invoices (id, tenant_id, date, amount, status, description) VALUES ($1,$2,$3,$4,$5,$6)", ["INV-2026-001", tenantId, ago(90), 0, "trial", "Masa Trial - Mar 2026"]);

  console.log("✅ Database seeded successfully");
}
