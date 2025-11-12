import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { api } from "../services/api.js";

export default function ClientePage() {
  const { usuario, logout } = useAuth();

  const [aba, setAba] = useState("novo"); // "novo" | "historico" | "respostas"

  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [respostas, setRespostas] = useState([]);

  const [form, setForm] = useState({
    id_produto: "",
    nota: 5,
    comentario_curto: "",
    comentario_completo: "",
  });

  const [mensagem, setMensagem] = useState("");
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [carregandoRespostas, setCarregandoRespostas] = useState(false);

  useEffect(() => {
    carregarProdutos();
    carregarHistorico();
    carregarRespostas();
  }, []);

  async function carregarProdutos() {
    const { data } = await api.get("/api/produtos");
    setProdutos(data);
  }

  async function carregarHistorico() {
    try {
      setCarregandoHistorico(true);
      const { data } = await api.get("/api/feedbacks/me");
      setHistorico(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoHistorico(false);
    }
  }

  async function carregarRespostas() {
    try {
      setCarregandoRespostas(true);
      const { data } = await api.get("/api/feedbacks/me/respostas");
      setRespostas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoRespostas(false);
    }
  }

  async function enviarFeedback(e) {
    e.preventDefault();
    setMensagem("");

    try {
      await api.post("/api/feedbacks", {
        id_produto: form.id_produto,
        nota: Number(form.nota),
        comentario_curto: form.comentario_curto,
        comentario_completo: form.comentario_completo,
        tags: [],
      });

      setMensagem("Feedback enviado com sucesso.");
      setForm({
        id_produto: "",
        nota: 5,
        comentario_curto: "",
        comentario_completo: "",
      });

      // atualizar histórico e respostas
      carregarHistorico();
      carregarRespostas();
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao enviar feedback.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h2 className="text-xl font-semibold">Área do cliente</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{usuario?.nome}</span>
          <button className="text-sm text-red-600" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Abas */}
        <div className="flex gap-2">
          <button
            onClick={() => setAba("novo")}
            className={`px-3 py-2 rounded-md text-sm ${aba === "novo" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Novo feedback
          </button>
          <button
            onClick={() => setAba("historico")}
            className={`px-3 py-2 rounded-md text-sm ${aba === "historico" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Meus feedbacks
          </button>
          <button
            onClick={() => setAba("respostas")}
            className={`px-3 py-2 rounded-md text-sm ${aba === "respostas" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Respostas do analista
          </button>
        </div>

        {/* Conteúdo por aba */}
        {aba === "novo" && (
          <section className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Novo feedback</h3>
            {mensagem && (
              <p className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                {mensagem}
              </p>
            )}
            <form className="space-y-4" onSubmit={enviarFeedback}>
              <div>
                <label className="block text-sm mb-1">Produto</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.id_produto}
                  onChange={(e) =>
                    setForm((old) => ({ ...old, id_produto: e.target.value }))
                  }
                  required
                >
                  <option value="">Selecione</option>
                  {produtos.map((p) => (
                    <option key={p.id_produto} value={p.id_produto}>
                      {p.nome_produto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Nota (1 a 5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border rounded-md px-3 py-2"
                  value={form.nota}
                  onChange={(e) =>
                    setForm((old) => ({ ...old, nota: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Comentário curto</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.comentario_curto}
                  onChange={(e) =>
                    setForm((old) => ({
                      ...old,
                      comentario_curto: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Comentário completo</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  rows={4}
                  value={form.comentario_completo}
                  onChange={(e) =>
                    setForm((old) => ({
                      ...old,
                      comentario_completo: e.target.value,
                    }))
                  }
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
              >
                Enviar
              </button>
            </form>
          </section>
        )}

        {aba === "historico" && (
          <section className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Meus feedbacks</h3>
            {carregandoHistorico ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Nota</th>
                      <th className="px-3 py-2 text-left">Classificação</th>
                      <th className="px-3 py-2 text-left">Comentário curto</th>
                      <th className="px-3 py-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((h) => (
                      <tr key={h.id_feedback} className="border-b">
                        <td className="px-3 py-2">{h.nome_produto}</td>
                        <td className="px-3 py-2">{h.nota}</td>
                        <td className="px-3 py-2">{h.classificacao}</td>
                        <td className="px-3 py-2">{h.comentario_curto}</td>
                        <td className="px-3 py-2">
                          {new Date(h.data_feedback).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {historico.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-center text-slate-500">
                          Nenhum feedback encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {aba === "respostas" && (
          <section className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Respostas do analista</h3>
            {carregandoRespostas ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Comentário curto</th>
                      <th className="px-3 py-2 text-left">Resposta</th>
                      <th className="px-3 py-2 text-left">Analista</th>
                      <th className="px-3 py-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {respostas.map((r) => (
                      <tr key={r.id_resposta} className="border-b">
                        <td className="px-3 py-2">{r.nome_produto}</td>
                        <td className="px-3 py-2">{r.comentario_curto}</td>
                        <td className="px-3 py-2">{r.texto_resposta}</td>
                        <td className="px-3 py-2">{r.nome_analista}</td>
                        <td className="px-3 py-2">
                          {new Date(r.data_resposta).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {respostas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-center text-slate-500">
                          Nenhuma resposta registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
