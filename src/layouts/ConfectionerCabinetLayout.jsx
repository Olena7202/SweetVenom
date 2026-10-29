import { Outlet } from "react-router-dom";
import Navbar from "../components/NavBar/NavBar";

export default function ConfectionerCabinetLayout() {
  return (
    <div className="page">
      <Navbar />
      <Outlet />
    </div>
  );
}
