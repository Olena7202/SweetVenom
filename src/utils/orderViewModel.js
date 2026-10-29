import { cakeName } from "../data/catalogCopy";

export const CLIENT_ORDERS_KEY = "bakery_client_orders";

export const statusMeta = {
  Accepted:{label:"Підтверджене",className:"client-status-progress",color:"#967b52"},
  Ready:{label:"Готове до видачі",className:"client-status-ready",color:"#72836b"},
  Cancelled:{label:"Скасоване",className:"client-status-cancelled",color:"#9e7167"},
  Pending: {
    label: "Очікує підтвердження",
    className: "client-status-pending",
    color: "#9b620f",
  },
  InProgress: {
    label: "Готується",
    className: "client-status-progress",
    color: "#403393",
  },
  Delivered: {
    label: "Виконане",
    className: "client-status-delivered",
    color: "#5a9f21",
  },
};

export function readClientOrders(clientId) {
  if (!clientId) return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(CLIENT_ORDERS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((order) => Number(order.clientId) === Number(clientId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    return [];
  }
}


export function normalizeStatus(status) {
 const value=String(status||"").toLowerCase().replace(/[s_-]/g,"");
 if(["inprogress","уроботі","готується"].includes(value)) return "InProgress";
 if(["accepted","прийняті","підтверджене"].includes(value)) return "Accepted";
 if(["ready","готові","готове"].includes(value)) return "Ready";
 if(["delivered","виконані","виконано"].includes(value)) return "Delivered";
 if(["cancelled","canceled","скасовано","скасоване"].includes(value)) return "Cancelled";
 return "Pending";
}

export function formatDate(value) {
  if (!value) return "Дата не вказана";

  return new Date(value).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getSavedCakeData(saved, fallbackCake = null) {
  const cake = saved.cake || saved;
  const resolvedCake = fallbackCake || null;
  const id = cake.id ?? saved.cakeId ?? saved.id ?? resolvedCake?.id ?? null;
  const name =
    cake.name ||
    saved.cakeName ||
    saved.name ||
    resolvedCake?.name ||
    "Торт без назви";
  const image =
    cake.photoUrl ||
    cake.image ||
    cake.imageUrl ||
    saved.cakeImage ||
    saved.photoUrl ||
    saved.image ||
    saved.imageUrl ||
    resolvedCake?.photoUrl ||
    resolvedCake?.image ||
    resolvedCake?.imageUrl ||
    "/images/your-custom-cake.jpg";
  const price =
    saved.customization?.totalPrice ??
    cake.basePrice ??
    cake.price ??
    saved.basePrice ??
    saved.price ??
    saved.totalPrice ??
    resolvedCake?.basePrice ??
    resolvedCake?.price ??
    0;

  return {
    id,
    name: cakeName(name),
    image,
    price: Number(price) || 0,
    customization: saved.customization,
  };
}
