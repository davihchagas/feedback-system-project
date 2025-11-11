import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { api } from "../services/api.js";

export default function ClientePage() {
  const { usuario, logout } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({
    id_produto: "",
    nota: 5,
    comentario_curto: "",
    comentario_completo: "",
  });
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await api.get("/api/produtos");
    setProdutos(data);
  }

  async function enviarFeedback(e) {
    e.preventDefault();
    setMensagem("");

    try {
      await api.post("/api/feedbacks", {
        id_cliente: usuario.id_usuario, // associação simplificada
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
          <button
            className="text-sm text-red-600"
            onClick={logout}
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
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
      </main>
    </div>
  );
}
