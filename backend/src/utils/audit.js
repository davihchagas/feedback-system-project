// backend/src/utils/audit.js
import { getMongoDb } from "../config/mongo.js";

/**
 * Registra uma ação de auditoria em MongoDB.
 *
 * @param {Object} p
 * @param {string} p.action       - Código da ação (ex.: CLIENTE_FEEDBACK_CRIADO)
 * @param {Object} p.actor        - { id_usuario, nome, email, id_grupo }
 * @param {Object} [p.entity]     - Entidade-alvo (ex.: { type:'feedback', id:'FBK-...' })
 * @param {Object} [p.context]    - Contexto opcional (ex.: { id_produto, nome_produto, cliente:{nome,...} })
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
    entity,  // { type, id }
    context, // campos extras úteis para montar a frase
  };
  await db.collection("logs_acesso").insertOne(doc);
}

/**
 * Converte um documento de log em uma frase humana no padrão solicitado.
 * Retorna { whenIso, message }.
 *
 * Observações de contexto esperado por ação:
 * - CLIENTE_FEEDBACK_CRIADO: { nome_produto?, id_produto? }
 * - ANALISTA_RESPOSTA_CRIADA | ANALISTA_FEEDBACK_RESPONDIDO:
 *     { cliente:{nome?, id_usuario?}, nome_produto?, id_produto? }
 * - ADMIN_PRODUTO_CRIADO | ADMIN_PRODUTO_INATIVADO: { nome_produto?, id_produto? }
 * - ADMIN_USUARIO_CRIADO: { nome_usuario?, id_usuario_alvo?, grupo_alvo?, email_alvo? }
 * - ADMIN_USUARIO_ATUALIZADO: { depois:{...} }
 * - ADMIN_USUARIO_DESATIVADO: { nome_usuario? | id_usuario_alvo? }
 */
export function humanizeLog(doc) {
  const d = new Date(doc.when);
  const quando = d.toLocaleString("pt-BR", { hour12: false });

  const nome = doc?.actor?.nome || "Usuário";
  const ctx = doc?.context || {};
  const ent = doc?.entity || {};

  // auxiliares de texto
  const produtoTxt = ctx.nome_produto || ctx.id_produto || "produto";
  const alvoUsuarioTxt =
    ctx.nome_usuario || ctx.email_alvo || ctx.id_usuario_alvo || (doc?.entity?.id || "usuário");

  switch (doc.action) {
    // Cliente → criou feedback
    case "CLIENTE_FEEDBACK_CRIADO":
      return {
        whenIso: d.toISOString(),
        message: `Cliente ${nome} fez um feedback (${ent.id || "sem ID"}) para ${produtoTxt} em ${quando}.`,
      };

    // Analista → respondeu feedback (aceita os dois códigos)
    case "ANALISTA_RESPOSTA_CRIADA":
    case "ANALISTA_FEEDBACK_RESPONDIDO": {
      const clienteNome = ctx?.cliente?.nome || "cliente";
      return {
        whenIso: d.toISOString(),
        message: `Analista ${nome} respondeu o feedback (${ent.id || "sem ID"}) de ${clienteNome} sobre ${produtoTxt} em ${quando}.`,
      };
    }

    // Admin → produto
    case "ADMIN_PRODUTO_CRIADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} criou o produto ${produtoTxt} em ${quando}.`,
      };

    case "ADMIN_PRODUTO_INATIVADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} inativou o produto ${produtoTxt} em ${quando}.`,
      };

    // Admin → usuário
    case "ADMIN_USUARIO_CRIADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} criou o usuário ${alvoUsuarioTxt} (${ctx.grupo_alvo || "grupo não informado"}) em ${quando}.`,
      };

    case "ADMIN_USUARIO_ATUALIZADO": {
      const depois = ctx?.depois || {};
      const alvo = depois.email || depois.nome || alvoUsuarioTxt;
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} atualizou a conta ${alvo} em ${quando}.`,
      };
    }

    case "ADMIN_USUARIO_DESATIVADO":
      return {
        whenIso: d.toISOString(),
        message: `Admin ${nome} desativou o usuário ${alvoUsuarioTxt} em ${quando}.`,
      };

    // fallback
    default:
      return {
        whenIso: d.toISOString(),
        message: `Registro sem mapeamento (${doc.action || "sem ação"}) em ${quando}.`,
      };
  }
}
