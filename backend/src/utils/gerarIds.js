// backend/src/utils/gerarIds.js
import crypto from "crypto";

/**
 * Gera um ID padronizado no formato PREFIXO-YYYYMMDD-HHMMSS-rand(4)
 * Exemplo: PRD-20251112-153045-8f3a
 */
function gerarId(prefixo = "GEN") {
  const agora = new Date();
  const data =
    agora.getFullYear().toString() +
    String(agora.getMonth() + 1).padStart(2, "0") +
    String(agora.getDate()).padStart(2, "0");
  const hora =
    String(agora.getHours()).padStart(2, "0") +
    String(agora.getMinutes()).padStart(2, "0") +
    String(agora.getSeconds()).padStart(2, "0");
  const aleatorio = crypto.randomBytes(2).toString("hex");
  return `${prefixo}-${data}-${hora}-${aleatorio}`;
}

// Funções específicas para cada tipo de entidade
export function gerarIdUsuario() {
  return gerarId("USR");
}

export function gerarIdProduto() {
  return gerarId("PRD");
}

export function gerarIdFeedback() {
  return gerarId("FBK");
}

export function gerarIdCliente() {
  return gerarId("CLI");
}
