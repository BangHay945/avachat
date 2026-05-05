import TelegramBot from "node-telegram-bot-api";
import { query } from "../db/db";
import { ChannelAdapterFactory } from "./channel-adapter";
import type { Conversation } from "../models/types";

export async function sendToChannel(conversationId: string, text: string): Promise<boolean> {
  const { rows } = await query("SELECT * FROM conversations WHERE id = $1", [conversationId]);
  if (rows.length === 0) return false;

  const conv = rows[0] as Conversation;

  // Telegram: send directly via Bot API using stored customer_id (chat_id)
  if (conv.channel === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !conv.customer_id) return false;

    try {
      const bot = new TelegramBot(token, { polling: false });
      await bot.sendMessage(conv.customer_id, text, { parse_mode: "HTML" });
      console.log(`📤 Telegram sent to ${conv.customer_name}`);
      return true;
    } catch (err) {
      console.error(`❌ Telegram send failed:`, err);
      return false;
    }
  }

  // Other channels: use adapter
  const adapter = ChannelAdapterFactory.get(conv.channel);
  if (!adapter || !adapter.connected) return false;

  try {
    await adapter.sendMessage(conversationId, conv.customer_id || conv.customer_name, text);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send to ${conv.channel}:`, err);
    return false;
  }
}

export async function sendTypingToChannel(conversationId: string): Promise<boolean> {
  const { rows } = await query("SELECT * FROM conversations WHERE id = $1", [conversationId]);
  if (rows.length === 0) return false;
  const conv = rows[0] as Conversation;

  if (conv.channel === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !conv.customer_id) return false;
    try {
      const bot = new TelegramBot(token, { polling: false });
      await bot.sendChatAction(conv.customer_id, "typing");
      return true;
    } catch { return false; }
  }
  return false;
}
