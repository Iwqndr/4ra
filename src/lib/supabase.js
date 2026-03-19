import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snskhwjkzkeedjyobkhh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuc2tod2premtlZWRqeW9ia2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTA2MjksImV4cCI6MjA4OTQ2NjYyOX0.py6VROlPKC9zlhebwg-NCu5TLpYjCc3nwm6BXCmGHn8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
