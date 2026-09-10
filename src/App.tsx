import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TransIn from "./pages/TransIn";
import TransOut from "./pages/TransOut";
import History from "./pages/History";
import Master from "./pages/Master";
import Users from "./pages/Users";

// Protect route based on role
function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute roles={["PPIC", "IN", "OUT"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="in" element={
          <ProtectedRoute roles={["PPIC", "IN"]}>
            <TransIn />
          </ProtectedRoute>
        } />
        <Route path="out" element={
          <ProtectedRoute roles={["PPIC", "OUT"]}>
            <TransOut />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute roles={["PPIC", "IN", "OUT"]}>
            <History />
          </ProtectedRoute>
        } />
        <Route path="master" element={
          <ProtectedRoute roles={["PPIC"]}>
            <Master />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute roles={["PPIC"]}>
            <Users />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
