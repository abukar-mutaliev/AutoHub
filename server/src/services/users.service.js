import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { normalizeRuPhone } from "../utils/phone.js";

export async function getMasters() {
  return prisma.user.findMany({
    where: { role: "MASTER", isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createMaster(payload) {
  const phone = normalizeRuPhone(payload.phone);
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    throw new HttpError(409, "CONFLICT", "Пользователь с таким номером уже есть.");
  }

  const password = await bcrypt.hash(payload.password, 10);
  return prisma.user.create({
    data: {
      name: payload.name,
      phone,
      email: payload.email,
      password,
      role: "MASTER"
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true
    }
  });
}

const profileSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true
};

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect
  });

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Пользователь не найден.");
  }

  return user;
}

export async function updateMyProfile(userId, payload) {
  const current = await prisma.user.findUnique({ where: { id: userId } });
  if (!current) {
    throw new HttpError(404, "NOT_FOUND", "Пользователь не найден.");
  }

  const phone = normalizeRuPhone(payload.phone);

  if (phone !== current.phone) {
    const byPhone = await prisma.user.findUnique({ where: { phone } });
    if (byPhone) {
      throw new HttpError(409, "CONFLICT", "Этот номер телефона уже занят.");
    }
  }

  const emailNormalized = payload.email === "" || payload.email === undefined ? null : payload.email;
  if (emailNormalized && emailNormalized !== current.email) {
    const byEmail = await prisma.user.findFirst({
      where: { email: emailNormalized }
    });
    if (byEmail && byEmail.id !== userId) {
      throw new HttpError(409, "CONFLICT", "Этот email уже занят.");
    }
  }

  const data = {
    name: payload.name,
    phone,
    email: emailNormalized
  };

  const newPass = payload.newPassword?.trim();
  if (newPass && newPass.length >= 6) {
    data.password = await bcrypt.hash(newPass, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect
  });
}
