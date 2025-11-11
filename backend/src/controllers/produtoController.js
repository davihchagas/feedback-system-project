// backend/src/controllers/produtoController.js
import { mysqlPool } from "../config/mysql.js";

export async function listarProdutos(req, res) {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM produtos WHERE ativo = 1"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar produtos" });
  }
}

export async function criarProduto(req, res) {
  const { nome_produto, categoria } = req.body;

  try {
    const [[row]] = await mysqlPool.query(
      "SELECT fn_gerar_id_produto() AS id_produto"
    );
    const id_produto = row.id_produto;

    await mysqlPool.query(
      "INSERT INTO produtos (id_produto, nome_produto, categoria, ativo) VALUES (?, ?, ?, 1)",
      [id_produto, nome_produto, categoria]
    );

    res.status(201).json({ id_produto, nome_produto, categoria, ativo: 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao criar produto" });
  }
}
