// backend/src/utils/audit.js
import { getMongoDb } from "../config/mongo.js";

/**
 * Registra uma ação de auditoria em MongoDB.
 *
 * @param {Object} p
 * @param {string} p.action       - Código da ação (ex.: CLIENTE_FEEDBACK_CRIADO)
 * @param {Object} p.actor        - { id_usuario, nome, email, id_grupo }
 * @param {Object} [p.entity]     - Entidade-alvo (ex.: { type:'feedback', id:'FBK-...' })
 * @param {Object} [p.context]    - Contexto opcional (ex.: { id_produto, nome_produto })
 * @param {Date}   [p.when]       - Data/hora (default: now)
 */
export async function logAction({
  action,
  actor,
  entity = null,
  context = {},
  when = new Date(),
}) {
  const db = getMongoDb();
  const doc = {
    when,
    action,
    actor: actor
      ? {
          id_usuario: actor.id_usuario,
          nome: actor.nome,
          email: actor.email,
          id_grupo: actor.id_grupo, // ADMIN | ANALISTA | CLIENTE
        }
      : null,
    entity, // { type, id }
    context, // campos extras úteis para montar a frase
  };
  await db.collection("logs_acesso").insertOne(doc);
}

/**
 * Converte um documento de log em uma frase humana no padrão solicitado.
 * Retorna { whenIso, message }.
 */
export function humanizeLog(doc) {
  const d = new Date(doc.when);
  const quando = d.toLocaleString("pt-BR", { hour12: false });
  const nome = doc?.actor?.nome || "Usuário";
  const grupo = (doc?.actor?.id_grupo || "").toUpperCase();
  const ctx = doc?.context || {};
  const ent = doc?.entity || {};

  // Mapeamento simples de ações → frases
  switch (doc.action) {
    case "CLIENTE_FEEDBACK_CRIADO":
      return {
        whenIso: d.toISOString(),
        message: `Cliente ${nome} fez um feedback (${ent.id}) para ${
          ctx.nome_produto || ctx.id_produto || "produto"
        } em ${quando}.`,
      };

    case "ANALISTA_FEEDBACK_RESPONDIDO":
      return {
        whenIso: d.toISOString(),
        message: `Analista ${nome} respondeu o feedback (${ent.id}) em ${quando}.`,
      };

    case "ADMIN_PRODUTO_CRIADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} criou o produto ${
          ctx.nome_produto || ctx.id_produto
        } em ${quando}.`,
      };

    case "ADMIN_PRODUTO_INATIVADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} inativou o produto ${
          ctx.nome_produto || ctx.id_produto
        } em ${quando}.`,
      };

    case "ADMIN_USUARIO_CRIADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} criou o usuário ${
          ctx.nome_usuario || ctx.id_usuario_alvo
        } (${ctx.grupo_alvo}) em ${quando}.`,
      };

    case "ADMIN_USUARIO_DESATIVADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} desativou o usuário ${
          ctx.nome_usuario || ctx.id_usuario_alvo
        } em ${quando}.`,
      };

    default:
      return {
        whenIso: d.toISOString(),
        message: `Registro sem mapeamento (${
          doc.action || "sem ação"
        }) em ${quando}.`,
      };
  }
}
