# 4Aura UI Redesign & Bug Fixes

## 1. Core Fixes
- **Supabase Singleton**: Move `createClient` to `src/lib/supabase.js`.
- **401 Errors**: Add proper RLS policies for anonymous `INSERT` (since user auth is AniList-based, we'll use a public-write for prototyping or a simple policy).
- **Route Match**: Change route to `/u/:userId` for cleaner matching.

## 2. Immersive UI Redesign
- **Layout**: Switch to "Floating Layers".
- **Server Strip**: Move to a refined vertical bar with glow effects.
- **Chat Area**: Translucent panels with background anime artwork (blurred).
- **Member Bar**: Slide-out overlay instead of fixed column.

## 3. SQL Security
Update `database_setup.sql` with:
```sql
-- Allow anyone to insert messages (for demo/public prototyping)
create policy "Public Insert" on messages for insert with check (true);
create policy "Public Insert Servers" on servers for insert with check (true);
create policy "Public Insert channels" on channels for insert with check (true);
create policy "Public Insert members" on server_members for insert with check (true);
```
