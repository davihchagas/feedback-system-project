// backend/src/controllers/produtoController.js
import { mysqlPool } from "../config/mysql.js";
import { gerarIdProduto } from "../utils/gerarIds.js";
import { logAction } from "../utils/audit.js";

/**
 * Lista todos os produtos, ativos e inativos.
 */
export async function listarProdutos(req, res) {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT id_produto, nome_produto, categoria, ativo FROM produtos ORDER BY nome_produto ASC"
    );
    res.json(rows);
  } catch (e) {
    console.error("Erro ao listar produtos:", e);
    res.status(500).json({ message: "Erro ao listar produtos." });
  }
}

/**
 * Cria um novo produto (ADMIN).
 */
export async function criarProduto(req, res) {
  const { nome_produto, categoria } = req.body;
  if (!nome_produto) {
    return res.status(400).json({ message: "nome_produto é obrigatório." });
  }

  const id_produto = gerarIdProduto();

  try {
    await mysqlPool.query(
      "INSERT INTO produtos (id_produto, nome_produto, categoria, ativo) VALUES (?, ?, ?, 1)",
      [id_produto, nome_produto, categoria || null]
    );

    // log da criação
    await logAction({
      action: "ADMIN_PRODUTO_CRIADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "produto", id: id_produto },
      context: {
        id_produto,
        nome_produto,
        categoria: categoria || null,
      },
    });

    res.status(201).json({ id_produto });
  } catch (e) {
    console.error("Erro ao criar produto:", e);
    res.status(500).json({ message: "Erro ao criar produto." });
  }
}

/**
 * Inativa um produto (ativo = 0).
 */
export async function inativarProduto(req, res) {
  const { id } = req.params;

  try {
    // busca estado atual para validar e para log
    const [antesRows] = await mysqlPool.query(
      "SELECT id_produto, nome_produto, ativo FROM produtos WHERE id_produto = ?",
      [id]
    );

    if (!antesRows.length) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const produtoAntes = antesRows[0];

    if (produtoAntes.ativo === 0) {
      // já inativo, nada para fazer
      return res.status(200).json({ alreadyInactive: true });
    }

    await mysqlPool.query(
      "UPDATE produtos SET ativo = 0 WHERE id_produto = ?",
      [id]
    );

    // log da inativação
    await logAction({
      action: "ADMIN_PRODUTO_INATIVADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "produto", id },
      context: {
        id_produto: id,
        nome_produto: produtoAntes.nome_produto,
        ativo_antes: produtoAntes.ativo,
        ativo_depois: 0,
      },
    });

    res.json({ inativado: true });
  } catch (e) {
    console.error("Erro ao inativar produto:", e);
    res.status(500).json({ message: "Erro ao inativar produto." });
  }
}

/**
 * Reativa um produto (ativo = 1).
 * Se não quiser expor essa ação na interface, pode usar só para testes.
 */
export async function reativarProduto(req, res) {
  const { id } = req.params;

  try {
    const [antesRows] = await mysqlPool.query(
      "SELECT id_produto, nome_produto, ativo FROM produtos WHERE id_produto = ?",
      [id]
    );

    if (!antesRows.length) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const produtoAntes = antesRows[0];

    if (produtoAntes.ativo === 1) {
      return res.status(200).json({ alreadyActive: true });
    }

    await mysqlPool.query(
      "UPDATE produtos SET ativo = 1 WHERE id_produto = ?",
      [id]
    );

    // se quiser registrar essa ação:
    await logAction({
      action: "ADMIN_PRODUTO_REATIVADO",
      actor: {
        id_usuario: req.user.id_usuario,
        nome: req.user.nome,
        email: req.user.email,
        id_grupo: req.user.id_grupo,
      },
      entity: { type: "produto", id },
      context: {
        id_produto: id,
        nome_produto: produtoAntes.nome_produto,
        ativo_antes: produtoAntes.ativo,
        ativo_depois: 1,
      },
    });

    res.json({ reativado: true });
  } catch (e) {
    console.error("Erro ao reativar produto:", e);
    res.status(500).json({ message: "Erro ao reativar produto." });
  }
}
