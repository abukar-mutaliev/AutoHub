import webpush from "web-push";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";

let vapidPublic = env.vapidPublicKey;
let vapidPrivate = env.vapidPrivateKey;
let pushReady = false;

function ensureWebPush() {
  if (pushReady) {
    return true;
  }
  if (!vapidPublic || !vapidPrivate) {
    if (env.nodeEnv === "production") {
      return false;
    }
    const keys = webpush.generateVAPIDKeys();
    vapidPublic = keys.publicKey;
    vapidPrivate = keys.privateKey;
    logger.warn("push_vapid_autogen", {
      message:
        "VAPID ключи сгенерированы автоматически (только development). Для стабильных push задайте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY.",
      publicKey: vapidPublic
    });
  }
  webpush.setVapidDetails(env.vapidSubject, vapidPublic, vapidPrivate);
  pushReady = true;
  return true;
}

export function getVapidPublicKeyForClient() {
  if (!ensureWebPush()) {
    return null;
  }
  return vapidPublic;
}

export async function savePushSubscription(userId, subscription) {
  if (!ensureWebPush()) {
    return null;
  }
  const { endpoint, keys } = subscription;
  return prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    },
    update: {
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth
    }
  });
}

export async function removePushSubscription(userId, endpoint) {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint }
  });
}

export async function notifyMasterNewAssignment(masterId, payload) {
  if (!ensureWebPush()) {
    return;
  }
  const subs = await prisma.pushSubscription.findMany({ where: { userId: masterId } });
  const body = JSON.stringify({
    title: "Новое назначение",
    body: payload.body,
    url: payload.url ?? "/master",
    orderId: payload.orderId ?? null
  });
  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    };
    try {
      await webpush.sendNotification(pushSub, body, { TTL: 3600, urgency: "high" });
    } catch (error) {
      const status = error?.statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        logger.warn("push_send_failed", { masterId, endpoint: sub.endpoint, message: error?.message });
      }
    }
  }
}
