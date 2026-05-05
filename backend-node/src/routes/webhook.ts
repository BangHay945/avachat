import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { sanitize } from "../utils/sanitize";
import { ok, created, error } from "../utils/response";
import { validate } from "../middleware/validation";
import { broadcast } from "../websocket/hub";
import { analyzeSentiment, handleAutoReply } from "../services/ai";
import { webhookSimulateSchema, webhookReplySchema } from "./validation-schemas";

const router = Router();

router.post("/simulate", validate(webhookSimulateSchema), async (req, res) => {
  try {
    const { channel, customerName, customerPhone, message } = req.body;
    const text = sanitize(message);
    const name = customerName ? sanitize(customerName) : "Customer";

    const tenantId = "a1b1c1d1-e1f1-0000-0000-000000000001";
    const convId = uuid();
    await query(
      "INSERT INTO conversations (id, tenant_id, customer_name, channel, status, sentiment, last_message, last_message_at, tags) VALUES ($1, $2, $3, $4, 'active', 'neutral', $5, NOW(), '{}')",
      [convId, tenantId, name, channel, text]
    );
    const msgId = uuid();
    await query(
      "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'customer', $3, $4, 'text')",
      [msgId, convId, name, text]
    );

    broadcast(convId, { type: "new_conversation", conversation: { id: convId, customer_name: name, channel, status: "active" }, message: { id: msgId, content: text, sender: "customer" }, timestamp: new Date().toISOString() });

    const sentResult = analyzeSentiment(text);
    await query("UPDATE conversations SET sentiment = $1 WHERE id = $2", [sentResult.sentiment, convId]);
    if (sentResult.sentiment === "negative") {
      const alertId = uuid();
      const alertContent = `⚠️ Sentiment Alert: Negative sentiment detected in message from ${name}. Score: ${(sentResult.score * 100).toFixed(0)}%`;
      await query("INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'Ava AI', $3, 'template')", [alertId, convId, alertContent]);
      await query("UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2", [alertContent, convId]);
      broadcast(convId, { type: "sentiment_alert", conversationId: convId, sentiment: "negative", message: { id: alertId, content: alertContent }, timestamp: new Date().toISOString() });
    }

    const { rows: existingContacts } = await query("SELECT id, total_chats FROM crm_contacts WHERE tenant_id = $1 AND name = $2 AND channel = $3", [tenantId, name, channel]);
    if (existingContacts.length > 0) {
      await query("UPDATE crm_contacts SET total_chats = total_chats + 1, last_contact = NOW(), updated_at = NOW() WHERE id = $1", [existingContacts[0].id]);
    } else {
      await query(
        "INSERT INTO crm_contacts (id, tenant_id, name, phone, channel, last_contact, total_chats, sentiment, tags, segment) VALUES ($1, $2, $3, $4, $5, NOW(), 1, 'neutral', '{}', 'Lead')",
        [uuid(), tenantId, name, customerPhone, channel]
      );
    }

    setTimeout(async () => { await handleAutoReply(tenantId, convId, text); }, 1000);

    created(res, { success: true, conversation: { id: convId }, message: { id: msgId, content: text } });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/simulate/:id/message", validate(webhookReplySchema), async (req, res) => {
  try {
    const text = sanitize(req.body.message);
    const { rows: convRows } = await query("SELECT * FROM conversations WHERE id = $1", [req.params.id]);
    if (convRows.length === 0) { error(res, "conversation not found", 404); return; }
    const conv = convRows[0];

    const msgId = uuid();
    await query(
      "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'customer', $3, $4, 'text')",
      [msgId, req.params.id, conv.customer_name, text]
    );
    await query("UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2", [text, req.params.id]);
    broadcast(req.params.id, { type: "new_message", conversationId: req.params.id, message: { id: msgId, content: text, sender: "customer" }, timestamp: new Date().toISOString() });

    const sentResult = analyzeSentiment(text);
    await query("UPDATE conversations SET sentiment = $1 WHERE id = $2", [sentResult.sentiment, req.params.id]);
    if (sentResult.sentiment === "negative") {
      const alertId = uuid();
      const alertContent = `⚠️ Sentiment Alert: Negative sentiment detected. Score: ${(sentResult.score * 100).toFixed(0)}%`;
      await query("INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'Ava AI', $3, 'template')", [alertId, req.params.id, alertContent]);
      await query("UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2", [alertContent, req.params.id]);
      broadcast(req.params.id, { type: "sentiment_alert", conversationId: req.params.id, sentiment: "negative", message: { id: alertId, content: alertContent }, timestamp: new Date().toISOString() });
    }

    setTimeout(async () => { await handleAutoReply(conv.tenant_id, req.params.id, text); }, 1000);

    created(res, { success: true, message: { id: msgId, content: text } });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
