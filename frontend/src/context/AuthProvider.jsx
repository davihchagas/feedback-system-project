// src/context/AuthProvider.jsx
import { useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext.jsx";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem("usuario")) || null
  );
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  async function login(email, senha) {
    const { data } = await axios.post("http://localhost:4000/auth/login", {
      email,
      senha,
    });

    setUsuario(data.usuario);
    setToken(data.token);

    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    localStorage.setItem("token", data.token);

    return data.usuario;
  }

  function logout() {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
