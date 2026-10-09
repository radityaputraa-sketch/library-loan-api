import express from "express";
import { BookController } from "../controllers/bookController.js";
import { validateIdParam } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/", BookController.getAll);
router.get("/:id", validateIdParam, BookController.getById);
router.post("/", BookController.create);
router.put("/:id", validateIdParam, BookController.update);
router.delete("/:id", validateIdParam, BookController.remove);

export default router;
