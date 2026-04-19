const TOAST_EVENT = "autogo:toast";

export function showToast(message, type = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message, type }
    })
  );
}

export function subscribeToToasts(handler) {
  if (typeof window === "undefined") return () => {};

  const listener = (event) => handler(event.detail);
  window.addEventListener(TOAST_EVENT, listener);
  return () => window.removeEventListener(TOAST_EVENT, listener);
}
