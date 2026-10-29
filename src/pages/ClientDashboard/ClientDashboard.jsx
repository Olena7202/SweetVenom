import { splitOrderNote } from "../../utils/orderContact";
import Navbar from "../../components/NavBar/NavBar";
import { cardPhoto } from "../../data/cakePhotos";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../services/authStorage";
import { removeFavoriteCake } from "../../services/cakeService";
import { useClientOrdersData } from "../../hooks/useClientOrders";
import { statusMeta, normalizeStatus, formatDate } from "../../utils/orderViewModel";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [activeTab,setActiveTab]=useState(() => window.location.hash === "#saved-cakes" ? "saved" : "orders");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(null);
  const [savedCakesTick, setSavedCakesTick] = useState(0);
  const user = getCurrentUser();
  const orderNote = splitOrderNote(selectedOrder?.note);
  const orderPhone = selectedOrder?.contactPhone || orderNote.phone;
  const { orders, savedCakes, loadingOrders, ordersUnavailable } = useClientOrdersData(user?.id, savedCakesTick);

  const activeOrders = orders.filter((order) => !["Delivered","Cancelled"].includes(normalizeStatus(order.status))).length;
  const completedOrders = orders.filter((order) => normalizeStatus(order.status) === "Delivered").length;


  function handleTabKey(event) {
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
   event.preventDefault();
   const next=event.key==="Home"?"orders":event.key==="End"?"saved":activeTab==="orders"?"saved":"orders";
   setActiveTab(next);
   document.getElementById(next==="orders"?"client-orders-tab":"client-saved-tab")?.focus();
  }
  function handleRemoveSaved(cake) {
    if (!user?.id || cake?.id == null) return;
    removeFavoriteCake(user.id, cake.id);
    setSavedCakesTick((n) => n + 1);
  }

  function handleOrderCake(cake) {
    navigate("/order", {
      state: {
        orderDraft: {
          ...cake.customization,
          cakeId: cake.id,
          cakeName: cake.name,
          cakeImage: cake.image,
          basePrice: cake.customization?.basePrice ?? cake.price,
          totalPrice: cake.price,
          biscuitName: cake.customization?.biscuitName || "",
          creamName: cake.customization?.creamName || "",
          biscuitId: cake.customization?.biscuitId ?? null,
          creamId: cake.customization?.creamId ?? null,
        },
      },
    });
  }

  function handleSelectOrder(order, index) {
    setSelectedOrder(order);
    setSelectedOrderIndex(index);
  }

  function handleCloseModal() {
    setSelectedOrder(null);
    setSelectedOrderIndex(null);
  }

  if (!user) {
    return null;
  }

  return (
    <div className="client-workspace"><Navbar /><main className="client-dashboard">

      <section className="client-hero-panel" aria-label="Мій профіль">
       <div className="client-avatar" aria-hidden="true">{(user.fullName||"Клієнт").split(/s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("")}</div>
       <div className="client-identity"><span>Мій кабінет</span><h2>{user.fullName||"Клієнт"}</h2><p>{user.email||""}</p></div>
       <Link className="client-catalog-link" to="/#catalog">Обрати десерт <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
      </section>

      <section className="client-stats-grid" aria-label="Моя статистика">
        <article className="client-stat-tile">
          <span>Активні замовлення</span>
          <strong>{activeOrders}</strong>
        </article>
        <article className="client-stat-tile">
          <span>Виконані замовлення</span>
          <strong>{completedOrders}</strong>
        </article>
        <article className="client-stat-tile">
          <span>Кошик</span>
          <strong>{savedCakes.length}</strong>
        </article>
      </section>


      <nav className="client-tabs" role="tablist" aria-label="Розділи мого кабінету">
       <button type="button" id="client-orders-tab" role="tab" aria-selected={activeTab==="orders"} aria-controls="client-orders-panel" tabIndex={activeTab==="orders"?0:-1} onClick={()=>setActiveTab("orders")} onKeyDown={handleTabKey}>Мої замовлення <span>{orders.length}</span></button>
       <button type="button" id="client-saved-tab" role="tab" aria-selected={activeTab==="saved"} aria-controls="saved-cakes" tabIndex={activeTab==="saved"?0:-1} onClick={()=>setActiveTab("saved")} onKeyDown={handleTabKey}>Кошик <span>{savedCakes.length}</span></button>
      </nav>

      <section className="client-section" id="client-orders-panel" role="tabpanel" aria-labelledby="client-orders-tab" hidden={activeTab!=="orders"} tabIndex={0}>
        <div className="client-section-heading">
          <h3>Мої замовлення</h3>
          <span>{orders.length} усього</span>
        </div>

        {ordersUnavailable && <p className="client-data-message" role="status">Не вдалося оновити замовлення із сервера. Спробуйте перезавантажити сторінку.</p>}
        {loadingOrders && orders.length===0 ? <p className="client-data-message" role="status">Завантажуємо замовлення…</p> : orders.length === 0 ? (
          <div className="client-empty-state">
            <svg className="client-empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M15 22h34l3 33H12l3-33ZM24 24V16a8 8 0 0 1 16 0v8M26 39c3 5 9 5 12 0"/></svg><h4>Замовлень поки немає</h4>
            <p>Оберіть торт у каталозі та оформіть замовлення. Тут можна буде перевірити його статус.</p>
            <Link className="secondary-btn" to="/#catalog">Обрати десерт
            </Link>
          </div>
        ) : (
          <div className="client-orders-list">
            {orders.map((order, index) => {
              const status = normalizeStatus(order.status);
              const meta = statusMeta[status] || statusMeta.Pending;
              const orderNumber = Number(order.id)>0?order.id:orders.length-index;

              return (
                <button
                  key={order.id}
                  type="button"
                  className="client-order-card client-order-button"
                  onClick={() => handleSelectOrder(order, orderNumber)}
                >
                  <div>
                    <span className="client-order-id">#{orderNumber}</span>
                    <h4>{order.cakeName || "Замовлення"}</h4>
                  </div>
                  <p className="client-order-date"><span>Оформлено</span>{formatDate(order.date)}</p>
                  <span className={`client-status-badge ${meta.className}`}>{meta.label}</span>
                  <strong>{order.total} грн</strong>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="client-section" id="saved-cakes" role="tabpanel" aria-labelledby="client-saved-tab" hidden={activeTab!=="saved"} tabIndex={0}>
        <div className="client-section-heading">
          <h3>Кошик</h3>
          <span>{savedCakes.length} обрано</span>
        </div>

        {savedCakes.length === 0 ? (
          <div className="client-empty-state">
            <svg className="client-empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 53S9 39 9 22c0-14 18-19 23-5 5-14 23-9 23 5 0 17-23 31-23 31Z"/></svg><h4>Кошик поки порожній</h4>
            <p>Відкрийте торт у каталозі та натисніть «Зберегти в кошик». Він з’явиться в цьому розділі.</p>
            <Link className="secondary-btn" to="/#catalog">
              До вітрини
            </Link>
          </div>
        ) : (
          <div className="client-saved-grid">
            {savedCakes.map((cake) => (
              <article key={cake.id} className="client-saved-card">
                <img src={cardPhoto(cake.image)||cake.image} alt={cake.name} loading="lazy" />
                <div>
                  <h4>{cake.name}</h4>
                  {cake.customization?.biscuitName || cake.customization?.creamName ? (
                    <small>
                      {cake.customization?.biscuitName || "Бісквіт не змінено"} /{" "}
                      {cake.customization?.creamName || "Крем не змінено"}
                    </small>
                  ) : null}
                  <p>{cake.price} грн</p>
                  {cake.customization?.weight && <small>Вага: {cake.customization.weight}</small>}
                  {cake.customization?.note && <p>Побажання: {cake.customization.note}</p>}
                  <div className="client-saved-card-actions">
                    <button type="button" className="client-saved-order-btn" onClick={() => handleOrderCake(cake)}>
                      Замовити
                    </button>
                    <button
                      type="button"
                      className="client-saved-remove-btn"
                      onClick={() => handleRemoveSaved(cake)}
                    >
                      Прибрати з кошика
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedOrder ? (
        <div className="client-order-modal-overlay" onClick={handleCloseModal}>
          <section className="client-order-modal client-details-dialog" role="dialog" aria-modal="true" aria-label="Деталі замовлення" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="client-order-modal-close"
              onClick={handleCloseModal}
              aria-label="Закрити"
            >
              x
            </button>
            <img
              src={cardPhoto(selectedOrder.cakeImage||"/images/your-custom-cake.jpg")||selectedOrder.cakeImage}
              alt={selectedOrder.cakeName || "Замовлений торт"}
            />
            <div className="client-order-modal-body">
              <span className="client-order-id">#{selectedOrderIndex}</span>
              <h3>{selectedOrder.cakeName || "Замовлення"}</h3>
              <p>Оформлено: {formatDate(selectedOrder.date)}</p><p>Дата видачі: {selectedOrder.deliveryDate?formatDate(selectedOrder.deliveryDate):"Уточнюється"}</p>
              <p>Кількість: {selectedOrder.quantity || 1}</p>
              <p>Базова ціна: {selectedOrder.cakeBasePrice || selectedOrder.total} грн</p>
              {selectedOrder.biscuitName ? <p>Бісквіт: {selectedOrder.biscuitName}</p> : null}
              {selectedOrder.creamName ? <p>Крем: {selectedOrder.creamName}</p> : null}

              {orderPhone && <div className="client-order-contact"><span>Телефон</span><a href={`tel:${orderPhone.replace(/[^+\d]/g,"")}`}>{orderPhone}</a></div>}
              {orderNote.comment && <div className="client-order-comment"><span>Побажання до замовлення</span><p>{orderNote.comment}</p></div>}
              <div className="client-order-modal-footer">
                <span
                  className={`client-status-badge ${
                    statusMeta[normalizeStatus(selectedOrder.status)]?.className ||
                    statusMeta.Pending.className
                  }`}
                >
                  {statusMeta[normalizeStatus(selectedOrder.status)]?.label || "Очікує підтвердження"}
                </span>
                <strong>{selectedOrder.total} грн</strong>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main></div>
  );
}
