import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Pass12", 10);

  await prisma.payment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      name: "Владелец",
      phone: "+79990000001",
      email: "owner@autogo.local",
      password: passwordHash,
      role: "OWNER"
    }
  });

  const masters = await Promise.all([
    prisma.user.create({
      data: {
        name: "Адам Мастер",
        phone: "+79990000011",
        email: "master1@autogo.local",
        password: passwordHash,
        role: "MASTER"
      }
    }),
    prisma.user.create({
      data: {
        name: "Руслан Мастер",
        phone: "+79990000012",
        email: "master2@autogo.local",
        password: passwordHash,
        role: "MASTER"
      }
    }),
    prisma.user.create({
      data: {
        name: "Ахмед Мастер",
        phone: "+79990000013",
        email: "master3@autogo.local",
        password: passwordHash,
        role: "MASTER"
      }
    })
  ]);

  const clients = await Promise.all([
    prisma.user.create({
      data: {
        name: "Магомед клиент",
        phone: "+79990000021",
        email: "client1@autogo.local",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Мадина клиент",
        phone: "+79990000022",
        email: "client2@autogo.local",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Ибрагим клиент",
        phone: "+79990000023",
        email: "client3@autogo.local",
        password: passwordHash,
        role: "CLIENT"
      }
    }),
    prisma.user.create({
      data: {
        name: "Аслан клиент",
        phone: "+79990000024",
        email: "client4@autogo.local",
        password: passwordHash,
        role: "CLIENT"
      }
    })
  ]);

  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Выездная шиномонтажка",
        description: "Приедем быстро и заменим шину или отремонтируем ее",
        priceType: "ESTIMATED",
        priceMin: 500,
        priceMax: 1000,
        calloutFee: 300,
        isMobile: true,
        sortOrder: 1
      }
    }),
    prisma.service.create({
      data: {
        name: "Заведем двигатель",
        description: "Мастер приедем устранит неисправность и заведет ваш автомобиль",
        priceType: "ESTIMATED",
        priceMin: 1000,
        priceMax: 5000,
        calloutFee: 500,
        isMobile: true,
        sortOrder: 2
      }
    }),
    prisma.service.create({
      data: {
        name: "Компьютерная диагностика",
        description: "Диагностика неисправностей автомобиля",
        priceType: "ON_SITE",
        calloutFee: 1000,
        isMobile: true,
        sortOrder: 3
      }
    }),
    prisma.service.create({
      data: {
        name: "Плановое техническое обслуживание",
        description: "Выездная замена колодок, масла, фильтров и т.д",
        priceType: "FIXED",
        price: 6500,
        calloutFee: 0,
        isMobile: false,
        sortOrder: 4
      }
    })
  ]);

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysAgo = (days) => new Date(now.getTime() - days * dayMs);
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const inFiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const threeDaysAgo = daysAgo(3);
  const twelveDaysAgo = daysAgo(12);
  const fortyFiveDaysAgo = daysAgo(45);
  const oneHundredTwentyDaysAgo = daysAgo(120);

  const orderPending = await prisma.order.create({
    data: {
      clientId: clients[0].id,
      serviceId: services[0].id,
      status: "PENDING",
      priceType: services[0].priceType,
      estimatedMin: services[0].priceMin,
      estimatedMax: services[0].priceMax,
      calloutFee: services[0].calloutFee,
      address: "Назрань, улица А. Гамидова, 1",
      geoLat: 55.7558,
      geoLng: 37.6173,
      carBrand: "Kia",
      carModel: "Rio",
      carYear: 2018,
      comment: "Правое колесо прокололось",
      scheduledAt: inTwoHours,
      createdAt: oneHourAgo,
      payment: {
        create: {
          calloutAmount: services[0].calloutFee,
          finalAmount: null,
          status: "PENDING"
        }
      }
    }
  });

  const orderAssigned = await prisma.order.create({
    data: {
      clientId: clients[1].id,
      serviceId: services[1].id,
      status: "ASSIGNED",
      priceType: services[1].priceType,
      calloutFee: services[1].calloutFee,
      address: "Сунжа, улица Осканова, 4 st 3",
      geoLat: 55.7602,
      geoLng: 37.6187,
      carBrand: "Toyota",
      carModel: "Camry",
      carYear: 2017,
      comment: "Автомобиль не заводится",
      scheduledAt: inFiveHours,
      createdAt: twelveDaysAgo,
      payment: {
        create: {
          calloutAmount: services[1].calloutFee,
          finalAmount: services[1].price,
          status: "CALLOUT_PAID",
          calloutPaidAt: twelveDaysAgo
        }
      }
    }
  });

  const orderInProgress = await prisma.order.create({
    data: {
      clientId: clients[2].id,
      serviceId: services[2].id,
      status: "IN_PROGRESS",
      priceType: services[2].priceType,
      calloutFee: services[2].calloutFee,
      address: "Карабулак, улица Московская 6",
      geoLat: 55.7962,
      geoLng: 37.5372,
      carBrand: "Volkswagen",
      carModel: "Polo",
      carYear: 2015,
      comment: "Горит индикатор неисправности двигателя.",
      scheduledAt: oneHourAgo,
      createdAt: threeDaysAgo,
      payment: {
        create: {
          calloutAmount: services[2].calloutFee,
          finalAmount: 2800,
          status: "AWAITING_FINAL",
          calloutPaidAt: threeDaysAgo
        }
      }
    }
  });

  const orderDone = await prisma.order.create({
    data: {
      clientId: clients[3].id,
      serviceId: services[3].id,
      status: "DONE",
      priceType: services[3].priceType,
      finalPrice: services[3].price,
      priceApproved: true,
      calloutFee: services[3].calloutFee,
      address: "Экажево, улица Муталиева, 6",
      geoLat: 55.7494,
      geoLng: 37.5912,
      carBrand: "Skoda",
      carModel: "Octavia",
      carYear: 2019,
      comment: "Техническое обслуживание перед дальней поездкой",
      scheduledAt: threeDaysAgo,
      createdAt: fortyFiveDaysAgo,
      payment: {
        create: {
          calloutAmount: services[3].calloutFee,
          finalAmount: services[3].price,
          status: "COMPLETED",
          calloutPaidAt: fortyFiveDaysAgo,
          finalPaidAt: fortyFiveDaysAgo
        }
      }
    }
  });

  const orderCancelled = await prisma.order.create({
    data: {
      clientId: clients[0].id,
      serviceId: services[1].id,
      status: "CANCELLED",
      priceType: services[1].priceType,
      calloutFee: services[1].calloutFee,
      address: "Магас, улица Зязикова, 12",
      geoLat: 55.7867,
      geoLng: 37.6348,
      carBrand: "Ford",
      carModel: "Focus",
      carYear: 2012,
      comment: "Клиент отменил заявку",
      createdAt: oneHundredTwentyDaysAgo,
      payment: {
        create: {
          calloutAmount: services[1].calloutFee,
          finalAmount: services[1].price,
          status: "REFUNDED"
        }
      }
    }
  });

  await Promise.all([
    prisma.assignment.create({
      data: {
        orderId: orderAssigned.id,
        masterId: masters[0].id,
        gpsLat: 55.7591,
        gpsLng: 37.6156,
        notes: "Связался с клиентом, ухожу."
      }
    }),
    prisma.assignment.create({
      data: {
        orderId: orderInProgress.id,
        masterId: masters[1].id,
        gpsLat: 55.7921,
        gpsLng: 37.5401,
        startedAt: oneHourAgo,
        arrivedAt: new Date(now.getTime() - 30 * 60 * 1000),
        notes: "Проведение диагностики и согласование объема работ."
      }
    }),
    prisma.assignment.create({
      data: {
        orderId: orderDone.id,
        masterId: masters[2].id,
        gpsLat: 55.749,
        gpsLng: 37.592,
        startedAt: fourHoursAgo,
        arrivedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        doneAt: twoHoursAgo,
        notes: "Техническое обслуживание завершено, автомобиль доставлен."
      }
    })
  ]);

  console.log("Seed completed");
  console.log(`Owner: ${owner.phone}`);
  console.log(`Masters: ${masters.length}`);
  console.log(`Clients: ${clients.length}`);
  console.log(`Services: ${services.length}`);
  console.log("Orders: 5");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
