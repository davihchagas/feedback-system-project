import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { mysqlPool } from "./config/mysql.js";
import { connectMongo } from "./config/mongo.js";

import authRoutes from "./routes/authRoutes.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import relatorioRoutes from "./routes/relatorioRoutes.js";

import { logAcesso } from "./middlewares/logAcesso.js";
import { checkAuth } from "./middlewares/checkAuth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// rota simples para teste de saúde da API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// rota de autenticação (sem JWT nem log)
app.use("/auth", authRoutes);

// a partir daqui: qualquer rota que comece com /api
// passa por autenticação e registro de log
app.use("/api", checkAuth, logAcesso);

// rotas protegidas
app.use("/api/produtos", produtoRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/relatorios", relatorioRoutes);

app.use((req, _res, next) => { console.log(req.method, req.originalUrl); next(); });


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
