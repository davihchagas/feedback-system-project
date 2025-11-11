// backend/src/routes/produtoRoutes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  listarProdutos,
  criarProduto
} from "../controllers/produtoController.js";

const router = Router();

// Todos os perfis podem listar produtos
router.get(
  "/",
  checkAuth,
  checkRole(["ADMIN", "ANALISTA", "CLIENTE"]),
  listarProdutos
);

// Apenas ADMIN cadastra
router.post(
  "/",
  checkAuth,
  checkRole(["ADMIN"]),
  criarProduto
);

export default router;
