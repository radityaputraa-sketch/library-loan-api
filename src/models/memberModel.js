import { supabase } from "../config/supabaseClient.js";

const TABLE = "members";

export const MemberModel = {
  async getAll({ search } = {}) {
    let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase.from(TABLE).update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};
