import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export function PrivateRoute({ children, roles }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario.id_grupo)) return <Navigate to="/login" />;

  return children;
}
