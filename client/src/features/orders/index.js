import { axiosClient } from "../../shared/api/axiosClient";

export async function createOrder(payload) {
  const response = await axiosClient.post("/orders", payload);
  return response.data;
}

export async function getOrders() {
  const response = await axiosClient.get("/orders");
  return response.data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await axiosClient.patch(`/orders/${orderId}/status`, { status });
  return response.data;
}

export async function setFinalPrice(orderId, finalPrice) {
  const response = await axiosClient.patch(`/orders/${orderId}/final-price`, { finalPrice });
  return response.data;
}

export async function approvePrice(orderId) {
  const response = await axiosClient.patch(`/orders/${orderId}/approve-price`);
  return response.data;
}

export async function sendInvoice(orderId) {
  const response = await axiosClient.post(`/orders/${orderId}/send-invoice`);
  return response.data;
}
