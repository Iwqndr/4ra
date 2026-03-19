import { DurableObject } from "cloudflare:workers";

export class ChatRoom extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.sessions = new Set();
    
    // Initialize SQLite storage
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          user_name TEXT,
          user_avatar TEXT,
          content TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_rich_link BOOLEAN DEFAULT FALSE,
          metadata TEXT
        );
      `);
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const [client, server] = new WebSocketPair();
    await this.handleSession(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async handleSession(ws) {
    ws.accept();
    this.sessions.add(ws);
    this.broadcastUserCount();

    // Send history (last 50 messages)
    const history = this.ctx.storage.sql.exec("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50").toArray();
    ws.send(JSON.stringify({ type: 'history', messages: history.reverse() }));

    ws.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        
        if (data.type === 'message') {
          const { userId, userName, userAvatar, content, isRichLink, metadata } = data;
          this.ctx.storage.sql.exec(
            "INSERT INTO messages (user_id, user_name, user_avatar, content, is_rich_link, metadata) VALUES (?, ?, ?, ?, ?, ?)",
            userId, userName, userAvatar, content, isRichLink ? 1 : 0, JSON.stringify(metadata || {})
          );

          this.broadcast({
            type: 'message',
            userId, userName, userAvatar, content, isRichLink, metadata,
            timestamp: new Date().toISOString()
          });
        } else if (data.type === 'typing') {
          this.broadcast({
            type: 'typing',
            userId: data.userId,
            userName: data.userName,
            isTyping: data.isTyping
          }, ws);
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    });

    ws.addEventListener("close", () => {
      this.sessions.delete(ws);
      this.broadcastUserCount();
    });

    ws.addEventListener("error", () => {
      this.sessions.delete(ws);
      this.broadcastUserCount();
    });
  }

  broadcastUserCount() {
    this.broadcast({
      type: 'user_count',
      count: this.sessions.size
    });
  }

  broadcast(message, excludeWs = null) {
    const msgStr = JSON.stringify(message);
    const deadSessions = [];
    for (const session of this.sessions) {
      if (session !== excludeWs) {
        try {
          session.send(msgStr);
        } catch (err) {
          deadSessions.push(session);
        }
      }
    }
    deadSessions.forEach(s => this.sessions.delete(s));
    if (deadSessions.length > 0) this.broadcastUserCount();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/chat/ws/")) {
      const roomName = url.pathname.split("/").pop();
      if (!roomName) return new Response("Room name required", { status: 400 });
      const id = env.CHAT_ROOM.idFromName(roomName);
      const room = env.CHAT_ROOM.get(id);
      return room.fetch(request);
    }
    return new Response("4Aura Chat API", { status: 200 });
  }
};
