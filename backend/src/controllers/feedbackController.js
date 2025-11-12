import { mysqlPool } from "../config/mysql.js";
import { FeedbackTexto } from "../models/FeedbackTexto.js";

/**
 * POST /api/feedbacks
 * Cria feedback para o cliente autenticado (mapeia USR -> CLI)
 */
export async function criarFeedback(req, res) {
  try {
    const {
      id_produto,
      nota,
      comentario_curto,
      comentario_completo,
      tags = [],
      sentimento = null,
    } = req.body;

    const idUsuario = req.user?.id_usuario;
    const [rowsCliente] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ? LIMIT 1",
      [idUsuario]
    );
    if (!rowsCliente.length) {
      return res
        .status(400)
        .json({
          message: "Cliente não encontrado para o usuário autenticado.",
        });
    }
    const idCliente = rowsCliente[0].id_cliente;

    const [procResult] = await mysqlPool.query(
      "CALL sp_inserir_feedback(?, ?, ?, ?)",
      [idCliente, id_produto, nota, comentario_curto]
    );

    let idFeedbackGerado = null;
    try {
      idFeedbackGerado = procResult?.[0]?.[0]?.id_feedback || null;
    } catch (_) {
      idFeedbackGerado = null;
    }
    if (!idFeedbackGerado) {
      const [lastFb] = await mysqlPool.query(
        "SELECT id_feedback FROM feedbacks WHERE id_cliente = ? AND id_produto = ? ORDER BY data_feedback DESC LIMIT 1",
        [idCliente, id_produto]
      );
      if (lastFb.length) idFeedbackGerado = lastFb[0].id_feedback;
    }

    if (idFeedbackGerado && comentario_completo) {
      await FeedbackTexto.create({
        id_feedback: idFeedbackGerado,
        comentario_completo,
        tags,
        sentimento,
      });
    }

    return res
      .status(201)
      .json({ message: "Feedback registrado", id_feedback: idFeedbackGerado });
  } catch (err) {
    console.error("Falha ao criar feedback:", err);
    return res.status(500).json({ message: "Erro ao registrar feedback." });
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
    const { id } = req.params;
    const { texto_resposta } = req.body;
    const idUsuario = req.user?.id_usuario;

    await mysqlPool.query(
      "INSERT INTO respostas_feedback (id_feedback, id_usuario_analista, texto_resposta, data_resposta) VALUES (?, ?, ?, NOW())",
      [id, idUsuario, texto_resposta]
    );

    return res.status(201).json({ message: "Resposta registrada" });
  } catch (err) {
    console.error("Falha ao responder feedback:", err);
    return res.status(500).json({ message: "Erro ao registrar resposta." });
  }
}
