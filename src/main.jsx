import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ScrollToRoute from "./components/ScrollToRoute";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {import.meta.env.MODE === "demo" && <div className="demo-notice" role="status">Демонстраційна версія з тестовими кабінетами. Зміни зберігаються лише в цьому браузері. Замовлення не надсилаються кондитеру.</div>}
      <ScrollToRoute /><App />
    </BrowserRouter>
  </React.StrictMode>
);
