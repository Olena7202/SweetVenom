import { Link } from "react-router-dom";
import { getCurrentUser, getDashboardPathByRole } from "../../services/authStorage";

export default function SiteFooter() {
  const user = getCurrentUser();
  const cabinetPath = user ? getDashboardPathByRole(user.role) : "/auth";
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top-row">
          <div className="site-footer-brand">
            <span className="site-footer-logo">Sweet Venom</span>
          </div>

          <nav className="site-footer-nav" aria-label="Навігація в підвалі сайту">
            <Link to="/#catalog">Вітрина</Link>
            <Link to="/order">Замовити</Link>
            <Link to={user ? cabinetPath : "/auth"}>{user ? "Кабінет" : "Увійти"}</Link>
          </nav>
        </div>

        <div className="site-footer-bottom">
          <span className="site-footer-mark">Дизайн і розробка · demway</span>
          <p className="site-footer-copy">© {year} Sweet Venom</p>
        </div>
      </div>
    </footer>
  );
}
