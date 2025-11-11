// backend/src/middlewares/logAcesso.js
import { LogAcesso } from "../models/LogAcesso.js";

export async function logAcesso(req, res, next) {
  try {
    await LogAcesso.create({
      id_usuario: req.user?.id_usuario || "anonimo",
      rota: req.originalUrl,
      tipo_acao: req.method,
    });
  } catch (err) {
    console.error("Falha ao registrar log de acesso:", err.message);
  }
  next();
}
