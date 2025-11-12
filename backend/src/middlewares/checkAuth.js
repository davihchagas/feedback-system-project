import jwt from "jsonwebtoken";

export function checkAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Token ausente." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id_usuario: payload.id_usuario,
      id_grupo: payload.id_grupo,
      email: payload.email,
    };
    next();
  } catch (err) {
    console.error("JWT inválido:", err.message);
    return res.status(401).json({ message: "Token inválido." });
  }
}
