USE feedbacks_db;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE grupos_usuarios (
  id_grupo VARCHAR(20) PRIMARY KEY,
  nome_grupo VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id_usuario VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  ativo TINYINT(1) DEFAULT 1,
  id_grupo VARCHAR(20) NOT NULL,
  CONSTRAINT fk_usuarios_grupo
    FOREIGN KEY (id_grupo) REFERENCES grupos_usuarios(id_grupo)
      ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clientes (
  id_cliente VARCHAR(50) PRIMARY KEY,
  id_usuario VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  documento VARCHAR(20),
  CONSTRAINT fk_clientes_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produtos (
  id_produto VARCHAR(50) PRIMARY KEY,
  nome_produto VARCHAR(150) NOT NULL,
  categoria VARCHAR(100),
  ativo TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE feedbacks (
  id_feedback VARCHAR(50) PRIMARY KEY,
  id_cliente VARCHAR(50) NOT NULL,
  id_produto VARCHAR(50) NOT NULL,
  nota INT NOT NULL,
  comentario_curto VARCHAR(255),
  data_feedback DATETIME NOT NULL,
  CONSTRAINT chk_feedback_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT fk_feedbacks_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_feedbacks_produto
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE respostas_feedback (
  id_resposta INT AUTO_INCREMENT PRIMARY KEY,
  id_feedback VARCHAR(50) NOT NULL,
  id_usuario_analista VARCHAR(50) NOT NULL,
  texto_resposta TEXT NOT NULL,
  data_resposta DATETIME NOT NULL,
  CONSTRAINT fk_respostas_feedback
    FOREIGN KEY (id_feedback) REFERENCES feedbacks(id_feedback)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_respostas_usuario
    FOREIGN KEY (id_usuario_analista) REFERENCES usuarios(id_usuario)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE estatisticas_produto (
  id_produto VARCHAR(50) PRIMARY KEY,
  media_nota DECIMAL(3,2) NOT NULL,
  qtd_feedbacks INT NOT NULL,
  CONSTRAINT fk_estatisticas_produto
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
