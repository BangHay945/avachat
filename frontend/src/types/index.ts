export type AgentStatus = "online" | "away" | "busy";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "supervisor" | "agent";
  tenantId: string;
  tenantName: string;
  avatar?: string;
  status: AgentStatus;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "basic" | "pro" | "enterprise";
  channels: Channel[];
}

export type ChannelType = "whatsapp" | "instagram" | "telegram" | "livechat" | "facebook" | "tiktok" | "email";

export interface Channel {
  type: ChannelType;
  name: string;
  connected: boolean;
}

export interface Conversation {
  id: string;
  customer: {
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  channel: ChannelType;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  status: "active" | "waiting" | "closed";
  assignedTo?: string;
  sentiment?: "positive" | "neutral" | "negative";
  tags: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  sender: "customer" | "agent" | "ai";
  senderName?: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "file" | "template";
  metadata?: Record<string, unknown>;
}
