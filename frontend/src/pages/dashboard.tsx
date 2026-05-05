/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Search,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Info,
  MessageSquare,
  Globe,
  Zap,
  StickyNote,
  X,
  CheckCircle,
  UserCheck,
  Tag,
  ArrowRightLeft,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Sparkles,
  Mic,
  ChevronDown,
  Copy,
  Reply,
  Trash2,
  CheckCheck,
  Check,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
  SiFacebook,
  SiTiktok,
  SiGmail,
} from "react-icons/si";
import type { Message, Conversation, ChannelType } from "@/types";
import { conversations as convApi, messages as msgApi, cannedResponses as cannedApi, users as usersApi, ai as aiApi, handoffRequests as handoffApi, connectWebSocket } from "@/lib/api";
import { notifyResolved, notifySLAWarning } from "@/lib/notifications";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { HandoffDialog } from "@/components/handoff/handoff-dialog";
import { PendingHandoffs } from "@/components/handoff/pending-handoffs";
import { toast } from "sonner";

const fallbackCanned: { label: string; text: string }[] = [];

const fallbackProducts: { name: string; price: string; desc: string; tag: string }[] = [];

function fallbackSuggestions(_conversation: Conversation): { label: string; text: string }[] {
  return [];
}

const channelMeta: Record<ChannelType, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  whatsapp: { color: "text-green-500/80", icon: SiWhatsapp, label: "WhatsApp" },
  instagram: { color: "text-pink-500/80", icon: SiInstagram, label: "Instagram" },
  telegram: { color: "text-blue-500/80", icon: SiTelegram, label: "Telegram" },
  livechat: { color: "text-purple-500/80", icon: Globe, label: "Live Chat" },
  facebook: { color: "text-blue-600/80", icon: SiFacebook, label: "Facebook" },
  tiktok: { color: "text-gray-600/80 dark:text-gray-300/80", icon: SiTiktok, label: "TikTok" },
  email: { color: "text-orange-500/80", icon: SiGmail, label: "Email" },
};

const mockConversations: Conversation[] = [];

const mockMessages: Record<string, Message[]> = {};

// Remember scroll position per conversation
const scrollPositions = new Map<string, number>();

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
}

function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  inboxTab,
  onInboxTabChange,
  statusFilter,
  onStatusFilterChange,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  search: string;
  onSearchChange: (v: string) => void;
  inboxTab: "mine" | "unassigned" | "all";
  onInboxTabChange: (v: "mine" | "unassigned" | "all") => void;
  statusFilter: "all" | "active" | "waiting" | "closed";
  onStatusFilterChange: (v: "all" | "active" | "waiting" | "closed") => void;
}) {
    return (
      <div className="flex h-full flex-col min-h-0 bg-card/30">
        {/* Header */}
        <div className="shrink-0 border-b bg-card px-2 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-tight">Inbox</h2>
            {conversations.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {conversations.length}
              </span>
            )}
          </div>
          
          {/* Search */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-xs rounded-full border-muted-foreground/10 bg-muted/30 focus-visible:ring-1"
            />
            {search && (
              <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border p-0.5 flex-1">
              {(["mine", "unassigned", "all"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onInboxTabChange(tab)}
                  className={`flex-1 px-2 py-1 text-[11px] rounded-md transition-colors font-medium ${
                    inboxTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "mine" ? "Mine" : tab === "unassigned" ? "Pool" : "All"}
                </button>
              ))}
            </div>
            <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as typeof statusFilter)}>
              <SelectTrigger size="sm" className="w-[90px] h-8 text-[11px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No conversations</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">Messages from your channels will appear here</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2 py-1">
              {conversations.map((conv) => {
                const isSelected = selectedId === conv.id;
                const isUnread = conv.unread > 0 && !isSelected;
                const ChannelIcon = channelMeta[conv.channel].icon;
                const initials = conv.customer.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                const statusColor =
                  conv.status === "active" ? "bg-emerald-500" :
                  conv.status === "waiting" ? "bg-amber-500" :
                  "bg-slate-400";
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv)}
                    className={cn(
                      "group flex w-full items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                      isSelected
                        ? "bg-primary/10 border-l-0 ring-1 ring-primary/20"
                        : "hover:bg-muted/60",
                      isUnread && "bg-blue-50/50 dark:bg-blue-950/30"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold",
                        isSelected 
                          ? "bg-primary/15 text-primary" 
                          : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/15"
                      )}>
                        {initials || "?"}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2",
                        isSelected ? "border-primary/5" : "border-background",
                        statusColor
                      )} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "truncate text-[13px] leading-tight",
                          isUnread ? "font-semibold text-foreground" : "font-medium",
                          isSelected && "text-foreground"
                        )}>
                          {conv.customer.name}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          "flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5",
                          channelMeta[conv.channel].color.replace("text-", "bg-").replace("/80", "/10"),
                          channelMeta[conv.channel].color
                        )}>
                          <ChannelIcon className="h-2.5 w-2.5" />
                          <span className="font-medium">{channelMeta[conv.channel].label}</span>
                        </span>
                        {!conv.assignedTo && (
                          <span className="text-[9px] text-amber-600/80 font-medium">Unassigned</span>
                        )}
                      </div>

                      <p className={cn(
                        "mt-1.5 line-clamp-1 text-[12px] leading-relaxed",
                        isUnread ? "text-foreground/80 font-medium" : "text-muted-foreground/60"
                      )}>
                        {conv.lastMessage}
                      </p>

                      {conv.tags.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1">
                          {conv.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[9px] text-muted-foreground/50 bg-muted/30 rounded px-1.5 py-0.5">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Unread badge */}
                    {isUnread && (
                      <span className="mt-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/20">
                        {conv.unread > 9 ? "9+" : conv.unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

function ChatPanel({ conversation, onBack, hasCollision, onRequestHandoff, onAssignToMe, newWsMessage, wsIsTyping }: { conversation: Conversation; onBack: () => void; hasCollision?: boolean; onRequestHandoff?: () => void; onAssignToMe?: () => void; newWsMessage?: any; wsIsTyping?: boolean }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showCanned, setShowCanned] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [chatResolved, setChatResolved] = useState(false);
  const [showAiSuggest, setShowAiSuggest] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [recording, setRecording] = useState(false);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [cannedList, setCannedList] = useState<{ label: string; text: string }[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{ label: string; text: string }[]>([]);
  const [productRecommendations, setProductRecommendations] = useState<{ name: string; price: string; desc: string; tag: string }[]>([]);
  const [agentList, setAgentList] = useState<{ id: string; name: string }[]>([]);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const voiceInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  const commonEmojis = ["😊", "😂", "❤️", "👍", "🙏", "🔥", "🎉", "✅", "👋", "💪", "🤝", "⭐", "📸", "💰", "✈️", "🏝️", "🏨", "🎯", "📅", "💬"];

  const slaMinutes = 15;
  const [slaRemaining, setSlaRemaining] = useState(slaMinutes * 60);
  const slaInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const hasMessagesRef = useRef(false);

  useEffect(() => {
    cannedApi.list().then((data) => {
      const mapped = (data as any[]).map((c: Record<string, unknown>) => ({ label: c.title as string, text: c.content as string }));
      setCannedList(mapped.length > 0 ? [...mapped] : [...fallbackCanned]);
    }).catch(() => setCannedList([...fallbackCanned]));
    usersApi.list().then((data) => {
      setAgentList((data as any[]).map((u: Record<string, unknown>) => ({ id: u.id as string, name: u.name as string })));
    }).catch((err) => { console.error("Failed to fetch agents:", err); });
    aiApi.suggestions(conversation.id).then((data) => {
      setAiSuggestions((data as any).suggestions || fallbackSuggestions(conversation));
    }).catch(() => setAiSuggestions(fallbackSuggestions(conversation)));
    aiApi.recommendations(conversation.id).then((data) => {
      setProductRecommendations((data as any).recommendations || fallbackProducts);
    }).catch(() => setProductRecommendations(fallbackProducts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlaRemaining(slaMinutes * 60);
    if (slaInterval.current) clearInterval(slaInterval.current);
    slaInterval.current = setInterval(() => {
      setSlaRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    msgApi.list(conversation.id)
      .then((data) => {
        const mapped = data.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          conversationId: (m.conversationId || m.conversation_id) as string,
          sender: m.sender as "customer" | "agent" | "ai",
          senderName: (m.senderName || m.sender_name) as string | undefined,
          content: m.content as string,
          timestamp: (m.createdAt || m.created_at || new Date().toISOString()) as string,
          type: (m.type || "text") as Message["type"],
          metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata as string) : m.metadata) as Record<string, unknown> : undefined,
        }));
        setMessages(mapped.length > 0 ? mapped : mockMessages[conversation.id] ?? []);
        hasMessagesRef.current = true;
      })
      .catch(() => {
        setMessages(mockMessages[conversation.id] ?? []);
        hasMessagesRef.current = true;
      });

    // Restore scroll position on mount
    const savedPos = scrollPositions.get(conversation.id);
    if (savedPos !== undefined && savedPos > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = savedPos;
          }
        });
      });
    } else {
      // First time: scroll to bottom after messages render
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 300);
    }

    return () => {
      // Save scroll position before unmounting (only if messages loaded)
      if (scrollRef.current && hasMessagesRef.current) {
        scrollPositions.set(conversation.id, scrollRef.current.scrollTop);
      }
      if (slaInterval.current) clearInterval(slaInterval.current);
    };
  }, [conversation.id]);

  // Listen for real-time WebSocket messages
  useEffect(() => {
    if (!newWsMessage) return;
    const convId = newWsMessage.conversation_id || newWsMessage.conversationId;
    if (convId !== conversation.id) return;
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === newWsMessage.id)) return prev;
      return [...prev, {
        id: newWsMessage.id,
        conversationId: convId,
        sender: newWsMessage.sender || "customer",
        senderName: newWsMessage.sender_name,
        content: newWsMessage.content,
        timestamp: newWsMessage.created_at || new Date().toISOString(),
        type: newWsMessage.type || "text",
      }];
    });
    setTimeout(() => {
      if (scrollRef.current) {
        // When new message arrives, always scroll to bottom
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        // Update saved position to bottom (since user saw the new message)
        scrollPositions.set(conversation.id, scrollRef.current.scrollHeight);
      }
    }, 50);
  }, [newWsMessage, conversation.id]);

  useEffect(() => {
    if (chatResolved) return;
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }, 4000);
    return () => { clearTimeout(timer); setIsTyping(false); };
  }, [conversation.id, chatResolved]);

  const slaColor = slaRemaining > 300 ? "text-green-600/80 bg-green-500/10" : slaRemaining > 60 ? "text-yellow-600/80 bg-yellow-500/10" : slaRemaining > 0 ? "text-red-600/80 bg-red-500/10" : "text-red-700/80 bg-red-500/15";
  const slaMins = Math.floor(slaRemaining / 60);
  const slaSecs = slaRemaining % 60;

  const showCollision = hasCollision && conversation.assignedTo && conversation.assignedTo !== user?.id;

  useEffect(() => {
    if (showNoteInput) noteInputRef.current?.focus();
  }, [showNoteInput]);

  useEffect(() => {
    if (slaRemaining === 60) notifySLAWarning(conversation.customer.name, "1 minute");
    else if (slaRemaining === 0) notifySLAWarning(conversation.customer.name, "0 - overdue");
  }, [slaRemaining, conversation.customer.name]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setScrolledUp(el.scrollTop + el.clientHeight < el.scrollHeight - 80);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const otherAgents = agentList.filter((a) => a.id !== user?.id);

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const startReply = (msg: Message) => {
    setReplyTo(msg);
    textareaRef.current?.focus();
  };

  const startEdit = (msg: Message) => {
    setEditingMsg(msg);
    setInput(msg.content);
    textareaRef.current?.focus();
  };

  const markAsRead = () => {
    const ids = new Set<string>();
    messages.forEach((m) => {
      if (m.sender === "customer") ids.add(m.id);
    });
    setReadMessages(ids);
  };

  const sendVoice = () => {
    const duration = Math.floor(Math.random() * 10) + 3;
    const newMsg: Message = {
      id: `v-${Date.now()}`,
      conversationId: conversation.id,
      sender: "agent",
      senderName: user?.name,
      content: "",
      timestamp: new Date().toISOString(),
      type: "text",
      metadata: { isVoice: true, duration },
    };
    setMessages((prev) => [...prev, newMsg]);
    setReadMessages((prev) => { const s = new Set(prev); s.add(newMsg.id); return s; });
  };

  const playVoice = (msgId: string, duration: number) => {
    if (playingVoice === msgId) {
      if (voiceInterval.current) clearInterval(voiceInterval.current);
      setPlayingVoice(null);
      setVoiceProgress(0);
      return;
    }
    setPlayingVoice(msgId);
    setVoiceProgress(0);
    const totalSteps = duration * 10;
    let step = 0;
    voiceInterval.current = setInterval(() => {
      step++;
      setVoiceProgress(Math.min(100, (step / totalSteps) * 100));
      if (step >= totalSteps) {
        if (voiceInterval.current) clearInterval(voiceInterval.current);
        setPlayingVoice(null);
        setVoiceProgress(0);
      }
    }, 100);
  };

  useEffect(() => {
    setTimeout(() => {
      const ids = new Set<string>();
      messages.slice(0, -1).forEach((m) => {
        if (m.sender === "agent") ids.add(m.id);
      });
      setReadMessages(ids);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "36px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  useEffect(() => { autoResize(); }, [input]);

  const handleResolve = () => {
    convApi.updateStatus(conversation.id, "closed").catch((err) => console.error("Failed to resolve chat:", err));
    notifyResolved(conversation.customer.name);
    setChatResolved(true);
    setMessages((prev) => [
      ...prev,
      { id: `sys-${Date.now()}`, conversationId: conversation.id, sender: "ai", senderName: "System", content: "✅ This conversation has been resolved.", timestamp: new Date().toISOString(), type: "text", metadata: { isSystem: true } },
    ]);
  };

  const handleTransfer = (agentId: string) => {
    setShowTransferDialog(true);
    setTransferTarget(agentId);
  };

  const handleSummarize = () => {
    setSummaryLoading(true);
    aiApi.summarize(conversation.id).then((data) => {
      setSummaryText(data.summary);
      setSummaryLoading(false);
    }).catch(() => { setSummaryLoading(false); });
  };

  const confirmTransfer = () => {
    if (!transferTarget) return;
    const agent = agentList.find((a) => a.id === transferTarget);
    convApi.transfer(conversation.id, transferTarget, transferReason).then((data) => {
      const sysMsg = data.message;
      setMessages((prev) => [
        ...prev,
        { id: sysMsg.id, conversationId: sysMsg.conversationId, sender: "ai", senderName: "System", content: sysMsg.content, timestamp: sysMsg.createdAt, type: "text", metadata: { isSystem: true } },
      ]);
    }).catch(() => {
      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, conversationId: conversation.id, sender: "ai", senderName: "System", content: `🔄 Transferred to ${agent?.name || "another agent"}`, timestamp: new Date().toISOString(), type: "text", metadata: { isSystem: true } },
      ]);
    });
    setShowTransferDialog(false);
    setTransferReason("");
    setTransferTarget(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !editingMsg) return;
    if (editingMsg) {
      setMessages((prev) => prev.map((m) => m.id === editingMsg.id ? { ...m, content: input } : m));
      setEditingMsg(null);
      setInput("");
      return;
    }
    msgApi.send(conversation.id, input).catch((err) => console.error("Failed to send message:", err));
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversationId: conversation.id,
      sender: "agent",
      senderName: user?.name,
      content: input,
      timestamp: new Date().toISOString(),
      type: "text",
      metadata: replyTo ? { replyTo: { id: replyTo.id, sender: replyTo.senderName, content: replyTo.content.slice(0, 80) } } : undefined,
    };
    setMessages((prev) => [...prev, newMsg]);
    setReadMessages((prev) => { const s = new Set(prev); s.add(newMsg.id); return s; });
    setInput("");
    setReplyTo(null);
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    convApi.addNote(conversation.id, noteText).catch((err) => console.error("Failed to add note:", err));
    setMessages((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        conversationId: conversation.id,
        sender: "agent",
        senderName: user?.name,
        content: noteText,
        timestamp: new Date().toISOString(),
        type: "text",
        metadata: { isNote: true },
      },
    ]);
    setNoteText("");
    setShowNoteInput(false);
  };

  const insertCanned = (text: string) => {
    setInput(text);
    setShowCanned(false);
  };

  const sentimentEmoji = conversation.sentiment === "positive" ? "\u{1F60A}" : conversation.sentiment === "negative" ? "\u{1F61F}" : null;

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/40 rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <div className="flex h-full flex-col relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b bg-card px-3 py-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-[11px]">{conversation.customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">
              {conversation.customer.name}
              {sentimentEmoji}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                via{" "}
                {(() => {
                  const Icon = channelMeta[conversation.channel].icon;
                  return <Icon className="h-3 w-3" />;
                })()}{" "}
                {channelMeta[conversation.channel].label}
              </p>
              <span className="text-[10px] text-muted-foreground">&middot;</span>
              <span className={cn(
                "text-[10px] capitalize",
                user?.status === "online" && "text-green-600",
                user?.status === "away" && "text-yellow-600",
                user?.status === "busy" && "text-red-600"
              )}>
                You are {user?.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSearch(!showSearch)}>
            <Search className={cn("h-3.5 w-3.5", showSearch && "text-primary")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-foreground" onClick={() => setShowInfo(!showInfo)}><Info className={cn("h-3.5 w-3.5", showInfo && "text-primary")} /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-foreground"><MoreVertical className="h-3.5 w-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleResolve()} className="text-xs">
                <CheckCircle className="mr-2 h-3.5 w-3.5 text-green-500" />
                Resolve Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { markAsRead(); }} className="text-xs">
                <CheckCheck className="mr-2 h-3.5 w-3.5 text-blue-500" />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                  Request Handoff...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-36">
                  {otherAgents.map((a) => (
                    <DropdownMenuItem key={a.id} onClick={() => {
                      if (onRequestHandoff) onRequestHandoff();
                    }} className="text-xs">
                      {a.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              {onAssignToMe && !conversation.assignedTo && (
                <DropdownMenuItem onClick={onAssignToMe} className="text-xs">
                  <UserCheck className="mr-2 h-3.5 w-3.5" />
                  Assign to Me
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => {}} className="text-xs">
                <Tag className="mr-2 h-3.5 w-3.5" />
                Manage Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setShowNoteInput(true); setShowCanned(false); setShowAiSuggest(false); }} className="text-xs">
                <StickyNote className="mr-2 h-3.5 w-3.5 text-yellow-600" />
                Add Internal Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Collision Alert */}
      {showCollision && (
        <div className="flex items-center gap-2 border-b bg-destructive/5 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/20 px-3 py-2 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-[11px] text-destructive/80 font-medium">
            Dewi Lestari is also viewing this conversation
          </span>
        </div>
      )}

      {/* SLA Timer */}
      <div className={cn("flex items-center gap-2 border-b px-3 py-1.5 shrink-0", slaColor)}>
        <Clock className="h-3 w-3" />
        <span className="text-[10px] font-medium">
          SLA Response: {slaMins}:{slaSecs.toString().padStart(2, "0")}
        </span>
        {slaRemaining === 0 && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-red-500/50 text-red-600 bg-red-500/10">
            Overdue
          </Badge>
        )}
        <span className="ml-auto text-[9px] opacity-70">{slaMinutes}m target</span>
      </div>

      {showSearch && (
        <div className="flex items-center gap-2 border-b px-3 py-2 shrink-0 bg-muted/20">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in conversation..."
            className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <span className="text-[10px] text-muted-foreground">
              {messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} match(es)
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-3 relative">
        {/* Scroll to bottom FAB */}
        {scrolledUp && (
          <button
            onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
            className="sticky bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full border bg-card shadow-lg px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:shadow-xl transition-all animate-bounce"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            New messages
          </button>
        )}
        {chatResolved && (
          <div className="sticky top-0 z-10 -mx-3 mb-3 flex items-center justify-center gap-2 bg-success/5 dark:bg-success/10 border-b border-success/20 dark:border-success/20 px-4 py-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-[12px] font-medium text-success/80">
              This conversation has been resolved
            </span>
            <button
              onClick={() => setChatResolved(false)}
              className="text-[11px] text-success underline ml-2"
            >
              Reopen
            </button>
          </div>
        )}
        <div className="mx-auto space-y-0.5">
          {messages.map((msg, idx) => {
            if (msg.metadata && (msg.metadata as Record<string, unknown>).isSystem) {
              return (
                <div key={msg.id} className="flex justify-center py-1.5">
                  <span className="text-[11px] text-muted-foreground bg-muted/50 dark:bg-zinc-800/50 dark:text-zinc-400 rounded-full px-3 py-0.5">
                    {highlightText(msg.content)}
                  </span>
                </div>
              );
            }

            const prev = idx > 0 ? messages[idx - 1] : null;
            const next = idx < messages.length - 1 ? messages[idx + 1] : null;
            const sameSenderAsPrev = prev && prev.sender === msg.sender && !prev.metadata?.isSystem && !prev.metadata?.isNote;
            const sameSenderAsNext = next && next.sender === msg.sender && !next.metadata?.isSystem && !next.metadata?.isNote;
            const isGroupStart = !sameSenderAsPrev;
            const isGroupEnd = !sameSenderAsNext;
            const isGroupMiddle = sameSenderAsPrev && sameSenderAsNext;
            const isSingle = !sameSenderAsPrev && !sameSenderAsNext;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={cn(
                  "flex gap-2",
                  msg.sender === "agent" ? "justify-end" : "justify-start",
                  isGroupStart ? "mt-3" : "mt-0.5"
                )}
              >
              {msg.sender !== "agent" && isGroupEnd && (
                <Avatar className="h-8 w-8 shrink-0 self-end">
                  <AvatarFallback className="text-[11px]">{msg.senderName?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
              )}
              {msg.sender !== "agent" && !isGroupEnd && (
                <div className="w-8 shrink-0 self-end" />
              )}
              <div className="max-w-[75%]">
                {msg.sender !== "agent" && isGroupStart && (
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5 pl-1">
                    {msg.senderName}
                    {msg.sender === "ai" && <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0">AI</Badge>}
                  </p>
                )}
                {msg.sender === "agent" && !!(msg.metadata && (msg.metadata as Record<string, unknown>).isNote) && (
                  <p className="text-[10px] font-medium text-warning/80 dark:text-warning/70 pl-1">
                    <StickyNote className="inline h-3 w-3 mr-0.5" />
                    Internal Note
                  </p>
                )}
                {(() => {
                  const isNote = !!(msg.metadata && (msg.metadata as Record<string, unknown>).isNote);
                  const isReplied = replyTo?.id === msg.id;

                  const getBubbleRadius = () => {
                    if (msg.sender === "agent") {
                      return "rounded-tl-[18px] rounded-bl-[18px] rounded-tr-[4px] rounded-br-[4px]";
                    }
                    return "rounded-tr-[18px] rounded-br-[18px] rounded-tl-[4px] rounded-bl-[4px]";
                  };

                  const bubbleClass = cn(
                    "px-4 py-2.5 text-[13px] leading-relaxed relative transition-colors max-w-prose",
                    isReplied && "ring-2 ring-blue-400/60 dark:ring-blue-500/60",
                    getBubbleRadius(),
                    msg.sender === "agent" && isNote
                      ? "bg-warning/10 text-warning-foreground/90 border border-warning/20 dark:bg-warning/15 dark:text-warning-foreground/80 dark:border-warning/20"
                      : msg.sender === "agent"
                      ? "bg-primary text-primary-foreground dark:bg-blue-600 dark:text-white"
                      : msg.sender === "ai"
                        ? "bg-purple-50 text-purple-900 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-800/30"
                        : "bg-white text-gray-900 border border-gray-200 dark:bg-zinc-700 dark:text-zinc-50 dark:border-zinc-600"
                  );
                  return (
                    <div className="relative group/msg">
                      <div className={bubbleClass}>
                      {/* Voice message */}
                      {(msg.metadata && (msg.metadata as Record<string, unknown>).isVoice) ? (
                        <button
                          onClick={() => playVoice(msg.id, ((msg.metadata as Record<string, unknown>).duration as number) || 3)}
                          className="flex items-center gap-2.5 w-full min-w-[180px]"
                        >
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                            msg.sender === "agent" ? "bg-white/20" : "bg-blue-500 text-white"
                          )}>
                            {playingVoice === msg.id ? (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="h-8 flex items-center gap-px">
                              {Array.from({ length: 20 }).map((_, i) => {
                                const h = 8 + Math.sin(i * 0.9 + (msg.id.charCodeAt(0) || 0)) * 12 + Math.sin(i * 0.4) * 6;
                                return (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-[2px] rounded-full transition-all",
                                      playingVoice === msg.id && (i / 20) * 100 <= voiceProgress ? "opacity-60" : "opacity-30",
                                      msg.sender === "agent" ? "bg-white" : "bg-current"
                                    )}
                                    style={{ height: `${Math.abs(h)}px` }}
                                  />
                                );
                              })}
                            </div>
                            {playingVoice === msg.id && (
                              <div className="h-0.5 mt-0.5 rounded-full bg-white/20">
                                <div className="h-full rounded-full bg-white/60 transition-all duration-100" style={{ width: `${voiceProgress}%` }} />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-medium opacity-70 w-8 text-right shrink-0">
                            {playingVoice === msg.id
                              ? `${Math.ceil(((msg.metadata as Record<string, unknown>).duration as number || 3) * (1 - voiceProgress / 100))}s`
                              : `${(msg.metadata as Record<string, unknown>).duration || 3}s`
                            }
                          </span>
                        </button>
                      ) : (
                        <>
                          {msg.type === "template" ? (
                            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content }} />
                          ) : (
                            <p className="whitespace-pre-wrap">{highlightText(msg.content)}</p>
                          )}
                        </>
                      )}
                      {isNote && (
                        <p className="mt-1 text-[9px] font-medium text-yellow-700 dark:text-yellow-400">
                          🔒 Internal Note — only visible to agents
                        </p>
                      )}
                    </div>
                    {isReplied && (
                      <p className="text-[9px] font-medium text-blue-600 dark:text-blue-400 mt-0.5 pl-1">
                        ↩ You replied to this message
                      </p>
                    )}
                    {!isNote && (
                      <div className={cn(
                        "absolute top-0 flex flex-col gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity",
                        msg.sender === "agent" ? "-left-10" : "-right-10"
                      )}>
                        <button onClick={() => startReply(msg)} className="p-0.5 rounded hover:bg-muted" title="Reply">
                          <Reply className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => navigator.clipboard.writeText(msg.content)} className="p-0.5 rounded hover:bg-muted" title="Copy">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                        {msg.sender === "agent" && (
                          <>
                            <button onClick={() => startEdit(msg)} className="p-0.5 rounded hover:bg-muted" title="Edit">
                              <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                            <button onClick={() => deleteMessage(msg.id)} className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
                })()}
                {isGroupEnd && (
                  <p
                    className={cn("text-[9px] text-muted-foreground mt-0.5", msg.sender === "agent" ? "text-right pr-1" : "pl-1")}
                    title={new Date(msg.timestamp).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })}
                  >
                    {formatChatTime(msg.timestamp)}
                    {msg.sender === "agent" && (
                      <span className="ml-1 text-[10px]">{readMessages.has(msg.id) ? <CheckCheck className="inline h-3 w-3 text-blue-500" /> : <Check className="inline h-3 w-3 text-muted-foreground" />}</span>
                    )}
                  </p>
                )}
              </div>
              {msg.sender === "agent" && isGroupEnd && (
                <AgentAvatar name={user?.name ?? ""} size="default" className="self-end" />
              )}
              {msg.sender === "agent" && !isGroupEnd && (
                <div className="w-8 shrink-0 self-end" />
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAiSuggest && (
        <div className="border-t bg-gradient-to-b from-violet-50/50 to-background dark:from-zinc-800/50 dark:to-zinc-900 px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500/80" />
              <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">AI Suggestions</span>
              <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-violet-500/10 text-violet-600/80 border-violet-500/15">Beta</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowAiSuggest(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1.5">
            {aiSuggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => { setInput(s.text); setShowAiSuggest(false); textareaRef.current?.focus(); }}
                className="w-full text-left rounded-lg border border-violet-200/40 dark:border-violet-800/30 bg-card dark:bg-zinc-800/60 px-3 py-2 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3 w-3 text-violet-400/80 group-hover:text-violet-500" />
                  <span className="text-[10px] font-semibold text-violet-600/80 dark:text-violet-400/80 uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-[12px] text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">{s.text}</p>
              </button>
            ))}
          </div>

          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-2 text-center">Tap to insert · Edit before sending</p>
        </div>
      )}

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <div className="border-t bg-muted/30 dark:bg-zinc-900 px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium">Transfer to {agentList.find((a) => a.id === transferTarget)?.name}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setShowTransferDialog(false); setTransferTarget(null); setTransferReason(""); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Reason (optional)..."
              className="flex-1 h-7 rounded border border-input bg-background px-2 text-[11px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button size="sm" className="h-7 text-[11px] px-3" onClick={confirmTransfer}>Transfer</Button>
          </div>
        </div>
      )}

      {/* Canned Responses Panel */}
      {showCanned && (
        <div className="border-t bg-muted/30 dark:bg-zinc-900 px-3 py-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium dark:text-zinc-200">Quick Replies</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowCanned(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div>
            <p className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Templates</p>
            <div className="flex flex-wrap gap-1.5">
              {cannedList.map((cr) => (
                <button
                  key={cr.label}
                  onClick={() => insertCanned(cr.text)}
                  className="inline-flex items-center rounded-full border border-zinc-200/60 dark:border-zinc-700/60 bg-card dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 text-[11px] transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-700/60"
                >
                  {cr.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Products</p>
            <div className="flex flex-col sm:flex-row gap-2 overflow-y-auto max-h-[180px] sm:max-h-none sm:overflow-x-auto sm:pb-1">
              {productRecommendations.map((p) => (
                <button
                  key={p.name}
                  onClick={() => { setInput(`Saya rekomendasikan paket ${p.name} (${p.price}) - ${p.desc}. Mau saya bantu booking?`); setShowCanned(false); }}
                  className="shrink-0 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 bg-card dark:bg-zinc-800 px-2.5 py-2 w-full sm:w-[140px] text-left hover:border-violet-400/60 dark:hover:border-violet-600/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 truncate">{p.name}</span>
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0 ml-1">{p.tag}</Badge>
                  </div>
                  <p className="text-[11px] font-bold text-violet-600/80 dark:text-violet-400/80">{p.price}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Internal Note Input */}
      {showNoteInput && (
        <div className="border-t bg-warning/5 dark:bg-warning/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5 text-warning shrink-0" />
            <input
              ref={noteInputRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add internal note..."
              className="flex-1 h-7 rounded border border-warning/20 dark:border-warning/20 bg-card dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 px-2 text-[11px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button size="sm" className="h-7 text-[10px] px-2" onClick={addNote}>Add</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowNoteInput(false); setNoteText(""); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Typing Indicator */}
      {(wsIsTyping || isTyping) && !chatResolved && (
        <div className="px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[11px] text-muted-foreground italic">
              {conversation.customer.name} is typing...
            </span>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="border-t bg-card px-3 py-2">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { setInput((prev) => prev + emoji); setShowEmoji(false); }}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowEmoji(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between border-t bg-blue-50 dark:bg-blue-950/20 px-3 py-2">
          <button
            onClick={() => {
              const el = document.getElementById(`msg-${replyTo.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase">Replying to {replyTo.senderName}</p>
            <p className="text-[11px] truncate text-muted-foreground">{replyTo.content.slice(0, 100)}</p>
          </button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Editing Banner */}
      {editingMsg && (
        <div className="flex items-center justify-between border-t bg-blue-50 dark:bg-blue-950/20 px-3 py-2">
          <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Editing message</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingMsg(null); setInput(""); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Voice Recording */}
      {recording && (
        <div className="flex items-center justify-between border-t bg-destructive/5 dark:bg-destructive/10 px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[12px] font-medium text-destructive/80">Recording voice message...</span>
          </div>
          <span className="text-[11px] text-destructive/70 font-mono">0:05</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRecording(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSend} className="border-t bg-card px-3 py-2.5 shrink-0">
        <div className="flex items-end gap-1.5">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-foreground" title="Attach file or photo">
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center gap-1 flex-1 rounded-lg border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Debounce typing indicator (send max once every 2s)
                const now = Date.now();
                const lastTyping = ((window as any).__lastTypingSent || 0);
                if (now - lastTyping > 2000) {
                  msgApi.sendTyping(conversation.id).catch(() => {});
                  (window as any).__lastTypingSent = now;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              placeholder={chatResolved ? "Chat resolved. Reopen to send messages." : "Type a message..."}
              disabled={chatResolved}
              className="flex flex-1 resize-none border-none bg-transparent px-1 py-1.5 text-[13px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 overflow-y-auto"
              style={{ minHeight: "36px", maxHeight: "120px", height: "36px" }}
            />
            {!input.trim() && (
              <>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-foreground" onClick={() => { setShowAiSuggest(!showAiSuggest); setShowCanned(false); setShowNoteInput(false); }}>
                  <Sparkles className={cn("h-3.5 w-3.5", showAiSuggest && "text-violet-500")} />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-foreground" onClick={() => { setShowCanned(!showCanned); setShowNoteInput(false); setShowAiSuggest(false); }}>
                  <Zap className={cn("h-3.5 w-3.5", showCanned && "text-yellow-500")} />
                </Button>
              </>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-foreground" onClick={() => { setShowEmoji(!showEmoji); setShowCanned(false); setShowAiSuggest(false); }}>
            <Smile className={cn("h-3.5 w-3.5", showEmoji && "text-yellow-500")} />
          </Button>
          {input.trim() ? (
            <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!input.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className={cn("h-8 w-8 shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-foreground", recording ? "bg-destructive/15 dark:bg-destructive/20 text-destructive" : "bg-muted dark:bg-zinc-700")}
              onMouseDown={() => setRecording(true)}
              onMouseUp={() => { if (recording) { setRecording(false); sendVoice(); } }}
              onMouseLeave={() => recording && setRecording(false)}
            >
              <Mic className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </form>

      {/* Info Panel */}
      {showInfo && (
        <Sheet open onOpenChange={() => setShowInfo(false)}>
          <SheetContent className="w-[380px] sm:max-w-[380px] p-6 overflow-auto">
            <SheetHeader className="mb-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{conversation.customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-lg">{conversation.customer.name}</SheetTitle>
                  <p className="text-[11px] text-muted-foreground capitalize mt-1">
                    {conversation.sentiment || "neutral"} sentiment · {channelMeta[conversation.channel].label}
                  </p>
                </div>
              </div>
            </SheetHeader>

            <Separator className="mb-5" />

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Channel</p>
                  <p className="text-[13px] font-medium">{channelMeta[conversation.channel].label}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <p className="text-[13px] font-medium capitalize">{conversation.status}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Assigned</p>
                  <p className="text-[13px] font-medium">{conversation.assignedTo || "Unassigned"}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Messages</p>
                  <p className="text-[13px] font-medium">{messages.length}</p>
                </div>
              </div>

              {conversation.tags.length > 0 && (
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {conversation.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[11px] px-2.5 py-1">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" onClick={handleResolve}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500/80" /> Resolve Chat
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" onClick={handleSummarize} disabled={summaryLoading}>
                    <Sparkles className="mr-2 h-4 w-4 text-purple-500/80" /> {summaryLoading ? "Generating..." : "Summarize"}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" onClick={() => { setShowInfo(false); setShowNoteInput(true); }}>
                    <StickyNote className="mr-2 h-4 w-4 text-warning/80" /> Add Internal Note
                  </Button>
                </div>
              </div>
              {summaryText && (
                <div className="rounded-xl border bg-purple-500/5 border-purple-500/15 p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Chat Summary</p>
                  <pre className="text-[11px] whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">{summaryText}</pre>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-3 max-w-sm px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold">AvaChat Inbox</h3>
        <p className="text-sm text-muted-foreground">
          Select a conversation from the left panel to start chatting. All your channels in one place.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [inboxTab, setInboxTab] = useState<"mine" | "unassigned" | "all">("mine");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "waiting" | "closed">("all");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [apiConversations, setApiConversations] = useState<Conversation[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [collisionConvId, setCollisionConvId] = useState<string | null>(null);
  const [pendingHandoffs, setPendingHandoffs] = useState<any[]>([]);
  const [showHandoffDialog, setShowHandoffDialog] = useState(false);
  const [handoffConvId, setHandoffConvId] = useState<string | null>(null);
  const [agentList, setAgentList] = useState<{ id: string; name: string }[]>([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [wsNewMessage, setWsNewMessage] = useState<any>(null);
  const [wsIsTyping, setWsIsTyping] = useState(false);
  const wsSendRef = useRef<(data: any) => void>(() => {});

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const done = localStorage.getItem("avachat_onboarding_done");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!done) setShowOnboarding(true);
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const params: { status?: string; assigned?: string } = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (inboxTab === "mine") params.assigned = "me";
    else if (inboxTab === "unassigned") params.assigned = "unassigned";

    convApi.list(params)
      .then((data) => {
        const mapped = data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          customer: { name: (c.customer_name as string) || "Unknown", phone: c.phone as string | undefined, email: c.email as string | undefined },
          channel: (c.channel || "whatsapp") as ChannelType,
          lastMessage: (c.last_message || "") as string,
          lastMessageAt: (c.last_message_at || c.updated_at || new Date().toISOString()) as string,
          unread: 0,
          status: (c.status || "active") as "active" | "waiting" | "closed",
          assignedTo: (c.assigned_to) as string | undefined,
          sentiment: c.sentiment as "positive" | "neutral" | "negative" | undefined,
          tags: (c.tags || []) as string[],
        }));
         
        setApiConversations(mapped);
      })
      .catch(() => {
         
        setApiConversations(mockConversations);
      });
  }, [isAuthenticated, inboxTab, statusFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;

    usersApi.list().then((data) => {
      setAgentList(data.filter((u: any) => u.role === "agent").map((u: any) => ({ id: u.id, name: u.name })));
    }).catch(() => {});

    handoffApi.pending().then((data) => {
      setPendingHandoffs(data);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    convApi.list({ assigned: "unassigned" }).then((data) => {
      setUnassignedCount(data.length);
    }).catch(() => {});
  }, [isAuthenticated, apiConversations.length]);

  useEffect(() => {
    const ws = connectWebSocket((data) => {
      if (data.type === "new_message" || data.type === "status_change") {
        // Push to chat panel if viewing this conversation
        if (data.type === "new_message" && data.message) {
          setWsNewMessage({ ...data.message, conversation_id: data.conversationId || data.conversation_id });
        }
        setApiConversations((prev) => {
          const existing = prev.find((c) => c.id === data.conversationId || c.id === (data.message?.conversation_id));
          if (existing) {
            return prev.map((c) => {
              if (c.id === data.conversationId || c.id === (data.message?.conversation_id)) {
                return {
                  ...c,
                  lastMessage: data.message?.content || c.lastMessage,
                  lastMessageAt: data.timestamp || new Date().toISOString(),
                  status: data.status || c.status,
                };
              }
              return c;
            });
          }
          // New conversation — refetch list
          convApi.list().then((data) => {
            const mapped = data.map((c: Record<string, unknown>) => ({
              id: c.id as string, customer: { name: (c.customer_name as string) || "" }, channel: (c.channel as ChannelType), lastMessage: c.last_message as string, lastMessageAt: c.last_message_at as string,               status: (c.status as Conversation["status"]), unread: 0, assignedTo: c.assigned_to as string, sentiment: c.sentiment as string, tags: (c.tags as string[]) || [],
            }));
            setApiConversations(mapped as Conversation[]);
          }).catch(() => {});
          return prev;
        });
      }
      if (data.type === "collision") {
        setCollisionConvId(data.conversationId);
      }
      if (data.type === "collision_clear") {
        setCollisionConvId((prev) => prev === data.conversationId ? null : prev);
      }
      if (data.type === "handoff_request") {
        setPendingHandoffs((prev) => [...prev, data.handoff]);
        toast.info(`Handoff request from ${data.handoff.from_agent_name}`);
      }
      if (data.type === "handoff_accepted" || data.type === "handoff_rejected") {
        setPendingHandoffs((prev) => prev.filter((h) => h.id !== data.handoffId));
        toast.success(data.type === "handoff_accepted" ? "Handoff accepted" : "Handoff rejected");
      }
      if (data.type === "typing" && selectedConv && (data.conversationId || data.conversation_id) === selectedConv.id) {
        setWsIsTyping(true);
        clearTimeout((window as any).__wsTypingTimer);
        (window as any).__wsTypingTimer = setTimeout(() => setWsIsTyping(false), 4000);
      }
    });
    wsSendRef.current = ws.send;
    return () => { ws.disconnect(); };
  }, []);

  // Send viewing event when selected conversation changes
  useEffect(() => {
    if (selectedConv && selectedConv.id) {
      wsSendRef.current({ type: "viewing", conversationId: selectedConv.id });
    }
    return () => {
      if (selectedConv && selectedConv.id) {
        wsSendRef.current({ type: "stop_viewing", conversationId: selectedConv.id });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  let conversations = apiConversations.length > 0 ? apiConversations : mockConversations;

  if (search) {
    const q = search.toLowerCase();
    conversations = conversations.filter(
      (c) =>
        c.customer.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q))
    );
  }

  if (inboxTab === "mine") {
    conversations = conversations.filter((c) => c.assignedTo === user?.name);
  } else if (inboxTab === "unassigned") {
    conversations = conversations.filter((c) => !c.assignedTo);
  }

  if (statusFilter !== "all") {
    conversations = conversations.filter((c) => c.status === statusFilter);
  }

  const handleRequestHandoff = (agentId: string, reason: string) => {
    if (!handoffConvId) return;
    convApi.handoff(handoffConvId, agentId, reason).then(() => {
      toast.success("Handoff request sent");
      setShowHandoffDialog(false);
    }).catch(() => {
      toast.error("Failed to send handoff request");
    });
  };

  const handleAcceptHandoff = (id: string) => {
    handoffApi.respond(id, "accept").then(() => {
      setPendingHandoffs((prev) => prev.filter((h) => h.id !== id));
      toast.success("Handoff accepted");
    }).catch(() => {
      toast.error("Failed to accept handoff");
    });
  };

  const handleRejectHandoff = (id: string) => {
    handoffApi.respond(id, "reject").then(() => {
      setPendingHandoffs((prev) => prev.filter((h) => h.id !== id));
      toast.info("Handoff rejected");
    }).catch(() => {
      toast.error("Failed to reject handoff");
    });
  };

  const handleAssignToMe = (convId: string) => {
    convApi.assign(convId, user?.id || "").then(() => {
      setApiConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, assignedTo: user?.name } : c)
      );
      toast.success("Conversation assigned to you");
    }).catch(() => {
      toast.error("Failed to assign conversation");
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Page Header - Mobile Only */}
        <div className="border-b bg-card px-4 py-3 shrink-0 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight">Inbox</h2>
                <p className="text-[11px] text-muted-foreground leading-tight">{conversations.length} conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <PendingHandoffs handoffs={pendingHandoffs} onAccept={handleAcceptHandoff} onReject={handleRejectHandoff} />
              <div className="flex items-center rounded-lg border p-0.5">
                {(["mine", "unassigned", "all"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInboxTab(tab)}
                    className={`px-2 py-0.5 text-[11px] rounded-md transition-colors ${
                      inboxTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tab === "mine" ? "Mine" : tab === "unassigned" ? "Pool" : "All"}
                  </button>
                ))}
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger size="sm" className="w-[100px] text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Conversation List */}
          <div
            className={cn(
              "w-full shrink-0 border-r bg-card lg:w-[300px] lg:flex lg:flex-col min-h-0",
              selectedConv ? "hidden lg:flex" : "flex flex-col"
            )}
          >
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id ?? null}
              onSelect={setSelectedConv}
              search={search}
              onSearchChange={setSearch}
              inboxTab={inboxTab}
              onInboxTabChange={setInboxTab}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Right Panel - Chat */}
          <div
            className={cn(
              "flex-1 flex-col min-h-0",
              selectedConv ? "flex" : "hidden lg:flex"
            )}
          >
            {selectedConv ? (
              <ChatPanel
                key={selectedConv.id}
                conversation={selectedConv}
                onBack={() => setSelectedConv(null)}
                hasCollision={collisionConvId === selectedConv.id}
                newWsMessage={wsNewMessage}
                wsIsTyping={wsIsTyping}
                onRequestHandoff={() => {
                  setHandoffConvId(selectedConv.id);
                  setShowHandoffDialog(true);
                }}
                onAssignToMe={() => handleAssignToMe(selectedConv.id)}
              />
            ) : (
              <EmptyChat />
            )}
          </div>
        </div>
      </div>

      <HandoffDialog
        open={showHandoffDialog}
        onOpenChange={setShowHandoffDialog}
        agents={agentList}
        currentAgentId={user?.id}
        onSubmit={handleRequestHandoff}
      />

      {showOnboarding && (
        <OnboardingWizard onClose={() => setShowOnboarding(false)} />
      )}
    </AppLayout>
  );
}
