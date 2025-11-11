// backend/src/routes/relatorioRoutes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  rankingProdutos,
  relatorioProduto
} from "../controllers/relatorioController.js";

const router = Router();

// Ranking geral
router.get(
  "/ranking-produtos",
  checkAuth,
  checkRole(["ANALISTA", "ADMIN"]),
  rankingProdutos
);

// Estatísticas por produto e período
router.get(
  "/produto/:id",
  checkAuth,
  checkRole(["ANALISTA", "ADMIN"]),
  relatorioProduto
);

export default router;
