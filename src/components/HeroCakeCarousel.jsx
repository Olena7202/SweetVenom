import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ArrowIcon from "./ArrowIcon";
import "../styles/hero-carousel.css";

const cakes = [
  { name: "Малиновий", image: "/images/cards/raspberry-cutout.png", note: "Ванільний бісквіт, крем-чиз і малина", custom: false },
  { name: "Шоколадний мус", image: "/images/cards/chocolate-mousse-cutout.png", note: "Бісквіт, шоколадний мус і глазур", custom: false },
  { name: "Індивідуальний дизайн", image: "/images/cards/weeknd-heart-cutout.png", note: "Вибір бісквіта, крему та декору", custom: true },
];

export default function HeroCakeCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);
  const cake = cakes[active];
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % cakes.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);
  function move(step) { setActive(index => (index + step + cakes.length) % cakes.length); }
  function onKeyDown(event) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
  }
  return <div className="bakery-hero-visual hero-cake-carousel" role="region" aria-roledescription="карусель" aria-label="Приклади тортів" onKeyDown={onKeyDown} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    <span className="hero-drawn-orbit" aria-hidden="true" />
    <div className="hero-cake-stage" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={event => {
      if (touchStart.current !== null) {
        const distance = touchStart.current - event.changedTouches[0].clientX;
        if (Math.abs(distance) > 45) move(distance > 0 ? 1 : -1);
      }
      touchStart.current = null;
    }} onTouchCancel={() => { touchStart.current = null; }}>
      {cakes.map((item, index) => <div key={item.image} className={`hero-cake-slide${index === active ? " is-current" : ""}`} aria-hidden={index !== active}>
        <img src={item.image} alt={item.name} fetchPriority={index === 0 ? "high" : "auto"} draggable="false" />
      </div>)}
    </div>
    <div className="hero-cake-bottom">
      <div className="hero-cake-caption" aria-live="off"><span>{cake.note}</span><h2>{cake.name}</h2></div>
      <div className="hero-cake-position" aria-hidden="true">{cakes.map((item, index) => <span key={item.image} className={index === active ? "is-current" : ""} />)}</div>
      <div className="hero-cake-link-slot">{cake.custom && <Link to="/order" className="hero-custom-link">Створити свій торт <ArrowIcon /></Link>}</div>
    </div>
  </div>;
}
