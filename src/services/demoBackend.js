const STATE_KEY = "sweetvenom_demo_state_v1";

function createState(data) {
  const date = (offset) => {
    const value = new Date();
    value.setDate(value.getDate() + offset);
    return value.toISOString();
  };
  const users = [
    { id: 9001, name: "Демо-клієнт", email: "client@example.test", phone: "", role: "Client" },
    { id: 9002, name: "Демо-кондитер", email: "baker@example.test", phone: "", role: "Confectioner" },
  ];
  const orders = ["Pending", "Accepted", "Delivered"].map((status, index) => ({
    id: 101 + index, clientId: 9001, createdAt: date(-3 - index),
    deliveryDate: date(index === 2 ? -1 : index + 1), status,
    paymentStatus: index === 2 ? "Paid" : "Unpaid",
    totalPrice: data.cakes[index].basePrice, note: "Тестове замовлення для перегляду кабінету.",
    orderItems: [{ cakeId: data.cakes[index].id, quantity: 1, itemPrice: data.cakes[index].basePrice }],
  }));
  return { cakes: structuredClone(data.cakes), users, orders };
}

function readState(data) {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (Array.isArray(saved?.cakes) && Array.isArray(saved?.users) && Array.isArray(saved?.orders)) return saved;
  } catch { /* Restore sample data if browser storage is invalid. */ }
  const state = createState(data);
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  return state;
}

function failure(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

export function handleDemoRequest(config, data) {
  const state = readState(data);
  const route = config.url.replace(/^\//, "").split("/");
  const method = config.method || "get";
  const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  const save = () => localStorage.setItem(STATE_KEY, JSON.stringify(state));
  const current = JSON.parse(localStorage.getItem("bakery_current_user") || "null");
  const session = (user) => ({ token: `demo-session-${user.id}`, role: user.role, userId: user.id, name: user.name, email: user.email, phone: user.phone });
  const expandOrder = (order) => ({
    ...order, client: state.users.find(user => user.id === order.clientId),
    orderItems: order.orderItems.map(item => ({ ...item,
      cake: state.cakes.find(cake => cake.id === item.cakeId),
      biscuit: data.biscuits.find(biscuit => biscuit.id === item.biscuitId),
      cream: data.creams.find(cream => cream.id === item.creamId),
    })),
  });

  if (route[0] === "auth") {
    if (method === "post" && route[1] === "demo") {
      const role = body?.role === "confectioner" ? "Confectioner" : "Client";
      return session(state.users.find(user => user.role === role));
    }
    if (method === "put" && route[1] === "profile" && current?.isDemo) {
      const user = state.users.find(user => user.id === current.id);
      if (!user) failure("Демо-профіль не знайдено.", 404);
      Object.assign(user, { name: body.name, email: body.email, phone: body.phone });
      save();
      return session(user);
    }
    failure("Для перегляду оберіть демо-кабінет клієнта або кондитера.");
  }

  if (route[0] === "orders") {
    if (!current?.isDemo) failure("Спочатку відкрийте демонстраційний кабінет.", 401);
    if (method === "get") {
      if (route[1] === "client") return state.orders.filter(order => order.clientId === Number(route[2])).map(expandOrder);
      if (route[1]) {
        const order = state.orders.find(order => order.id === Number(route[1]));
        if (!order) failure("Тестове замовлення не знайдено.", 404);
        return expandOrder(order);
      }
      return state.orders.map(expandOrder);
    }
    if (method === "post") {
      if (!body?.orderItems?.length || !Number.isFinite(body.totalPrice)) failure("Перевірте дані тестового замовлення.");
      const order = { ...body, id: Date.now(), clientId: current.id, createdAt: new Date().toISOString(), status: "Pending", paymentStatus: "Unpaid" };
      state.orders.push(order);
      save();
      return expandOrder(order);
    }
    const order = state.orders.find(order => order.id === Number(route[1]));
    if (!order) failure("Тестове замовлення не знайдено.", 404);
    if (method === "patch" && ["status", "payment"].includes(route[2])) {
      if (current.role !== "confectioner") failure("Ця дія доступна в демо-кабінеті кондитера.", 403);
      order[route[2] === "status" ? "status" : "paymentStatus"] = body;
      save();
      return order;
    }
  }

  if (route[0] === "cakes") {
    if (method === "get") {
      if (!route[1]) return state.cakes;
      const cake = state.cakes.find(cake => cake.id === Number(route[1]));
      if (!cake) failure("Торт не знайдено.", 404);
      return cake;
    }
    if (current?.role !== "confectioner" || !current?.isDemo) failure("Відкрийте демо-кабінет кондитера.", 403);
    if (method === "delete") {
      state.cakes = state.cakes.filter(cake => cake.id !== Number(route[1]));
      save();
      return null;
    }
    if (["post", "put"].includes(method)) {
      const id = method === "post" ? Date.now() : Number(route[1]);
      const existing = state.cakes.find(cake => cake.id === id);
      const cake = { ...existing, ...body, id, category: data.categories.find(category => category.id === Number(body.categoryId ?? existing?.categoryId)) };
      if (existing) Object.assign(existing, cake);
      else state.cakes.push(cake);
      save();
      return cake;
    }
  }

  if (method === "get" && data[route[0]]) return data[route[0]];
  failure("Ця дія недоступна в демонстраційній версії.", 503);
}
