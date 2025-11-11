import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { api } from "../services/api.js";

export default function AnalistaPage() {
  const { usuario, logout } = useAuth();
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

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await api.get("/api/produtos");
    setProdutos(data);
  }

  async function buscarFeedbacks(e) {
    e.preventDefault();
    setMensagem("");

    const params = {};
    if (filtros.id_produto) params.id_produto = filtros.id_produto;
    if (filtros.data_inicio && filtros.data_fim) {
      params.data_inicio = filtros.data_inicio + " 00:00:00";
      params.data_fim = filtros.data_fim + " 23:59:59";
    }

    const { data } = await api.get("/api/feedbacks", { params });
    setFeedbacks(data);
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
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao registrar resposta.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h2 className="text-xl font-semibold">Painel do analista</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{usuario?.nome}</span>
          <button
            className="text-sm text-red-600"
            onClick={logout}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={buscarFeedbacks}>
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
                    <td
                      colSpan={7}
                      className="px-3 py-3 text-center text-slate-500"
                    >
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
              <strong>Nota:</strong> {selecionado.nota} (
              {selecionado.classificacao})
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
      </main>
    </div>
  );
}
