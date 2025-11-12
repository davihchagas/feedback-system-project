// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { api } from "../services/api.js";

export default function AdminPage() {
  const { usuario, logout } = useAuth();

  const [aba, setAba] = useState("produtos"); // produtos | usuarios | clientes | analistas | feedbacks | logs

  // Produtos
  const [produtos, setProdutos] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [formProduto, setFormProduto] = useState({
    nome_produto: "",
    categoria: "",
  });
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [carregandoRanking, setCarregandoRanking] = useState(false);

  // Usuários
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [formUsuario, setFormUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    id_grupo: "CLIENTE",
    documento: "",
  });

  // Clientes e Analistas
  const [clientesLista, setClientesLista] = useState([]);
  const [analistasLista, setAnalistasLista] = useState([]);

  // Feedbacks (somente leitura)
  const [feedbacks, setFeedbacks] = useState([]);
  const [filtroFb, setFiltroFb] = useState({ id_produto: "", id_cliente: "" });

  // Logs (MongoDB)
  const [logs, setLogs] = useState([]);
  const [paginacao, setPaginacao] = useState({ page: 1, limit: 20, total: 0 });
  const [filtroLogs, setFiltroLogs] = useState({ user: "", path: "" });

  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  // Carregamentos iniciais
  useEffect(() => {
    if (aba === "produtos") carregarProdutosERanking();
    if (aba === "usuarios") carregarUsuarios();
    if (aba === "clientes") carregarClientes();
    if (aba === "analistas") carregarAnalistas();
    if (aba === "feedbacks") carregarFeedbacks();
    if (aba === "logs") carregarLogsHuman();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  // -------- Produtos --------
  async function carregarProdutosERanking() {
    setErro("");
    setOk("");
    try {
      setCarregandoProdutos(true);
      const [prodResp, rankResp] = await Promise.all([
        api.get("/api/produtos"),
        api.get("/api/relatorios/ranking-produtos"),
      ]);
      setProdutos(Array.isArray(prodResp.data) ? prodResp.data : []);
      setRanking(Array.isArray(rankResp.data) ? rankResp.data : []);
    } catch (e) {
      console.error(e);
      setErro("Falha ao carregar produtos/ranking.");
    } finally {
      setCarregandoProdutos(false);
      setCarregandoRanking(false);
    }
  }

  async function criarProduto(e) {
    e.preventDefault();
    setErro("");
    setOk("");
    if (!formProduto.nome_produto.trim()) return;
    try {
      await api.post("/api/produtos", formProduto);
      setFormProduto({ nome_produto: "", categoria: "" });
      await carregarProdutosERanking();
      setOk("Produto criado.");
    } catch (e) {
      console.error(e);
      setErro("Falha ao salvar produto.");
    }
  }

  async function inativarProduto(id) {
    setErro("");
    setOk("");
    try {
      await api.patch(`/api/produtos/${id}/inativar`);
      await carregarProdutosERanking();
      setOk("Produto inativado.");
    } catch (e) {
      console.error(e);
      setErro("Falha ao inativar.");
    }
  }

  // -------- Usuários --------
  async function carregarUsuarios() {
    setErro("");
    setOk("");
    const { data } = await api.get("/api/admin/usuarios");
    setUsuariosLista(Array.isArray(data) ? data : []);
  }

  async function salvarUsuario(e) {
    e.preventDefault();
    setErro("");
    setOk("");
    try {
      await api.post("/api/admin/usuarios", formUsuario);
      setFormUsuario({
        nome: "",
        email: "",
        senha: "",
        id_grupo: "CLIENTE",
        documento: "",
      });
      await carregarUsuarios();
      if (formUsuario.id_grupo === "CLIENTE") await carregarClientes();
      if (formUsuario.id_grupo === "ANALISTA") await carregarAnalistas();
      setOk("Usuário criado.");
    } catch (e) {
      console.error(e);
      setErro("Falha ao criar usuário.");
    }
  }

  async function desativarUsuarioPorId(id) {
    setErro("");
    setOk("");
    try {
      await api.delete(`/api/admin/usuarios/${id}`);
      await carregarUsuarios();
      await carregarClientes();
      await carregarAnalistas();
      setOk("Usuário desativado.");
    } catch (e) {
      console.error(e);
      setErro("Falha ao desativar.");
    }
  }

  // -------- Clientes / Analistas --------
  async function carregarClientes() {
    const { data } = await api.get("/api/admin/clientes");
    setClientesLista(Array.isArray(data) ? data : []);
  }
  async function carregarAnalistas() {
    const { data } = await api.get("/api/admin/analistas");
    setAnalistasLista(Array.isArray(data) ? data : []);
  }

  // -------- Feedbacks (somente leitura) --------
  async function carregarFeedbacks() {
    const { data } = await api.get("/api/admin/feedbacks", {
      params: {
        id_produto: filtroFb.id_produto || undefined,
        id_cliente: filtroFb.id_cliente || undefined,
      },
    });
    setFeedbacks(Array.isArray(data) ? data : []);
  }

  // -------- Logs (MongoDB) --------
  async function carregarLogsHuman(page = paginacao.page) {
    const { data } = await api.get("/api/admin/logs/human", {
      params: {
        page,
        limit: paginacao.limit,
        role: filtroLogs.role || undefined, // ADMIN | ANALISTA | CLIENTE
        action: filtroLogs.action || undefined, // opcional
        dt_ini: filtroLogs.dt_ini || undefined,
        dt_fim: filtroLogs.dt_fim || undefined,
      },
    });
    // data.items = [{ whenIso, message }]
    setLogs(Array.isArray(data.items) ? data.items : []);
    setPaginacao({ page: data.page, limit: data.limit, total: data.total });
  }

  // UI
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h2 className="text-xl font-semibold">Painel do administrador</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{usuario?.nome}</span>
          <button className="text-sm text-red-600" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* abas */}
        <div className="flex gap-2">
          {[
            "produtos",
            "usuarios",
            "clientes",
            "analistas",
            "feedbacks",
            "logs",
          ].map((k) => (
            <button
              key={k}
              onClick={() => setAba(k)}
              className={`px-3 py-2 rounded-md text-sm ${
                aba === k ? "bg-blue-600 text-white" : "bg-white border"
              }`}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        {(erro || ok) && (
          <div
            className={`px-4 py-2 text-sm rounded-md ${
              erro
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {erro || ok}
          </div>
        )}

        {/* -------- ABA PRODUTOS -------- */}
        {aba === "produtos" && (
          <>
            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">
                Cadastro de produtos
              </h3>
              <form
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                onSubmit={criarProduto}
              >
                <div>
                  <label className="block text-sm mb-1">Nome do produto</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={formProduto.nome_produto}
                    onChange={(e) =>
                      setFormProduto((s) => ({
                        ...s,
                        nome_produto: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Categoria</label>
                  <input
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={formProduto.categoria}
                    onChange={(e) =>
                      setFormProduto((s) => ({
                        ...s,
                        categoria: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Produtos ativos</h3>
              {carregandoProdutos ? (
                <p className="text-sm text-slate-500 px-2 py-2">
                  Carregando...
                </p>
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
                              onClick={() => inativarProduto(p.id_produto)}
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
                <p className="text-sm text-slate-500 px-2 py-2">
                  Carregando...
                </p>
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
          </>
        )}

        {/* -------- ABA USUÁRIOS -------- */}
        {aba === "usuarios" && (
          <>
            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Criar usuário</h3>
              <form
                className="grid grid-cols-1 md:grid-cols-5 gap-4"
                onSubmit={salvarUsuario}
              >
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Nome"
                  value={formUsuario.nome}
                  onChange={(e) =>
                    setFormUsuario((s) => ({ ...s, nome: e.target.value }))
                  }
                  required
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Email"
                  value={formUsuario.email}
                  onChange={(e) =>
                    setFormUsuario((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Senha"
                  type="password"
                  value={formUsuario.senha}
                  onChange={(e) =>
                    setFormUsuario((s) => ({ ...s, senha: e.target.value }))
                  }
                  required
                />
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={formUsuario.id_grupo}
                  onChange={(e) =>
                    setFormUsuario((s) => ({ ...s, id_grupo: e.target.value }))
                  }
                >
                  <option value="CLIENTE">CLIENTE</option>
                  <option value="ANALISTA">ANALISTA</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Documento (se cliente)"
                  value={formUsuario.documento}
                  onChange={(e) =>
                    setFormUsuario((s) => ({ ...s, documento: e.target.value }))
                  }
                />
                <div className="md:col-span-5 flex justify-end">
                  <button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">
                    Salvar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Usuários</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Grupo</th>
                      <th className="px-3 py-2 text-left">Ativo</th>
                      <th className="px-3 py-2 text-left">Cliente?</th>
                      <th className="px-3 py-2 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosLista.map((u) => (
                      <tr key={u.id_usuario} className="border-b">
                        <td className="px-3 py-2">{u.nome}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2">{u.id_grupo}</td>
                        <td className="px-3 py-2">{u.ativo ? "Sim" : "Não"}</td>
                        <td className="px-3 py-2">
                          {u.id_cliente ? "Sim" : "Não"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                            onClick={() => desativarUsuarioPorId(u.id_usuario)}
                          >
                            Desativar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usuariosLista.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-3 text-center text-slate-500"
                        >
                          Sem usuários.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* -------- ABA CLIENTES -------- */}
        {aba === "clientes" && (
          <section className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Clientes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Documento</th>
                    <th className="px-3 py-2 text-left">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesLista.map((c) => (
                    <tr key={c.id_usuario} className="border-b">
                      <td className="px-3 py-2">{c.nome}</td>
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2">{c.documento || "-"}</td>
                      <td className="px-3 py-2">{c.ativo ? "Sim" : "Não"}</td>
                    </tr>
                  ))}
                  {clientesLista.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-3 text-center text-slate-500"
                      >
                        Sem clientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -------- ABA ANALISTAS -------- */}
        {aba === "analistas" && (
          <section className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-4">Analistas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {analistasLista.map((a) => (
                    <tr key={a.id_usuario} className="border-b">
                      <td className="px-3 py-2">{a.nome}</td>
                      <td className="px-3 py-2">{a.email}</td>
                      <td className="px-3 py-2">{a.ativo ? "Sim" : "Não"}</td>
                    </tr>
                  ))}
                  {analistasLista.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-3 text-center text-slate-500"
                      >
                        Sem analistas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* -------- ABA FEEDBACKS (read-only) -------- */}
        {aba === "feedbacks" && (
          <>
            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Filtros</h3>
              <form
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  carregarFeedbacks();
                }}
              >
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="ID do produto (opcional)"
                  value={filtroFb.id_produto}
                  onChange={(e) =>
                    setFiltroFb((s) => ({ ...s, id_produto: e.target.value }))
                  }
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="ID do cliente (opcional)"
                  value={filtroFb.id_cliente}
                  onChange={(e) =>
                    setFiltroFb((s) => ({ ...s, id_cliente: e.target.value }))
                  }
                />
                <div className="flex items-end">
                  <button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">
                    Buscar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Feedbacks</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left">Cliente</th>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Nota</th>
                      <th className="px-3 py-2 text-left">Comentário curto</th>
                      <th className="px-3 py-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((f) => (
                      <tr key={f.id_feedback} className="border-b">
                        <td className="px-3 py-2">
                          {f.nome_cliente} ({f.id_cliente})
                        </td>
                        <td className="px-3 py-2">
                          {f.nome_produto} ({f.id_produto})
                        </td>
                        <td className="px-3 py-2">{f.nota}</td>
                        <td className="px-3 py-2">{f.comentario_curto}</td>
                        <td className="px-3 py-2">
                          {new Date(f.data_feedback).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-3 text-center text-slate-500"
                        >
                          Sem feedbacks.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* -------- ABA LOGS (MongoDB) -------- */}
        {aba === "logs" && (
          <>
            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Filtros de logs</h3>
              <form
                className="grid grid-cols-1 md:grid-cols-6 gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPaginacao((p) => ({ ...p, page: 1 }));
                  carregarLogsHuman(1);
                }}
              >
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filtroLogs.role || ""}
                  onChange={(e) =>
                    setFiltroLogs((s) => ({ ...s, role: e.target.value || "" }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="ANALISTA">ANALISTA</option>
                  <option value="CLIENTE">CLIENTE</option>
                </select>
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Ação (ex.: ADMIN_PRODUTO_CRIADO)"
                  value={filtroLogs.action || ""}
                  onChange={(e) =>
                    setFiltroLogs((s) => ({ ...s, action: e.target.value }))
                  }
                />
                <input
                  type="datetime-local"
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filtroLogs.dt_ini || ""}
                  onChange={(e) =>
                    setFiltroLogs((s) => ({ ...s, dt_ini: e.target.value }))
                  }
                />
                <input
                  type="datetime-local"
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filtroLogs.dt_fim || ""}
                  onChange={(e) =>
                    setFiltroLogs((s) => ({ ...s, dt_fim: e.target.value }))
                  }
                />
                <div className="md:col-span-2 flex items-end">
                  <button className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">
                    Buscar
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Histórico de ações</h3>
              <ul className="space-y-2">
                {logs.map((l, idx) => (
                  <li
                    key={l.whenIso || idx}
                    className="text-sm bg-slate-50 border rounded px-3 py-2"
                  >
                    {l.message}
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="text-sm text-slate-500">Sem registros.</li>
                )}
              </ul>

              <div className="flex items-center gap-3 mt-3">
                <button
                  className="px-3 py-1 rounded border"
                  disabled={paginacao.page <= 1}
                  onClick={() => {
                    const p = Math.max(1, paginacao.page - 1);
                    setPaginacao((s) => ({ ...s, page: p }));
                    carregarLogsHuman(p);
                  }}
                >
                  Anterior
                </button>
                <span className="text-sm">
                  Página {paginacao.page} de{" "}
                  {Math.max(1, Math.ceil(paginacao.total / paginacao.limit))}
                </span>
                <button
                  className="px-3 py-1 rounded border"
                  disabled={
                    paginacao.page >=
                    Math.ceil(paginacao.total / paginacao.limit)
                  }
                  onClick={() => {
                    const p = paginacao.page + 1;
                    setPaginacao((s) => ({ ...s, page: p }));
                    carregarLogsHuman(p);
                  }}
                >
                  Próxima
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
