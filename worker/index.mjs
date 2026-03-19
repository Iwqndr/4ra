export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Check for WebSocket upgrade
    if (url.pathname.startsWith("/chat/ws/")) {
      const roomName = url.pathname.split("/").pop();
      if (!roomName) return new Response("Room name required", { status: 400 });
      
      const id = env.CHAT_ROOM.idFromName(roomName);
      const room = env.CHAT_ROOM.get(id);
      
      return room.fetch(request);
    }

    // Default response or proxy to assets if needed (though assets are handled by Cloudflare usually)
    return new Response("4Aura Chat API", { status: 200 });
  }
};

export { ChatRoom } from './ChatRoom.mjs';
