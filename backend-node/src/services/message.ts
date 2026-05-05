import { query } from "../db/db";
import { v4 as uuid } from "uuid";
import { sanitize } from "../utils/sanitize";
import type { Message } from "../models/types";

export async function sendMessage(conversationId: string, userId: string, userName: string, content: string, type = "text") {
  const msgId = uuid();
  await query(
    "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'agent', $3, $4, $5)",
    [msgId, conversationId, userName, content, type]
  );
  await query(
    "UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW(), first_response_at = COALESCE(first_response_at, NOW()) WHERE id = $2",
    [content, conversationId]
  );
  return { id: msgId, conversation_id: conversationId, sender: "agent", sender_name: userName, content, type, created_at: new Date().toISOString() } as Message;
}

export async function getMessages(conversationId: string) {
  const { rows } = await query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at", [conversationId]);
  return rows as Message[];
}

export async function insertAiMessage(conversationId: string, content: string, type = "template") {
  const msgId = uuid();
  await query(
    "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'Ava AI', $3, $4)",
    [msgId, conversationId, content, type]
  );
  return { id: msgId, conversation_id: conversationId, sender: "ai", sender_name: "Ava AI", content, type, created_at: new Date().toISOString() } as Message;
}

export async function insertSystemMessage(conversationId: string, content: string) {
  const msgId = uuid();
  await query(
    "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'System', $3, 'text')",
    [msgId, conversationId, content]
  );
  return { id: msgId, conversation_id: conversationId, sender: "ai", sender_name: "System", content, type: "text", created_at: new Date().toISOString() } as Message;
}
