// backend/src/middlewares/checkAuth.js
import jwt from "jsonwebtoken";

export function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token ausente" });
  }

  // Espera header no formato: "Bearer <token>"
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id_usuario, id_grupo }
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}
