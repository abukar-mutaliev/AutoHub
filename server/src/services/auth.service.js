import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { normalizeRuPhone } from "../utils/phone.js";

export async function registerClient(payload) {
  const phone = normalizeRuPhone(payload.phone);
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new HttpError(409, "CONFLICT", "Пользователь с таким номером уже зарегистрирован. Войдите или укажите другой телефон.");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  return prisma.user.create({
    data: {
      name: payload.name,
      phone,
      email: payload.email,
      password: hashedPassword,
      role: "CLIENT"
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

export async function loginByPhone(phone, password) {
  const normalizedPhone = normalizeRuPhone(phone);
  const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Пользователь с таким номером не найден.", { reason: "USER_NOT_FOUND" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new HttpError(401, "UNAUTHORIZED", "Неверный пароль.", { reason: "WRONG_PASSWORD" });
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role
  };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Пользователь не найден.");
  }

  return user;
}
