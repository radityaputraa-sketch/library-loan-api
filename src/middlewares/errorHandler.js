import { HttpError, isUuid } from "../utils/httpError.js";

/** Validasi parameter :id berupa UUID sebelum menyentuh database. */
export const validateIdParam = (req, res, next) => {
  if (!isUuid(req.params.id)) {
    return next(new HttpError(400, "Parameter id harus berupa UUID yang valid"));
  }
  next();
};

export const notFound = (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
};

/** Memetakan error Supabase/PostgreSQL ke status HTTP yang tepat. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Body JSON tidak valid" });
  }

  const map = {
    PGRST116: [404, "Data tidak ditemukan"],
    23505: [409, "Data duplikat (nilai unik sudah dipakai)"],
    23503: [400, "Relasi tidak valid: data referensi tidak ada atau masih dipakai"],
    23514: [400, "Data melanggar aturan (check constraint)"],
    "22P02": [400, "Format data tidak valid"],
    23502: [400, "Field wajib tidak boleh kosong"],
  };

  const hit = map[err?.code];
  if (hit) return res.status(hit[0]).json({ error: hit[1], details: err.message });

  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server" });
};
