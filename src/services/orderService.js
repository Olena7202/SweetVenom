import api from '../api/axiosConfig'

export async function getOrders() {
    const response = await api.get('/orders');
    return response.data;
}

export async function getOrdersByClient(clientId) {
    const response = await api.get(`/orders/client/${clientId}`);
    return response.data;
}

export async function createOrder(order) {
    const response = await api.post('/orders', order);
    return response.data;
}

export async function updateOrderStatus(orderId, status) {
    await api.patch(`/orders/${orderId}/status`, JSON.stringify(status), {
        headers: {'Content-Type': 'application/json'}
    });
}

export async function updatePaymentStatus(orderId, paymentStatus) {
    await api.patch(`/orders/${orderId}/payment`, JSON.stringify(paymentStatus), {
        headers: {'Content-Type': 'application/json'}
    });
}

