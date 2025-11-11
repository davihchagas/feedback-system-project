USE feedbacks_db;

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
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE resultado VARCHAR(20);
  IF p_nota <= 2 THEN
    SET resultado = 'ruim';
  ELSEIF p_nota = 3 THEN
    SET resultado = 'regular';
  ELSEIF p_nota = 4 THEN
    SET resultado = 'bom';
  ELSE
    SET resultado = 'ótimo';
  END IF;
  RETURN resultado;
END$$

DELIMITER ;
