import axios from "axios";
import { showToast } from "../lib/toast";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
const ACCESS_TOKEN_KEY = "accessToken";
let refreshPromise = null;

export const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isCanceled =
      axios.isCancel(error) ||
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError";
    if (isCanceled) {
      throw error;
    }

    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");
    const isLoginOrRegister =
      originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/register");

    if (!isUnauthorized || !originalRequest || originalRequest._retry || isRefreshCall || isLoginOrRegister) {
      if (!isUnauthorized) {
        const message = error.response?.data?.error?.message ?? "Ошибка запроса";
        showToast(message, "error");
      }
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        .then((response) => {
          saveAccessToken(response.data?.data?.accessToken);
          return response.data?.data?.accessToken;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const refreshedToken = await refreshPromise;
    if (refreshedToken) {
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
      return axiosClient(originalRequest);
    }

    showToast("Сессия истекла. Войдите снова.", "error");
    throw error;
  }
);

export function saveAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
