USE feedbacks_db;

CREATE OR REPLACE VIEW vw_ranking_produtos AS
SELECT
  p.id_produto,
  p.nome_produto,
  e.media_nota,
  e.qtd_feedbacks
FROM produtos p
JOIN estatisticas_produto e ON e.id_produto = p.id_produto
ORDER BY e.media_nota DESC, e.qtd_feedbacks DESC;

CREATE OR REPLACE VIEW vw_feedbacks_detalhados AS
SELECT
  f.id_feedback,
  c.nome AS nome_cliente,
  p.nome_produto,
  f.nota,
  fn_classificar_nota(f.nota) AS classificacao,
  f.comentario_curto,
  f.data_feedback
FROM feedbacks f
JOIN clientes c ON c.id_cliente = f.id_cliente
JOIN produtos p ON p.id_produto = f.id_produto;

DELIMITER $$

CREATE TRIGGER trg_feedback_after_insert
AFTER INSERT ON feedbacks
FOR EACH ROW
BEGIN
  DECLARE v_media DECIMAL(3,2);
  DECLARE v_qtd INT;

  SELECT media_nota, qtd_feedbacks
    INTO v_media, v_qtd
  FROM estatisticas_produto
  WHERE id_produto = NEW.id_produto
  FOR UPDATE;

  IF v_qtd IS NULL THEN
    INSERT INTO estatisticas_produto (id_produto, media_nota, qtd_feedbacks)
    VALUES (NEW.id_produto, NEW.nota, 1);
  ELSE
    SET v_media = (v_media * v_qtd + NEW.nota) / (v_qtd + 1);
    UPDATE estatisticas_produto
      SET media_nota = v_media,
          qtd_feedbacks = v_qtd + 1
    WHERE id_produto = NEW.id_produto;
  END IF;
END$$

CREATE TRIGGER trg_feedback_after_update
AFTER UPDATE ON feedbacks
FOR EACH ROW
BEGIN
  IF NEW.nota <> OLD.nota THEN
    UPDATE estatisticas_produto e
    JOIN (
      SELECT
        id_produto,
        AVG(nota) AS nova_media,
        COUNT(*) AS nova_qtd
      FROM feedbacks
      WHERE id_produto = NEW.id_produto
      GROUP BY id_produto
    ) sub ON sub.id_produto = e.id_produto
    SET e.media_nota = sub.nova_media,
        e.qtd_feedbacks = sub.nova_qtd
    WHERE e.id_produto = NEW.id_produto;
  END IF;
END$$

CREATE PROCEDURE sp_inserir_feedback(
  IN p_id_cliente VARCHAR(50),
  IN p_id_produto VARCHAR(50),
  IN p_nota INT,
  IN p_comentario_curto VARCHAR(255)
)
BEGIN
  DECLARE v_id_feedback VARCHAR(50);
  SET v_id_feedback = fn_gerar_id_feedback();

  INSERT INTO feedbacks (
    id_feedback, id_cliente, id_produto, nota, comentario_curto, data_feedback
  ) VALUES (
    v_id_feedback, p_id_cliente, p_id_produto, p_nota, p_comentario_curto, NOW()
  );

  SELECT v_id_feedback AS id_feedback;
END$$

CREATE PROCEDURE sp_relatorio_satisfacao_produto(
  IN p_id_produto VARCHAR(50),
  IN p_data_inicio DATETIME,
  IN p_data_fim DATETIME
)
BEGIN
  SELECT
    p.id_produto,
    p.nome_produto,
    AVG(f.nota) AS media_nota,
    MIN(f.nota) AS nota_minima,
    MAX(f.nota) AS nota_maxima,
    COUNT(*) AS qtd_feedbacks
  FROM feedbacks f
  JOIN produtos p ON p.id_produto = f.id_produto
  WHERE f.id_produto = p_id_produto
    AND f.data_feedback BETWEEN p_data_inicio AND p_data_fim;
END$$

DELIMITER ;
