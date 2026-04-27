import { axiosClient } from "../../shared/api/axiosClient";
import { urlBase64ToUint8Array } from "../../shared/lib/pushClient";

export async function fetchVapidPublicKey() {
  const response = await axiosClient.get("/push/vapid-public");
  return response.data?.data?.publicKey ?? null;
}

export async function subscribeMasterPush() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Уведомления или Service Worker не поддерживаются в этом браузере.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Разрешение на уведомления не выдано.");
  }
  const registration = await navigator.serviceWorker.ready;
  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    throw new Error("Сервер не отдал VAPID-ключ (push не настроен).");
  }
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe().catch(() => {});
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
  await axiosClient.post("/push/subscribe", { subscription: subscription.toJSON() });
  return subscription;
}

export async function unsubscribeMasterPush() {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (!existing) {
    return;
  }
  const json = existing.toJSON();
  await axiosClient.post("/push/unsubscribe", { endpoint: json.endpoint }).catch(() => {});
  await existing.unsubscribe().catch(() => {});
}
