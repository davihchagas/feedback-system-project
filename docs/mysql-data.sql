USE feedbacks_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Desliga o autocommit para controle manual da transação
SET autocommit = 0;

-- ===============================
-- 1) Grupos de usuários
-- ===============================

START TRANSACTION;

INSERT IGNORE INTO grupos_usuarios (id_grupo, nome_grupo) VALUES
  ('ADMIN', 'ADMIN'),
  ('ANALISTA', 'ANALISTA'),
  ('CLIENTE', 'CLIENTE');

COMMIT;

-- ===============================
-- 2) Usuários e clientes
-- ===============================

SET @senha_hash_123456 := '$2b$12$d0NgtrB9/8wi5KXjY.BSWe2h2NRlCXizopU3voTSawAcT9GcICE2m';

START TRANSACTION;

-- Usuário ADMIN
SET @id_admin := fn_gerar_id_usuario();

INSERT INTO usuarios (id_usuario, nome, email, senha_hash, ativo, id_grupo)
VALUES (@id_admin, 'Admin Sistema', 'admin@sistema.com', @senha_hash_123456, 1, 'ADMIN');

-- Usuário ANALISTA
SET @id_analista := fn_gerar_id_usuario();

INSERT INTO usuarios (id_usuario, nome, email, senha_hash, ativo, id_grupo)
VALUES (@id_analista, 'Analista Responsável', 'analista@sistema.com', @senha_hash_123456, 1, 'ANALISTA');

-- Usuário CLIENTE
SET @id_usuario_cliente := fn_gerar_id_usuario();

INSERT INTO usuarios (id_usuario, nome, email, senha_hash, ativo, id_grupo)
VALUES (@id_usuario_cliente, 'Cliente Teste', 'cliente@sistema.com', @senha_hash_123456, 1, 'CLIENTE');

-- Cliente vinculado ao usuário de cliente
SET @id_cliente := 'CLI-TESTE-001';

INSERT INTO clientes (id_cliente, id_usuario, nome, documento)
VALUES (@id_cliente, @id_usuario_cliente, 'Cliente Teste', '00000000000');

COMMIT;

-- ===============================
-- 3) Produtos
-- ===============================

START TRANSACTION;

SET @id_produto_1 := fn_gerar_id_produto();
SET @id_produto_2 := fn_gerar_id_produto();
SET @id_produto_3 := fn_gerar_id_produto();

INSERT INTO produtos (id_produto, nome_produto, categoria, ativo) VALUES
  (@id_produto_1, 'Aplicativo Mobile X', 'Software', 1),
  (@id_produto_2, 'Serviço de Suporte Y', 'Serviço', 1),
  (@id_produto_3, 'Plataforma Web Z', 'Software', 1);

COMMIT;

-- ===============================
-- 4) Feedbacks (usando procedure)
-- ===============================

START TRANSACTION;

CALL sp_inserir_feedback(@id_cliente, @id_produto_1, 5, 'Aplicativo muito intuitivo');
CALL sp_inserir_feedback(@id_cliente, @id_produto_1, 3, 'Poderia carregar mais rápido');
CALL sp_inserir_feedback(@id_cliente, @id_produto_2, 2, 'Demora no atendimento');
CALL sp_inserir_feedback(@id_cliente, @id_produto_3, 4, 'Interface clara e organizada');

COMMIT;

-- ===============================
-- 5) Respostas do analista
-- ===============================

-- Mostrar feedbacks
