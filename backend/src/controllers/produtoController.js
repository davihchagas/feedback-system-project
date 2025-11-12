// backend/src/controllers/produtoController.js
import { mysqlPool } from "../config/mysql.js";
import { gerarIdProduto } from "../utils/gerarIds.js";

// Listar produtos
export async function listarProdutos(req, res) {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM produtos WHERE ativo = 1 ORDER BY nome_produto ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ message: "Erro ao listar produtos." });
  }
}

// Criar produto
export async function criarProduto(req, res) {
  try {
    const { nome_produto, categoria } = req.body;
    if (!nome_produto) {
      return res.status(400).json({ message: "Nome do produto é obrigatório." });
    }

    const id_produto = gerarIdProduto();
    await mysqlPool.query(
      "INSERT INTO produtos (id_produto, nome_produto, categoria, ativo) VALUES (?, ?, ?, 1)",
      [id_produto, nome_produto, categoria || null]
    );

    res.status(201).json({ message: "Produto criado com sucesso", id_produto });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ message: "Erro ao criar produto." });
  }
}

// Inativar produto
export async function inativarProduto(req, res) {
  try {
    const { id } = req.params;

    const [result] = await mysqlPool.query(
      "UPDATE produtos SET ativo = 0 WHERE id_produto = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    res.json({ message: "Produto inativado com sucesso." });
  } catch (error) {
    console.error("Erro ao inativar produto:", error);
    res.status(500).json({ message: "Erro ao inativar produto." });
  }
}
