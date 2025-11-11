import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    try {
      const usuario = await login(email, senha);
      if (usuario.id_grupo === "CLIENTE") navigate("/cliente");
      else if (usuario.id_grupo === "ANALISTA") navigate("/analista");
      else if (usuario.id_grupo === "ADMIN") navigate("/admin");
    } catch (err) {
      console.log(err)
      setErro("Falha ao autenticar");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">
          Sistema de Feedbacks
        </h1>
        {erro && <p className="text-red-500 text-sm">{erro}</p>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded-md px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input
            type="password"
            className="w-full border rounded-md px-3 py-2"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded-md bg-blue-600 text-white font-medium"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
