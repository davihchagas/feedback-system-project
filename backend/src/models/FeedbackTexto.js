// backend/src/models/FeedbackTexto.js
import mongoose from "mongoose";

const FeedbackTextoSchema = new mongoose.Schema(
  {
    id_feedback: { type: String, required: true, index: true },
    comentario_completo: { type: String },
    tags: [{ type: String }],
    sentimento: { type: String },
    anexos: [
      {
        tipo: String,
        url: String
      }
    ]
  },
  {
    timestamps: {
      createdAt: "criado_em",
      updatedAt: "atualizado_em"
    }
  }
);

export const FeedbackTexto = mongoose.model(
  "FeedbackTexto",
  FeedbackTextoSchema
);
