// backend/src/controllers/feedbackController.js
import { mysqlPool } from "../config/mysql.js";
import { FeedbackTexto } from "../models/FeedbackTexto.js";

export async function criarFeedback(req, res) {
  const {
    id_cliente,
    id_produto,
    nota,
    comentario_curto,
    comentario_completo,
    tags
  } = req.body;

  try {
    // chama a procedure que gera o ID e grava no MySQL
    const [resultSets] = await mysqlPool.query(
      "CALL sp_inserir_feedback(?, ?, ?, ?)",
      [id_cliente, id_produto, nota, comentario_curto]
    );

    // mysql2 com CALL retorna um array de arrays
    const id_feedback =
      resultSets[0]?.id_feedback || resultSets[0]?.[0]?.id_feedback;

    await FeedbackTexto.create({
      id_feedback,
      comentario_completo,
      tags
    });

    res.status(201).json({ id_feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar feedback" });
  }
}

export async function listarFeedbacksDetalhados(req, res) {
  const { id_produto, data_inicio, data_fim } = req.query;

  try {
    let sql = "SELECT * FROM vw_feedbacks_detalhados WHERE 1=1";
    const params = [];

    if (id_produto) {
      sql += " AND id_produto = ?";
      params.push(id_produto);
    }

    if (data_inicio && data_fim) {
      sql += " AND data_feedback BETWEEN ? AND ?";
      params.push(data_inicio, data_fim);
    }

    const [rows] = await mysqlPool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar feedbacks" });
  }
}
