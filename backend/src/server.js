import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { mysqlPool } from "./config/mysql.js";
import { connectMongo } from "./config/mongo.js";

import authRoutes from "./routes/authRoutes.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import relatorioRoutes from "./routes/relatorioRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/relatorios", relatorioRoutes);

async function start() {
  try {
    await mysqlPool.getConnection();
    console.log("MySQL conectado");

    await connectMongo();

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`API ouvindo na porta ${PORT}`);
    });
  } catch (err) {
    console.error("Falha ao iniciar servidor", err);
    process.exit(1);
  }
}

start();
