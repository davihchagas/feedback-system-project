import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  criarFeedback,
  obterFeedbackTexto,
  listarFeedbacksDetalhados,   // precisa existir no controller
  responderFeedback,
  listarFeedbacksDoCliente,
  listarRespostasDoCliente,
} from "../controllers/feedbackController.js";

const router = Router();

// todas as rotas abaixo exigem token
router.use(checkAuth);

// CLIENTE
router.post("/", checkRole(["CLIENTE"]), criarFeedback);
router.get("/me", checkRole(["CLIENTE"]), listarFeedbacksDoCliente);
router.get("/me/respostas", checkRole(["CLIENTE"]), listarRespostasDoCliente);

// ANALISTA/ADMIN
router.get("/detalhados", checkRole(["ANALISTA", "ADMIN"]), listarFeedbacksDetalhados);
router.get("/:id_feedback/texto", checkRole(["ANALISTA", "ADMIN"]), obterFeedbackTexto);

// ANALISTA
router.post("/:id/respostas", checkRole(["ANALISTA"]), responderFeedback);

export default router;
