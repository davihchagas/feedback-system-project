import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ClientePage from "./pages/ClientePage.jsx";
import AnalistaPage from "./pages/AnalistaPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/cliente"
            element={
              <PrivateRoute roles={["CLIENTE"]}>
                <ClientePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/analista"
            element={
              <PrivateRoute roles={["ANALISTA"]}>
                <AnalistaPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["ADMIN"]}>
                <AdminPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
