import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { redis } from "../db/redis";
import { config } from "../config/env";

const viewingMap = new Map<string, Set<string>>();
const userConnections = new Map<string, Set<WebSocket>>();
let wsServer: WebSocketServer | null = null;

export function setupWebSocket(wss: WebSocketServer): WebSocketServer {
  wsServer = wss;

  const redisSubscriber = redis.duplicate();
  redisSubscriber.subscribe("avachat:messages").catch(() => {});
  redisSubscriber.on("message", (_channel, data) => {
    try {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(data);
      });
    } catch {}
  });

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected");
    let wsUserId: string | null = null;
    let wsConversationId: string | null = null;

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "auth") {
          try {
            const decoded = jwt.verify(msg.token, config.JWT_SECRET) as { userId: string };
            wsUserId = decoded.userId;
            if (!userConnections.has(wsUserId)) userConnections.set(wsUserId, new Set());
            userConnections.get(wsUserId)!.add(ws);
            ws.send(JSON.stringify({ type: "auth_ok", userId: wsUserId }));
          } catch {
            ws.send(JSON.stringify({ type: "auth_error", message: "invalid token" }));
          }
        } else if (msg.type === "viewing") {
          const convId = msg.conversationId as string;
          if (wsConversationId && wsConversationId !== convId && wsUserId) {
            const prevViewers = viewingMap.get(wsConversationId);
            if (prevViewers) {
              prevViewers.delete(wsUserId);
              if (prevViewers.size === 0) viewingMap.delete(wsConversationId);
              updateCollision(wsConversationId);
            }
          }
          wsConversationId = convId;
          if (wsUserId) {
            if (!viewingMap.has(convId)) viewingMap.set(convId, new Set());
            viewingMap.get(convId)!.add(wsUserId);
            updateCollision(convId);
          }
        } else if (msg.type === "stop_viewing") {
          if (wsConversationId && wsUserId) {
            const viewers = viewingMap.get(wsConversationId);
            if (viewers) {
              viewers.delete(wsUserId);
              if (viewers.size === 0) viewingMap.delete(wsConversationId);
              updateCollision(wsConversationId);
            }
            wsConversationId = null;
          }
        }
      } catch {}
    });

    ws.on("close", () => {
      if (wsConversationId && wsUserId) {
        const viewers = viewingMap.get(wsConversationId);
        if (viewers) {
          viewers.delete(wsUserId);
          if (viewers.size === 0) viewingMap.delete(wsConversationId);
          updateCollision(wsConversationId);
        }
      }
      if (wsUserId) {
        const conns = userConnections.get(wsUserId);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) userConnections.delete(wsUserId);
        }
      }
      console.log("🔌 WebSocket client disconnected");
    });

    ws.send(JSON.stringify({ type: "connected", message: "Welcome to AvaChat real-time", timestamp: new Date().toISOString() }));
  });

  return wss;
}

export function broadcast(conversationId: string, payload: Record<string, unknown>) {
  const data = JSON.stringify(payload);
  // Send to local WS clients directly
  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  }
  // Also publish to Redis for cross-instance scaling
  redis.publish("avachat:messages", data).catch(() => {});
}

export function broadcastToUser(userId: string, payload: Record<string, unknown>) {
  const data = JSON.stringify(payload);
  const connections = userConnections.get(userId);
  if (connections) {
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });
  }
}

function updateCollision(conversationId: string) {
  const viewers = viewingMap.get(conversationId);
  const count = viewers ? viewers.size : 0;
  const data = JSON.stringify({
    type: count >= 2 ? "collision" : "collision_clear",
    conversationId,
    viewers: viewers ? Array.from(viewers) : [],
    count,
    timestamp: new Date().toISOString(),
  });
  if (wsServer) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  }
}
