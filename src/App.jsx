import ClientSettings from "./pages/ClientSettings/ClientSettings";
import ConfectionerSettings from "./pages/ConfectionerSettings/ConfectionerSettings";
import { Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Auth from "./pages/Auth/Auth";
import Order from "./pages/Order/Order";
import ClientDashboard from "./pages/ClientDashboard/ClientDashboard";
import ConfectionerDashboard from "./pages/ConfectionerDashboard/ConfectionerDashboard";
import RequireAuth from "./components/RequireAuth";
import { getCurrentUser, getDashboardPathByRole } from "./services/authStorage";

export default function App() {
  const currentUser = getCurrentUser();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/auth"
        element={
          currentUser ? <Navigate to={getDashboardPathByRole(currentUser.role)} replace /> : <Auth />
        }
      />
      <Route path="/order" element={<Order />} />
      <Route
        path="/client"
        element={
          <RequireAuth allowedRole="client">
            <ClientDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/confectioner"
        element={
          <RequireAuth allowedRole="confectioner">
            <ConfectionerDashboard />
          </RequireAuth>
        }
      />
      <Route path="/client/settings" element={<RequireAuth allowedRole="client"><ClientSettings /></RequireAuth>} />
      <Route path="/confectioner/settings" element={<RequireAuth allowedRole="confectioner"><ConfectionerSettings /></RequireAuth>} />
    </Routes>
  );
}
