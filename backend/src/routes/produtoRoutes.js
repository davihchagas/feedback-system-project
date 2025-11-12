// backend/src/routes/produtoRoutes.js
import { Router } from "express";
import { checkAuth } from "../middlewares/checkAuth.js";
import { checkRole } from "../middlewares/checkRole.js";
import {
  listarProdutos,
  criarProduto,
  inativarProduto,
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
router.post("/", checkAuth, checkRole(["ADMIN"]), criarProduto);

router.patch("/:id/inativar", checkRole(["ADMIN"]), inativarProduto);

export default router;
