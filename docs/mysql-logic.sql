USE feedbacks_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE OR REPLACE VIEW vw_usuarios_clientes AS
SELECT
  u.id_usuario, u.nome, u.email, u.ativo, u.id_grupo,
  c.id_cliente, c.documento
FROM usuarios u
LEFT JOIN clientes c ON c.id_usuario = u.id_usuario;

CREATE OR REPLACE VIEW vw_ranking_produtos AS
SELECT p.id_produto, p.nome_produto, e.media_nota, e.qtd_feedbacks
FROM estatisticas_produto e
JOIN produtos p ON p.id_produto = e.id_produto
WHERE p.ativo = 1
ORDER BY e.media_nota DESC, e.qtd_feedbacks DESC;

CREATE OR REPLACE VIEW vw_feedbacks_detalhados AS
SELECT
  f.id_feedback,
  c.nome AS nome_cliente,
  p.id_produto,
  p.nome_produto,
  f.nota,
  fn_classificar_nota(f.nota) AS classificacao,
  f.comentario_curto,
  f.data_feedback
FROM feedbacks f
JOIN clientes c   ON c.id_cliente  = f.id_cliente
JOIN produtos p   ON p.id_produto  = f.id_produto
ORDER BY f.data_feedback DESC;


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

-- feedbacks (id_produto, data_feedback)
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedbacks' AND INDEX_NAME = 'idx_feedbacks_produto_data'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_feedbacks_produto_data ON feedbacks (id_produto, data_feedback)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- feedbacks (id_cliente, data_feedback)
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedbacks' AND INDEX_NAME = 'idx_feedbacks_cliente_data'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_feedbacks_cliente_data ON feedbacks (id_cliente, data_feedback)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- estatisticas_produto (media_nota)
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'estatisticas_produto' AND INDEX_NAME = 'idx_estatisticas_media'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_estatisticas_media ON estatisticas_produto (media_nota)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- usuarios (id_grupo)
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND INDEX_NAME = 'idx_usuarios_grupo'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_usuarios_grupo ON usuarios (id_grupo)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- clientes (id_usuario)
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND INDEX_NAME = 'idx_clientes_usuario'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_clientes_usuario ON clientes (id_usuario)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- feedbacks (id_cliente) auxiliar
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedbacks' AND INDEX_NAME = 'idx_feedbacks_cliente'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_feedbacks_cliente ON feedbacks (id_cliente)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- feedbacks (id_produto) auxiliar
SET @idx_exists := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feedbacks' AND INDEX_NAME = 'idx_feedbacks_produto'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_feedbacks_produto ON feedbacks (id_produto)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
