import express from "express";
import { LoanController } from "../controllers/loanController.js";
import { validateIdParam } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/", LoanController.getAll);
router.get("/:id", validateIdParam, LoanController.getById);
router.post("/", LoanController.create);
router.put("/:id", validateIdParam, LoanController.update);
router.delete("/:id", validateIdParam, LoanController.remove);

export default router;
