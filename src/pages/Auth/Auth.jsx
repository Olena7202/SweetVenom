import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/NavBar/NavBar";
import SiteFooter from "../../components/SiteFooter/SiteFooter";
import { getDashboardPathByRole, loginDemoUser, loginUser, registerUser } from "../../services/authStorage";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telegram, setTelegram] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const isDemo = import.meta.env.MODE === "demo";

  async function openDemo(role) {
    setDemoLoading(true);
    setErrorMessage("");
    const result = await loginDemoUser(role);
    setDemoLoading(false);
    if (!result.ok) { setErrorMessage(result.message); return; }
    navigate(getDashboardPathByRole(result.user.role), { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (isLogin) {
      const result = await loginUser({ email, password });
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      navigate(getDashboardPathByRole(result.user.role), { replace: true });
      return;
    }

    const result = await registerUser({ fullName, email, password, role, telegram });
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    navigate(getDashboardPathByRole(result.user.role), { replace: true });
  }

  return (
    <div className="page">
      <Navbar />

      <div className="auth-page">
        <div className="forms-layout">
          <section className="form-panel">
            <h1>Особистий кабінет</h1>
            <p>
              Увійдіть, щоб переглядати замовлення, перевіряти їхні статуси
              та зберігати торти з каталогу.
            </p>

            <div className="form-highlights">
              <div className="form-highlight">
                <strong>Мої замовлення</strong>
                Переглядайте склад, дату, вартість і статус замовлення.
              </div>
              <div className="form-highlight">
                <strong>Кошик</strong>
                Додавайте торти з каталогу до вподобаних, щоб знайти їх пізніше.
              </div>
            </div>
          </section>

          <section className="auth-card">
            {isDemo ? <>
              <div className="form-header">
                <h2>Демонстраційні кабінети</h2>
                <p>Оберіть роль для перегляду. Реєстрація та пароль не потрібні. Дані тестові, а зміни зберігаються лише в цьому браузері.</p>
              </div>
              <div className="auth-form">
                <button type="button" className="form-submit" disabled={demoLoading} onClick={() => openDemo("client")}>Відкрити кабінет клієнта</button>
                <button type="button" className="form-submit" disabled={demoLoading} onClick={() => openDemo("confectioner")}>Відкрити кабінет кондитера</button>
                {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
              </div>
            </> : <>
            <div className="form-header">
              <h2>{isLogin ? "Вхід до кабінету" : "Створення кабінету"}</h2>
              <p>
                {isLogin
                  ? "Введіть свої дані, щоб продовжити роботу."
                  : "Заповніть форму, щоб отримати доступ до особистого кабінету."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="field-group">
                  <label htmlFor="fullName">Ім&apos;я та прізвище</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Олена Коваленко"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
              )}

              <div className="field-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="hello@bakery.ua"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Введіть пароль"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {!isLogin && (
                <div className="field-group">
                  <label htmlFor="role">Роль</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="client">Клієнт</option>
                    <option value="confectioner">Кондитер</option>
                  </select>
                </div>
              )}

              {!isLogin && role === "confectioner" && (
                <>
                  <div className="field-group">
                    <label htmlFor="telegram">Telegram (username або посилання)</label>
                    <input
                      id="telegram"
                      type="text"
                      placeholder="@cake_master"
                      value={telegram}
                      onChange={(event) => setTelegram(event.target.value)}
                    />
                  </div>
                </>
              )}

              {errorMessage && <p className="form-error">{errorMessage}</p>}

              <button className="form-submit" type="submit">
                {isLogin ? "Увійти" : "Створити акаунт"}
              </button>
            </form>

            <p className="switch-auth">
              {isLogin ? "Ще не маєте акаунта?" : "Вже маєте акаунт?"}
              <button type="button" onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage("");
              }}>
                {isLogin ? " Зареєструватися" : " Увійти"}
              </button>
            </p>
            </>}
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
