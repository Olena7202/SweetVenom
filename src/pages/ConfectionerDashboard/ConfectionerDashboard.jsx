import { splitOrderNote } from "../../utils/orderContact";
import { studioDayKey, studioTodayOrders, isClosedStudioOrder } from "../../utils/studioSchedule";
import Navbar from "../../components/NavBar/NavBar";
import { cardPhoto } from "../../data/cakePhotos";
import { startTransition, useMemo, useState, useEffect } from "react";
import { getOrders, updateOrderStatus } from "../../services/orderService";
import {
  applyConfectionerCakeEdits,
  createCake,
  ensureConfectionerCakeIds,
  getCakes,
  getCategories,
  removeConfectionerCake,
  saveConfectionerCakeEdit
} from "../../services/cakeService";
import { getConfectionerProfile, getCurrentUser } from "../../services/authStorage";

const statusLabels = { All: "Усі", Pending: "Нові", Accepted: "Прийняті", "In Progress": "У роботі", Ready: "Готові", Delivered: "Виконані" };
function statusLabel(value) { return statusLabels[value || "Pending"] || value; }

function orderCakeName(order) {
  return order.orderItems?.[0]?.cake?.name || order.cake?.name || "Замовлення";
}

function orderCakePhoto(order) {
  const photo = order.orderItems?.[0]?.cake?.photoUrl || order.cake?.photoUrl;
  return cardPhoto(photo) || photo || "https://via.placeholder.com/320x200?text=Cake";
}

function formatUaDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("uk-UA");
  } catch {
    return "-";
  }
}

function formatUaDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
}

function normalizeOrderItems(order) {
  const items = order?.orderItems;
  if (Array.isArray(items) && items.length > 0) return items;
  if (order?.cake) {
    return [
      {
        id: "legacy",
        cake: order.cake,
        quantity: 1,
        itemPrice: order.totalPrice,
        biscuit: null,
        cream: null
      }
    ];
  }
  return [];
}

function itemCakeLabel(item) {
  return item?.cake?.name || "Позиція";
}

function paymentStatusLabel(value) {
  if (!value) return "-";
  const map = {
    Unpaid: "Не оплачено",
    Paid: "Оплачено",
    Partial: "Часткова оплата",
    Refunded: "Повернено"
  };
  return map[value] || value;
}

/** Показуємо номер для людини: справжній Id з БД, або порядковий 1…N у списку (якщо Id = 0). */
function orderDisplayNo(order, sortedList) {
  const id = Number(order?.id);
  if (Number.isFinite(id) && id > 0) return id;
  const idx = sortedList.findIndex((o) => o === order);
  return idx >= 0 ? idx + 1 : 1;
}

/** Розбір рядка Ingredients з БД у рядки для редактора. */
function splitIngredientLines(raw) {
  if (raw == null || !String(raw).trim()) return [""];
  const parts = String(raw)
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [""];
}

/** Перша літера рядка - мала (перелік інгредієнтів без «з великої» кожного пункту). */
function ingredientLineLowerFirstLetter(line) {
  const s = String(line).trim();
  if (!s) return s;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (!/\p{L}/u.test(ch)) continue;
    const lower = ch.toLocaleLowerCase("uk-UA");
    if (lower === ch) return s;
    return s.slice(0, i) + lower + s.slice(i + 1);
  }
  return s;
}

function joinIngredientLines(lines) {
  return lines.map((s) => String(s).trim()).filter(Boolean).join("\n");
}

function ConfectionerCakePhotoSlot({ photoUrl, isEditingCake }) {
  const [loadFailed, setLoadFailed] = useState(false);
  const showImg = Boolean(photoUrl) && !loadFailed;

  return (
    <div className="confectioner-cake-photo-frame">
      {showImg ? (
        <img
          src={photoUrl}
          alt=""
          className="confectioner-cake-photo-frame-img"
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <div
          className="confectioner-cake-photo-placeholder"
          role="img"
          aria-label={isEditingCake ? "Місце для фото торта" : "Фото торта ще не додано"}
        >
          <span className="confectioner-cake-photo-placeholder-graphic" aria-hidden />
          <span className="confectioner-cake-photo-placeholder-title">
            {isEditingCake ? "Місце для фото" : "Фото ще немає"}
          </span>
          <span className="confectioner-cake-photo-placeholder-sub">
            {isEditingCake
              ? "Додай посилання на зображення в полі нижче - тут з’явиться прев’ю."
              : "Додай URL у режимі редагування, щоб показати фото тут."}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ConfectionerDashboard() {
  const confectioner = getCurrentUser();
  const [activeTab, setActiveTab] = useState("orders");
  const [studioNow, setStudioNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setStudioNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  const [orders, setOrders] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [selectedCake, setSelectedCake] = useState(null);
  const [isEditingCake, setIsEditingCake] = useState(false);
  const [cakeForm, setCakeForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    weight: "",
    photoUrl: "",
    categoryId: "",
    isAvailable: true
  });
  const [isNewCake, setIsNewCake] = useState(false);
  const [categories, setCategories] = useState([]);
  const [ingredientLines, setIngredientLines] = useState([""]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [cakeSort, setCakeSort] = useState("new");
  const [toastMessage, setToastMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!confectioner?.id) {
      startTransition(() => setLoading(false));
      return;
    }

    Promise.allSettled([getOrders(), getCakes(), getCategories()])
      .then(([ordersResult, cakesResult, categoriesResult]) => {
        const normalizedOrders =
          ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
            ? ordersResult.value
            : [];
        const normalizedCakes =
          cakesResult.status === "fulfilled" && Array.isArray(cakesResult.value)
            ? cakesResult.value
            : [];
        const normalizedCategories =
          categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value)
            ? categoriesResult.value
            : [];

        if (ordersResult.status === "rejected" || cakesResult.status === "rejected") {
          setErrorMessage("Не вдалося завантажити дані. Перевір підключення до сервера.");
        } else {
          setErrorMessage("");
        }

        setCategories(normalizedCategories);

        const allowedCakeIds = ensureConfectionerCakeIds(confectioner.id, normalizedCakes);
        const ownedCakes = normalizedCakes.filter((cake) => allowedCakeIds.includes(Number(cake.id)));
        const ownedCakesWithEdits = applyConfectionerCakeEdits(confectioner.id, ownedCakes);
        const ownedCakeIds = new Set(ownedCakesWithEdits.map((cake) => Number(cake.id)));

        setOrders(
          normalizedOrders.filter((order) => {
            const orderCakeId = order.orderItems?.[0]?.cake?.id ?? order.cake?.id;
            return orderCakeId ? ownedCakeIds.has(Number(orderCakeId)) : true;
          })
        );
        setCakes(ownedCakesWithEdits);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [confectioner?.id]);

  const handleStatusChange = async (orderId, status) => {
    try {
      setStatusSavingId(orderId);
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } finally {
      setStatusSavingId(null);
    }
  };

  const orderStatusOptions = ["Pending", "Accepted", "In Progress", "Ready", "Delivered"];
  const orderFilterOptions = ["All", ...orderStatusOptions];

  const ordersSorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders]);

  const activeOrdersCount = orders.filter(
    (order) => !["Ready", "Delivered"].includes(order.status)
  ).length;
  const readyOrdersCount = orders.filter((order) => order.status === "Ready").length;
  const completedOrdersCount = orders.filter((order) => order.status === "Delivered").length;
  const totalRevenue = orders
    .filter((order) => order.status === "Delivered")
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  const availableCakes = cakes.filter((cake) => cake.isAvailable !== false);
  const confectionerProfile = getConfectionerProfile(confectioner?.id);

  const confectionerName = confectioner?.fullName || "Кондитер";
  const confectionerEmail = confectioner?.email || "email not set";
  const confectionerTelegram = confectionerProfile?.telegram || confectioner?.telegram || "Не вказано";
  const confectionerPhone =
    confectionerProfile?.phone || confectioner?.phone || "";
  const telegramLink =
    confectionerTelegram && confectionerTelegram !== "Не вказано"
      ? confectionerTelegram.startsWith("http")
        ? confectionerTelegram
        : `https://t.me/${confectionerTelegram.replace(/^@/, "")}`
      : "";

  const statusClassMap = {
    Ready: "status-delivered",
    Delivered: "status-delivered",
    "In Progress": "status-progress",
    Accepted: "status-progress",
    Pending: "status-pending"
  };

  const todayOrders = studioTodayOrders(ordersSorted, studioNow);
  const todayLabel = new Intl.DateTimeFormat("uk-UA", { timeZone:"Europe/Kyiv", day:"numeric", month:"long" }).format(studioNow);
  function deliveryLabel(order) {
    const key = studioDayKey(order.deliveryDate);
    if (!key) return "Не вказано";
    const [year, month, day] = key.split("-");
    return `${day}.${month}.${year}`;
  }
  function dueClass(order) {
    if (isClosedStudioOrder(order)) return "";
    const key = studioDayKey(order.deliveryDate);
    const today = studioDayKey(studioNow);
    return key && key < today ? "is-overdue" : key === today ? "is-today" : "";
  }
  function handleTabKey(event) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "orders" : event.key === "End" ? "cakes" : activeTab === "orders" ? "cakes" : "orders";
    setActiveTab(next);
    event.currentTarget.parentElement.querySelector(`[data-studio-tab="${next}"]`)?.focus();
  }
  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return ordersSorted;
    return ordersSorted.filter((order) => (order.status || "Pending") === statusFilter);
  }, [ordersSorted, statusFilter]);

  const modalOrder = useMemo(() => {
    if (selectedOrder == null) return null;
    return (
      orders.find((o) => o === selectedOrder || Number(o.id) === Number(selectedOrder.id)) ??
      selectedOrder
    );
  }, [orders, selectedOrder]);

  const orderNote = splitOrderNote(modalOrder?.note);
  const orderPhone = orderNote.phone || modalOrder?.client?.phone || "";

  const orderDetailLines = useMemo(
    () => (modalOrder ? normalizeOrderItems(modalOrder) : []),
    [modalOrder]
  );

  const modalDisplayNo = useMemo(
    () => (modalOrder ? orderDisplayNo(modalOrder, ordersSorted) : null),
    [modalOrder, ordersSorted]
  );

  const sortedCakes = useMemo(() => {
    const list = [...availableCakes];
    if (cakeSort === "priceAsc") return list.sort((a, b) => Number(a.basePrice || 0) - Number(b.basePrice || 0));
    if (cakeSort === "priceDesc") return list.sort((a, b) => Number(b.basePrice || 0) - Number(a.basePrice || 0));
    if (cakeSort === "name") return list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "uk"));
    return list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [availableCakes, cakeSort]);

  const fromCakePhoto = selectedCake?.photoUrl != null ? String(selectedCake.photoUrl).trim() : "";
  const fromFormPhoto = cakeForm.photoUrl?.trim() || "";
  const cakeModalPhotoUrl = isEditingCake ? fromFormPhoto || fromCakePhoto : fromCakePhoto;

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  if (loading) {
    return (
      <div className="dashboard-page confectioner-dashboard"><Navbar />
        <div className="dashboard-skeleton-grid">
          {[1, 2, 3].map((item) => (
            <div key={item} className="dashboard-card">
              <div className="ui-skeleton ui-skeleton-media" />
              <div className="ui-skeleton ui-skeleton-line" />
              <div className="ui-skeleton ui-skeleton-line short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  function closeCakeModal() {
    setSelectedCake(null);
    setIsNewCake(false);
    setIsEditingCake(false);
    setIngredientLines([""]);
  }

  function handleOpenNewCake() {
    setSelectedOrder(null);
    setIsNewCake(true);
    setSelectedCake({
      id: null,
      name: "",
      description: "",
      basePrice: 0,
      weight: "",
      photoUrl: "",
      categoryId: categories[0]?.id ?? null,
      isAvailable: true,
      ingredients: ""
    });
    setCakeForm({
      name: "",
      description: "",
      basePrice: "",
      weight: "",
      photoUrl: "",
      categoryId: categories[0]?.id != null ? String(categories[0].id) : "",
      isAvailable: true
    });
    setIngredientLines([""]);
    setIsEditingCake(true);
  }

  function handleSelectCake(cake) {
    setSelectedOrder(null);
    setIsNewCake(false);
    setSelectedCake(cake);
    setIsEditingCake(false);
    setCakeForm({
      name: cake.name || "",
      description: cake.description || "",
      basePrice: String(cake.basePrice ?? ""),
      weight: cake.weight || "",
      photoUrl: cake.photoUrl || "",
      categoryId: cake.categoryId != null ? String(cake.categoryId) : "",
      isAvailable: cake.isAvailable !== false
    });
    setIngredientLines(splitIngredientLines(cake.ingredients));
  }

  function handleCakeFieldChange(field, value) {
    setCakeForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCakeCheckboxChange(checked) {
    setCakeForm((prev) => ({ ...prev, isAvailable: checked }));
  }

  function handleIngredientLineChange(index, value) {
    setIngredientLines((prev) => prev.map((line, i) => (i === index ? value : line)));
  }

  function handleAddIngredientLine() {
    setIngredientLines((prev) => [...prev, ""]);
  }

  function handleRemoveIngredientLine(index) {
    setIngredientLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleCancelCakeEdit() {
    if (isNewCake) {
      closeCakeModal();
      return;
    }
    if (!selectedCake) return;
    setCakeForm({
      name: selectedCake.name || "",
      description: selectedCake.description || "",
      basePrice: String(selectedCake.basePrice ?? ""),
      weight: selectedCake.weight || "",
      photoUrl: selectedCake.photoUrl || "",
      categoryId: selectedCake.categoryId != null ? String(selectedCake.categoryId) : "",
      isAvailable: selectedCake.isAvailable !== false
    });
    setIngredientLines(splitIngredientLines(selectedCake.ingredients));
    setIsEditingCake(false);
  }

  async function handleSaveCake() {
    if (!confectioner?.id) return;
    const name = cakeForm.name.trim();
    if (!name) {
      setToastMessage("Вкажи назву торта");
      return;
    }

    const ingredientsJoined = joinIngredientLines(ingredientLines);
    if (ingredientsJoined.length > 500) {
      setToastMessage("Склад занадто довгий (макс. 500 символів). Скороти список інгредієнтів.");
      return;
    }

    const payload = {
      name,
      description: cakeForm.description.trim() || null,
      basePrice: Number(cakeForm.basePrice) || 0,
      weight: cakeForm.weight.trim() || null,
      photoUrl: cakeForm.photoUrl.trim() || null,
      categoryId: cakeForm.categoryId ? Number(cakeForm.categoryId) : null,
      isAvailable: Boolean(cakeForm.isAvailable),
      isCustomizable: true,
      ingredients: ingredientsJoined || null
    };

    try {
      if (isNewCake) {
        const created = await createCake(payload);
        const catId = created?.categoryId ?? payload.categoryId;
        const withCategory = {
          ...created,
          category:
            created?.category ?? categories.find((c) => Number(c.id) === Number(catId)) ?? null
        };
        setCakes((prev) => {
          const id = withCategory?.id;
          if (!id) return prev;
          return [withCategory, ...prev.filter((c) => Number(c.id) !== Number(id))];
        });
        setToastMessage("Торт додано в асортимент");
        closeCakeModal();
        return;
      }

      if (!selectedCake?.id) return;
      await saveConfectionerCakeEdit(confectioner.id, selectedCake.id, payload);
      setCakes((prev) =>
        prev.map((cake) =>
          Number(cake.id) === Number(selectedCake.id)
            ? {
                ...cake,
                ...payload,
                category: categories.find((c) => Number(c.id) === Number(payload.categoryId)) ?? cake.category
              }
            : cake
        )
      );
      setSelectedCake((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
              category: categories.find((c) => Number(c.id) === Number(payload.categoryId)) ?? prev.category
            }
          : prev
      );
      setIsEditingCake(false);
      setToastMessage("Зміни торта збережено");
    } catch {
      setToastMessage("Не вдалося зберегти торт. Перевір сервер.");
    }
  }

  function handleDeleteCake() {
    if (!confectioner?.id || !selectedCake?.id) return;
    const shouldDelete = window.confirm(
      `Видалити торт "${selectedCake.name || "Без назви"}" з кабінету кондитера?`
    );
    if (!shouldDelete) return;

    removeConfectionerCake(confectioner.id, selectedCake.id);
    setCakes((prev) => prev.filter((cake) => Number(cake.id) !== Number(selectedCake.id)));
    closeCakeModal();
    setToastMessage("Торт видалено з кабінету");
  }

  return (
    <div className="dashboard-page confectioner-dashboard"><Navbar />

        <div className="confectioner-cabinet-stack">
<article className="confectioner-about-card">
              <div className="studio-avatar" aria-hidden="true">{confectionerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</div><div className="studio-identity"><p className="profile-label">Кондитер</p>
              <h3>{confectionerName}</h3>
              <p className="profile-email">{confectionerEmail}</p></div>
              <div className="confectioner-contact-list">
                {telegramLink ? (
                  <a href={telegramLink} target="_blank" rel="noreferrer" className="confectioner-contact-chip">
                    Telegram: {confectionerTelegram}
                  </a>
                ) : (
                  <span className="confectioner-contact-chip">Telegram: {confectionerTelegram}</span>
                )}
                {confectionerPhone ? (
                  <span className="confectioner-contact-chip">Телефон: {confectionerPhone}</span>
                ) : null}
              </div>
            </article>
          <article className="confectioner-stats-strip confectioner-stats-strip--full" aria-label="Підсумки замовлень">
            <div className="client-stat-card">
              <span>Активні</span>
              <strong>{activeOrdersCount}</strong>
            </div>
            <div className="client-stat-card">
              <span>Готові</span>
              <strong>{readyOrdersCount}</strong>
            </div>
            <div className="client-stat-card">
              <span>Виконані</span>
              <strong>{completedOrdersCount}</strong>
            </div>
            <div className="client-stat-card">
              <span>Дохід (виконані)</span>
              <strong>{totalRevenue} грн</strong>
            </div>
          </article>

        <nav className="studio-tabs" role="tablist" aria-label="Розділи кабінету">
          <button type="button" role="tab" id="studio-orders-tab" aria-controls="studio-orders-panel" aria-selected={activeTab === "orders"} tabIndex={activeTab === "orders" ? 0 : -1} data-studio-tab="orders" onKeyDown={handleTabKey} onClick={() => setActiveTab("orders")}>Замовлення <span>{orders.length}</span></button>
          <button type="button" role="tab" id="studio-cakes-tab" aria-controls="studio-cakes" aria-selected={activeTab === "cakes"} tabIndex={activeTab === "cakes" ? 0 : -1} data-studio-tab="cakes" onKeyDown={handleTabKey} onClick={() => setActiveTab("cakes")}>Мої торти <span>{cakes.length}</span></button>
        </nav>
        <div className="confectioner-studio-layout">

          <div className="confectioner-studio-right-stack">
            <div id="studio-orders-panel" className="studio-orders-panel" role="tabpanel" aria-labelledby="studio-orders-tab" tabIndex={0} hidden={activeTab !== "orders"}>
              <section className="studio-today" aria-labelledby="studio-today-heading">
                <div className="studio-today-head"><div><h3 id="studio-today-heading">На сьогодні <span>{todayLabel}</span></h3><p>{todayOrders.length ? "Приготуй і передай клієнтам ці замовлення." : "На сьогодні немає замовлень до видачі."}</p></div><span className="studio-today-count">До видачі: {todayOrders.length}</span></div>
                {todayOrders.length > 0 && <div className="studio-today-grid">{todayOrders.map((order, index) => <button type="button" className="studio-today-order" key={order.id || index} onClick={() => { setSelectedCake(null); setSelectedOrder(order); }}><span className="studio-today-number">№{orderDisplayNo(order, ordersSorted)}</span><strong>{orderCakeName(order)}</strong><span>{order.client?.fullName || order.client?.name || "Клієнт"}</span><span className={`order-status-chip ${statusClassMap[order.status] || "status-pending"}`}>{statusLabel(order.status)}</span></button>)}</div>}
              </section>
            <article className="confectioner-orders-card" id="studio-orders">
              <h3>Замовлення клієнтів</h3>
              <div className="confectioner-order-filters">
                {orderFilterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`confectioner-filter-btn ${statusFilter === option ? "is-active" : ""}`}
                    onClick={() => setStatusFilter(option)}
                  >
                    {statusLabel(option)}
                  </button>
                ))}
              </div>
              <div className="confectioner-order-columns" aria-hidden="true"><span>Замовлення</span><span>Дата видачі</span><span>Статус</span><span>Сума</span></div><div className="confectioner-orders-compact-list">
                {filteredOrders.length === 0 ? <p>За цим фільтром замовлень немає.</p> : null}
                {filteredOrders.map((order, rowIdx) => (
                  <button
                    key={
                      Number(order?.id) > 0
                        ? `id-${order.id}`
                        : `ord-${rowIdx}-${order.createdAt || ""}-${orderCakeName(order)}`
                    }
                    type="button"
                    className="confectioner-order-summary"
                    aria-label={`Деталі замовлення №${orderDisplayNo(order, ordersSorted)}`}
                    onClick={() => {
                      setSelectedCake(null);
                      setSelectedOrder(order);
                    }}
                  >
                    <div>
                      <span className="confectioner-order-summary-id">
                        №{orderDisplayNo(order, ordersSorted)}
                      </span>
                      <h4>{orderCakeName(order)}</h4>
                    </div>
                    <p className={`studio-due-date ${dueClass(order)}`}><span><span className="studio-due-label">Видача: </span>{deliveryLabel(order)}</span>{dueClass(order) === "is-today" && <small>Сьогодні</small>}{dueClass(order) === "is-overdue" && <small>Прострочено</small>}</p>
                    <span className={`order-status-chip ${statusClassMap[order.status] || "status-pending"}`}>
                      {statusLabel(order.status)}
                    </span>
                    <strong>{order.totalPrice ?? "-"} грн</strong>
                  </button>
                ))}
              </div>
            </article>

            </div>
            <article className="confectioner-price-card" id="studio-cakes" role="tabpanel" aria-labelledby="studio-cakes-tab" tabIndex={0} hidden={activeTab !== "cakes"}>
              <div className="confectioner-price-card-head">
                <div><h3>Мої торти</h3><p className="confectioner-section-hint">Ціни, склад і наявність у вітрині.</p></div>
                <button type="button" className="confectioner-add-cake-btn" onClick={handleOpenNewCake}>
                  + Додати торт
                </button>
              </div>
              <div className="confectioner-order-filters">
                <button
                  type="button"
                  className={`confectioner-filter-btn ${cakeSort === "new" ? "is-active" : ""}`}
                  onClick={() => setCakeSort("new")}
                >
                  Нові
                </button>
                <button
                  type="button"
                  className={`confectioner-filter-btn ${cakeSort === "name" ? "is-active" : ""}`}
                  onClick={() => setCakeSort("name")}
                >
                  Назва
                </button>
                <button
                  type="button"
                  className={`confectioner-filter-btn ${cakeSort === "priceAsc" ? "is-active" : ""}`}
                  onClick={() => setCakeSort("priceAsc")}
                >
                  Дешевші
                </button>
                <button
                  type="button"
                  className={`confectioner-filter-btn ${cakeSort === "priceDesc" ? "is-active" : ""}`}
                  onClick={() => setCakeSort("priceDesc")}
                >
                  Дорожчі
                </button>
              </div>
              <div className="confectioner-price-grid">
                {sortedCakes.map((cake) => (
                  <button
                    key={cake.id}
                    type="button"
                    className="confectioner-price-item"
                    onClick={() => handleSelectCake(cake)}
                  >
                    <img src={cardPhoto(cake.photoUrl) || cake.photoUrl || "https://via.placeholder.com/320x200?text=Cake"} alt={cake.name} />
                    <div>
                      <strong>{cake.name}</strong>
                      <span>{cake.basePrice ?? "-"} грн</span>
                    </div>
                  </button>
                ))}
              </div>
            </article>
          </div>
        </div>
        </div>
        {errorMessage ? <p className="ui-error-banner">{errorMessage}</p> : null}
        {activeTab === "cakes" && sortedCakes.length === 0 ? (
          <div className="dashboard-empty-state">
            <h4>Поки немає тортів у твоєму профілі</h4>
            <p>Додай торти в асортимент або зміни поточний набір у налаштуваннях кабінету.</p>
            <button type="button" className="primary-btn" onClick={() => setCakeSort("new")}>
              Оновити список
            </button>
          </div>
        ) : null}
        {toastMessage ? <div className="ui-toast">{toastMessage}</div> : null}

        {modalOrder ? (
          <div
            className="client-order-modal-overlay confectioner-order-modal-overlay"
            onClick={() => setSelectedOrder(null)}
          >
            <section
              className="client-order-modal confectioner-order-detail-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="client-order-modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label="Закрити"
              >
                ×
              </button>
              <div className="confectioner-order-modal-media">
                <img src={orderCakePhoto(modalOrder)} alt={orderCakeName(modalOrder)} />
              </div>
              <div className="client-order-modal-body confectioner-order-detail-body">
                <header className="confectioner-order-modal-hero">
                  <span className="confectioner-order-modal-eyebrow">Замовлення №{modalDisplayNo}</span>
                  <div className="confectioner-order-modal-title-row">
                    <h3>{orderCakeName(modalOrder)}</h3>
                    <span
                      className={`order-status-chip ${statusClassMap[modalOrder.status] || "status-pending"}`}
                    >
                      {statusLabel(modalOrder.status)}
                    </span>
                  </div>
                </header>

                <section className="confectioner-order-modal-block" aria-label="Терміни та сума">
                  <h4 className="confectioner-order-section-title">Терміни й оплата</h4>
                  <dl className="confectioner-order-kv-board">
                    <div className="confectioner-order-kv">
                      <dt>Сума замовлення</dt>
                      <dd>{modalOrder.totalPrice ?? "-"} грн</dd>
                    </div>
                    <div className="confectioner-order-kv">
                      <dt>Статус оплати</dt>
                      <dd>{paymentStatusLabel(modalOrder.paymentStatus)}</dd>
                    </div>
                    <div className="confectioner-order-kv">
                      <dt>Видача / доставка</dt>
                      <dd>{formatUaDate(modalOrder.deliveryDate)}</dd>
                    </div>
                    <div className="confectioner-order-kv">
                      <dt>Оформлено</dt>
                      <dd>{formatUaDateTime(modalOrder.createdAt)}</dd>
                    </div>
                  </dl>
                </section>

                <section className="confectioner-order-modal-block" aria-label="Клієнт">
                  <h4 className="confectioner-order-section-title">Клієнт</h4>
                  <dl className="confectioner-order-kv-board">
                    <div className="confectioner-order-kv">
                      <dt>Ім&apos;я</dt>
                      <dd>{modalOrder.client?.name || modalOrder.client?.fullName || "-"}</dd>
                    </div>
                    <div className="confectioner-order-kv">
                      <dt>Email</dt>
                      <dd>{modalOrder.client?.email || "-"}</dd>
                    </div>
                    {orderPhone ? (
                      <div className="confectioner-order-kv">
                        <dt>Телефон</dt>
                        <dd><a href={`tel:${orderPhone.replace(/[^+\d]/g,"")}`}>{orderPhone}</a></dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                <section className="confectioner-order-modal-block" aria-label="Позиції замовлення">
                  <h4 className="confectioner-order-section-title">Що готуємо</h4>
                  {orderDetailLines.length === 0 ? (
                    <p className="confectioner-order-empty-hint">Немає позицій у замовленні.</p>
                  ) : (
                    <div className="confectioner-order-line-items">
                      {orderDetailLines.map((item, idx) => (
                        <article key={item.id ?? `line-${idx}`} className="confectioner-order-line-item">
                          <div className="confectioner-order-line-head">
                            <span className="confectioner-order-line-badge">Позиція {idx + 1}</span>
                            <strong className="confectioner-order-line-title">{itemCakeLabel(item)}</strong>
                          </div>
                          <dl className="confectioner-order-kv-board confectioner-order-kv-board--tight">
                            <div className="confectioner-order-kv">
                              <dt>Кількість</dt>
                              <dd>{item.quantity ?? 1}</dd>
                            </div>
                            <div className="confectioner-order-kv">
                              <dt>Ціна позиції</dt>
                              <dd>
                                {item.itemPrice != null && item.itemPrice !== ""
                                  ? `${item.itemPrice} грн`
                                  : "-"}
                              </dd>
                            </div>
                            {item.biscuit?.name ? (
                              <div className="confectioner-order-kv confectioner-order-kv--wide">
                                <dt>Бісквіт</dt>
                                <dd>
                                  {item.biscuit.name}
                                  {Number(item.biscuit.extraPrice) > 0
                                    ? ` · +${item.biscuit.extraPrice} грн`
                                    : ""}
                                </dd>
                              </div>
                            ) : null}
                            {item.cream?.name ? (
                              <div className="confectioner-order-kv confectioner-order-kv--wide">
                                <dt>Крем</dt>
                                <dd>
                                  {item.cream.name}
                                  {Number(item.cream.extraPrice) > 0 ? ` · +${item.cream.extraPrice} грн` : ""}
                                </dd>
                              </div>
                            ) : null}
                            {item.cake?.weight ? (
                              <div className="confectioner-order-kv">
                                <dt>Вага (каталог)</dt>
                                <dd>{item.cake.weight}</dd>
                              </div>
                            ) : null}
                            {item.cake?.ingredients ? (
                              <div className="confectioner-order-kv confectioner-order-kv--block">
                                <dt>Склад</dt>
                                <dd>
                                  <ul className="confectioner-order-ingredients-list">
                                    {splitIngredientLines(item.cake.ingredients).map((line, ingIdx) => (
                                      <li key={`${idx}-ing-${ingIdx}`}>
                                        {ingredientLineLowerFirstLetter(line)}
                                      </li>
                                    ))}
                                  </ul>
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {orderNote.comment ? (
                  <section className="confectioner-order-modal-block" aria-label="Коментар клієнта">
                    <h4 className="confectioner-order-section-title">Побажання до замовлення</h4>
                    <div className="confectioner-order-note-box">
                      <p className="confectioner-order-note-text">{orderNote.comment}</p>
                    </div>
                  </section>
                ) : null}

                <section className="confectioner-order-modal-block confectioner-order-modal-block--action">
                  <h4 className="confectioner-order-section-title">Статус виконання</h4>
                  <div className="confectioner-order-action-row">
                    <select
                      id="confectioner-order-status"
                      className="confectioner-order-status-select"
                      value={modalOrder.status || "Pending"}
                      onChange={(event) => {
                        const nextStatus = event.target.value;
                        if (nextStatus === (modalOrder.status || "Pending")) return;
                        const shouldApply = window.confirm(
                          `Змінити статус замовлення №${modalDisplayNo} на «${statusLabel(nextStatus)}»?`
                        );
                        if (!shouldApply) return;
                        handleStatusChange(modalOrder.id, nextStatus);
                        setToastMessage(`Статус замовлення №${modalDisplayNo} оновлено`);
                      }}
                      disabled={statusSavingId === modalOrder.id}
                      aria-label="Змінити статус замовлення"
                    >
                      {orderStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {statusLabel(option)}
                        </option>
                      ))}
                    </select>
                    {statusSavingId === modalOrder.id ? (
                      <span className="confectioner-order-saving">Збереження…</span>
                    ) : null}
                  </div>
                </section>

                <footer className="client-order-modal-footer confectioner-order-modal-footer">
                  <span className="confectioner-order-footer-label">До сплати</span>
                  <strong className="confectioner-order-footer-sum">{modalOrder.totalPrice ?? "-"} грн</strong>
                </footer>
              </div>
            </section>
          </div>
        ) : null}

        {selectedCake ? (
          <div className="modal-overlay studio-cake-overlay" onClick={closeCakeModal}>
            <div className="modal-content confectioner-cake-modal" role="dialog" aria-modal="true" aria-label={isNewCake ? "Новий торт" : selectedCake.name || "Деталі торта"} onClick={(event) => event.stopPropagation()}>
              <button className="close-btn" type="button" aria-label="Закрити торт" onClick={closeCakeModal}>
                ×
              </button>
              <ConfectionerCakePhotoSlot
                key={`${selectedCake?.id ?? "new"}-${cakeModalPhotoUrl}`}
                photoUrl={cardPhoto(cakeModalPhotoUrl) || cakeModalPhotoUrl}
                isEditingCake={isEditingCake}
              />
              <div className="studio-cake-details">
              {isEditingCake ? (
                <div className="confectioner-cake-edit-form">
                  <h2 className="confectioner-cake-modal-title">{isNewCake ? "Новий торт" : "Редагування"}</h2>
                  <div className="field-group">
                    <label htmlFor="cake-photo">Посилання на фото (URL)</label>
                    <input
                      id="cake-photo"
                      type="url"
                      value={cakeForm.photoUrl}
                      onChange={(event) => handleCakeFieldChange("photoUrl", event.target.value)}
                      placeholder="/images/my-cake.jpg"
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="cake-name">Назва</label>
                    <input
                      id="cake-name"
                      type="text"
                      value={cakeForm.name}
                      onChange={(event) => handleCakeFieldChange("name", event.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="cake-description">Опис</label>
                    <textarea
                      id="cake-description"
                      value={cakeForm.description}
                      onChange={(event) => handleCakeFieldChange("description", event.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="field-group">
                      <label htmlFor="cake-price">Ціна, грн</label>
                      <input
                        id="cake-price"
                        type="number"
                        min="0"
                        value={cakeForm.basePrice}
                        onChange={(event) => handleCakeFieldChange("basePrice", event.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="cake-weight">Вага</label>
                      <input
                        id="cake-weight"
                        type="text"
                        value={cakeForm.weight}
                        onChange={(event) => handleCakeFieldChange("weight", event.target.value)}
                        placeholder="напр. 1.2 кг"
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="cake-category">Категорія</label>
                    <select
                      id="cake-category"
                      value={cakeForm.categoryId}
                      onChange={(event) => handleCakeFieldChange("categoryId", event.target.value)}
                    >
                      <option value="">Без категорії</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group confectioner-checkbox-row">
                    <label htmlFor="cake-available">
                      <input
                        id="cake-available"
                        type="checkbox"
                        checked={Boolean(cakeForm.isAvailable)}
                        onChange={(event) => handleCakeCheckboxChange(event.target.checked)}
                      />
                      <span>Доступний для замовлення</span>
                    </label>
                  </div>
                  <div className="field-group confectioner-ingredients-editor">
                    <span className="confectioner-ingredients-label">Склад - кожен інгредієнт окремим рядком</span>
                    <div className="confectioner-ingredient-rows">
                      {ingredientLines.map((line, idx) => (
                        <div key={`ing-${idx}`} className="confectioner-ingredient-row">
                          <input
                            type="text"
                            value={line}
                            onChange={(event) => handleIngredientLineChange(idx, event.target.value)}
                            placeholder={`Інгредієнт ${idx + 1}`}
                            aria-label={`Інгредієнт ${idx + 1}`}
                          />
                          <button
                            type="button"
                            className="confectioner-ingredient-remove"
                            onClick={() => handleRemoveIngredientLine(idx)}
                            disabled={ingredientLines.length <= 1}
                            aria-label="Прибрати рядок"
                          >
                            -
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="confectioner-ingredient-add" onClick={handleAddIngredientLine}>
                      + Додати інгредієнт
                    </button>
                  </div>
                </div>
              ) : (
                <div className="confectioner-cake-view">
                  <h2>{selectedCake.name || "Торт"}</h2>
                  <p className="confectioner-cake-view-desc">{selectedCake.description || "Опис ще не додано."}</p>
                  <ul className="confectioner-cake-view-meta">
                    <li>
                      <span>Категорія</span> {selectedCake.category?.name || "-"}
                    </li>
                    <li>
                      <span>Вага</span> {selectedCake.weight || "-"}
                    </li>
                    <li>
                      <span>Ціна</span> {selectedCake.basePrice ?? "-"} грн
                    </li>
                    <li>
                      <span>Доступність</span>{" "}
                      {selectedCake.isAvailable === false ? "Недоступний" : "Доступний"}
                    </li>
                  </ul>
                  {splitIngredientLines(selectedCake.ingredients).some(Boolean) ? (
                    <div className="confectioner-cake-ingredients-view">
                      <h4>Склад</h4>
                      <ul>
                        {splitIngredientLines(selectedCake.ingredients)
                          .filter(Boolean)
                          .map((line, i) => (
                            <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                          ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="confectioner-cake-view-muted">Склад ще не заповнено.</p>
                  )}
                </div>
              )}
              <div className="actions-row confectioner-cake-modal-actions">
                {!isEditingCake && !isNewCake ? (
                  <button type="button" onClick={() => setIsEditingCake(true)}>
                    Редагувати торт
                  </button>
                ) : null}
                {isEditingCake ? (
                  <>
                    <button type="button" onClick={() => void handleSaveCake()}>
                      {isNewCake ? "Зберегти новий торт" : "Зберегти зміни"}
                    </button>
                    <button type="button" className="form-submit-secondary" onClick={handleCancelCakeEdit}>
                      Скасувати
                    </button>
                  </>
                ) : null}
                {!isNewCake && selectedCake?.id ? (
                  <button type="button" className="confectioner-delete-btn" onClick={handleDeleteCake}>
                    Видалити торт
                  </button>
                ) : null}
              </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
  );
}