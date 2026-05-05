import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { error } from "../utils/response";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      error(res, messages.join("; "), 400, result.error.issues);
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      error(res, messages.join("; "), 400, result.error.issues);
      return;
    }
    next();
  };
}

// ── Validation Schemas ──────────────────────────

export const loginSchema = z.object({
  email: z.string().email("invalid email format"),
  password: z.string().min(1, "password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("invalid email format"),
  password: z.string().min(8, "password must be at least 8 characters").max(128),
  name: z.string().min(1).max(100),
  tenantName: z.string().max(100).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  type: z.enum(["text", "template", "image", "file", "voice"]).optional().default("text"),
});

export const updateStatusSchema = z.object({
  status: z.enum(["active", "closed", "waiting"]),
});

export const assignSchema = z.object({
  agent_id: z.string().uuid(),
});

export const transferSchema = z.object({
  agent_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const handoffSchema = z.object({
  agent_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const handoffActionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export const addNoteSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const aiSettingsSchema = z.object({
  provider: z.string().max(50).optional(),
  api_key: z.string().max(255).optional(),
  custom_endpoint: z.string().max(255).optional(),
  auto_reply: z.boolean().optional(),
  sentiment: z.boolean().optional(),
  summarization: z.boolean().optional(),
  personalized: z.boolean().optional(),
});

export const faqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
});

export const faqUpdateSchema = z.object({
  question: z.string().max(500).optional(),
  answer: z.string().max(2000).optional(),
});

export const sentimentSchema = z.object({
  text: z.string().min(1).max(5000),
});

export const autoReplySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1),
});

export const suggestionsSchema = z.object({
  conversationId: z.string().uuid(),
});

export const recommendationsSchema = z.object({
  conversationId: z.string().uuid(),
});

export const cannedSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
});

export const cannedUpdateSchema = z.object({
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  channel: z.enum(["whatsapp", "instagram", "telegram", "livechat", "facebook", "tiktok", "email"]).optional(),
  segment: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  source: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
});

export const contactUpdateSchema = z.object({
  name: z.string().max(255).optional(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  channel: z.enum(["whatsapp", "instagram", "telegram", "livechat", "facebook", "tiktok", "email"]).optional(),
  segment: z.string().max(100).optional(),
  location: z.string().max(255).optional().nullable(),
  source: z.string().max(255).optional().nullable(),
  tags: z.array(z.string()).optional(),
  sentiment: z.string().optional(),
});

export const dealSchema = z.object({
  title: z.string().min(1).max(255),
  contactId: z.string().uuid().optional(),
  contactName: z.string().max(255).optional(),
  value: z.number().optional(),
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const dealUpdateSchema = z.object({
  title: z.string().max(255).optional(),
  contactId: z.string().uuid().optional(),
  contactName: z.string().max(255).optional(),
  value: z.number().optional(),
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1).max(255),
  message: z.string().min(1),
  channel: z.enum(["whatsapp", "instagram", "telegram", "livechat", "facebook", "tiktok", "email"]).optional(),
  segment: z.string().max(100).optional(),
  status: z.string().max(20).optional(),
  scheduledAt: z.string().optional(),
});

export const campaignUpdateSchema = z.object({
  name: z.string().max(255).optional(),
  channel: z.enum(["whatsapp", "instagram", "telegram", "livechat", "facebook", "tiktok", "email"]).optional(),
  segment: z.string().max(100).optional(),
  message: z.string().optional(),
  status: z.string().max(20).optional(),
  scheduledAt: z.string().optional(),
});

export const subscriptionPlanSchema = z.object({
  plan: z.enum(["basic", "pro", "enterprise"]),
  billingPeriod: z.enum(["monthly", "yearly"]).optional(),
});

export const whitelabelSchema = z.object({
  company_name: z.string().max(255).optional(),
  logo_url: z.string().max(255).optional(),
  primary_color: z.string().max(20).optional(),
});

export const channelUpdateSchema = z.object({
  connected: z.boolean(),
});

export const webhookSimulateSchema = z.object({
  channel: z.enum(["whatsapp", "instagram", "telegram", "livechat", "facebook", "tiktok", "email"]),
  message: z.string().min(1).max(10000),
  customerName: z.string().max(255).optional(),
  customerPhone: z.string().max(50).optional(),
});

export const webhookReplySchema = z.object({
  message: z.string().min(1).max(10000),
});

export const trackClickSchema = z.object({
  campaignId: z.string().min(1),
  link: z.string().min(1),
});
