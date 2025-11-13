import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { mysqlPool } from "../config/mysql.js";

export async function login(req, res) {
  const { email, senha } = req.body;

  const [rows] = await mysqlPool.query(
    "SELECT id_usuario, nome, email, senha_hash, id_grupo, ativo FROM usuarios WHERE email = ?",
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const u = rows[0];
  if (!u.ativo) {
    return res.status(403).json({ message: "Usuário inativo" });
  }

  const ok = await bcrypt.compare(senha, u.senha_hash);
  if (!ok) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const payload = {
    id_usuario: u.id_usuario,
    id_grupo: u.id_grupo,  // CLIENTE | ANALISTA | ADMIN
    nome: u.nome,
    email: u.email,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

  return res.json({ usuario: payload, token });
}
