import { axiosClient } from "../../shared/api/axiosClient";

export async function getMe() {
  const response = await axiosClient.get("/auth/me");
  return response.data;
}

export async function register(payload) {
  const response = await axiosClient.post("/auth/register", payload);
  return response.data;
}

export async function login(payload) {
  const response = await axiosClient.post("/auth/login", payload);
  return response.data;
}

export async function logout() {
  const response = await axiosClient.post("/auth/logout");
  return response.data;
}

export async function refreshAccessToken() {
  const response = await axiosClient.post("/auth/refresh");
  return response.data;
}
