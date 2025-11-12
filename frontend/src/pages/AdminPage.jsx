// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { api } from "../services/api.js";

export default function AdminPage() {
  const { usuario, logout } = useAuth();

  const [produtos, setProdutos] = useState([]);
  const [ranking, setRanking] = useState([]);

  const [form, setForm] = useState({ nome_produto: "", categoria: "" });
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [carregandoRanking, setCarregandoRanking] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarTudo() {
    setErro("");
    await Promise.all([carregarProdutos(), carregarRanking()]);
  }

  async function carregarProdutos() {
    try {
      setCarregandoLista(true);
      const { data } = await api.get("/api/produtos");
      setProdutos(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro("Falha ao carregar produtos.");
      console.error(e);
    } finally {
      setCarregandoLista(false);
    }
  }

  async function carregarRanking() {
    try {
      setCarregandoRanking(true);
      const { data } = await api.get("/api/relatorios/ranking-produtos");
      setRanking(Array.isArray(data) ? data : []);
    } catch (e) {
      setErro("Falha ao carregar ranking.");
      console.error(e);
    } finally {
      setCarregandoRanking(false);
    }
  }

  async function criarProduto(e) {
    e.preventDefault();
    if (!form.nome_produto.trim()) return;

    try {
      setSalvando(true);
      await api.post("/api/produtos", form);
      setForm({ nome_produto: "", categoria: "" });
      await carregarTudo();
    } catch (e) {
      setErro("Falha ao salvar produto.");
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  async function inativar(id) {
    if (!id) return;
    try {
      await api.patch(`/api/produtos/${id}/inativar`);
      await carregarTudo();
    } catch (e) {
      setErro("Falha ao inativar produto.");
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h2 className="text-xl font-semibold">Painel do administrador</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{usuario?.nome}</span>
          <button className="text-sm text-red-600" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {erro && (
          <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">
            {erro}
          </div>
        )}

        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Cadastro de produtos</h3>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            onSubmit={criarProduto}
          >
            <div>
              <label className="block text-sm mb-1">Nome do produto</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.nome_produto}
                onChange={(e) =>
                  setForm((old) => ({ ...old, nome_produto: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Categoria</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.categoria}
                onChange={(e) =>
                  setForm((old) => ({ ...old, categoria: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={salvando}
                className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Produtos ativos</h3>
          {carregandoLista ? (
            <p className="text-sm text-slate-500 px-2 py-2">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Categoria</th>
                    <th className="px-3 py-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.id_produto} className="border-b">
                      <td className="px-3 py-2">{p.id_produto}</td>
                      <td className="px-3 py-2">{p.nome_produto}</td>
                      <td className="px-3 py-2">{p.categoria}</td>
                      <td className="px-3 py-2">
                        <button
                          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                          onClick={() => inativar(p.id_produto)}
                        >
                          Inativar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {produtos.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-3 text-center text-slate-500"
                      >
                        Nenhum produto cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">
            Ranking de produtos por satisfação
          </h3>
          {carregandoRanking ? (
            <p className="text-sm text-slate-500 px-2 py-2">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-left">Média</th>
                    <th className="px-3 py-2 text-left">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r) => (
                    <tr key={r.id_produto} className="border-b">
                      <td className="px-3 py-2">{r.nome_produto}</td>
                      <td className="px-3 py-2">
                        {r.media_nota != null
                          ? Number(r.media_nota).toFixed(2)
                          : "-"}
                      </td>
                      <td className="px-3 py-2">{r.qtd_feedbacks ?? 0}</td>
                    </tr>
                  ))}
                  {ranking.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-3 text-center text-slate-500"
                      >
                        Nenhum dado de ranking ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
