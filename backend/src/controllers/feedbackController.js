// backend/src/controllers/feedbackController.js
import { mysqlPool } from "../config/mysql.js";
import { getMongoDb } from "../config/mongo.js";
import { logAction } from "../utils/audit.js";
import { gerarIdCliente } from "../utils/gerarIds.js";

/** =========================
 *  CRIAR FEEDBACK (CLIENTE)
 *  ========================= */
export async function criarFeedback(req, res) {
  try {
    // garante id_cliente do usuário logado (cria se faltar)
    let id_cliente;
    const [cliRows] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [req.user.id_usuario]
    );
    if (cliRows.length > 0) {
      id_cliente = cliRows[0].id_cliente;
    } else {
      id_cliente = gerarIdCliente();
      await mysqlPool.query(
        "INSERT INTO clientes (id_cliente, id_usuario, nome, documento) VALUES (?,?,?,NULL)",
        [id_cliente, req.user.id_usuario, req.user.nome || "Cliente"]
      );
    }

    const { id_produto, nota, comentario_curto, comentario_completo, tags = [] } = req.body || {};
    if (!id_produto) return res.status(400).json({ message: "id_produto é obrigatório." });
    if (!Number.isInteger(Number(nota)) || Number(nota) < 1 || Number(nota) > 5) {
      return res.status(400).json({ message: "nota deve estar entre 1 e 5." });
    }
    if (!comentario_curto?.trim()) {
      return res.status(400).json({ message: "comentario_curto é obrigatório." });
    }

    // produto válido e ativo
    const [prodRows] = await mysqlPool.query(
      "SELECT id_produto, nome_produto, ativo FROM produtos WHERE id_produto = ?",
      [id_produto]
    );
    if (prodRows.length === 0) return res.status(400).json({ message: "Produto inexistente." });
    if (prodRows[0].ativo !== 1) return res.status(400).json({ message: "Produto inativo." });

    // chama SP para inserir feedback e obter o id gerado
    const [resultSets] = await mysqlPool.query(
      "CALL sp_inserir_feedback(?,?,?,?)",
      [id_cliente, id_produto, Number(nota), String(comentario_curto)]
    );
    const newId = resultSets?.[0]?.[0]?.id_feedback;
    if (!newId) return res.status(500).json({ message: "Falha ao gerar ID do feedback." });

    // Mongo: texto longo
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

    // auditoria
    await logAction({
      action: "CLIENTE_FEEDBACK_CRIADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "feedback", id: newId },
      context: { id_produto, nome_produto: prodRows[0].nome_produto },
    });

    return res.status(201).json({ id_feedback: newId });
  } catch (e) {
    console.error("[criarFeedback] erro:", e);
    const msg = String(e?.sqlMessage || e?.message || "Erro interno");
    if (msg.toLowerCase().includes("foreign key")) {
      return res.status(400).json({ message: "Falha de integridade referencial.", detail: msg });
    }
    return res.status(500).json({ message: "Erro ao criar feedback.", detail: msg });
  }
}

/** =========================
 *  TEXTO COMPLETO (AN/AD)
 *  ========================= */
export async function obterFeedbackTexto(req, res) {
  try {
    const { id_feedback } = req.params;
    const db = getMongoDb();
    const doc = await db.collection("feedbacktextos").findOne({ id_feedback });
    if (!doc) return res.status(404).json({ message: "Texto não encontrado" });
    return res.json(doc);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao obter texto completo" });
  }
}

/** ======================================
 *  LISTA DETALHADA COM FILTROS (AN/AD)
 *  Fonte: view vw_feedbacks_detalhados
 *  ====================================== */
export async function listarFeedbacksDetalhados(req, res) {
  try {
    const { id_produto, data_inicio, data_fim, nota_min, nota_max } = req.query;

    const params = [];
    let where = "WHERE 1=1";

    if (id_produto) {
      where += " AND id_produto = ?";
      params.push(id_produto);
    }
    if (data_inicio) {
      where += " AND DATE(data_feedback) >= ?";
      params.push(data_inicio);
    }
    if (data_fim) {
      where += " AND DATE(data_feedback) <= ?";
      params.push(data_fim);
    }
    if (nota_min) {
      where += " AND nota >= ?";
      params.push(Number(nota_min));
    }
    if (nota_max) {
      where += " AND nota <= ?";
      params.push(Number(nota_max));
    }

    const [rows] = await mysqlPool.query(
      `SELECT id_feedback, nome_cliente, id_produto, nome_produto,
              nota, classificacao, comentario_curto, data_feedback
         FROM vw_feedbacks_detalhados
        ${where}
        ORDER BY data_feedback DESC`,
      params
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao listar feedbacks detalhados" });
  }
}

/** =========================
 *  HISTÓRICO DO CLIENTE
 *  ========================= */
export async function listarFeedbacksDoCliente(req, res) {
  try {
    const [cliRows] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [req.user.id_usuario]
    );
    if (cliRows.length === 0) return res.json([]);

    const id_cliente = cliRows[0].id_cliente;

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
    return res.status(500).json({ message: "Erro ao listar histórico" });
  }
}

/** =========================
 *  RESPOSTAS DO CLIENTE
 *  ========================= */
export async function listarRespostasDoCliente(req, res) {
  try {
    const [cliRows] = await mysqlPool.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [req.user.id_usuario]
    );
    if (cliRows.length === 0) return res.json([]);

    const id_cliente = cliRows[0].id_cliente;

    const [rows] = await mysqlPool.query(
      `SELECT r.id_resposta, r.id_feedback, r.texto_resposta, r.data_resposta,
              u.nome AS nome_analista, p.nome_produto, f.nota, f.comentario_curto
         FROM respostas_feedback r
         JOIN feedbacks f ON f.id_feedback = r.id_feedback
         JOIN usuarios u  ON u.id_usuario = r.id_usuario_analista
         JOIN produtos p  ON p.id_produto  = f.id_produto
        WHERE f.id_cliente = ?
        ORDER BY r.data_resposta DESC`,
      [id_cliente]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao listar respostas" });
  }
}

/** =========================
 *  RESPONDER (ANALISTA)
 *  ========================= */
export async function responderFeedback(req, res) {
  try {
    const { id } = req.params;
    const { texto_resposta } = req.body;
    if (!texto_resposta?.trim()) {
      return res.status(400).json({ message: "texto_resposta é obrigatório" });
    }

    // Confirma que o feedback existe (opcional, mas ajuda)
    const [fbkRows] = await mysqlPool.query(
      "SELECT f.id_feedback, f.id_cliente, c.id_usuario AS id_usuario_cliente, u.nome AS nome_cliente, p.nome_produto \
         FROM feedbacks f \
         JOIN clientes c ON c.id_cliente = f.id_cliente \
         JOIN usuarios u ON u.id_usuario = c.id_usuario \
         JOIN produtos p ON p.id_produto = f.id_produto \
        WHERE f.id_feedback = ?",
      [id]
    );
    if (fbkRows.length === 0) {
      return res.status(404).json({ message: "Feedback não encontrado" });
    }
    const alvo = fbkRows[0];

    await mysqlPool.query(
      `INSERT INTO respostas_feedback
         (id_feedback, id_usuario_analista, texto_resposta, data_resposta)
       VALUES (?,?,?,NOW())`,
      [id, req.user.id_usuario, texto_resposta]
    );

    // Auditoria — **com await**
    await logAction({
      action: "ANALISTA_RESPOSTA_CRIADA",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "feedback", id },
      context: {
        texto_resposta,
        cliente: { id_usuario: alvo.id_usuario_cliente, nome: alvo.nome_cliente },
        produto: alvo.nome_produto,
      },
      path: req.originalUrl,
      method: req.method,
    });

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro ao registrar resposta" });
  }
}
