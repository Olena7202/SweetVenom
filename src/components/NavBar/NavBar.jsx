import { startTransition, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, getDashboardPathByRole, logout } from "../../services/authStorage";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const accountPath = currentUser ? getDashboardPathByRole(currentUser.role) : "/auth";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    startTransition(() => setMenuOpen(false));
  }, [location.pathname]);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  }

  const isCabinet =
    location.pathname.startsWith("/client") || location.pathname.startsWith("/confectioner");
  const settingsPath =
    currentUser?.role === "confectioner" ? "/confectioner/settings" : "/client/settings";

  return (
    <header className="navbar">
      <Link to="/" className="logo" onClick={() => { if (location.pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        Sweet Venom
      </Link>

      <nav className="nav-links" aria-label="Основна навігація">
        <Link
          to="/#catalog"
          className={`nav-link ${location.pathname === "/" ? "nav-link-active" : ""}`}
        >
          Вітрина
        </Link>
        <Link to="/order" className="order-btn">
          Замовити
        </Link>

        {currentUser ? (
          <div className="account-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className={`account-btn account-menu-trigger ${isCabinet ? "nav-link-active" : ""}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Меню акаунта"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg className="account-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>
            {menuOpen ? (
              <div className="account-dropdown" role="menu">
                <Link to={accountPath} className="account-dropdown-item" role="menuitem">
                  Кабінет
                </Link>
                <Link to={settingsPath} className="account-dropdown-item" role="menuitem">
                  Налаштування
                </Link>
                <button type="button" className="account-dropdown-item" role="menuitem" onClick={handleLogout}>
                  Вийти
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link
            to="/auth"
            className={`account-btn ${location.pathname === "/auth" ? "nav-link-active" : ""}`}
            aria-label="Увійти"
          >
            <svg className="account-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
        )}
      </nav>
    </header>
  );
}
