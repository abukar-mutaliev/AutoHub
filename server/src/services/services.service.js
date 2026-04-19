import { prisma } from "../lib/prisma.js";

export async function getActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}
