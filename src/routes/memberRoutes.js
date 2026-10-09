import express from "express";
import { MemberController } from "../controllers/memberController.js";
import { validateIdParam } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/", MemberController.getAll);
router.get("/:id", validateIdParam, MemberController.getById);
router.post("/", MemberController.create);
router.put("/:id", validateIdParam, MemberController.update);
router.delete("/:id", validateIdParam, MemberController.remove);

export default router;
