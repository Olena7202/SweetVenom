import { Outlet } from "react-router-dom";
import Navbar from "../components/NavBar/NavBar";

export default function ClientCabinetLayout() {
  return (
    <div className="page">
      <Navbar />
      <Outlet />
    </div>
  );
}
