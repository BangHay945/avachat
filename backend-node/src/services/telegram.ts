import TelegramBot from "node-telegram-bot-api";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { broadcast } from "../websocket/hub";
import { analyzeSentiment, handleAutoReply } from "./ai";
import type { ChannelAdapter, ChannelEvent } from "./channel-adapter";

export class TelegramAdapter implements ChannelAdapter {
  readonly channel = "telegram";
  private bot: TelegramBot | null = null;
  private webhookUrl: string;
  private tenantId: string;

  constructor(webhookUrl: string, tenantId: string) {
    this.webhookUrl = webhookUrl;
    this.tenantId = tenantId;
  }

  get connected(): boolean {
    return this.bot !== null;
  }

  async connect(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.log("📡 Telegram: No bot token configured, skipping");
      return;
    }

    this.bot = new TelegramBot(token, {
      webHook: { autoOpen: false },
    });

    try {
      await this.bot.setWebHook(`${this.webhookUrl}/api/v1/telegram/webhook`);
      const info = await this.bot.getWebHookInfo();
      console.log(`✅ Telegram connected: @${info.url}`);
    } catch (err) {
      console.error("❌ Telegram setup failed:", err);
      this.bot = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      try {
        await this.bot.deleteWebHook();
      } catch {}
      this.bot = null;
      console.log("📡 Telegram disconnected");
    }
  }

  async sendMessage(conversationId: string, customerId: string, text: string): Promise<{ messageId: string }> {
    if (!this.bot) throw new Error("Telegram not connected");

    const sent = await this.bot.sendMessage(customerId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    return { messageId: String(sent.message_id) };
  }

  async sendMedia(conversationId: string, customerId: string, url: string, caption?: string): Promise<{ messageId: string }> {
    if (!this.bot) throw new Error("Telegram not connected");

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    let sent: TelegramBot.Message;

    if (isImage) {
      sent = await this.bot.sendPhoto(customerId, url, { caption });
    } else {
      sent = await this.bot.sendDocument(customerId, url, { caption });
    }

    return { messageId: String(sent.message_id) };
  }

  async handleEvent(event: ChannelEvent): Promise<{ conversationId: string; messageId: string }> {
    const { customerId, customerName, customerPhone, content, type } = event;

    let name = customerName || `Telegram User ${customerId}`;

    // Find existing conversation or create new
    const { rows: existing } = await query(
      "SELECT * FROM conversations WHERE tenant_id = $1 AND customer_id = $2 AND channel = 'telegram' AND status = 'active' ORDER BY last_message_at DESC LIMIT 1",
      [this.tenantId, customerId]
    );

    let convId: string;
    if (existing.length > 0) {
      convId = existing[0].id;
      await query("UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2", [content, convId]);
    } else {
      convId = uuid();
      const { rows: userRows } = await query("SELECT id FROM users WHERE tenant_id = $1 AND status != 'busy' ORDER BY RANDOM() LIMIT 1", [this.tenantId]);
      const assignedTo = userRows.length > 0 ? userRows[0].id : null;

      await query(
        "INSERT INTO conversations (id, tenant_id, customer_name, customer_id, channel, status, assigned_to, sentiment, last_message, last_message_at, tags) VALUES ($1, $2, $3, $4, 'telegram', 'active', $5, 'neutral', $6, NOW(), '{}')",
        [convId, this.tenantId, name, customerId, assignedTo, content]
      );
    }

    const msgId = uuid();
    await query(
      "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'customer', $3, $4, $5)",
      [msgId, convId, name, content, type || "text"]
    );

    // Auto-sync to CRM
    const { rows: existingContacts } = await query("SELECT id, total_chats FROM crm_contacts WHERE tenant_id = $1 AND name = $2 AND channel = 'telegram'", [this.tenantId, name]);
    if (existingContacts.length > 0) {
      await query("UPDATE crm_contacts SET total_chats = total_chats + 1, last_contact = NOW(), updated_at = NOW() WHERE id = $1", [existingContacts[0].id]);
    } else {
      await query(
        "INSERT INTO crm_contacts (id, tenant_id, name, phone, channel, last_contact, total_chats, sentiment, tags, segment) VALUES ($1, $2, $3, $4, 'telegram', NOW(), 1, 'neutral', '{}', 'Lead')",
        [uuid(), this.tenantId, name, customerPhone || null]
      );
    }

    // Sentiment analysis
    const sentResult = analyzeSentiment(content);
    await query("UPDATE conversations SET sentiment = $1 WHERE id = $2", [sentResult.sentiment, convId]);
    if (sentResult.sentiment === "negative") {
      const alertId = uuid();
      const alertContent = `⚠️ Sentiment Alert: Negative sentiment detected from ${name}. Score: ${(sentResult.score * 100).toFixed(0)}%`;
      await query("INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'Ava AI', $3, 'template')", [alertId, convId, alertContent]);
      await query("UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2", [alertContent, convId]);
      broadcast(convId, { type: "sentiment_alert", conversationId: convId, sentiment: "negative", message: { id: alertId, content: alertContent }, timestamp: new Date().toISOString() });
    }

    // Auto-reply
    setTimeout(async () => {
      await handleAutoReply(this.tenantId, convId, content);
    }, 1000);

    broadcast(convId, { type: "new_message", conversationId: convId, message: { id: msgId, content, sender: "customer", sender_name: name }, timestamp: new Date().toISOString() });

    return {
      conversationId: convId,
      messageId: msgId,
    };
  }
}
