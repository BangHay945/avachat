import { query } from "../db/db";
import { v4 as uuid } from "uuid";
import type { Conversation } from "../models/types";

export async function getConversations(tenantId: string, filters: { status?: string; assigned?: string }) {
  let sql = "SELECT * FROM conversations WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIdx = 2;

  if (filters.status && filters.status !== "all") { sql += ` AND status = $${paramIdx}`; params.push(filters.status); paramIdx++; }
  if (filters.assigned === "me") { sql += ` AND assigned_to IS NOT NULL`; }
  else if (filters.assigned === "unassigned") { sql += ` AND assigned_to IS NULL`; }

  sql += " ORDER BY last_message_at DESC LIMIT 100";
  const { rows } = await query(sql, params);
  return rows as Conversation[];
}

export async function getConversation(id: string, tenantId: string) {
  const { rows } = await query("SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return rows.length > 0 ? (rows[0] as Conversation) : null;
}

export async function updateConversationStatus(id: string, tenantId: string, status: string) {
  const { rows } = await query("SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  if (rows.length === 0) return null;
  const resolvedAt = status === "closed" ? new Date().toISOString() : null;
  await query("UPDATE conversations SET status = $1, updated_at = NOW(), resolved_at = $2 WHERE id = $3", [status, resolvedAt, id]);
  return rows[0] as Conversation;
}

export async function assignConversation(id: string, tenantId: string, agentId: string) {
  const { rows } = await query("SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  if (rows.length === 0) return null;
  await query("UPDATE conversations SET assigned_to = $1, updated_at = NOW() WHERE id = $2", [agentId, id]);
  return rows[0] as Conversation;
}

export async function addNote(conversationId: string, agentId: string, agentName: string, content: string) {
  const noteId = uuid();
  await query(
    "INSERT INTO notes (id, conversation_id, agent_id, agent_name, content) VALUES ($1, $2, $3, $4, $5)",
    [noteId, conversationId, agentId, agentName, content]
  );
  return { id: noteId, conversation_id: conversationId, agent_id: agentId, agent_name: agentName, content, created_at: new Date().toISOString() };
}

export async function getTransfers(conversationId: string) {
  const { rows } = await query("SELECT * FROM transfers WHERE conversation_id = $1 ORDER BY created_at", [conversationId]);
  return rows;
}
