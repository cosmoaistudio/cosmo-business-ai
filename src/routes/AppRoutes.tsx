import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Orders from "../pages/Orders";
import Customers from "../pages/Customers";
import AI from "../pages/AI";
import Settings from "../pages/Settings";
import Login from "../pages/Login";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        <Route
          path="/produtos"
          element={
            <AppLayout>
              <Products />
            </AppLayout>
          }
        />

        <Route
          path="/pedidos"
          element={
            <AppLayout>
              <Orders />
            </AppLayout>
          }
        />

        <Route
          path="/clientes"
          element={
            <AppLayout>
              <Customers />
            </AppLayout>
          }
        />

        <Route
          path="/ia"
          element={
            <AppLayout>
              <AI />
            </AppLayout>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}