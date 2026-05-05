import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { sanitize, sanitizeUser } from "../utils/sanitize";
import { ok, created, error } from "../utils/response";
import { auth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { getConversations, getConversation, updateConversationStatus, assignConversation, addNote, getTransfers } from "../services/conversation";
import { generateSummary, handleAutoReply, handleSentimentAlert } from "../services/ai";
import { insertAiMessage, insertSystemMessage } from "../services/message";
import { sendTypingToChannel } from "../services/channel-service";
import { broadcast, broadcastToUser } from "../websocket/hub";
import { updateStatusSchema, assignSchema, transferSchema, handoffSchema, handoffActionSchema, addNoteSchema } from "./validation-schemas";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const convs = await getConversations(req.tenantId, {
      status: req.query.status as string,
      assigned: req.query.assigned as string,
    });
    ok(res, convs);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const conv = await getConversation(req.params.id, req.tenantId);
    if (!conv) { error(res, "not found", 404); return; }
    ok(res, conv);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/:id/status", auth, validate(updateStatusSchema), async (req, res) => {
  try {
    const conv = await updateConversationStatus(req.params.id, req.tenantId, req.body.status);
    if (!conv) { error(res, "not found", 404); return; }
    broadcast(req.params.id, { type: "status_change", conversationId: req.params.id, status: req.body.status, timestamp: new Date().toISOString() });
    if (req.body.status === "closed") {
      const { rows: aiRows } = await query("SELECT * FROM ai_settings WHERE tenant_id = $1 AND summarization = true", [req.tenantId]);
      if (aiRows.length > 0) {
        const summary = await generateSummary(req.params.id);
        const msg = await insertAiMessage(req.params.id, summary);
        broadcast(req.params.id, { type: "new_message", message: msg, timestamp: new Date().toISOString() });
      }
    }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/:id/assign", auth, validate(assignSchema), async (req, res) => {
  try {
    const conv = await assignConversation(req.params.id, req.tenantId, req.body.agent_id);
    if (!conv) { error(res, "not found", 404); return; }
    broadcast(req.params.id, { type: "assignment", conversationId: req.params.id, assignedTo: req.body.agent_id, timestamp: new Date().toISOString() });
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/:id/transfer", auth, validate(transferSchema), async (req, res) => {
  try {
    const conv = await getConversation(req.params.id, req.tenantId);
    if (!conv) { error(res, "not found", 404); return; }
    const { rows: userRows } = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
    const { rows: targetRows } = await query("SELECT * FROM users WHERE id = $1", [req.body.agent_id]);
    if (targetRows.length === 0) { error(res, "target agent not found", 400); return; }

    const currentUser = userRows[0];
    const targetAgent = targetRows[0];
    const transferId = uuid();
    await query(
      "INSERT INTO transfers (id, conversation_id, from_agent_id, from_agent_name, to_agent_id, to_agent_name, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [transferId, req.params.id, currentUser.id, currentUser.name, targetAgent.id, targetAgent.name, req.body.reason || ""]
    );
    await query("UPDATE conversations SET assigned_to = $1, updated_at = NOW() WHERE id = $2", [targetAgent.id, req.params.id]);

    const sysMsg = await insertSystemMessage(req.params.id, `🔄 Transferred to ${targetAgent.name}${req.body.reason ? ` — ${req.body.reason}` : ""}`);
    broadcast(req.params.id, { type: "transfer", conversationId: req.params.id, transfer: { id: transferId, from_agent_id: currentUser.id, from_agent_name: currentUser.name, to_agent_id: targetAgent.id, to_agent_name: targetAgent.name, reason: req.body.reason || "" }, timestamp: new Date().toISOString() });

    const { rows: aiRows } = await query("SELECT * FROM ai_settings WHERE tenant_id = $1 AND summarization = true", [req.tenantId]);
    if (aiRows.length > 0) {
      const summary = await generateSummary(req.params.id);
      const aiMsg = await insertAiMessage(req.params.id, summary);
      broadcast(req.params.id, { type: "new_message", message: aiMsg, timestamp: new Date().toISOString() });
    }

    ok(res, { status: "ok", transfer: { id: transferId }, message: { id: sysMsg.id } });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/:id/transfers", auth, async (req, res) => {
  try {
    const transfers = await getTransfers(req.params.id);
    ok(res, transfers);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/:id/handoff", auth, validate(handoffSchema), async (req, res) => {
  try {
    const conv = await getConversation(req.params.id, req.tenantId);
    if (!conv) { error(res, "conversation not found", 404); return; }
    if (conv.status === "closed") { error(res, "cannot handoff closed conversation", 400); return; }

    const { rows: userRows } = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
    const { rows: targetRows } = await query("SELECT * FROM users WHERE id = $1", [req.body.agent_id]);
    if (targetRows.length === 0) { error(res, "target agent not found", 400); return; }

    const currentUser = userRows[0];
    const targetAgent = targetRows[0];
    if (currentUser.id === targetAgent.id) { error(res, "cannot handoff to yourself", 400); return; }

    const { rows: existing } = await query("SELECT id FROM handoff_requests WHERE conversation_id = $1 AND status = 'pending'", [req.params.id]);
    if (existing.length > 0) { error(res, "pending handoff request already exists", 409); return; }

    const handoffId = uuid();
    await query(
      "INSERT INTO handoff_requests (id, conversation_id, from_agent_id, from_agent_name, to_agent_id, to_agent_name, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [handoffId, req.params.id, currentUser.id, currentUser.name, targetAgent.id, targetAgent.name, req.body.reason || ""]
    );
    broadcastToUser(targetAgent.id, { type: "handoff_request", id: handoffId, conversationId: req.params.id, customerName: conv.customer_name, channel: conv.channel, fromAgentId: currentUser.id, fromAgentName: currentUser.name, reason: req.body.reason || "", timestamp: new Date().toISOString() });
    created(res, { id: handoffId, status: "pending", toAgentName: targetAgent.name });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/handoff/pending", auth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT h.*, c.customer_name, c.channel, c.status FROM handoff_requests h JOIN conversations c ON h.conversation_id = c.id WHERE h.to_agent_id = $1 AND h.status = 'pending' ORDER BY h.created_at DESC",
      [req.userId]
    );
    ok(res, rows);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/handoff/:id", auth, validate(handoffActionSchema), async (req, res) => {
  try {
    const { rows: requestRows } = await query("SELECT * FROM handoff_requests WHERE id = $1", [req.params.id]);
    if (requestRows.length === 0) { error(res, "handoff request not found", 404); return; }
    const handoff = requestRows[0];
    if (handoff.to_agent_id !== req.userId) { error(res, "not authorized", 403); return; }
    if (handoff.status !== "pending") { error(res, "request already responded", 400); return; }

    const action = req.body.action;
    await query("UPDATE handoff_requests SET status = $1, responded_at = NOW() WHERE id = $2", [action === "accept" ? "accepted" : "rejected", req.params.id]);

    if (action === "accept") {
      await query("UPDATE conversations SET assigned_to = $1, updated_at = NOW() WHERE id = $2", [handoff.to_agent_id, handoff.conversation_id]);
      const sysMsg = await insertSystemMessage(handoff.conversation_id, `🔄 Chat handed over from ${handoff.from_agent_name} to ${handoff.to_agent_name}${handoff.reason ? ` — ${handoff.reason}` : ""}`);
      broadcast(handoff.conversation_id, { type: "handoff_accepted", id: handoff.id, conversationId: handoff.conversation_id, toAgentName: handoff.to_agent_name, message: { id: sysMsg.id }, timestamp: new Date().toISOString() });
      broadcastToUser(handoff.from_agent_id, { type: "handoff_accepted", id: handoff.id, conversationId: handoff.conversation_id, toAgentName: handoff.to_agent_name, timestamp: new Date().toISOString() });
    } else {
      broadcastToUser(handoff.from_agent_id, { type: "handoff_rejected", id: handoff.id, conversationId: handoff.conversation_id, timestamp: new Date().toISOString() });
    }
    ok(res, { status: "ok", action });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/:id/notes", auth, validate(addNoteSchema), async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (rows.length === 0) { error(res, "unauthorized", 401); return; }
    const user = rows[0];
    const note = await addNote(req.params.id, user.id, user.name, sanitize(req.body.content));
    broadcast(req.params.id, { type: "new_note", note, timestamp: new Date().toISOString() });
    created(res, note);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

// Typing indicator (throttled)
const typingThrottle = new Map<string, number>();
router.post("/:id/typing", auth, async (req, res) => {
  try {
    // Throttle: max 1 typing event per 3 seconds per conversation
    const now = Date.now();
    const last = typingThrottle.get(req.params.id) || 0;
    if (now - last < 3000) { ok(res, { status: "throttled" }); return; }
    typingThrottle.set(req.params.id, now);

    const { rows } = await query("SELECT name FROM users WHERE id = $1", [req.userId]);
    const agentName = rows.length > 0 ? rows[0].name : "Agent";
    sendTypingToChannel(req.params.id);
    broadcast(req.params.id, { type: "typing", conversationId: req.params.id, agentName, timestamp: new Date().toISOString() });
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
