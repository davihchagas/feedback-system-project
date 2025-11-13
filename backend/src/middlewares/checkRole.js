export function checkRole(rolesPermitidos = []) {
  return (req, res, next) => {
    const papel = req.user?.id_grupo; // vem do token decodificado
    if (!papel) return res.status(401).json({ message: "Não autenticado" });
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(papel)) {
      return res.status(403).json({
        message: "Acesso negado",
        esperado: rolesPermitidos,
        recebido: papel
      });
    }
    next();
  };
}
