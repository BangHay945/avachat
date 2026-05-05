export type ChannelType = "whatsapp" | "instagram" | "telegram" | "livechat" | "facebook" | "tiktok" | "email";
export type UserRole = "admin" | "supervisor" | "agent";
export type AgentStatus = "online" | "away" | "busy";
export type ConversationStatus = "active" | "closed" | "waiting";
export type DealStage = "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
export type SubscriptionPlan = "trial" | "basic" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type MessageType = "text" | "template" | "image" | "file" | "voice";

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: AgentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface UserClaims {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_id?: string;
  channel: ChannelType;
  status: ConversationStatus;
  assigned_to?: string;
  sentiment?: string;
  last_message?: string;
  last_message_at: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  first_response_at?: string;
  resolved_at?: string;
  sla_breached?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: string;
  sender_name?: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Note {
  id: string;
  conversation_id: string;
  agent_id: string;
  agent_name: string;
  content: string;
  created_at: string;
}

export interface TransferRecord {
  id: string;
  conversation_id: string;
  from_agent_id: string;
  from_agent_name: string;
  to_agent_id: string;
  to_agent_name: string;
  reason: string;
  created_at: string;
}

export interface HandoffRequest {
  id: string;
  conversation_id: string;
  from_agent_id: string;
  from_agent_name: string;
  to_agent_id: string;
  to_agent_name: string;
  reason: string;
  status: string;
  created_at: string;
  responded_at?: string;
}

export interface AISettings {
  tenant_id: string;
  provider: string;
  api_key: string;
  custom_endpoint: string;
  auto_reply: boolean;
  sentiment: boolean;
  summarization: boolean;
  personalized: boolean;
  updated_at: string;
}

export interface FAQ {
  id: string;
  tenant_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface CRContact {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  channel: string;
  last_contact: string;
  total_chats: number;
  sentiment: string;
  tags: string[];
  segment: string;
  location?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  tenant_id: string;
  contact_id: string;
  contact_name: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expected_close_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  channel: string;
  segment: string;
  message: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  status: string;
  created_at: string;
  scheduled_at?: string;
  updated_at: string;
}

export interface WhiteLabelSettings {
  tenant_id: string;
  company_name: string;
  logo_url: string;
  primary_color: string;
  updated_at: string;
}

export interface CannedResponse {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  shortcut: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  tenant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_start: string;
  trial_end: string;
  billing_period: string;
  auto_renew: boolean;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
}

export const PLAN_PRICES: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  trial: { monthly: 0, yearly: 0 },
  basic: { monthly: 500000, yearly: 5400000 },
  pro: { monthly: 2500000, yearly: 27000000 },
  enterprise: { monthly: 0, yearly: 0 },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  trial: ["2 Agents", "3 Channels", "1.000 chats/mo", "Basic AI FAQ", "Email support"],
  basic: ["2 Agents", "3 Channels", "1.000 chats/mo", "Basic AI FAQ", "Email support"],
  pro: ["10 Agents", "All Channels", "10.000 chats/mo", "AI FAQ + Sentiment", "Priority support", "CRM Integration", "Analytics"],
  enterprise: ["Unlimited agents", "All channels", "Unlimited chats", "Full AI Suite", "Dedicated support", "White-label", "Custom integration"],
};

export const VALID_ROLES: UserRole[] = ["admin", "supervisor", "agent"];
export const VALID_CHANNELS: ChannelType[] = ["whatsapp", "instagram", "telegram", "livechat", "facebook", "tiktok", "email"];
export const VALID_CONVERSATION_STATUSES: ConversationStatus[] = ["active", "closed", "waiting"];
export const VALID_DEAL_STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
export const VALID_MESSAGE_TYPES: MessageType[] = ["text", "template", "image", "file", "voice"];
