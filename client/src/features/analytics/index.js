import { axiosClient } from "../../shared/api/axiosClient";

export async function getRevenueAnalytics(period = "30d") {
  const response = await axiosClient.get("/analytics/revenue", { params: { period } });
  return response.data;
}

export async function getMastersAnalytics(period = "30d") {
  const response = await axiosClient.get("/analytics/masters", { params: { period } });
  return response.data;
}

export async function getOrdersAnalytics(period = "30d") {
  const response = await axiosClient.get("/analytics/orders", { params: { period } });
  return response.data;
}
