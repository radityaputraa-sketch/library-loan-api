import { LoanModel } from "../models/loanModel.js";
import { BookModel } from "../models/bookModel.js";
import { HttpError, isDate, isUuid, pick, today } from "../utils/httpError.js";

export const LOAN_STATUSES = ["Dipinjam", "Dikembalikan", "Terlambat"];
const SORTABLE = ["loan_date", "due_date", "return_date", "created_at"];
const DEFAULT_LOAN_DAYS = 7;

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const isReturned = (status) => status === "Dikembalikan";

const assertDates = (p) => {
  for (const key of ["loan_date", "due_date", "return_date"]) {
    if (p[key] !== undefined && p[key] !== null && !isDate(p[key])) {
      throw new HttpError(400, `Field '${key}' harus berformat YYYY-MM-DD`);
    }
  }
};

const assertStatus = (status) => {
  if (status !== undefined && !LOAN_STATUSES.includes(status)) {
    throw new HttpError(400, `Status tidak valid. Gunakan salah satu: ${LOAN_STATUSES.join(", ")}`);
  }
};

export const LoanController = {
  /** GET /api/loans?status=Terlambat&member_id=..&book_id=..&from=..&to=..&sort=..&order=asc|desc */
  async getAll(req, res) {
    const { status, member_id, book_id, from, to, sort, order } = req.query;

    assertStatus(status);
    if (member_id && !isUuid(member_id)) throw new HttpError(400, "Query 'member_id' harus UUID");
    if (book_id && !isUuid(book_id)) throw new HttpError(400, "Query 'book_id' harus UUID");
    if ((from && !isDate(from)) || (to && !isDate(to))) throw new HttpError(400, "Query 'from'/'to' harus berformat YYYY-MM-DD");
    if (sort && !SORTABLE.includes(sort)) throw new HttpError(400, `Query 'sort' harus salah satu: ${SORTABLE.join(", ")}`);
    if (order && !["asc", "desc"].includes(order)) throw new HttpError(400, "Query 'order' harus 'asc' atau 'desc'");

    await LoanModel.syncOverdue();
    const data = await LoanModel.getAll({ status, member_id, book_id, from, to, sort, order });
    res.json({ count: data.length, filters: { status, member_id, book_id, from, to }, data });
  },

  async getById(req, res) {
    await LoanModel.syncOverdue();
    res.json(await LoanModel.getById(req.params.id));
  },

  /** POST /api/loans — anggota meminjam buku; stok buku berkurang 1. */
  async create(req, res) {
    const payload = pick(req.body, ["member_id", "book_id", "loan_date", "due_date", "notes"]);

    if (!isUuid(payload.member_id) || !isUuid(payload.book_id)) {
      throw new HttpError(400, "Field 'member_id' dan 'book_id' wajib diisi dengan UUID yang valid");
    }
    assertDates(payload);

    payload.loan_date ??= today();
    payload.due_date ??= addDays(payload.loan_date, DEFAULT_LOAN_DAYS);
    if (payload.due_date < payload.loan_date) throw new HttpError(400, "'due_date' tidak boleh sebelum 'loan_date'");
    payload.status = payload.due_date < today() ? "Terlambat" : "Dipinjam";

    const book = await BookModel.getById(payload.book_id);
    if (book.stock <= 0) throw new HttpError(409, `Stok buku "${book.title}" sedang habis`);

    const loan = await LoanModel.create(payload);
    await BookModel.adjustStock(payload.book_id, -1);
    res.status(201).json(loan);
  },

  /** PUT /api/loans/:id — ubah data / proses pengembalian buku. */
  async update(req, res) {
    const payload = pick(req.body, ["due_date", "return_date", "status", "notes"]);
    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, "Tidak ada field yang diubah. Field yang diizinkan: due_date, return_date, status, notes");
    }
    assertDates(payload);
    assertStatus(payload.status);

    const current = await LoanModel.getById(req.params.id);

    // Aturan pengembalian: isi return_date => status Dikembalikan, dan sebaliknya.
    if (payload.return_date && payload.status === undefined) payload.status = "Dikembalikan";
    if (payload.status === "Dikembalikan" && !payload.return_date && !current.return_date) payload.return_date = today();
    if (payload.status && !isReturned(payload.status)) payload.return_date = null;
    if (payload.return_date && payload.return_date < current.loan_date) {
      throw new HttpError(400, "'return_date' tidak boleh sebelum 'loan_date'");
    }

    // Jika due_date diperpanjang & belum dikembalikan, hitung ulang status.
    const nextStatus = payload.status ?? current.status;
    if (!isReturned(nextStatus)) {
      const due = payload.due_date ?? current.due_date;
      payload.status = due < today() ? "Terlambat" : "Dipinjam";
    }

    const updated = await LoanModel.update(req.params.id, payload);

    // Sinkronkan stok buku ketika status berpindah ke/dari "Dikembalikan".
    const wasReturned = isReturned(current.status);
    const nowReturned = isReturned(updated.status);
    if (!wasReturned && nowReturned) await BookModel.adjustStock(current.book_id, +1);
    if (wasReturned && !nowReturned) await BookModel.adjustStock(current.book_id, -1);

    res.json(updated);
  },

  /** DELETE /api/loans/:id — jika buku belum dikembalikan, stok dipulihkan. */
  async remove(req, res) {
    const current = await LoanModel.getById(req.params.id);
    await LoanModel.remove(req.params.id);
    if (!isReturned(current.status)) await BookModel.adjustStock(current.book_id, +1);
    res.json({ message: "Loan deleted successfully" });
  },
};
