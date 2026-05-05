import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { ok, error } from "../utils/response";
import { broadcast } from "../websocket/hub";
import { analyzeSentiment, handleAutoReply } from "../services/ai";

const router = Router();
const DEFAULT_TENANT = "a1b1c1d1-e1f1-0000-0000-000000000001";

router.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("📥 Telegram webhook:", JSON.stringify(body).slice(0, 200));

    if (body.inline_query) {
      res.json({ method: "answerInlineQuery", inline_query_id: body.inline_query.id, results: [] });
      return;
    }

    if (body.callback_query) {
      res.json({ callback_query_id: body.callback_query.id });
      return;
    }

    const msg = body.message || body.edited_message;
    if (!msg || !msg.chat || !msg.text) {
      ok(res, { status: "ok", reason: "no message" });
      return;
    }

    const from = msg.from || msg.chat;
    const customerId = String(msg.chat.id);
    const customerName = `${from.first_name || ""} ${from.last_name || ""}`.trim() || `Telegram User ${msg.chat.id}`;
    const content = msg.text;

    console.log(`📥 Telegram: ${customerName} (${customerId}) - "${content}"`);

    // Find or create conversation (use customer_name + channel to match, since customer_id is UUID)
    const { rows: existing } = await query(
      "SELECT * FROM conversations WHERE tenant_id = $1 AND customer_name = $2 AND channel = 'telegram' AND status = 'active' ORDER BY last_message_at DESC LIMIT 1",
      [DEFAULT_TENANT, customerName]
    );

    let convId: string;
    if (existing.length > 0) {
      convId = existing[0].id;
      await query("UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2", [content, convId]);
    } else {
      convId = uuid();
      await query(
        "INSERT INTO conversations (id, tenant_id, customer_name, customer_id, channel, status, sentiment, last_message, last_message_at, tags) VALUES ($1, $2, $3, $4, 'telegram', 'active', 'neutral', $5, NOW(), '{}')",
        [convId, DEFAULT_TENANT, customerName, customerId, content]
      );
    }

    const msgId = uuid();
    await query(
      "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'customer', $3, $4, 'text')",
      [msgId, convId, customerName, content]
    );

    // Sentiment analysis
    const sentResult = analyzeSentiment(content);
    await query("UPDATE conversations SET sentiment = $1 WHERE id = $2", [sentResult.sentiment, convId]);

    // Broadcast
    broadcast(convId, {
      type: "new_message",
      conversationId: convId,
      message: { id: msgId, conversation_id: convId, content, sender: "customer", sender_name: customerName, type: "text", created_at: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });

    // Auto-reply via AI
    setTimeout(() => {
      handleAutoReply(DEFAULT_TENANT, convId, content);
    }, 1000);

    // Auto-create CRM contact
    const { rows: existingContacts } = await query(
      "SELECT id FROM crm_contacts WHERE tenant_id = $1 AND name = $2 AND channel = 'telegram'",
      [DEFAULT_TENANT, customerName]
    );
    if (existingContacts.length === 0) {
      await query(
        "INSERT INTO crm_contacts (id, tenant_id, name, channel, last_contact, total_chats, sentiment, tags, segment) VALUES ($1, $2, $3, 'telegram', NOW(), 1, 'neutral', '{}', 'Lead')",
        [uuid(), DEFAULT_TENANT, customerName]
      );
    } else {
      await query("UPDATE crm_contacts SET total_chats = total_chats + 1, last_contact = NOW() WHERE id = $1", [existingContacts[0].id]);
    }

    console.log(`✅ Telegram: conversation ${convId} created`);
    ok(res, { status: "ok" });
  } catch (err: any) {
    console.error("❌ Telegram webhook error:", err?.message || err, err?.stack?.slice(0, 300));
    error(res, "webhook error", 500);
  }
});

router.get("/webhook", (_req, res) => {
  ok(res, { status: "telegram webhook active" });
});

export default router;
