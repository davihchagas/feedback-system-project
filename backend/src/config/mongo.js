// backend/src/config/mongo.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let connected = false;

export async function connectMongo() {
  if (connected) return mongoose.connection.db;

  const uri = process.env.MONGO_URI; // ex.: mongodb://localhost:27017/feedbacks_db
  if (!uri) throw new Error("MONGO_URI não definido no .env");

  await mongoose.connect(uri);
  connected = true;
  console.log("MongoDB conectado");

  const db = mongoose.connection.db;

  // helper: garante índice com nome e opções; se existir diferente, dropa e recria
  async function ensureIndex(coll, key, options) {
    const c = db.collection(coll);
    const name = options?.name;
    if (!name) throw new Error("Defina 'name' no options do índice");

    const idx = await c.listIndexes().toArray();
    const existing = idx.find(i => i.name === name);

    // compara chave e 'unique' (simples e suficiente aqui)
    const sameKey = existing && JSON.stringify(existing.key) === JSON.stringify(key);
    const sameUnique = existing && (!!existing.unique) === (!!options.unique);

    if (existing && sameKey && sameUnique) return; // já ok

    if (existing) {
      // quando difere, dropa e recria
      await c.dropIndex(name);
    }
    await c.createIndex(key, options);
  }

  // feedbacks_texto: id_feedback único
  await ensureIndex("feedbacktextos", { id_feedback: 1 }, { name: "uniq_id_feedback", unique: true });

  // logs de auditoria
  await ensureIndex("logs_acesso", { when: -1 }, { name: "when_desc" });
  await ensureIndex("logs_acesso", { "user.id_usuario": 1, when: -1 }, { name: "user_when" });
  await ensureIndex("logs_acesso", { path: 1, when: -1 }, { name: "path_when" });

  return db;
}

export function getMongoDb() {
  if (!connected || !mongoose.connection?.db) {
    throw new Error("MongoDB não conectado. Chame connectMongo() antes.");
  }
  return mongoose.connection.db;
}
