import { supabase } from "../config/supabaseClient.js";
import { today } from "../utils/httpError.js";

const TABLE = "loans";

// Join ke tabel members & books (lewat foreign key) agar response informatif.
const SELECT_WITH_RELATIONS = `
  id, loan_date, due_date, return_date, status, notes, created_at,
  member_id, book_id,
  member:members ( id, name, email, phone ),
  book:books ( id, isbn, title, author )
`;

export const LoanModel = {
  /**
   * Tandai otomatis pinjaman yang lewat jatuh tempo menjadi "Terlambat".
   * Dipanggil sebelum operasi baca sehingga status selalu up-to-date.
   */
  async syncOverdue() {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: "Terlambat" })
      .eq("status", "Dipinjam")
      .lt("due_date", today());
    if (error) throw error;
  },

  async getAll(filters = {}) {
    const { status, member_id, book_id, from, to, sort = "loan_date", order = "desc" } = filters;

    let query = supabase.from(TABLE).select(SELECT_WITH_RELATIONS);
    if (status) query = query.eq("status", status);
    if (member_id) query = query.eq("member_id", member_id);
    if (book_id) query = query.eq("book_id", book_id);
    if (from) query = query.gte("loan_date", from);
    if (to) query = query.lte("loan_date", to);
    query = query.order(sort, { ascending: order === "asc" });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase.from(TABLE).select(SELECT_WITH_RELATIONS).eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select(SELECT_WITH_RELATIONS).single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select(SELECT_WITH_RELATIONS)
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};
