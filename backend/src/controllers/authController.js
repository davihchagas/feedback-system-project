import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mysqlPool } from "../config/mysql.js";

export async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM usuarios WHERE email = ? AND ativo = 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaOk) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_grupo: usuario.id_grupo
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        id_grupo: usuario.id_grupo
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro interno" });
  }
}
