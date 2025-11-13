import { mysqlPool } from "../config/mysql.js";
import { FeedbackTexto } from "../models/FeedbackTexto.js";
import { logAction } from "../utils/audit.js";

/**
 * POST /api/feedbacks
 * Cria feedback para o cliente autenticado (mapeia USR -> CLI)
 */
export async function listarFeedbacksDoCliente(req, res) {
  try {
    // 1) Ache o id_cliente pelo id_usuario do token
    const [cliRows] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [req.user.id_usuario]
    );
    if (cliRows.length === 0) {
      return res.json([]); // sem vínculo cliente→usuario
    }
    const id_cliente = cliRows[0].id_cliente;

    // 2) Liste os feedbacks desse cliente com nome do produto
    const [rows] = await mysqlPool.query(
      `SELECT f.id_feedback, f.id_produto, p.nome_produto,
              f.nota, f.comentario_curto, f.data_feedback
         FROM feedbacks f
         JOIN produtos p ON p.id_produto = f.id_produto
        WHERE f.id_cliente = ?
        ORDER BY f.data_feedback DESC`,
      [id_cliente]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao listar histórico do cliente" });
  }
}

/** Respostas de feedback dirigidas ao cliente logado */
export async function listarRespostasDoCliente(req, res) {
  try {
    // 1) id_cliente do usuário do token
    const [cliRows] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [req.user.id_usuario]
    );
    if (cliRows.length === 0) {
      return res.json([]);
    }
    const id_cliente = cliRows[0].id_cliente;

    // 2) Todas as respostas dos feedbacks desse cliente
    const [rows] = await mysqlPool.query(
      `SELECT r.id_resposta, r.id_feedback, r.texto_resposta, r.data_resposta,
              u.nome AS nome_analista, p.nome_produto, f.nota, f.comentario_curto
         FROM respostas_feedback r
         JOIN feedbacks f           ON f.id_feedback = r.id_feedback
         JOIN usuarios  u           ON u.id_usuario = r.id_usuario_analista
         JOIN produtos  p           ON p.id_produto  = f.id_produto
        WHERE f.id_cliente = ?
        ORDER BY r.data_resposta DESC`,
      [id_cliente]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao listar respostas do cliente" });
  }
}

export async function criarFeedback(req, res) {
  try {
    const { id_cliente, id_produto, nota, comentario_curto, comentario_completo, tags = [] } = req.body;

    // 1) MySQL: insere feedback e captura o ID gerado pela SP
    const [resultSets] = await mysqlPool.query(
      "CALL sp_inserir_feedback(?,?,?,?)",
      [id_cliente, id_produto, Number(nota), comentario_curto]
    );
    // mysql2 para CALL retorna: [ [rows], [fields], ... ]
    const newId = resultSets?.[0]?.[0]?.id_feedback;

    if (!newId) {
      return res.status(500).json({ message: "Falha ao gerar id_feedback." });
    }

    // 2) MongoDB: texto completo
    const db = getMongoDb();
    await db.collection("feedbacktextos").updateOne(
      { id_feedback: newId },
      {
        $set: {
          id_feedback: newId,
          comentario_completo: comentario_completo || null,
          tags: Array.isArray(tags) ? tags : [],
          criado_em: new Date(),
        },
      },
      { upsert: true }
    );

    // 3) Audit: CLIENTE_FEEDBACK_CRIADO
    await logAction({
      action: "CLIENTE_FEEDBACK_CRIADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "feedback", id: newId },
      context: { id_produto },
    });

    return res.status(201).json({ id_feedback: newId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao criar feedback." });
  }
}

/**
 * GET /api/feedbacks/texto/:id_feedback
 * Busca comentário completo no MongoDB
 */
export async function obterFeedbackTexto(req, res) {
  try {
    const { id_feedback } = req.params;
    const doc = await FeedbackTexto.findOne({ id_feedback }).lean();
    if (!doc) return res.status(404).json({ message: "Texto não encontrado." });
    return res.json(doc);
  } catch (err) {
    console.error("Falha ao obter texto:", err);
    return res
      .status(500)
      .json({ message: "Erro ao buscar texto do feedback." });
  }
}

/**
 * GET /api/feedbacks/detalhados
 * Lista feedbacks detalhados usando a view vw_feedbacks_detalhados, com filtros opcionais
 * Filtros via query: id_produto, data_inicio (YYYY-MM-DD), data_fim (YYYY-MM-DD), nota_min, nota_max
 */
export async function listarFeedbacksDetalhados(req, res) {
  const { id_produto, data_inicio, data_fim, nota_min, nota_max } = req.query;

  const where = [];
  const params = [];

  if (id_produto) {
    where.push("id_produto = ?");
    params.push(id_produto);
  }
  if (data_inicio) {
    where.push("DATE(data_feedback) >= ?");
    params.push(data_inicio);
  }
  if (data_fim) {
    where.push("DATE(data_feedback) <= ?");
    params.push(data_fim);
  }
  if (nota_min) {
    where.push("nota >= ?");
    params.push(Number(nota_min));
  }
  if (nota_max) {
    where.push("nota <= ?");
    params.push(Number(nota_max));
  }

  const sql = `
    SELECT * FROM vw_feedbacks_detalhados
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY data_feedback DESC
  `;

  const [rows] = await mysqlPool.query(sql, params);
  return res.json(rows);
}

/**
 * POST /api/feedbacks/:id/respostas
 * Responde um feedback (analista)
 */
export async function responderFeedback(req, res) {
  try {
    const { id } = req.params; // id_feedback
    const { texto_resposta } = req.body;

    await mysqlPool.query(
      "INSERT INTO respostas_feedback (id_feedback, id_usuario_analista, texto_resposta, data_resposta) VALUES (?,?,?,NOW())",
      [id, req.user.id_usuario, texto_resposta]
    );

    // Audit: ANALISTA_FEEDBACK_RESPONDIDO
    await logAction({
      action: "ANALISTA_FEEDBACK_RESPONDIDO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "feedback", id },
    });

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao responder feedback." });
  }
}

// Lista somente os feedbacks do usuário autenticado (CLIENTE)
export async function listarMeusFeedbacks(req, res) {
  try {
    const idUsuario = req.user?.id_usuario;

    // Resolve o id_cliente vinculado ao usuário
    const [rowsCliente] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1",
      [idUsuario]
    );
    if (!rowsCliente.length) {
      return res.json([]); // sem vínculo -> lista vazia
    }
    const idCliente = rowsCliente[0].id_cliente;

    // Busca direto nas tabelas (sem depender da view)
    const [rows] = await mysqlPool.query(
      `
      SELECT
        f.id_feedback,
        f.id_produto,
        p.nome_produto,
        f.nota,
        fn_classificar_nota(f.nota) AS classificacao,
        f.comentario_curto,
        f.data_feedback
      FROM feedbacks f
      JOIN produtos p ON p.id_produto = f.id_produto
      WHERE f.id_cliente = ?
      ORDER BY f.data_feedback DESC
      `,
      [idCliente]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Falha ao listar meus feedbacks:", err);
    return res.status(500).json({ message: "Erro ao listar seus feedbacks." });
  }
}

// Lista respostas do analista para os feedbacks do cliente autenticado
export async function listarMinhasRespostas(req, res) {
  try {
    const idUsuario = req.user?.id_usuario;

    // descobrir id_cliente desse usuário
    const [rowsCli] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1",
      [idUsuario]
    );
    if (!rowsCli.length) return res.json([]);

    const idCliente = rowsCli[0].id_cliente;

    // respostas ligadas aos feedbacks desse cliente
    const [rows] = await mysqlPool.query(
      `
      SELECT
        r.id_resposta,
        r.id_feedback,
        r.texto_resposta,
        r.data_resposta,
        u.nome AS nome_analista,
        p.nome_produto,
        f.nota,
        f.comentario_curto
      FROM respostas_feedback r
      JOIN feedbacks f ON f.id_feedback = r.id_feedback
      JOIN usuarios u ON u.id_usuario = r.id_usuario_analista
      JOIN produtos p ON p.id_produto = f.id_produto
      WHERE f.id_cliente = ?
      ORDER BY r.data_resposta DESC
      `,
      [idCliente]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Falha ao listar minhas respostas:", err);
    return res.status(500).json({ message: "Erro ao listar respostas." });
  }
}

// ANALISTA vê apenas as próprias respostas; ADMIN vê todas.
export async function listarRespostasAnalista(req, res) {
  try {
    const { id_produto } = req.query;
    const ehAdmin = req.user?.id_grupo === "ADMIN";
    const idAnalista = req.user?.id_usuario;

    const where = [];
    const params = [];

    if (!ehAdmin) {
      where.push("r.id_usuario_analista = ?");
      params.push(idAnalista);
    }
    if (id_produto) {
      where.push("f.id_produto = ?");
      params.push(id_produto);
    }

    const sql = `
      SELECT
        r.id_resposta,
        r.id_feedback,
        r.texto_resposta,
        r.data_resposta,
        u.nome            AS nome_analista,
        c.nome            AS nome_cliente,
        p.nome_produto,
        f.nota,
        f.comentario_curto
      FROM respostas_feedback r
      JOIN feedbacks  f ON f.id_feedback = r.id_feedback
      JOIN usuarios   u ON u.id_usuario  = r.id_usuario_analista
      JOIN clientes   c ON c.id_cliente  = f.id_cliente
      JOIN produtos   p ON p.id_produto  = f.id_produto
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY r.data_resposta DESC
    `;

    const [rows] = await mysqlPool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("Falha ao listar respostas (analista):", err);
    return res.status(500).json({ message: "Erro ao listar respostas." });
  }
}
