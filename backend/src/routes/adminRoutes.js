// backend/src/routes/adminRoutes.js
import { Router } from "express";
import { checkRole } from "../middlewares/checkRole.js";
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  desativarUsuario,
  listarClientes,
  listarAnalistas,
  listarFeedbacksAdmin,
  listarLogsAuditoria,
  listarLogsHuman, 
} from "../controllers/adminController.js";

const router = Router();

// apenas ADMIN
router.use(checkRole(["ADMIN"]));

// Usuários (qualquer grupo)
router.get("/usuarios", listarUsuarios);
router.post("/usuarios", criarUsuario);
router.patch("/usuarios/:id", atualizarUsuario);
router.delete("/usuarios/:id", desativarUsuario);

// Clientes e Analistas (atalhos)
router.get("/clientes", listarClientes);
router.get("/analistas", listarAnalistas);

// Feedbacks (somente leitura)
router.get("/feedbacks", listarFeedbacksAdmin);

// Logs (MongoDB)
router.get("/logs", listarLogsAuditoria);
router.get("/logs/human", listarLogsHuman); 

export default router;
