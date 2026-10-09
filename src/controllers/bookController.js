import { BookModel } from "../models/bookModel.js";
import { HttpError, pick } from "../utils/httpError.js";

const FIELDS = ["isbn", "title", "author", "publisher", "year", "stock"];

const validateNumbers = (p) => {
  if (p.stock !== undefined && (!Number.isInteger(p.stock) || p.stock < 0)) {
    throw new HttpError(400, "Field 'stock' harus bilangan bulat >= 0");
  }
  if (p.year !== undefined && !Number.isInteger(p.year)) {
    throw new HttpError(400, "Field 'year' harus bilangan bulat");
  }
};

export const BookController = {
  async getAll(req, res) {
    const { search, author, available } = req.query;
    res.json(await BookModel.getAll({ search, author, available }));
  },

  async getById(req, res) {
    res.json(await BookModel.getById(req.params.id));
  },

  async create(req, res) {
    const payload = pick(req.body, FIELDS);
    if (!payload.title?.trim() || !payload.author?.trim()) {
      throw new HttpError(400, "Field 'title' dan 'author' wajib diisi");
    }
    validateNumbers(payload);
    res.status(201).json(await BookModel.create(payload));
  },

  async update(req, res) {
    const payload = pick(req.body, FIELDS);
    if (Object.keys(payload).length === 0) throw new HttpError(400, `Tidak ada field yang diubah. Field yang diizinkan: ${FIELDS.join(", ")}`);
    validateNumbers(payload);
    res.json(await BookModel.update(req.params.id, payload));
  },

  async remove(req, res) {
    await BookModel.remove(req.params.id);
    res.json({ message: "Book deleted successfully" });
  },
};
