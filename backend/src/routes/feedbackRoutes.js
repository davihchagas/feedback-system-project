import { Router } from "express";
import { checkRole } from "../middlewares/checkRole.js";
import {
  criarFeedback,
  obterFeedbackTexto,
  listarFeedbacksDetalhados,
  responderFeedback,
} from "../controllers/feedbackController.js";

const router = Router();

/**
 * CLIENTE cria feedback
 */
router.post("/", checkRole(["CLIENTE"]), criarFeedback);

/**
 * ANALISTA/ADMIN lista feedbacks detalhados pela view + filtros
 * Ex.: GET /api/feedbacks/detalhados?id_produto=PRD-...&data_inicio=2025-11-01&data_fim=2025-11-30
 */
router.get("/detalhados", checkRole(["ANALISTA", "ADMIN"]), listarFeedbacksDetalhados);

/**
 * Comentário completo em MongoDB
 */
router.get("/:id_feedback/texto", checkRole(["ANALISTA", "ADMIN"]), obterFeedbackTexto);

/**
 * ANALISTA responde um feedback
 */
router.post("/:id/respostas", checkRole(["ANALISTA"]), responderFeedback);

export default router;
