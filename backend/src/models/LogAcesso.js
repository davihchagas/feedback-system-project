// backend/src/models/LogAcesso.js
import mongoose from "mongoose";

const LogAcessoSchema = new mongoose.Schema(
  {
    id_usuario: String,
    rota: String,
    tipo_acao: String
  },
  {
    timestamps: {
      createdAt: "timestamp",
      updatedAt: false
    }
  }
);

export const LogAcesso = mongoose.model("LogAcesso", LogAcessoSchema);
