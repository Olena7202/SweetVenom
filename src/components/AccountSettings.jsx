import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./NavBar/NavBar";
import ArrowIcon from "./ArrowIcon";
import { getCurrentUser, getConfectionerProfile, saveConfectionerProfile, saveAccountProfile } from "../services/authStorage";

export default function AccountSettings({ role }) {
  const user = getCurrentUser();
  const isConfectioner = role === "confectioner";
  const profile = user && isConfectioner ? getConfectionerProfile(user.id) : null;
  const current = { fullName:user?.fullName || "", email:user?.email || "", phone:user?.phone || profile?.phone || "", telegram:profile?.telegram || user?.telegram || "" };
  const [fields, setFields] = useState(current);
  const [notice, setNotice] = useState("");
  const [saving,setSaving]=useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  const dirty = fields.fullName.trim() !== current.fullName || fields.email.trim().toLowerCase() !== current.email.toLowerCase() || fields.phone.trim() !== current.phone || (isConfectioner && fields.telegram.trim() !== current.telegram);
  const initials = (fields.fullName.trim() || user.fullName || "Профіль").split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("");
  function change(key, value) { setFields(prev=>({...prev,[key]:value})); setNotice(""); setError(""); }
  function reset() { setFields(current); setNotice(""); setError(""); }
  async function submit(event) {
    event.preventDefault();
    const fullName = fields.fullName.trim();
    const phone = fields.phone.trim();
    const email = fields.email.trim().toLowerCase();
    if (saving) return;
    let telegram = fields.telegram.trim();
    if (fullName.length < 2) { setError("Вкажи ім’я щонайменше з двох символів."); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Вкажи коректний email."); return; }
    if (!phone || (!/^[+\d\s()-]+$/.test(phone) || phone.replace(/\D/g,"").length < 7 || phone.replace(/\D/g,"").length > 15)) { setError("Перевір номер телефону: від 7 до 15 цифр."); return; }
    if (isConfectioner && telegram) {
      telegram = telegram.replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i,"").replace(/^@/,"").replace(/\/$/,"");
      if (!/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) { setError("Вкажи Telegram у форматі @username або t.me/username (від 5 до 32 символів)."); return; }
      telegram = "@" + telegram;
    }

    setSaving(true); setError(""); setNotice("");
    try {
      const updated = await saveAccountProfile({fullName,email,phone});
      if (isConfectioner) saveConfectionerProfile({userId:user.id,phone:updated.phone,telegram});
      setFields({fullName:updated.fullName,email:updated.email,phone:updated.phone,telegram});
      setNotice("Контактні дані збережено. Для входу використовуй " + updated.email + ".");
    } catch (cause) {
      const data=cause.response?.data;
      const validation=data?.errors?Object.values(data.errors).flat().join(" "):"";
      setError(data?.message || (typeof data==="string"?data:"") || (cause.response?.status===404?"Онови сервер і спробуй ще раз: зміна профілю ще недоступна.":validation || "Не вдалося зберегти дані. Перевір підключення та спробуй ще раз."));
    } finally { setSaving(false); }
  }
  return <div className="account-settings-shell"><Navbar />
    <main className="account-settings-main">
      <Link className="account-settings-back" to={isConfectioner?"/confectioner":"/client"}><ArrowIcon direction="left" />До кабінету</Link>
      <header className="account-settings-heading"><h1>Налаштування <em>профілю.</em></h1><p>Твоє ім’я та контакти - усе потрібне в одному місці.</p></header>
      <div className="account-settings-grid">
        <form className="account-settings-form" onSubmit={submit}>
          <h2>{isConfectioner?"Контакти кондитера":"Особисті дані"}</h2>
          <div className="account-settings-field"><label htmlFor="account-name">{isConfectioner?"Ім’я або назва бренду":"Ім’я"}</label><input disabled={saving} id="account-name" name="fullName" value={fields.fullName} onChange={e=>change("fullName",e.target.value)} required minLength={2} maxLength={80} autoComplete="name" /></div>
          <div className="account-settings-field"><label htmlFor="account-email">Email <span>обов’язково</span></label><input disabled={saving} id="account-email" name="email" type="email" value={fields.email} onChange={e=>change("email",e.target.value)} required maxLength={100} autoComplete="email" /><p>Після збереження це буде твій email для входу.</p></div>
          <div className="account-settings-field"><label htmlFor="account-phone">Телефон <span>обов’язково</span></label><input disabled={saving} id="account-phone" name="phone" type="tel" required value={fields.phone} onChange={e=>change("phone",e.target.value)} maxLength={25} autoComplete="tel" placeholder="+380 68 123 45 67" /></div>
          {isConfectioner && <div className="account-settings-field"><label htmlFor="account-telegram">Telegram <span>необов’язково</span></label><input disabled={saving} id="account-telegram" name="telegram" value={fields.telegram} onChange={e=>change("telegram",e.target.value)} maxLength={80} placeholder="@username" autoComplete="off" /><p>З’явиться у твоєму профілі кондитера.</p></div>}
          <p className="account-settings-storage">Ім’я, email і телефон зберігаються в акаунті.{isConfectioner?" Telegram - у цьому браузері.":""}</p>
          {error && <p className="account-settings-error" role="alert">{error}</p>}
          {notice && <p className="account-settings-success" role="status">{notice}</p>}
          <div className="account-settings-actions"><button type="submit" disabled={!dirty || saving}>{saving?"Зберігаємо…":"Зберегти зміни"}</button><button type="button" onClick={reset} disabled={!dirty || saving}>Скасувати</button></div>
        </form>
        <aside className="account-settings-summary" aria-label="Твій профіль">
          <div className="account-settings-avatar" aria-hidden="true">{initials}</div>
          <h2>{fields.fullName.trim() || user.fullName || "Твій профіль"}</h2><p>{isConfectioner?"Кондитер":"Клієнт Sweet Venom"}</p>
          <div className="account-settings-email"><span>Email для входу</span><p className="account-email-value">{user.email || ""}</p><p>Онови email у формі контактних даних.</p></div>
        </aside>
      </div>
    </main>
  </div>;
}

