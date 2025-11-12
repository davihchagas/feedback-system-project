// backend/src/middlewares/logAcesso.js
import { getMongoDb } from "../config/mongo.js";

export async function logAcesso(req, res, next) {
  try {
    const mongoDb = getMongoDb();
   const doc = {
     when: new Date(),
     method: req.method,
     path: req.originalUrl,
     ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
     user: req.user
       ? { id_usuario: req.user.id_usuario, email: req.user.email, id_grupo: req.user.id_grupo }
       : null,
     query: req.query,
     body: sanitizeBody(req.body),
     ua: req.headers["user-agent"] || null,
   };
   await mongoDb.collection("logs_acesso").insertOne(doc);
  } catch (e) {
    // não bloquear requisição por falha de log
    console.error("Falha ao registrar log", e?.message);
  }
  next();
}

function sanitizeBody(body) {
  if (!body || typeof body !== "object") return null;
  const clone = { ...body };
  if ("senha" in clone) clone.senha = "***";
  if ("senha_hash" in clone) clone.senha_hash = "***";
  return Object.fromEntries(
    Object.entries(clone).slice(0, 30) // limitar tamanho
  );
}
