// backend/src/routes/feedbackRoutes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  criarFeedback,
  listarFeedbacksDetalhados
} from "../controllers/feedbackController.js";

const router = Router();

// Cliente envia feedback
router.post(
  "/",
  checkAuth,
  checkRole(["CLIENTE"]),
  criarFeedback
);

// Analista e Admin consultam feedbacks detalhados
router.get(
  "/",
  checkAuth,
  checkRole(["ANALISTA", "ADMIN"]),
  listarFeedbacksDetalhados
);

export default router;
