import { Router } from "express";
import { ok, error } from "../utils/response";
import { auth, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { channelUpdateSchema } from "./validation-schemas";
import { ChannelAdapterFactory } from "../services/channel-adapter";
import { TelegramAdapter } from "../services/telegram";

const defaultChannels = [
  { type: "whatsapp", name: "WhatsApp", connected: false },
  { type: "instagram", name: "Instagram", connected: false },
  { type: "telegram", name: "Telegram", connected: false },
  { type: "livechat", name: "Live Chat", connected: true },
  { type: "facebook", name: "Facebook", connected: false },
  { type: "tiktok", name: "TikTok", connected: false },
  { type: "email", name: "Email", connected: false },
];

const channelStatus = new Map<string, boolean>(defaultChannels.map((c) => [c.type, c.connected]));
const channelConfig = new Map<string, Record<string, string>>();

// Auto-detect connected channels from env
if (process.env.TELEGRAM_BOT_TOKEN) {
  channelStatus.set("telegram", true);
}

const router = Router();

router.get("/", auth, (_req, res) => {
  ok(res, defaultChannels.map((c) => ({
    ...c,
    connected: channelStatus.get(c.type) ?? c.connected,
  })));
});

router.put("/:type", auth, adminOnly, validate(channelUpdateSchema), (req, res) => {
  const ch = defaultChannels.find((c) => c.type === req.params.type);
  if (!ch) { error(res, "channel not found", 404); return; }
  channelStatus.set(req.params.type, req.body.connected);

  // If disconnecting, remove adapter
  if (!req.body.connected) {
    const adapter = ChannelAdapterFactory.get(req.params.type);
    if (adapter) adapter.disconnect().catch(() => {});
  }

  ok(res, { ...ch, connected: req.body.connected });
});

// Channel config endpoint (for storing bot tokens, API keys, etc.)
router.put("/:type/config", auth, adminOnly, async (req, res) => {
  const { type } = req.params;
  const { token, connected } = req.body;

  const ch = defaultChannels.find((c) => c.type === type);
  if (!ch) { error(res, "channel not found", 404); return; }

  // Store config
  const config: Record<string, string> = {};
  if (token) config.token = token;
  channelConfig.set(type, config);

  // Handle Telegram connection
  if (type === "telegram" && token) {
    process.env.TELEGRAM_BOT_TOKEN = token;
    try {
      const webhookUrl = process.env.WEBHOOK_BASE_URL || "http://localhost:4000";
      const defaultTenant = "a1b1c1d1-e1f1-0000-0000-000000000001";
      const adapter = new TelegramAdapter(webhookUrl, defaultTenant);
      await adapter.connect();
      if (adapter.connected) {
        ChannelAdapterFactory.register(adapter);
        channelStatus.set(type, true);
      }
    } catch (e) {
      console.error("Failed to connect Telegram:", e);
      error(res, "Failed to connect Telegram bot", 500);
      return;
    }
  }

  if (connected !== undefined) {
    channelStatus.set(type, connected);
  }

  ok(res, { ...ch, connected: channelStatus.get(type) ?? ch.connected });
});

// Get channel config
router.get("/:type/config", auth, adminOnly, (req, res) => {
  const config = channelConfig.get(req.params.type);
  ok(res, config || {});
});

export default router;
