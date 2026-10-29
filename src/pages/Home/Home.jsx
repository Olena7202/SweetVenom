import ArrowIcon from "../../components/ArrowIcon";
import HeroCakeCarousel from "../../components/HeroCakeCarousel";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/NavBar/NavBar";
import SiteFooter from "../../components/SiteFooter/SiteFooter";
import ProductCard from "../../components/ProductCard/ProductCard";
import ProductModal from "../../components/ProductModal/ProductModal";
import { getCakes } from "../../services/cakeService";
import { products as fallbackProducts } from "../../data/products";

function normalizeCake(cake) {
  return {
    ...cake,
    photoUrl: cake.photoUrl || cake.image,
    basePrice: cake.basePrice ?? cake.price,
    category: typeof cake.category === "object" && cake.category ? cake.category : { name: cake.category || "Десерти" },
    ingredients: Array.isArray(cake.ingredients) ? cake.ingredients.join(", ") : cake.ingredients,
  };
}

const questions = [
  ["Як замовити торт?", "Оберіть торт у каталозі, відкрийте його опис і натисніть «Оформити замовлення». У формі вкажіть вагу, кількість, бажану дату та контактні дані."],
  ["Як вказати побажання до складу й декору?", "У вікні торта натисніть «Додати побажання», щоб обрати доступні варіанти бісквіта та крему. Напис, оформлення й інші побажання додайте в коментарі до замовлення."],
  ["Де перевірити статус замовлення?", "Увійдіть до особистого кабінету й відкрийте розділ «Мої замовлення». Біля кожного замовлення вказано його поточний статус."],
];
export default function Home() {
  const [products, setProducts] = useState(() => fallbackProducts.map(normalizeCake));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [category, setCategory] = useState("Усі десерти");
  const [catalogState, setCatalogState] = useState("loading");
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { if (active) setCatalogState("demo"); }, 8000);
    getCakes().then((data) => {
      if (!active) return;
      setProducts((Array.isArray(data) ? data : []).filter((cake) => cake.isAvailable !== false).map(normalizeCake));
      setCatalogState("live");
    }).catch(() => { if (active) setCatalogState("demo"); }).finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.setAttribute("data-visible", "true"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -25px 0px" });
    pageRef.current?.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    const updateProgress = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${range > 0 ? window.scrollY / range : 0})`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    return () => { observer.disconnect(); window.removeEventListener("scroll", updateProgress); };
  }, []);

  const categories = ["Усі десерти", ...new Set(products.map((p) => p.category.name))];
  const filtered = useMemo(() => {
    const result = products.filter((p) => (category === "Усі десерти" || p.category.name === category));
    return result;
  }, [products, category]);

  function moveHero(event) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    heroRef.current.style.setProperty("--mouse-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 18}px`);
    heroRef.current.style.setProperty("--mouse-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * 14}px`);
  }
  function resetHero() {
    heroRef.current?.style.setProperty("--mouse-x", "0px");
    heroRef.current?.style.setProperty("--mouse-y", "0px");
  }

  return (
    <div className="page home-page sv-home paper-edition" ref={pageRef}>
      <div className="reading-progress" ref={progressRef} aria-hidden="true" />
      <div className="home-shell">
        <Navbar />
        <main>
          <section className="bakery-hero torn-section" ref={heroRef} onPointerMove={moveHero} onPointerLeave={resetHero} aria-labelledby="hero-title">
            <div className="hero-grain" aria-hidden="true" />
            <div className="bakery-hero-copy">

              <h1 id="hero-title">Торти<br />на замовлення<span className="hero-title-occasion">для ваших особливих моментів</span></h1>
              <p>Авторські десерти з ніжним смаком, якісних інгредієнтів і стильним дизайном для будь-якого свята.</p>
              <a className="paper-button" href="#catalog">Обрати десерт <ArrowIcon /></a>

            </div>
            <HeroCakeCarousel />
          </section>
          <section className="paper-catalog paper-section" id="catalog" aria-labelledby="catalog-title" data-reveal>
            <div className="paper-section-head"><div><h2 id="catalog-title">Каталог товарів</h2></div></div>
            <div className="paper-catalog-tools"><div className="sv-filters" aria-label="Категорії десертів">{categories.map((name) => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)} className={category === name ? "is-active" : ""}>{name}</button>)}</div></div>
            {catalogState !== "live" && <p className="sv-catalog-notice" role="status">{catalogState === "loading" ? "Оновлюємо каталог. Поки показано приклади тортів." : "Не вдалося оновити каталог. Показано приклади тортів; ціни й наявність можуть відрізнятися. Спробуйте оновити сторінку."}</p>}
            <div className="products-grid" key={category}>{filtered.map((product) => <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />)}</div>
            {filtered.length === 0 && <div className="sv-empty"><h3>У цій категорії поки немає тортів</h3><p>Оберіть іншу категорію або перегляньте весь каталог.</p><button className="paper-button" type="button" onClick={() => { setCategory("Усі десерти"); }}>Показати всі десерти <ArrowIcon /></button></div>}
          </section>

          <section className="occasion-section torn-section" data-reveal><div className="occasion-photo"><img src="/images/wedding-flower-cake.jpg" alt="Торт із квітами" loading="lazy" /></div><div className="occasion-copy"><h2>Оберіть склад<br />і оформлення.</h2><p>Вкажіть торт, вагу, кількість і бажану дату. Напис на торті та побажання до декору залиште в коментарі.</p><Link className="paper-button paper-button-cream" to="/order">Оформити замовлення <ArrowIcon /></Link></div></section>

          <section className="paper-faq paper-section" aria-labelledby="faq-title" data-reveal><h2 id="faq-title">Питання — відповіді</h2><div className="faq-list">{questions.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
        </main>
        <SiteFooter />
      </div>
      <ProductModal key={selectedProduct?.id ?? "closed"} product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
