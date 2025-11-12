USE feedbacks_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

DELIMITER $$

CREATE FUNCTION fn_gerar_id_usuario()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
  RETURN CONCAT('USR-', DATE_FORMAT(NOW(), '%Y%m%d-%H%i%s'),
                '-', LPAD(FLOOR(RAND()*1000), 3, '0'));
END$$

CREATE FUNCTION fn_gerar_id_produto()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
  RETURN CONCAT('PRD-', DATE_FORMAT(NOW(), '%Y%m%d-%H%i%s'),
                '-', LPAD(FLOOR(RAND()*1000), 3, '0'));
END$$

CREATE FUNCTION fn_gerar_id_feedback()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
  RETURN CONCAT('FBK-', DATE_FORMAT(NOW(), '%Y%m%d-%H%i%s'),
                '-', LPAD(FLOOR(RAND()*1000), 3, '0'));
END$$

CREATE FUNCTION fn_classificar_nota(p_nota INT)
RETURNS VARCHAR(10) CHARACTER SET utf8mb4
DETERMINISTIC
BEGIN
  RETURN CASE
    WHEN p_nota <= 2 THEN 'Ruim'
    WHEN p_nota = 3 THEN 'Regular'
    WHEN p_nota = 4 THEN 'Bom'
    ELSE 'Ótimo'
  END;
END$$

DELIMITER ;
