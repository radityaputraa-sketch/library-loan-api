import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[config] SUPABASE_URL / SUPABASE_KEY belum di-set. Cek file .env atau Environment Variables Vercel.");
}

export const supabase = createClient(supabaseUrl ?? "http://localhost", supabaseKey ?? "missing-key", {
  auth: { persistSession: false },
});
