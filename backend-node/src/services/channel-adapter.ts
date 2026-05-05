export interface ChannelEvent {
  channel: string;
  event: "message" | "media" | "typing" | "read";
  customerId: string;
  customerName: string;
  customerPhone?: string;
  content: string;
  type?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ChannelAdapter {
  readonly channel: string;
  readonly connected: boolean;

  /** Start the adapter (e.g. set webhook, connect) */
  connect(): Promise<void>;

  /** Stop the adapter (e.g. remove webhook, disconnect) */
  disconnect(): Promise<void>;

  /** Send a text message to customer */
  sendMessage(conversationId: string, customerId: string, text: string): Promise<{ messageId: string }>;

  /** Send media (image, document) to customer */
  sendMedia(conversationId: string, customerId: string, url: string, caption?: string): Promise<{ messageId: string }>;

  /** Handle incoming event from webhook */
  handleEvent(event: ChannelEvent): Promise<{ conversationId: string; messageId: string }>;
}

export class ChannelAdapterFactory {
  private static adapters = new Map<string, ChannelAdapter>();

  static register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channel, adapter);
  }

  static get(channel: string): ChannelAdapter | undefined {
    return this.adapters.get(channel);
  }

  static getAllConnected(): ChannelAdapter[] {
    return Array.from(this.adapters.values()).filter((a) => a.connected);
  }
}
