import { MemberModel } from "../models/memberModel.js";
import { HttpError, pick } from "../utils/httpError.js";

const FIELDS = ["name", "email", "phone", "address"];

export const MemberController = {
  async getAll(req, res) {
    res.json(await MemberModel.getAll({ search: req.query.search }));
  },

  async getById(req, res) {
    res.json(await MemberModel.getById(req.params.id));
  },

  async create(req, res) {
    const payload = pick(req.body, FIELDS);
    if (!payload.name?.trim()) throw new HttpError(400, "Field 'name' wajib diisi");
    res.status(201).json(await MemberModel.create(payload));
  },

  async update(req, res) {
    const payload = pick(req.body, FIELDS);
    if (Object.keys(payload).length === 0) throw new HttpError(400, `Tidak ada field yang diubah. Field yang diizinkan: ${FIELDS.join(", ")}`);
    res.json(await MemberModel.update(req.params.id, payload));
  },

  async remove(req, res) {
    await MemberModel.remove(req.params.id);
    res.json({ message: "Member deleted successfully" });
  },
};
