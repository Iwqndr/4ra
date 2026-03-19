export default {
  async fetch(request, env) {
    // 4Aura Global Network Worker
    // Now powered by Supabase Realtime (Durable Objects disabled for cost/performance)
    return new Response("4Aura Global Network — Realtime Active", { status: 200 });
  }
};
