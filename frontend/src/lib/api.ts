/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/api/v1/ws";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("avachat_token", t);
    else localStorage.removeItem("avachat_token");
  }
}

export function getToken(): string | null {
  if (token) return token;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("avachat_token");
  }
  return token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const t = getToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; name: string; tenantName: string }) =>
    request<{ token: string; user: any; tenant: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: any }>("/auth/me"),
};

// ─── Conversations ───────────────────────────────

export const users = {
  list: () => request<any[]>("/users"),
};

export const conversations = {
  list: (params?: { status?: string; assigned?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.assigned && params.assigned !== "all") qs.set("assigned", params.assigned);
    const q = qs.toString();
    return request<any[]>(`/conversations${q ? `?${q}` : ""}`);
  },

  get: (id: string) => request<any>(`/conversations/${id}`),

  updateStatus: (id: string, status: string) =>
    request<any>(`/conversations/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  assign: (id: string, agentId: string) =>
    request<any>(`/conversations/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify({ agent_id: agentId }),
    }),

  addNote: (id: string, content: string) =>
    request<any>(`/conversations/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  transfer: (id: string, agentId: string, reason?: string) =>
    request<any>(`/conversations/${id}/transfer`, {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId, reason }),
    }),

  handoff: (id: string, agentId: string, reason?: string) =>
    request<any>(`/conversations/${id}/handoff`, {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId, reason }),
    }),

  transfers: (id: string) => request<any[]>(`/conversations/${id}/transfers`),
};

export const handoffRequests = {
  pending: () => request<any[]>("/conversations/handoff/pending"),
  respond: (id: string, action: "accept" | "reject") =>
    request<any>(`/conversations/handoff/${id}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    }),
};

// ─── Messages ────────────────────────────────────

export const messages = {
  list: (convId: string) => request<any[]>(`/conversations/${convId}/messages`),

  send: (convId: string, content: string, type = "text") =>
    request<any>(`/conversations/${convId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, type }),
    }),

  sendTyping: (convId: string) =>
    request<any>(`/conversations/${convId}/typing`, {
      method: "POST",
    }),
};

// ─── Analytics ───────────────────────────────────

export const analytics = {
  summary: () => request<any>("/analytics/summary"),
  sla: () => request<any>("/analytics/sla"),
};

// ─── CRM ──────────────────────────────────────

export const crm = {
  contacts: {
    list: (params?: { search?: string; channel?: string; segment?: string; sentiment?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.channel && params.channel !== "all") qs.set("channel", params.channel);
      if (params?.segment && params.segment !== "all") qs.set("segment", params.segment);
      if (params?.sentiment && params.sentiment !== "all") qs.set("sentiment", params.sentiment);
      const q = qs.toString();
      return request<any[]>(`/crm/contacts${q ? `?${q}` : ""}`);
    },
    get: (id: string) => request<any>(`/crm/contacts/${id}`),
    create: (data: any) => request<any>("/crm/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/crm/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/crm/contacts/${id}`, { method: "DELETE" }),
  },

  deals: {
    list: (stage?: string) => {
      const qs = stage && stage !== "all" ? `?stage=${stage}` : "";
      return request<any[]>(`/crm/deals${qs}`);
    },
    get: (id: string) => request<any>(`/crm/deals/${id}`),
    create: (data: any) => request<any>("/crm/deals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/crm/deals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/crm/deals/${id}`, { method: "DELETE" }),
  },

  segments: () => request<any>("/crm/segments"),
};

export const campaigns = {
  list: () => request<any[]>("/campaigns"),
  create: (data: any) => request<any>("/campaigns", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/campaigns/${id}`, { method: "DELETE" }),
  tracking: (id: string) => request<any>(`/campaigns/${id}/tracking`),
};

export const whitelabel = {
  get: () => request<any>("/whitelabel"),
  update: (data: any) => request<any>("/whitelabel", { method: "PUT", body: JSON.stringify(data) }),
};

// ─── Channels ─────────────────────────────────

export const channels = {
  list: () => request<Record<string, boolean>>("/channels"),
  toggle: (type: string, connected: boolean) =>
    request<any>(`/channels/${type}`, {
      method: "PUT",
      body: JSON.stringify({ connected }),
    }),
  setConfig: (type: string, config: { token?: string; connected?: boolean }) =>
    request<any>(`/channels/${type}/config`, {
      method: "PUT",
      body: JSON.stringify(config),
    }),
};

// ─── Canned Responses ──────────────────────────

export const cannedResponses = {
  list: (category?: string) => {
    const qs = category && category !== "all" ? `?category=${category}` : "";
    return request<any[]>(`/canned-responses${qs}`);
  },

  create: (data: { title: string; content: string; shortcut?: string; category?: string }) =>
    request<any>("/canned-responses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; content?: string; shortcut?: string; category?: string }) =>
    request<any>(`/canned-responses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<any>(`/canned-responses/${id}`, { method: "DELETE" }),
};

// ─── AI Settings & FAQ ─────────────────────────

export const ai = {
  getSettings: () => request<any>("/ai/settings"),
  updateSettings: (data: any) =>
    request<any>("/ai/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  listFaqs: () => request<any[]>("/ai/faqs"),

  createFaq: (data: { question: string; answer: string }) =>
    request<any>("/ai/faqs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateFaq: (id: string, data: { question?: string; answer?: string }) =>
    request<any>(`/ai/faqs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteFaq: (id: string) =>
    request<any>(`/ai/faqs/${id}`, { method: "DELETE" }),

  autoReply: (conversationId: string, message: string) =>
    request<any>("/ai/auto-reply", {
      method: "POST",
      body: JSON.stringify({ conversationId, message }),
    }),

  summarize: (conversationId: string) =>
    request<any>(`/ai/summarize/${conversationId}`),

  analyzeSentiment: (text: string) =>
    request<any>("/ai/sentiment", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  suggestions: (conversationId: string) =>
    request<any>("/ai/suggestions", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    }),

  recommendations: (conversationId: string) =>
    request<any>("/ai/recommendations", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    }),
};

// ─── Subscription & Billing ────────────────────────

export const subscription = {
  get: () => request<any>("/subscription"),

  changePlan: (plan: string, billingPeriod?: string) =>
    request<any>("/subscription/plan", {
      method: "PUT",
      body: JSON.stringify({ plan, billingPeriod }),
    }),

  cancel: () =>
    request<any>("/subscription/cancel", { method: "POST" }),

  reactivate: () =>
    request<any>("/subscription/reactivate", { method: "POST" }),

  invoices: () => request<any[]>("/subscription/invoices"),
};

// ─── WebSocket ───────────────────────────────────

export function connectWebSocket(onMessage: (data: any) => void): { disconnect: () => void; send: (data: any) => void } {
  const t = getToken();
  if (!t) return { disconnect: () => {}, send: () => {} };

  const ws = new WebSocket(WS_URL);
  let authed = false;

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "auth_ok") authed = true;
      if (data.type === "auth_error") console.warn("WS auth failed");
      onMessage(data);
    } catch {}
  };

  ws.onopen = () => {
    console.log("🔌 WebSocket connected");
    ws.send(JSON.stringify({ type: "auth", token: t }));
  };
  ws.onclose = () => {};
  ws.onerror = () => {};

  const send = (data: any) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  return {
    disconnect: () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    },
    send,
  };
}
