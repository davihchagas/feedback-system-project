import jwt from "jsonwebtoken";

export function checkAuth(req, res, next) {
  // libera preflight de CORS
  if (req.method === "OPTIONS") return res.sendStatus(204);

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token ausente" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload precisa ter id_usuario, id_grupo, nome, email
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido" });
  }
}
