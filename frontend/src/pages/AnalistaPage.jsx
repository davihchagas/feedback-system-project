import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { api } from "../services/api.js";

export default function AnalistaPage() {
  const { usuario, logout } = useAuth();

  const [aba, setAba] = useState("feedbacks"); // "feedbacks" | "respostas"

  const [produtos, setProdutos] = useState([]);
  const [filtros, setFiltros] = useState({
    id_produto: "",
    data_inicio: "",
    data_fim: "",
  });

  const [feedbacks, setFeedbacks] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [textoCompleto, setTextoCompleto] = useState(null);
  const [resposta, setResposta] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [respostas, setRespostas] = useState([]);
  const [filtroRespostas, setFiltroRespostas] = useState({ id_produto: "" });
  const [msgRespostas, setMsgRespostas] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await api.get("/api/produtos");
    setProdutos(data);
  }

  async function buscarFeedbacks(e) {
    if (e) e.preventDefault();
    setMensagem("");
    setSelecionado(null);
    setTextoCompleto(null);

    try {
      const params = {
        id_produto: filtros.id_produto || undefined,
        data_inicio: filtros.data_inicio || undefined, // YYYY-MM-DD
        data_fim: filtros.data_fim || undefined,       // YYYY-MM-DD
      };
      const { data } = await api.get("/api/feedbacks/detalhados", { params });
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
      setMensagem("Falha ao buscar feedbacks.");
    }
  }

  async function verTextoCompleto(f) {
    setSelecionado(f);
    setResposta("");
    setMensagem("");

    try {
      const { data } = await api.get(`/api/feedbacks/${f.id_feedback}/texto`);
      setTextoCompleto(data);
    } catch (err) {
      console.error(err);
      setTextoCompleto(null);
      setMensagem("Texto completo não encontrado.");
    }
  }

  async function enviarResposta(e) {
    e.preventDefault();
    if (!selecionado) return;

    try {
      await api.post(`/api/feedbacks/${selecionado.id_feedback}/respostas`, {
        texto_resposta: resposta,
      });
      setMensagem("Resposta registrada.");
      setResposta("");
      // opcional: recarregar respostas para aparecer na aba "Respostas"
      if (aba === "respostas") await buscarRespostas();
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao registrar resposta.");
    }
  }

  // ---- Aba "Respostas" ----
  async function buscarRespostas(e) {
    if (e) e.preventDefault();
    setMsgRespostas("");
    try {
      const params = {
        id_produto: filtroRespostas.id_produto || undefined,
      };
      const { data } = await api.get("/api/feedbacks/respostas", { params });
      setRespostas(data);
    } catch (err) {
      console.error(err);
      setMsgRespostas("Falha ao buscar respostas.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h2 className="text-xl font-semibold">Painel do analista</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{usuario?.nome}</span>
          <button className="text-sm text-red-600" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Abas */}
        <div className="flex gap-2">
          <button
            onClick={() => setAba("feedbacks")}
            className={`px-3 py-2 rounded-md text-sm ${aba === "feedbacks" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Feedbacks
          </button>
          <button
            onClick={() => setAba("respostas")}
            className={`px-3 py-2 rounded-md text-sm ${aba === "respostas" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Respostas
          </button>
        </div>

        {/* ---- ABA FEEDBACKS ---- */}
        {aba === "feedbacks" && (
          <>
            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Filtros</h3>
              <form
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
                onSubmit={buscarFeedbacks}
              >
                <div>
                  <label className="block text-sm mb-1">Produto</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={filtros.id_produto}
                    onChange={(e) =>
                      setFiltros((old) => ({ ...old, id_produto: e.target.value }))
                    }
                  >
                    <option value="">Todos</option>
                    {produtos.map((p) => (
                      <option key={p.id_produto} value={p.id_produto}>
                        {p.nome_produto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Data início</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={filtros.data_inicio}
                    onChange={(e) =>
                      setFiltros((old) => ({ ...old, data_inicio: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Data fim</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={filtros.data_fim}
                    onChange={(e) =>
                      setFiltros((old) => ({ ...old, data_fim: e.target.value }))
                    }
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Feedbacks</h3>
              {mensagem && (
                <p className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                  {mensagem}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left">Cliente</th>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Nota</th>
                      <th className="px-3 py-2 text-left">Classificação</th>
                      <th className="px-3 py-2 text-left">Comentário curto</th>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((f) => (
                      <tr key={f.id_feedback} className="border-b">
                        <td className="px-3 py-2">{f.nome_cliente}</td>
                        <td className="px-3 py-2">{f.nome_produto}</td>
                        <td className="px-3 py-2">{f.nota}</td>
                        <td className="px-3 py-2">{f.classificacao}</td>
                        <td className="px-3 py-2">{f.comentario_curto}</td>
                        <td className="px-3 py-2">
                          {new Date(f.data_feedback).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="text-xs px-2 py-1 rounded bg-slate-200"
                            onClick={() => verTextoCompleto(f)}
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-3 text-center text-slate-500">
                          Nenhum feedback encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {selecionado && (
              <section className="bg-white p-4 rounded-xl shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Detalhes de {selecionado.nome_produto}
                </h3>
                <p className="text-sm mb-2">
                  <strong>Cliente:</strong> {selecionado.nome_cliente}
                </p>
                <p className="text-sm mb-2">
                  <strong>Nota:</strong> {selecionado.nota} ({selecionado.classificacao})
                </p>
                <p className="text-sm mb-2">
                  <strong>Comentário curto:</strong> {selecionado.comentario_curto}
                </p>
                <p className="text-sm mb-2">
                  <strong>Comentário completo:</strong>{" "}
                  {textoCompleto?.comentario_completo || "Não registrado."}
                </p>

                <form className="mt-4 space-y-2" onSubmit={enviarResposta}>
                  <label className="block text-sm mb-1">Responder cliente</label>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    rows={3}
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium"
                  >
                    Enviar resposta
                  </button>
                </form>
              </section>
            )}
          </>
        )}

        {/* ---- ABA RESPOSTAS ---- */}
        {aba === "respostas" && (
          <>
            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Filtros de respostas</h3>
              <form
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                onSubmit={buscarRespostas}
              >
                <div>
                  <label className="block text-sm mb-1">Produto</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={filtroRespostas.id_produto}
                    onChange={(e) =>
                      setFiltroRespostas((s) => ({ ...s, id_produto: e.target.value }))
                    }
                  >
                    <option value="">Todos</option>
                    {produtos.map((p) => (
                      <option key={p.id_produto} value={p.id_produto}>
                        {p.nome_produto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
                  >
                    Buscar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Respostas</h3>
              {msgRespostas && (
                <p className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                  {msgRespostas}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left">Cliente</th>
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
                        <td className="px-3 py-2">{r.nome_cliente}</td>
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
                        <td colSpan={6} className="px-3 py-3 text-center text-slate-500">
                          Nenhuma resposta encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
