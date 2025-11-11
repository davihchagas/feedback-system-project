// backend/src/controllers/relatorioController.js
import { mysqlPool } from "../config/mysql.js";

export async function rankingProdutos(req, res) {
  try {
    const [rows] = await mysqlPool.query("SELECT * FROM vw_ranking_produtos");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao gerar ranking de produtos" });
  }
}

export async function relatorioProduto(req, res) {
  const { id } = req.params;
  const { data_inicio, data_fim } = req.query;

  try {
    const [resultSets] = await mysqlPool.query(
      "CALL sp_relatorio_satisfacao_produto(?, ?, ?)",
      [id, data_inicio, data_fim]
    );

    const rows = resultSets[0] || resultSets;
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao gerar relatório do produto" });
  }
}
