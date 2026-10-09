import { supabase } from "../config/supabaseClient.js";

const TABLE = "books";

export const BookModel = {
  async getAll({ search, author, available } = {}) {
    let query = supabase.from(TABLE).select("*").order("title", { ascending: true });
    if (search) query = query.ilike("title", `%${search}%`);
    if (author) query = query.ilike("author", `%${author}%`);
    if (available === "true") query = query.gt("stock", 0);
    if (available === "false") query = query.eq("stock", 0);
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

  async adjustStock(id, delta) {
    const book = await this.getById(id);
    return this.update(id, { stock: Math.max(0, book.stock + delta) });
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};
