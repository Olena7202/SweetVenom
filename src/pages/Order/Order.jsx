import { startTransition, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/NavBar/NavBar";
import SiteFooter from "../../components/SiteFooter/SiteFooter";
import { products } from "../../data/products";
import { createOrder } from "../../services/orderService";
import { getCurrentUser } from "../../services/authStorage";
import { getBiscuits, getCakes, getCreams } from "../../services/cakeService";

const CLIENT_ORDERS_KEY = "bakery_client_orders";

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseWeightKg(value, fallback = 1) {
  const raw = String(value ?? "").replace(",", ".").match(/[\d.]+/)?.[0];
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function formatWeightOption(value) {
  return parseWeightKg(value, 1).toFixed(1);
}

function buildWeightOptions(baseWeightKg, draftOptions = []) {
  const fallback = ["0.5", "0.8", "1", "1.2", "1.5", "2", "2.5", "3"];
  const options = Array.isArray(draftOptions) && draftOptions.length ? draftOptions : fallback;
  const merged = [formatWeightOption(baseWeightKg), ...options.map(formatWeightOption)];
  return Array.from(new Set(merged)).sort((a, b) => Number(a) - Number(b));
}

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.orderDraft;
  const currentUser = getCurrentUser();
  const [selectedDessert, setSelectedDessert] = useState(draft?.cakeId ? String(draft.cakeId) : "");
  const [availableCakes, setAvailableCakes] = useState([]);
  const [biscuits, setBiscuits] = useState([]);
  const [creams, setCreams] = useState([]);
  const [biscuitId, setBiscuitId] = useState(draft?.biscuitId ? String(draft.biscuitId) : "");
  const [creamId, setCreamId] = useState(draft?.creamId ? String(draft.creamId) : "");
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [selectedWeight, setSelectedWeight] = useState(
    draft?.selectedWeightKg ? String(draft.selectedWeightKg) : "1"
  );
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState(draft?.note || "");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const cakeOptions = useMemo(() => {
    if (availableCakes.length > 0) return availableCakes;
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      basePrice: product.price,
      weight: product.weight,
      photoUrl: product.photoUrl || product.image,
    }));
  }, [availableCakes]);

  const effectiveDessertId = selectedDessert || (draft?.cakeId ? String(draft.cakeId) : "");
  const selectedCake = useMemo(
    () => cakeOptions.find((product) => String(product.id) === String(effectiveDessertId)),
    [cakeOptions, effectiveDessertId]
  );

  const selectedBiscuit = useMemo(
    () => biscuits.find((item) => String(item.id) === String(biscuitId)),
    [biscuits, biscuitId]
  );
  const selectedCream = useMemo(
    () => creams.find((item) => String(item.id) === String(creamId)),
    [creams, creamId]
  );

  useEffect(() => {
    let cancelled = false;
    getCakes()
      .then((data) => {
        if (cancelled) return;
        const normalized = Array.isArray(data) ? data : [];
        setAvailableCakes(normalized);
      })
      .catch(() => {
        if (!cancelled) setAvailableCakes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      if (!cancelled) {
        setOptionsLoading(true);
        setOptionsError("");
      }
    });

    Promise.all([getBiscuits(), getCreams()])
      .then(([biscuitsData, creamsData]) => {
        if (cancelled) return;
        const nextBiscuits = Array.isArray(biscuitsData) ? biscuitsData : [];
        const nextCreams = Array.isArray(creamsData) ? creamsData : [];
        setBiscuits(nextBiscuits);
        setCreams(nextCreams);
        if (!biscuitId && nextBiscuits.length > 0) setBiscuitId(String(nextBiscuits[0].id));
        if (!creamId && nextCreams.length > 0) setCreamId(String(nextCreams[0].id));
      })
      .catch(() => {
        if (cancelled) return;
        setBiscuits([]);
        setCreams([]);
        setOptionsError("Не вдалося підвантажити бісквіти та креми.");
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load biscuits/creams once on mount
  }, []);

  const weightOptions = useMemo(
    () => buildWeightOptions(selectedCake?.weight ?? draft?.baseWeightKg ?? 1, draft?.weightOptions),
    [selectedCake, draft]
  );

  const priceSummary = useMemo(() => {
    if (!draft && !selectedCake) return null;
    const isUsingOriginalDraftCake =
      Boolean(draft?.cakeId) && String(effectiveDessertId) === String(draft.cakeId);
    const baseWeightKg = parseWeightKg(selectedCake?.weight ?? draft?.baseWeightKg, 1);
    const chosenWeightKg = parseWeightKg(selectedWeight, baseWeightKg);
    const basePrice = isUsingOriginalDraftCake
      ? num(draft?.basePrice ?? selectedCake?.basePrice ?? selectedCake?.price ?? 0)
      : num(selectedCake?.basePrice ?? selectedCake?.price ?? 0);
    const weightAdjustedBase = Math.round(basePrice * (chosenWeightKg / baseWeightKg));
    const extras = num(selectedBiscuit?.extraPrice) + num(selectedCream?.extraPrice);
    const perCake = Math.max(0, weightAdjustedBase + extras);
    const qty = Math.max(1, num(quantity) || 1);
    return {
      chosenWeightKg,
      perCake,
      total: perCake * qty,
      extras,
    };
  }, [draft, selectedCake, selectedWeight, quantity, selectedBiscuit, selectedCream, effectiveDessertId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!currentUser?.id) {
      setSubmitError("Спочатку увійди в акаунт, щоб оформити замовлення.");
      return;
    }

    const selectedProduct = selectedCake;
    const isUsingOriginalDraftCake =
      Boolean(draft?.cakeId) && String(effectiveDessertId) === String(draft.cakeId);
    const fallbackWeight = selectedProduct?.weight ?? "1";
    const baseWeightKg = parseWeightKg(draft?.baseWeightKg ?? fallbackWeight, 1);
    const chosenWeightKg = parseWeightKg(selectedWeight, baseWeightKg);
    const draftBasePrice = isUsingOriginalDraftCake
      ? num(draft?.basePrice ?? selectedProduct?.price ?? selectedProduct?.basePrice ?? 0)
      : num(selectedProduct?.basePrice ?? selectedProduct?.price ?? 0);
    const weightedBase = Math.round(draftBasePrice * (chosenWeightKg / baseWeightKg));
    const extras = num(selectedBiscuit?.extraPrice) + num(selectedCream?.extraPrice);
    const perCake = Math.max(0, weightedBase + extras);
    const qty = Math.max(1, num(quantity) || 1);
    const totalPrice = perCake * qty;
    const cakeId = selectedProduct?.id ?? draft?.cakeId ?? null;

    if (!cakeId) {
      setSubmitError("Обери десерт перед оформленням замовлення.");
      return;
    }

    const fullNote = [comment.trim(), phone.trim() ? `Телефон: ${phone.trim()}` : ""]
      .filter(Boolean)
      .join(" | ");

    const payload = {
      clientId: currentUser.id,
      totalPrice,
      note: fullNote,
      deliveryDate: deliveryDate || null,
      orderItems: [
        {
          cakeId,
          biscuitId: selectedBiscuit?.id ?? draft?.biscuitId ?? null,
          creamId: selectedCream?.id ?? draft?.creamId ?? null,
          quantity: qty,
          itemPrice: perCake,
        },
      ],
    };

    try {
      setIsSubmitting(true);
      const created = await createOrder(payload);

      // Зберігаємо в localStorage щоб дашборд показував назву і картинку
      const existing = JSON.parse(localStorage.getItem(CLIENT_ORDERS_KEY) || "[]");
      const newOrder = {
        id: created?.id || Date.now(),
        clientId: currentUser.id,
        cakeName: selectedProduct?.name || draft?.cakeName || "Замовлення",
        cakeImage:
          selectedProduct?.photoUrl ||
          selectedProduct?.image ||
          draft?.cakeImage ||
          "/images/your-custom-cake.jpg",
        total: totalPrice,
        date: new Date().toISOString(),
        status: "Pending",
        quantity: qty,
        cakeBasePrice: perCake,
        biscuitName: selectedBiscuit?.name || draft?.biscuitName || "",
        creamName: selectedCream?.name || draft?.creamName || "",
        note: fullNote,
      };
      localStorage.setItem(CLIENT_ORDERS_KEY, JSON.stringify([...existing, newOrder]));

      setSubmitSuccess("Замовлення успішно створено.");
      navigate("/client");
    } catch {
      setSubmitError("Не вдалося створити замовлення. Перевір, що бекенд запущений.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <Navbar />

      <div className="order-page">
        <div className="forms-layout">
          <section className="form-panel">
            <h1>Оформлення замовлення</h1>
            <p>
              Оберіть торт, вкажіть вагу, кількість і бажану дату.
              Додайте контактні дані та побажання до оформлення.
            </p>

            <div className="form-highlights">
              <div className="form-highlight">
                <strong>Склад і декор</strong>
                Вкажіть побажання до начинки, напису та оформлення в коментарі.
              </div>
              <div className="form-highlight">
                <strong>Бажана дата</strong>
                Оберіть дату, на яку потрібне замовлення.
              </div>
            </div>
          </section>

          <section className="order-card">
            <div className="form-header">
              <h2>Замовити десерт</h2>
              <p>Заповніть форму та перевірте дані перед надсиланням.</p>
            </div>

            {draft ? (
              <div className="order-draft-summary">
                <h3 className="order-draft-title">Обраний торт</h3>
                <p className="order-draft-cake">
                  <strong>{draft.cakeName}</strong>
                </p>
                {draft.biscuitName || draft.creamName ? (
                  <ul className="order-draft-list">
                    {draft.biscuitName ? (
                      <li>
                        Бісквіт: {draft.biscuitName}
                        {Number(draft.extraBiscuit) > 0 ? ` (+${draft.extraBiscuit} грн)` : ""}
                      </li>
                    ) : null}
                    {draft.creamName ? (
                      <li>
                        Крем: {draft.creamName}
                        {Number(draft.extraCream) > 0 ? ` (+${draft.extraCream} грн)` : ""}
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="order-draft-muted">
                    Побажання до складу та декору можна додати в коментарі.
                  </p>
                )}
                <p className="order-draft-total">
                  Орієнтовна сума:{" "}
                  <strong>{priceSummary ? priceSummary.total : draft.totalPrice} грн</strong>
                  {priceSummary && priceSummary.extras > 0 ? (
                    <span className="order-draft-base">
                      {" "}
                      (за 1 торт {priceSummary.perCake} грн, включно з доплатою за склад)
                    </span>
                  ) : null}
                </p>
                <p className="order-draft-muted">
                  Редагування доступне одразу тут: можна змінити торт, вагу, кількість, дату, коментар і склад.
                </p>
              </div>
            ) : null}

            <form className="order-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="dessert">Десерт</label>
                {draft && !selectedDessert ? (
                  <p id="dessert" className="order-draft-readonly">
                    {draft.cakeName}
                    <span className="order-draft-hint">
                      {" "}
                      - можна змінити нижче у випадаючому списку.
                    </span>
                  </p>
                ) : (
                  <select
                    id="dessert"
                    name="dessert"
                    value={selectedDessert}
                    onChange={(event) => setSelectedDessert(event.target.value)}
                  >
                    <option value="" disabled>
                      Оберіть десерт
                    </option>
                    {cakeOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="quantity">Кількість</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, num(event.target.value) || 1))}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="date">Дата</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="order-weight">Вага торта</label>
                <select
                  id="order-weight"
                  name="orderWeight"
                  value={selectedWeight}
                  onChange={(event) => setSelectedWeight(event.target.value)}
                >
                  {weightOptions.map((weight) => (
                    <option key={weight} value={weight}>
                      {weight} кг
                    </option>
                  ))}
                </select>
              </div>

              <div className="order-draft-summary">
                <h3 className="order-draft-title">Редагування складу</h3>
                <p className="order-draft-muted">
                  Оберіть поєднання бісквіта й крему на свій смак.
                </p>
                {optionsLoading ? <p className="order-draft-muted">Завантаження складу...</p> : null}
                {optionsError ? <p className="order-draft-muted">{optionsError}</p> : null}
                {!optionsLoading && !optionsError && (biscuits.length > 0 || creams.length > 0) ? (
                  <div className="form-row">
                    <div className="field-group">
                      <label htmlFor="order-biscuit">Бісквіт</label>
                      <select
                        id="order-biscuit"
                        name="orderBiscuit"
                        value={biscuitId}
                        onChange={(event) => setBiscuitId(event.target.value)}
                      >
                        {biscuits.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                            {num(item.extraPrice) > 0 ? ` (+${num(item.extraPrice)} грн)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="order-cream">Крем</label>
                      <select
                        id="order-cream"
                        name="orderCream"
                        value={creamId}
                        onChange={(event) => setCreamId(event.target.value)}
                      >
                        {creams.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                            {num(item.extraPrice) > 0 ? ` (+${num(item.extraPrice)} грн)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="field-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+380 67 123 45 67"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label htmlFor="comment">Коментар для кондитера</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Наприклад: менше цукру, напис на торті або пакування для подарунка"
                />
              </div>

              <button className="form-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Створюємо..." : "Підтвердити замовлення"}
              </button>
              {submitError ? <p className="ui-error-banner">{submitError}</p> : null}
              {submitSuccess ? <p className="ui-success-banner">{submitSuccess}</p> : null}
            </form>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
