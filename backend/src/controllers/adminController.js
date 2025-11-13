// backend/src/controllers/adminController.js
import bcrypt from "bcrypt";
import { mysqlPool } from "../config/mysql.js";
import { getMongoDb } from "../config/mongo.js";
import { gerarIdUsuario, gerarIdCliente } from "../utils/gerarIds.js";
import { logAction, humanizeLog } from "../utils/audit.js";

// -------- Usuários --------

export async function listarUsuarios(req, res) {
  const { grupo } = req.query; // ADMIN | ANALISTA | CLIENTE | vazio = todos
  const where = [];
  const params = [];
  if (grupo) {
    where.push("u.id_grupo = ?");
    params.push(grupo);
  }

  const sql = `
    SELECT u.id_usuario, u.nome, u.email, u.ativo, u.id_grupo,
           c.id_cliente, c.documento
    FROM usuarios u
    LEFT JOIN clientes c ON c.id_usuario = u.id_usuario
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY u.nome ASC
  `;
  const [rows] = await mysqlPool.query(sql, params);
  res.json(rows);
}

export async function criarUsuario(req, res) {
  const { nome, email, senha, id_grupo, documento } = req.body;
  if (!nome || !email || !senha || !id_grupo) {
    return res.status(400).json({ message: "Dados obrigatórios ausentes." });
  }

  const id_usuario = gerarIdUsuario();
  const senha_hash = await bcrypt.hash(String(senha), 10);

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "INSERT INTO usuarios (id_usuario, nome, email, senha_hash, ativo, id_grupo) VALUES (?, ?, ?, ?, 1, ?)",
      [id_usuario, nome, email, senha_hash, id_grupo]
    );

    if (id_grupo === "CLIENTE") {
      const id_cliente = gerarIdCliente();
      await conn.query(
        "INSERT INTO clientes (id_cliente, id_usuario, nome, documento) VALUES (?, ?, ?, ?)",
        [id_cliente, id_usuario, nome, documento || null]
      );
    }

    await conn.commit();

    // Log da ação somente após sucesso
    await logAction({
      action: "ADMIN_USUARIO_CRIADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "usuario", id: id_usuario },
      context: {
        id_usuario_alvo: id_usuario,
        nome_usuario: nome,
        grupo_alvo: id_grupo,
        email_alvo: email,
      },
      path: req.originalUrl,
      method: req.method,
    });

    res.status(201).json({ id_usuario });
  } catch (e) {
    await conn.rollback();
    console.error("Falha ao criar usuário:", e);
    res.status(500).json({ message: "Erro ao criar usuário." });
  } finally {
    conn.release();
  }
}

export async function atualizarUsuario(req, res) {
  const { id } = req.params;
  const { nome, email, id_grupo, documento, ativo } = req.body;

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    // Dados atuais para compor contexto do log
    const [antesRows] = await conn.query(
      "SELECT id_usuario, nome, email, id_grupo, ativo FROM usuarios WHERE id_usuario = ?",
      [id]
    );

    await conn.query(
      "UPDATE usuarios SET nome = COALESCE(?, nome), email = COALESCE(?, email), id_grupo = COALESCE(?, id_grupo), ativo = COALESCE(?, ativo) WHERE id_usuario = ?",
      [nome ?? null, email ?? null, id_grupo ?? null, ativo ?? null, id]
    );

    // Se for cliente, manter registro em clientes sincronizado
    if (id_grupo === "CLIENTE" || documento) {
      const [rows] = await conn.query(
        "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
        [id]
      );
      if (rows.length) {
        await conn.query(
          "UPDATE clientes SET nome = COALESCE(?, nome), documento = COALESCE(?, documento) WHERE id_usuario = ?",
          [nome ?? null, documento ?? null, id]
        );
      }
    }

    await conn.commit();

    // Log da atualização
    await logAction({
      action: "ADMIN_USUARIO_ATUALIZADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "usuario", id },
      context: {
        antes: antesRows?.[0] ?? null,
        depois: { nome, email, id_grupo, documento, ativo },
      },
      path: req.originalUrl,
      method: req.method,
    });

    res.json({ updated: true });
  } catch (e) {
    await conn.rollback();
    console.error("Falha ao atualizar usuário:", e);
    res.status(500).json({ message: "Erro ao atualizar usuário." });
  } finally {
    conn.release();
  }
}

export async function desativarUsuario(req, res) {
  const { id } = req.params;
  try {
    const [result] = await mysqlPool.query(
      "UPDATE usuarios SET ativo = 0 WHERE id_usuario = ?",
      [id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Log da desativação
    await logAction({
      action: "ADMIN_USUARIO_DESATIVADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "usuario", id },
      context: { id_usuario_alvo: id },
      path: req.originalUrl,
      method: req.method,
    });

    res.json({ disabled: true });
  } catch (e) {
    console.error("Falha ao desativar usuário:", e);
    res.status(500).json({ message: "Erro ao desativar usuário." });
  }
}

// -------- Clientes e Analistas (atalhos de listagem) --------

export async function listarClientes(_req, res) {
  const [rows] = await mysqlPool.query(
    `SELECT u.id_usuario, u.nome, u.email, u.ativo, c.id_cliente, c.documento
     FROM usuarios u
     JOIN clientes c ON c.id_usuario = u.id_usuario
     WHERE u.id_grupo = 'CLIENTE'
     ORDER BY u.nome ASC`
  );
  res.json(rows);
}

export async function listarAnalistas(_req, res) {
  const [rows] = await mysqlPool.query(
    `SELECT id_usuario, nome, email, ativo
     FROM usuarios
     WHERE id_grupo = 'ANALISTA'
     ORDER BY nome ASC`
  );
  res.json(rows);
}

// -------- Feedbacks (somente leitura) --------

export async function listarFeedbacksAdmin(req, res) {
  const { id_produto, id_cliente } = req.query;
  const where = [];
  const params = [];
  if (id_produto) {
    where.push("f.id_produto = ?");
    params.push(id_produto);
  }
  if (id_cliente) {
    where.push("f.id_cliente = ?");
    params.push(id_cliente);
  }

  const sql = `
    SELECT
      f.id_feedback, f.id_produto, p.nome_produto,
      f.id_cliente, c.nome AS nome_cliente,
      f.nota, f.comentario_curto, f.data_feedback
    FROM feedbacks f
    JOIN produtos p ON p.id_produto = f.id_produto
    JOIN clientes c ON c.id_cliente = f.id_cliente
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY f.data_feedback DESC
  `;
  const [rows] = await mysqlPool.query(sql, params);
  res.json(rows);
}

// -------- Logs (MongoDB) --------

// versão “bruta” (para tabelas paginadas/diagnóstico)
export async function listarLogsAuditoria(req, res) {
  try {
    const db = getMongoDb();
    const { page = 1, limit = 20, id_usuario, path, action } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const q = {};
    if (id_usuario) q["actor.id_usuario"] = id_usuario; // << padronizado
    if (path) q.path = path;
    if (action) q.action = action;

    const cursor = db
      .collection("logs_acesso")
      .find(q)
      .sort({ when: -1 })
      .skip(skip)
      .limit(Number(limit));

    const docs = await cursor.toArray();
    const total = await db.collection("logs_acesso").countDocuments(q);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      data: docs,
    });
  } catch (e) {
    console.error("Falha ao listar logs:", e);
    res.status(500).json({ message: "Erro ao listar logs." });
  }
}

// versão “humanizada” (frases amigáveis)
export async function listarLogsHuman(req, res) {
  try {
    const db = getMongoDb();
    const {
      page = 1,
      limit = 20,
      role,     // ADMIN | ANALISTA | CLIENTE (opcional)
      action,   // ex.: ANALISTA_RESPOSTA_CRIADA
      dt_ini,   // yyyy-mm-dd(THH:mm opcional)
      dt_fim,
      id_usuario, // opcional
    } = req.query;

    // conjunto padrão de ações relevantes
    const allow = [
      "CLIENTE_FEEDBACK_CRIADO",
      "ANALISTA_RESPOSTA_CRIADA",
      "ADMIN_PRODUTO_CRIADO",
      "ADMIN_PRODUTO_INATIVADO",
      "ADMIN_USUARIO_CRIADO",
      "ADMIN_USUARIO_ATUALIZADO",
      "ADMIN_USUARIO_DESATIVADO",
    ];

    const q = {};
    if (req.query.all !== "1") q.action = { $in: allow };
    if (role) q["actor.id_grupo"] = role.toUpperCase();
    if (action) q.action = action;
    if (id_usuario) q["actor.id_usuario"] = id_usuario;

    if (dt_ini || dt_fim) {
      q.when = {};
      if (dt_ini) q.when.$gte = new Date(dt_ini);
      if (dt_fim) q.when.$lte = new Date(dt_fim);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const cursor = db
      .collection("logs_acesso")
      .find(q)
      .sort({ when: -1 })
      .skip(skip)
      .limit(Number(limit));

    const docs = await cursor.toArray();
    const total = await db.collection("logs_acesso").countDocuments(q);

    const items = docs.map(humanizeLog);
    return res.json({ page: Number(page), limit: Number(limit), total, items });
  } catch (e) {
    console.error("Falha ao listar logs humanizados:", e);
    return res.status(500).json({ message: "Erro ao listar logs." });
  }
}
