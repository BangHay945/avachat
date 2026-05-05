import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import bcrypt from "bcrypt";
import { config } from "./config/env";
import { query } from "./db/db";
import { runMigrations, seedDatabase } from "./db/seed";
import { setupWebSocket } from "./websocket/hub";
import { ChannelAdapterFactory } from "./services/channel-adapter";
import { TelegramAdapter } from "./services/telegram";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import conversationRoutes from "./routes/conversation";
import messageRoutes from "./routes/message";
import cannedRoutes from "./routes/canned";
import aiRoutes from "./routes/ai";
import analyticsRoutes from "./routes/analytics";
import crmRoutes from "./routes/crm";
import campaignRoutes from "./routes/campaign";
import trackRoutes from "./routes/track";
import whitelabelRoutes from "./routes/whitelabel";
import subscriptionRoutes from "./routes/subscription";
import channelRoutes from "./routes/channel";
import webhookRoutes from "./routes/webhook";
import telegramWebhookRoutes from "./routes/telegram-webhook";

const app = express();
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/conversations", messageRoutes);
app.use("/api/v1/canned-responses", cannedRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/crm", crmRoutes);
app.use("/api/v1/campaigns", campaignRoutes);
app.use("/api/v1/track", trackRoutes);
app.use("/api/v1/whitelabel", whitelabelRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);
app.use("/api/v1/channels", channelRoutes);
app.use("/api/v1/webhook", webhookRoutes);
app.use("/api/v1/telegram", telegramWebhookRoutes);

// Static files (widget)
const publicDir = path.join(__dirname, "public");
app.use("/widget", express.static(publicDir));

// Widget demo page
app.get("/widget/demo", (_req, res) => {
  res.sendFile(path.join(publicDir, "demo.html"));
});

// WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/v1/ws" });
setupWebSocket(wss);

// ── Channel Adapters ──────────────────────────────

async function initChannelAdapters() {
  const webhookUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${config.PORT}`;
  const defaultTenant = "a1b1c1d1-e1f1-0000-0000-000000000001";

  // Telegram — connect and set webhook
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const telegram = new TelegramAdapter(webhookUrl, defaultTenant);
    ChannelAdapterFactory.register(telegram);
    await telegram.connect();
    if (telegram.connected) {
      console.log(`📡 Telegram webhook: ${webhookUrl}/api/v1/telegram/webhook`);
      // Also set webhook directly to ensure it's always registered
      const TelegramBot = require("node-telegram-bot-api");
      const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
      await bot.setWebHook(`${webhookUrl}/api/v1/telegram/webhook`).catch(() => {});
      console.log("✅ Telegram webhook registered");
    } else {
      console.log("⚠️ Telegram: webhook set failed");
    }
  } else {
    console.log("📡 Telegram: Add TELEGRAM_BOT_TOKEN to .env to enable");
  }
}

// Start
async function start() {
  await runMigrations();

  console.log("🔐 Migrating plaintext passwords...");
  const { rows: plainUsers } = await query("SELECT id, password FROM users WHERE password NOT LIKE '$2%'");
  for (const u of plainUsers) {
    const hashed = await bcrypt.hash(u.password, config.SALT_ROUNDS);
    await query("UPDATE users SET password = $1 WHERE id = $2", [hashed, u.id]);
  }
  if (plainUsers.length > 0) console.log(`✅ Migrated ${plainUsers.length} plaintext password(s)`);
  else console.log("✅ No plaintext passwords to migrate");

  await seedDatabase();
  await initChannelAdapters();

  server.listen(parseInt(config.PORT), () => {
    console.log(`🚀 AvaChat API running on http://localhost:${config.PORT}`);
    console.log(`📡 WebSocket: ws://localhost:${config.PORT}/api/v1/ws`);
    console.log(`🔌 Live Chat Widget demo: http://localhost:${config.PORT}/widget/demo`);
    console.log(`\n🔑 Demo login: agent@avachat.id / password`);
  });
}

start();
