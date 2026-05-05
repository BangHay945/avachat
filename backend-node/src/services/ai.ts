import { query } from "../db/db";
import { v4 as uuid } from "uuid";
import type { Message, Conversation, FAQ } from "../models/types";

const positiveKeywords = ["terima kasih", "makasih", "keren", "bagus", "puas", "suka", "oke", "setuju", "recommended", "recommend", "baik", "mantap", "lengkap", "murah", "hemat", "cepat", "responsive"];
const negativeKeywords = ["tidak", "nggak", "buruk", "jelek", "lambat", "lama", "kecewa", "komplain", "rusak", "gagal", "kurang", "tidak profesional", "marah", "sebal", "kesal", "tolong", "urgent"];

export function analyzeSentiment(text: string): { sentiment: "positive" | "neutral" | "negative"; score: number } {
  const lower = text.toLowerCase();
  let posCount = 0, negCount = 0;
  positiveKeywords.forEach((k) => { if (lower.includes(k)) posCount++; });
  negativeKeywords.forEach((k) => { if (lower.includes(k)) negCount++; });
  if (negCount > posCount) return { sentiment: "negative", score: Math.min(1, negCount / Math.max(1, lower.split(" ").length)) };
  if (posCount > negCount) return { sentiment: "positive", score: Math.min(1, posCount / Math.max(1, lower.split(" ").length)) };
  return { sentiment: "neutral", score: 0 };
}

export async function generateSummary(convId: string): Promise<string> {
  const { rows: convRows } = await query("SELECT * FROM conversations WHERE id = $1", [convId]);
  if (convRows.length === 0) return "Conversation not found.";
  const conv = convRows[0];

  const { rows: msgs } = await query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at", [convId]);
  if (msgs.length === 0) return "No messages.";

  const customerMsgs = msgs.filter((m: Message) => m.sender === "customer");
  const agentMsgs = msgs.filter((m: Message) => m.sender === "agent");
  const aiMsgs = msgs.filter((m: Message) => m.sender === "ai");

  const duration = msgs.length > 1
    ? Math.round((new Date(msgs[msgs.length - 1].created_at).getTime() - new Date(msgs[0].created_at).getTime()) / 60000)
    : 0;

  const allText = customerMsgs.map((m: Message) => m.content.toLowerCase()).join(" ");
  const topics: string[] = [];
  if (allText.includes("harga") || allText.includes("biaya") || allText.includes("berapa")) topics.push("pricing inquiry");
  if (allText.includes("booking") || allText.includes("pesan") || allText.includes("reservasi")) topics.push("booking");
  if (allText.includes("tour") || allText.includes("paket") || allText.includes("trip")) topics.push("tour package");
  if (allText.includes("diskon") || allText.includes("promo") || allText.includes("gratis")) topics.push("discount/promo");
  if (allText.includes("komplain") || allText.includes("kecewa") || allText.includes("rusak")) topics.push("complaint");
  if (allText.includes("refund") || allText.includes("cancel") || allText.includes("batal")) topics.push("cancellation/refund");
  if (allText.includes("jadwal") || allText.includes("schedule")) topics.push("scheduling");
  if (topics.length === 0) topics.push("general inquiry");

  let posCount = 0, negCount = 0;
  customerMsgs.forEach((m: Message) => {
    const lower = m.content.toLowerCase();
    if (positiveKeywords.some((k) => lower.includes(k))) posCount++;
    if (negativeKeywords.some((k) => lower.includes(k))) negCount++;
  });
  const overallSentiment = negCount > posCount ? "negative" : posCount > negCount ? "positive" : "neutral";

  const { rows: userRows } = await query("SELECT name FROM users WHERE id = $1", [conv.assigned_to]);
  const assignedName = userRows.length > 0 ? userRows[0].name : "";

  return [
    `📋 Chat Summary: ${conv.channel} — ${conv.customer_name}`,
    ``,
    `• Duration: ${duration} min | ${msgs.length} messages (${customerMsgs.length} from customer, ${agentMsgs.length} from agent)`,
    `• Topics: ${topics.join(", ")}`,
    `• Sentiment: ${overallSentiment}`,
    aiMsgs.length > 0 ? `• AI Interventions: ${aiMsgs.length} auto-replies sent` : "",
    `• Status: ${conv.status === "closed" ? "✅ Resolved" : conv.status === "active" ? "🔄 Active" : "⏳ Waiting"}`,
    assignedName ? `• Assigned to: ${assignedName}` : "",
    conv.tags && conv.tags.length > 0 ? `• Tags: ${conv.tags.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

export async function handleAutoReply(tenantId: string, conversationId: string, customerMessage: string): Promise<boolean> {
  const { rows: settingsRows } = await query("SELECT * FROM ai_settings WHERE tenant_id = $1 AND auto_reply = true", [tenantId]);
  if (settingsRows.length === 0) return false;

  const { rows: faqRows } = await query("SELECT * FROM faqs WHERE tenant_id = $1", [tenantId]);
  const msg = customerMessage.toLowerCase();
  const matched = faqRows.find((f: FAQ) => {
    const keywords = f.question.toLowerCase().split(" ").filter((w: string) => w.length > 3);
    return keywords.some((k: string) => msg.includes(k));
  });

  if (!matched) return false;

  const aiMsgId = uuid();
  const aiContent = `💡 Auto Reply: ${matched.answer}`;
  await query(
    "INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'Ava AI', $3, 'template')",
    [aiMsgId, conversationId, aiContent]
  );
  await query("UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2", [aiContent, conversationId]);
  return true;
}

export async function handleSentimentAlert(convId: string, text: string): Promise<boolean> {
  const result = analyzeSentiment(text);
  await query("UPDATE conversations SET sentiment = $1 WHERE id = $2", [result.sentiment, convId]);
  if (result.sentiment === "negative") {
    const alertId = uuid();
    const alertContent = `⚠️ Sentiment Alert: Negative sentiment detected. Score: ${(result.score * 100).toFixed(0)}%`;
    await query("INSERT INTO messages (id, conversation_id, sender, sender_name, content, type) VALUES ($1, $2, 'ai', 'Ava AI', $3, 'template')", [alertId, convId, alertContent]);
    await query("UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2", [alertContent, convId]);
    return true;
  }
  return false;
}

export const productCatalog = [
  { name: "Bali 4D3N Premium", price: "Rp 3.200.000", desc: "Hotel bintang 5 + private guide + spa", tag: "Best Seller" },
  { name: "Lombok Gili 3D2N", price: "Rp 2.800.000", desc: "Snorkeling + island hopping", tag: "Popular" },
  { name: "Labuan Bajo 3D2N", price: "Rp 3.500.000", desc: "Komodo tour + sunset cruise", tag: "Adventure" },
  { name: "Raja Ampat 5D4N", price: "Rp 7.500.000", desc: "Diving paradise + private island", tag: "Premium" },
  { name: "Bromo 2D1N", price: "Rp 1.800.000", desc: "Sunrise view + jeep tour", tag: "Budget" },
  { name: "Honeymoon Bali", price: "Rp 5.000.000", desc: "Private villa + couple spa + dinner", tag: "Romantic" },
];
