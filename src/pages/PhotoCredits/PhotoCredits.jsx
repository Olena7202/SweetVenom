import ArrowIcon from "../../components/ArrowIcon";
import { Link } from "react-router-dom";
import Navbar from "../../components/NavBar/NavBar";
import { cafePhotoCredits } from "../../data/cafePhotos";
export default function PhotoCredits() {
  return <div className="page"><Navbar/><main className="photo-credits"><h1>Джерела зображень</h1><p>Нижче наведено авторів і джерела фотографій із Pexels та Unsplash. Ці фото не показують виконані замовлення Sweet Venom. Зображення тортів у каталозі та розрізів також є ілюстраціями. Оформлення замовлення уточнюйте з кондитером.</p><div>{cafePhotoCredits.map((photo)=><article key={photo.file}><img src={`/images/cafe/${photo.file}`} alt={`Фото десерту - ${photo.author}`} loading="lazy"/><h2>{photo.author}</h2><a href={photo.url} target="_blank" rel="noreferrer">Джерело · {photo.license} <ArrowIcon direction="up-right" /></a></article>)}</div><Link to="/"><ArrowIcon direction="left" /> На головну</Link></main></div>;
}
