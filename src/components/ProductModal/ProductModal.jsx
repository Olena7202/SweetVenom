import { cardPhoto, cutawayPhoto, detailPhoto, wholeCakePhoto } from "../../data/cakePhotos";
import { createPortal } from "react-dom";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBiscuits,
  getCreams,
  saveCakeCustomization,
  saveFavoriteCake
} from "../../services/cakeService";
import { getCurrentUser } from "../../services/authStorage";

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

function buildWeightOptions(baseWeightKg) {
  const presets = ["0.5", "0.8", "1", "1.2", "1.5", "2", "2.5", "3"];
  const merged = [formatWeightOption(baseWeightKg), ...presets.map(formatWeightOption)];
  return Array.from(new Set(merged)).sort((a, b) => Number(a) - Number(b));
}

function CakeDetailMedia({ product }) {
  const source = product.photoUrl || product.image;
  const whole = wholeCakePhoto(source);
  const cut = cutawayPhoto(source) || cardPhoto(source);
  const [view, setView] = useState("whole");
  const [loaded, setLoaded] = useState({});
  const [failed, setFailed] = useState(false);
  const hasPair = whole && cut && whole !== cut && !failed;
  const primary = hasPair ? whole : cardPhoto(source) || detailPhoto(source);
  const ready = hasPair && loaded[whole] && loaded[cut];
  const showCut = ready && view === "cut";

  function markLoaded(event) {
    const src = event.currentTarget.getAttribute("src");
    setLoaded((previous) => ({ ...previous, [src]: true }));
  }

  return (
    <div className="product-dialog-media">
      <div className="dessert-view-stage" data-view={showCut ? "cut" : "whole"} role="img" aria-label={`${product.name}${hasPair ? (showCut ? " — розріз" : " — цілий торт") : ""}`}>
        <img key={primary} src={primary} alt="" aria-hidden="true" className="modal-image dessert-view-whole" onLoad={markLoaded} onError={(event) => {
          setFailed(true);
          const fallback = detailPhoto(source);
          if (!event.currentTarget.dataset.fallback && primary !== fallback) {
            event.currentTarget.dataset.fallback = "true";
            event.currentTarget.src = fallback;
          }
        }} />
        {hasPair && <img src={cut} alt="" aria-hidden="true" className="modal-image dessert-view-cut" onLoad={markLoaded} onError={() => setFailed(true)} />}
      </div>
      {hasPair && <div className="dessert-view-switch" role="group" aria-label="Вигляд торта">
        <span className="dessert-view-indicator" data-view={showCut ? "cut" : "whole"} aria-hidden="true" />
        <button type="button" aria-pressed={!showCut} onClick={() => setView("whole")}>Цілий</button>
        <button type="button" aria-pressed={!!showCut} disabled={!ready} onClick={() => setView("cut")}>Розріз</button>
      </div>}
    </div>
  );
}

export default function ProductModal({ product, onClose }) {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!product) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button")?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const nodes = [...dialogRef.current.querySelectorAll('button, input, select, textarea, a[href]')].filter((node) => !node.disabled && node.getClientRects().length);
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [product, onClose]);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [biscuits, setBiscuits] = useState([]);
  const [creams, setCreams] = useState([]);
  const [biscuitId, setBiscuitId] = useState("");
  const [creamId, setCreamId] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [weightValue, setWeightValue] = useState(() =>
    product ? formatWeightOption(parseWeightKg(product.weight, 1)) : "1"
  );
  const [clientComment, setClientComment] = useState("");
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!product || !showCustomizer) {
      return;
    }

    let cancelled = false;
    startTransition(() => {
      if (!cancelled) {
        setOptionsLoading(true);
        setOptionsError("");
      }
    });

    Promise.all([getBiscuits(), getCreams()])
      .then(([bList, cList]) => {
        if (cancelled) return;
        const b = Array.isArray(bList) ? bList : [];
        const c = Array.isArray(cList) ? cList : [];
        setBiscuits(b);
        setCreams(c);
        if (b.length) setBiscuitId(String(b[0].id));
        if (c.length) setCreamId(String(c[0].id));
      })
      .catch(() => {
        if (!cancelled) {
          setOptionsError(
            "Не вдалося завантажити варіанти. Перевір, що бекенд запущений."
          );
          setBiscuits([]);
          setCreams([]);
          setBiscuitId("");
          setCreamId("");
        }
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Fetch options by cake id; full product object not needed for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- product?.id + showCustomizer drive refetch
  }, [product?.id, showCustomizer]);

  const selectedBiscuit = useMemo(
    () => biscuits.find((b) => String(b.id) === String(biscuitId)),
    [biscuits, biscuitId]
  );
  const selectedCream = useMemo(
    () => creams.find((c) => String(c.id) === String(creamId)),
    [creams, creamId]
  );

  const basePrice = product ? num(product.basePrice ?? product.price) : 0;
  const baseWeightKg = product ? parseWeightKg(product.weight, 1) : 1;
  const weightOptions = useMemo(() => buildWeightOptions(baseWeightKg), [baseWeightKg]);
  const selectedWeightKg = parseWeightKg(weightValue, baseWeightKg);
  const weightAdjustedBasePrice = Math.round(basePrice * (selectedWeightKg / baseWeightKg));
  const liveTotalPrice = Math.max(0, weightAdjustedBasePrice);
  const extrasTotal =
    showCustomizer && selectedBiscuit && selectedCream
      ? num(selectedBiscuit.extraPrice) + num(selectedCream.extraPrice)
      : 0;
  const totalWithCustom = liveTotalPrice + extrasTotal;
  const canCustomize = biscuits.length > 0 && creams.length > 0;

  if (!product) {
    return null;
  }

  const ingredients = Array.isArray(product.ingredients)
    ? product.ingredients
    : product.ingredients
      ? String(product.ingredients).split(",")
      : [];
  const imageUrl = detailPhoto(product.photoUrl || product.image);

  function createOrderDraft() {
    const usedCustom = showCustomizer && canCustomize;
    const draft = {
      cakeId: product.id,
      cakeName: product.name,
      basePrice,
      baseWeightKg,
      selectedWeightKg,
      weightOptions,
      biscuitId: usedCustom && selectedBiscuit ? selectedBiscuit.id : null,
      creamId: usedCustom && selectedCream ? selectedCream.id : null,
      biscuitName: usedCustom ? (selectedBiscuit?.name ?? "") : "",
      creamName: usedCustom ? (selectedCream?.name ?? "") : "",
      extraBiscuit: usedCustom && selectedBiscuit ? num(selectedBiscuit.extraPrice) : 0,
      extraCream: usedCustom && selectedCream ? num(selectedCream.extraPrice) : 0,
      weight: `${selectedWeightKg.toFixed(1)} кг`,
      note: clientComment.trim(),
      totalPrice: usedCustom ? totalWithCustom : liveTotalPrice
    };
    return draft;
  }

  function handleOrderClick() {
    navigate("/order", { state: { orderDraft: createOrderDraft() } });
    onClose();
  }

  function ensureClientUser() {
    if (!currentUser || currentUser.role !== "client") {
      setActionError("Щоб зберегти торт у кошик, увійдіть до кабінету клієнта.");
      return false;
    }
    return true;
  }

  function handleSaveChanges() {
    if (!ensureClientUser()) return;

    const usedCustom = showCustomizer && canCustomize;
    const customization = saveCakeCustomization({
      clientId: currentUser.id,
      cakeId: product.id,
      biscuitId: usedCustom ? selectedBiscuit?.id : null,
      biscuitName: usedCustom ? selectedBiscuit?.name : "",
      creamId: usedCustom ? selectedCream?.id : null,
      creamName: usedCustom ? selectedCream?.name : "",
      note: clientComment.trim(),
      totalPrice: usedCustom ? totalWithCustom : liveTotalPrice
    });

    setActionError("");
    setSuccessMessage(
      customization.biscuitName || customization.creamName
        ? "Зміни збережено. Ці параметри підставляться для цього торта."
        : "Зміни збережено."
    );
  }

  function handleLikeCake() {
    if (!ensureClientUser()) return;

    const usedCustom = showCustomizer && canCustomize;
    const result = saveFavoriteCake({
      clientId: currentUser.id,
      cake: {
        id: product.id,
        name: product.name,
        photoUrl: imageUrl,
        basePrice: usedCustom ? totalWithCustom : liveTotalPrice
      },
      customization: createOrderDraft()
    });

    setActionError("");
    setSuccessMessage(
      result.alreadyExists
        ? "Цей торт уже є в кошику."
        : "Торт додано до кошика."
    );
    navigate("/client#saved-cakes");
    onClose();
  }

  return createPortal(
    <div className="modal-overlay product-dialog-overlay" onClick={onClose}>
      <div className="modal-content product-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="dessert-dialog-title" onClick={(event) => event.stopPropagation()}>
        <button className="close-btn" onClick={onClose} type="button" aria-label="Закрити">
          ×
        </button>

        <CakeDetailMedia key={`${product.id}-${product.photoUrl || product.image}`} product={product} />
        <div className="product-dialog-details">
        <h2 id="dessert-dialog-title">{product.name}</h2>
        <p>{product.description}</p>
        <p className="modal-price-line">
          <strong>Ціна:</strong> {basePrice} грн
        </p>
        <p>
          <strong>Вага:</strong> {selectedWeightKg.toFixed(1)} кг
        </p>

        <h4 className="modal-composition-title">Склад торта</h4>
        {ingredients.length > 0 ? (
          <ul className="modal-composition-list">
            {ingredients.map((ingredient, index) => (
              <li key={`${index}-${ingredient}`}>{ingredient.trim()}</li>
            ))}
          </ul>
        ) : (
          <p className="modal-muted">Склад не вказано. Зазначте побажання до начинки в коментарі до замовлення.</p>
        )}

        {showCustomizer ? (
          <section className="modal-customize" aria-labelledby="customize-heading">
            <h4 id="customize-heading">Параметри торта</h4>
            <p className="modal-customize-hint">
              Оберіть вагу, бісквіт і крем. Вартість оновиться автоматично.
            </p>

            <div className="modal-field-group">
              <label htmlFor="modal-weight">Вага торта</label>
              <select
                id="modal-weight"
                className="modal-select"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
              >
                {weightOptions.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight} кг
                  </option>
                ))}
              </select>
            </div>

            {optionsLoading ? <p className="modal-muted">Завантаження варіантів…</p> : null}
            {optionsError ? <p className="modal-error">{optionsError}</p> : null}

            {canCustomize ? (
              <>
                <div className="modal-field-group">
                  <label htmlFor="modal-biscuit">Бісквіт</label>
                  <select
                    id="modal-biscuit"
                    className="modal-select"
                    value={biscuitId}
                    onChange={(e) => setBiscuitId(e.target.value)}
                  >
                    {biscuits.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                        {num(b.extraPrice) > 0 ? ` (+${num(b.extraPrice)} грн)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-field-group">
                  <label htmlFor="modal-cream">Крем</label>
                  <select
                    id="modal-cream"
                    className="modal-select"
                    value={creamId}
                    onChange={(e) => setCreamId(e.target.value)}
                  >
                    {creams.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {num(c.extraPrice) > 0 ? ` (+${num(c.extraPrice)} грн)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="modal-total-price">
                  <strong>Разом з обраними змінами:</strong> {totalWithCustom} грн
                </p>
              </>
            ) : (
              <p className="modal-total-price">
                <strong>Разом з обраними змінами:</strong> {liveTotalPrice} грн
              </p>
            )}

            <div className="modal-field-group">
              <label htmlFor="modal-client-comment">Коментар до торта</label>
              <textarea
                id="modal-client-comment"
                value={clientComment}
                onChange={(e) => setClientComment(e.target.value)}
                placeholder="Наприклад: менше цукру, напис на торті, побажання до декору"
              />
            </div>
          </section>
        ) : null}

        <div className="modal-actions">
          <div className="modal-actions-top">
            {!showCustomizer ? (
              <button
                type="button"
                className="modal-change-btn modal-change-btn--in-actions"
                onClick={() => setShowCustomizer(true)}
              >
                Додати побажання
              </button>
            ) : (
              <button
                type="button"
                className="modal-change-btn modal-change-btn-muted modal-change-btn--in-actions"
                onClick={() => {
                  setShowCustomizer(false);
                  setOptionsError("");
                }}
              >
                Сховати зміни
              </button>
            )}
            {showCustomizer && <button type="button" className="modal-secondary-btn" onClick={handleSaveChanges}>Зберегти зміни</button>}
            <button type="button" className="modal-secondary-btn" onClick={handleLikeCake}>
              Зберегти в кошик
            </button>
          </div>
          <div className="modal-actions-bottom">
            <button type="button" className="modal-primary-btn" onClick={handleOrderClick}>
              Оформити замовлення
            </button>
          </div>
        </div>
        {successMessage ? <p className="modal-success">{successMessage}</p> : null}
        {actionError ? <p className="modal-error" role="alert">{actionError}</p> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
