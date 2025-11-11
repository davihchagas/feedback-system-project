// backend/src/middlewares/checkRole.js
export function checkRole(rolesPermitidos = []) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.id_grupo)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };
}
