import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { sanitize } from "../utils/sanitize";
import { ok, created, error } from "../utils/response";
import { auth, adminOnly, adminOrSupervisor } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { analyzeSentiment, generateSummary, productCatalog, handleAutoReply } from "../services/ai";
import { insertAiMessage } from "../services/message";
import { broadcast } from "../websocket/hub";
import type { Message, FAQ, Conversation } from "../models/types";
import { aiSettingsSchema, faqSchema, faqUpdateSchema, sentimentSchema, autoReplySchema, suggestionsSchema, recommendationsSchema } from "./validation-schemas";

const router = Router();

router.get("/settings", auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM ai_settings WHERE tenant_id = $1", [req.tenantId]);
    if (rows.length === 0) { error(res, "not found", 404); return; }
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/settings", auth, adminOnly, validate(aiSettingsSchema), async (req, res) => {
  try {
    const { provider, api_key, custom_endpoint, auto_reply, sentiment, summarization, personalized } = req.body;
    await query(
      `INSERT INTO ai_settings (tenant_id, provider, api_key, custom_endpoint, auto_reply, sentiment, summarization, personalized, updated_at)
       VALUES ($1, COALESCE($2,'openai'), COALESCE($3,''), COALESCE($4,''), COALESCE($5,true), COALESCE($6,true), COALESCE($7,true), COALESCE($8,true), NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET provider = COALESCE($2, ai_settings.provider), api_key = COALESCE($3, ai_settings.api_key), custom_endpoint = COALESCE($4, ai_settings.custom_endpoint), auto_reply = COALESCE($5, ai_settings.auto_reply), sentiment = COALESCE($6, ai_settings.sentiment), summarization = COALESCE($7, ai_settings.summarization), personalized = COALESCE($8, ai_settings.personalized), updated_at = NOW()`,
      [req.tenantId, provider, api_key, custom_endpoint, auto_reply, sentiment, summarization, personalized]
    );
    const { rows } = await query("SELECT * FROM ai_settings WHERE tenant_id = $1", [req.tenantId]);
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/faqs", auth, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM faqs WHERE tenant_id = $1 ORDER BY question", [req.tenantId]);
    ok(res, rows);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/faqs", auth, adminOrSupervisor, validate(faqSchema), async (req, res) => {
  try {
    const id = uuid();
    await query("INSERT INTO faqs (id, tenant_id, question, answer) VALUES ($1, $2, $3, $4)", [id, req.tenantId, sanitize(req.body.question), sanitize(req.body.answer)]);
    created(res, { id, tenant_id: req.tenantId, question: req.body.question, answer: req.body.answer });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/faqs/:id", auth, adminOrSupervisor, validate(faqUpdateSchema), async (req, res) => {
  try {
    const { rowCount } = await query("UPDATE faqs SET question = COALESCE($1, question), answer = COALESCE($2, answer), updated_at = NOW() WHERE id = $3 AND tenant_id = $4", [req.body.question, req.body.answer, req.params.id, req.tenantId]);
    if (rowCount === 0) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.delete("/faqs/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM faqs WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenantId]);
    if (rowCount === 0) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/summarize/:conversationId", auth, async (req, res) => {
  try {
    const summary = await generateSummary(req.params.conversationId);
    ok(res, { summary, conversationId: req.params.conversationId, generatedAt: new Date().toISOString() });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/sentiment", auth, validate(sentimentSchema), (req, res) => {
  ok(res, analyzeSentiment(sanitize(req.body.text)));
});

router.post("/auto-reply", auth, validate(autoReplySchema), async (req, res) => {
  try {
    const { rows: settingsRows } = await query("SELECT * FROM ai_settings WHERE tenant_id = $1 AND auto_reply = true", [req.tenantId]);
    if (settingsRows.length === 0) { ok(res, { reply: null, matched: false }); return; }

    const { rows: faqRows } = await query("SELECT * FROM faqs WHERE tenant_id = $1", [req.tenantId]);
    const msg = req.body.message.toLowerCase();
    const matched = faqRows.find((f: FAQ) => {
      const keywords = f.question.toLowerCase().split(" ").filter((w: string) => w.length > 3);
      return keywords.some((k: string) => msg.includes(k));
    });

    if (matched) {
      if (req.body.conversationId) {
        const aiMsg = await insertAiMessage(req.body.conversationId, `💡 Auto Reply: ${matched.answer}`);
        await query("UPDATE conversations SET last_message = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2", [`💡 Auto Reply: ${matched.answer}`, req.body.conversationId]);
        broadcast(req.body.conversationId, { type: "new_message", message: aiMsg, timestamp: new Date().toISOString() });
      }
      ok(res, { reply: matched.answer, matched: true, question: matched.question });
    } else {
      ok(res, { reply: null, matched: false });
    }
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/suggestions", auth, validate(suggestionsSchema), async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM conversations WHERE id = $1", [req.body.conversationId]);
    if (rows.length === 0) { error(res, "conversation not found", 404); return; }
    const conv = rows[0] as Conversation;
    const { rows: msgs } = await query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1", [req.body.conversationId]);
    const lastCustomerMsg = msgs.find((m: Message) => m.sender === "customer");

    const suggestions: { label: string; text: string }[] = [];
    if (lastCustomerMsg) {
      const lower = lastCustomerMsg.content.toLowerCase();
      if (lower.includes("harga") || lower.includes("berapa") || lower.includes("biaya")) {
        suggestions.push({ label: "Price Info", text: `Untuk ${conv.customer_name}, berikut harga paket favorit kami. Mulai dari Rp 1.800.000 - Rp 7.500.000 tergantung paket yang dipilih. Ada yang spesifik mau ditanyakan?` });
        suggestions.push({ label: "Promo Offer", text: `Saat ini kami ada promo diskon 10% untuk booking hari ini ${conv.customer_name}! Mau saya bantu cek detailnya?` });
      }
      if (lower.includes("booking") || lower.includes("pesan") || lower.includes("reservasi")) {
        suggestions.push({ label: "Booking Guide", text: `Untuk booking, ${conv.customer_name} bisa langsung pilih paket dan tanggal, DP 50%, dan konfirmasi dalam 1x24 jam. Mau saya bantu proses?` });
      }
      if (lower.includes("tour") || lower.includes("paket") || lower.includes("liburan")) {
        suggestions.push({ label: "Recommendation", text: `Berdasarkan minat ${conv.customer_name}, saya rekomendasikan paket ${productCatalog[Math.floor(Math.random() * productCatalog.length)].name}. Mau saya jelaskan lebih detail?` });
      }
    }
    if (suggestions.length === 0) suggestions.push({ label: "Follow Up", text: `Apakah ada yang bisa saya bantu lebih lanjut, ${conv.customer_name}?` });
    ok(res, { suggestions, customerName: conv.customer_name });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/recommendations", auth, validate(recommendationsSchema), async (req, res) => {
  try {
    const { rows: convRows } = await query("SELECT * FROM conversations WHERE id = $1", [req.body.conversationId]);
    if (convRows.length === 0) { error(res, "not found", 404); return; }
    const { rows: msgs } = await query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1", [req.body.conversationId]);
    const lastCustomerMsg = msgs.find((m: Message) => m.sender === "customer");
    const lower = lastCustomerMsg?.content.toLowerCase() || "";

    let filtered = productCatalog;
    if (lower.includes("murah") || lower.includes("hemat") || lower.includes("budget")) filtered = productCatalog.filter((p) => p.tag === "Budget");
    else if (lower.includes("mewah") || lower.includes("premium") || lower.includes("vip")) filtered = productCatalog.filter((p) => p.tag === "Premium" || p.tag === "Best Seller");
    else if (lower.includes("romantis") || lower.includes("honeymoon") || lower.includes("pasangan")) filtered = productCatalog.filter((p) => p.tag === "Romantic");
    else if (lower.includes("petualangan") || lower.includes("adventure") || lower.includes("trip")) filtered = productCatalog.filter((p) => p.tag === "Adventure" || p.tag === "Popular");

    ok(res, { recommendations: filtered.slice(0, 3), customerName: convRows[0].customer_name });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
