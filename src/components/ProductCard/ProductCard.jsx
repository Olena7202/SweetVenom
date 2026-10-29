import { useEffect, useRef, useState } from "react";
import { cardPhoto, cutawayPhoto, detailPhoto, wholeCakePhoto } from "../../data/cakePhotos";
import useCakePreview from "../../hooks/useCakePreview";

export default function ProductCard({ product, onClick }) {
  const previewRef = useCakePreview();
  const titleRef = useRef(null);
  useEffect(() => {
    const title = titleRef.current;
    if (!title || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    title.dataset.appearance = "pending";
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      title.dataset.appearance = "visible";
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(title);
    return () => {
      observer.disconnect();
      delete title.dataset.appearance;
    };
  }, [product.name]);
  const [wholeReady, setWholeReady] = useState(null);
  const [cutReady, setCutReady] = useState(null);
  const titleWords = product.name.split(" ");
  const lastWord = titleWords.pop();
  const sourcePhoto = product.photoUrl || product.image;
  const originalPhoto = detailPhoto(sourcePhoto);
  const isolatedPhoto = cardPhoto(sourcePhoto);
  const wholePhoto = wholeCakePhoto(sourcePhoto);
  const cutPhoto = cutawayPhoto(sourcePhoto) || isolatedPhoto || originalPhoto;
  const hasReveal = wholePhoto && wholeReady === wholePhoto && cutReady === cutPhoto;
  return (
    <button ref={previewRef} className={`product-card reference-card ${isolatedPhoto ? "has-cutout" : "has-photo"}`} onClick={onClick} type="button" aria-label={`Переглянути ${product.name}`}>
      <h3 ref={titleRef} className="reference-card-title">{titleWords.length > 0 && <span>{titleWords.join(" ")}</span>}<span>{lastWord}</span></h3>
      <div className={`product-image-wrap cake-preview ${hasReveal ? "has-reveal" : ""}`}>
        {wholePhoto && <img key={wholePhoto} className="cake-preview-whole" src={wholePhoto} alt="" aria-hidden="true" loading="lazy" onLoad={() => setWholeReady(wholePhoto)} onError={() => setWholeReady(null)} />}
        <img key={cutPhoto} className="cake-preview-cut" src={cutPhoto} alt={product.name} loading="lazy" onLoad={(event) => {
          if (!event.currentTarget.dataset.fallback) setCutReady(cutPhoto);
        }} onError={(event) => {
          setCutReady(null);
          if (event.currentTarget.dataset.fallback) return;
          event.currentTarget.dataset.fallback = "true";
          event.currentTarget.src = originalPhoto;
        }} />
      </div>
      <div className="reference-card-bottom">
        <div className="reference-card-pricing">
          <span className="product-price">{new Intl.NumberFormat("uk-UA").format(product.basePrice ?? product.price)} <small>грн</small></span>
          <span className="reference-card-weight">{product.weight || "На замовлення"}</span>
        </div>
        <span className="reference-card-cta" aria-hidden="true"><span>Детальніше</span><svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg></span>
      </div>
    </button>
  );
}
