# design.md — Платформа выездного автосервиса

## 1. Обзор системы

Веб-приложение для приёма и управления заявками на выездное автомобильное обслуживание. Ключевое требование — полный контроль владельца над заказами: мастера работают только через систему, не имеют прямого доступа к деньгам и не могут вести клиентов в обход платформы.

**Услуги:** замена масла, замена колодок, диагностика, выездной шиномонтаж, запуск двигателя.

**Роли:** клиент, мастер, владелец.

---

## 2. Стек технологий

### Фронтенд
| Технология | Версия | Назначение |
|---|---|---|
| React | 18 | UI-фреймворк |
| Vite | 5 | Сборщик, dev-сервер |
| Redux Toolkit | 2 | Глобальный стейт |
| React Router | 6 | Клиентская маршрутизация |
| Mantine UI | 7 | Компонентная библиотека |
| Axios | 1.6 | HTTP-клиент |
| Socket.io-client | 4 | Real-time обновления |
| React Hook Form | 7 | Управление формами |
| Zod | 3 | Валидация схем на клиенте |

### Бэкенд
| Технология | Версия | Назначение |
|---|---|---|
| Node.js | 20 LTS | Среда выполнения |
| Express.js | 4 | HTTP-фреймворк |
| Prisma ORM | 5 | Доступ к базе данных |
| PostgreSQL | 16 | Основная БД |
| Socket.io | 4 | WebSocket-сервер |
| JWT (jsonwebtoken) | 9 | Аутентификация |
| bcrypt | 5 | Хэширование паролей |
| Zod | 3 | Валидация входящих данных |
| Nodemailer | 6 | Email-уведомления |
| Winston | 3 | Логирование |

### Инфраструктура
| Технология | Назначение |
|---|---|
| Docker + Docker Compose | Контейнеризация |
| Nginx | Reverse proxy, SSL termination |
| PM2 | Process manager для Node.js |
| GitHub Actions | CI/CD пайплайн |

---

## 3. Архитектура

```
┌─────────────────────────────────────────────────────┐
│                     Клиент (React + Vite)            │
│  Страница заказа │ Панель владельца │ Панель мастера  │
│                Redux Toolkit (стейт)                  │
│           Axios (REST) + Socket.io (WS)              │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────┐
│                   Nginx (reverse proxy)              │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│             Express.js REST API + Socket.io          │
│                                                      │
│  middleware:   auth → role → validate → handler      │
│                                                      │
│  routes:  /auth  /orders  /assignments               │
│           /users  /services  /analytics              │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                    Prisma ORM                        │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                   PostgreSQL 16                      │
│  users │ orders │ services │ assignments │ payments  │
└─────────────────────────────────────────────────────┘
```

Монолитная архитектура. Разделение на микросервисы не планируется до достижения нагрузки > 1000 заказов в день.

---

## 4. Структура базы данных

### Полная Prisma-схема

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CLIENT
  MASTER
  OWNER
}

enum OrderStatus {
  PENDING       // ожидает назначения мастера
  ASSIGNED      // мастер назначен
  EN_ROUTE      // мастер в пути
  IN_PROGRESS   // работа выполняется
  DONE          // выполнено
  CANCELLED     // отменено
}

enum PriceType {
  FIXED         // цена фиксирована (масло, колодки, диагностика)
  ESTIMATED     // вилка цен (шиномонтаж)
  ON_SITE       // цена определяется на месте (запуск двигателя)
}

enum PaymentStatus {
  PENDING           // ожидает предоплаты
  CALLOUT_PAID      // выезд оплачен
  AWAITING_FINAL    // мастер ввёл сумму, ждёт подтверждения владельца
  FINAL_SENT        // счёт отправлен клиенту
  COMPLETED         // всё оплачено
  REFUNDED          // возврат
}

model User {
  id          String   @id @default(cuid())
  name        String
  phone       String   @unique
  email       String?  @unique
  password    String
  role        Role     @default(CLIENT)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ordersAsClient Order[]      @relation("ClientOrders")
  assignments    Assignment[]
}

model Service {
  id          String    @id @default(cuid())
  name        String
  description String?
  priceType   PriceType @default(FIXED)
  price       Decimal?               // для FIXED
  priceMin    Decimal?               // для ESTIMATED
  priceMax    Decimal?               // для ESTIMATED
  calloutFee  Decimal?               // предоплата за выезд (для ESTIMATED и ON_SITE)
  isMobile    Boolean   @default(false)
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())

  orders Order[]
}

model Order {
  id            String      @id @default(cuid())
  clientId      String
  serviceId     String
  status        OrderStatus @default(PENDING)
  priceType     PriceType
  estimatedMin  Decimal?
  estimatedMax  Decimal?
  finalPrice    Decimal?               // мастер вводит на месте
  priceApproved Boolean     @default(false)  // владелец подтвердил
  calloutFee    Decimal?
  address       String?                // для выездных услуг
  geoLat        Float?
  geoLng        Float?
  carBrand      String
  carModel      String
  carYear       Int
  comment       String?
  scheduledAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  client     User        @relation("ClientOrders", fields: [clientId], references: [id])
  service    Service     @relation(fields: [serviceId], references: [id])
  assignment Assignment?
  payment    Payment?

  @@index([clientId])
  @@index([status])
  @@index([createdAt])
}

model Assignment {
  id        String    @id @default(cuid())
  orderId   String    @unique
  masterId  String
  gpsLat    Float?
  gpsLng    Float?
  startedAt DateTime?
  arrivedAt DateTime?
  doneAt    DateTime?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  order  Order @relation(fields: [orderId], references: [id])
  master User  @relation(fields: [masterId], references: [id])

  @@index([masterId])
}

model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique
  calloutAmount Decimal?
  finalAmount   Decimal?
  calloutPaidAt DateTime?
  finalPaidAt   DateTime?
  status        PaymentStatus @default(PENDING)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  order Order @relation(fields: [orderId], references: [id])
}
```

---

## 5. API

### Соглашения

- Базовый URL: `/api/v1`
- Формат ответа: `{ data, error, meta }`
- Аутентификация: Bearer JWT в заголовке `Authorization`
- Коды ошибок: стандартные HTTP (400, 401, 403, 404, 422, 500)

### Эндпоинты

#### Аутентификация

```
POST   /auth/register          Регистрация клиента
POST   /auth/login             Вход (все роли)
POST   /auth/refresh           Обновить access-токен
GET    /auth/me                Текущий пользователь
POST   /auth/logout            Выход (инвалидация refresh-токена)
```

#### Заказы

```
POST   /orders                 Создать заказ                  CLIENT
GET    /orders                 Список заказов                 ALL (фильтрация по роли)
GET    /orders/:id             Детали заказа                  ALL (по роли)
PATCH  /orders/:id/status      Обновить статус                MASTER, OWNER
PATCH  /orders/:id/final-price Ввести итоговую цену           MASTER
PATCH  /orders/:id/approve-price Подтвердить цену             OWNER
POST   /orders/:id/cancel      Отменить заказ                 CLIENT, OWNER
```

#### Назначения

```
POST   /assignments            Назначить мастера              OWNER
PATCH  /assignments/:id        Переназначить мастера          OWNER
PATCH  /assignments/:id/location Передать GPS-координаты     MASTER
GET    /assignments/active     Активные выезды (для карты)    OWNER
```

#### Пользователи

```
GET    /users                  Все пользователи               OWNER
POST   /users/master           Создать аккаунт мастера        OWNER
PATCH  /users/:id              Обновить роль / заблокировать  OWNER
GET    /users/masters          Список мастеров                OWNER
```

#### Услуги

```
GET    /services               Список активных услуг          PUBLIC
POST   /services               Создать услугу                 OWNER
PATCH  /services/:id           Обновить услугу                OWNER
DELETE /services/:id           Деактивировать услугу          OWNER
```

#### Оплата

```
POST   /payments/callout       Оплатить выезд                 CLIENT
POST   /payments/final         Оплатить итоговый счёт         CLIENT
GET    /payments/:orderId      Статус оплаты                  CLIENT, OWNER
POST   /orders/:id/send-invoice Отправить счёт клиенту        OWNER
```

#### Аналитика

```
GET    /analytics/revenue      Выручка по периодам            OWNER
GET    /analytics/masters      Статистика мастеров            OWNER
GET    /analytics/orders       Статистика заказов             OWNER
```

---

## 6. Аутентификация и авторизация

### Схема JWT

Используются два токена: короткоживущий access-токен (15 минут) и долгоживущий refresh-токен (7 дней). Refresh-токен хранится в httpOnly cookie.

```javascript
// Payload access-токена
{
  sub: "user_cuid",
  role: "MASTER",
  iat: 1700000000,
  exp: 1700000900
}
```

### Middleware цепочка

```
Request → authMiddleware → roleMiddleware → validateMiddleware → handler
```

`authMiddleware` — проверяет JWT, кладёт `req.user`.

`roleMiddleware(roles)` — проверяет, что `req.user.role` входит в допустимые.

`validateMiddleware(schema)` — валидирует тело запроса через Zod, возвращает 422 при ошибке.

### Фильтрация данных по роли

Ключевой принцип: один и тот же эндпоинт `GET /orders` возвращает разные данные в зависимости от роли. Телефон клиента (`phone`) убирается из ответа через `select` в Prisma — мастер никогда не получает контакты клиента до момента принятия заказа, и только пока заказ активен.

```javascript
// services/orderService.js
const getOrders = async (user) => {
  const where = {
    CLIENT: { clientId: user.id },
    MASTER: { assignment: { masterId: user.id } },
    OWNER:  {}
  }[user.role];

  const select = {
    CLIENT: { id: true, status: true, service: true, finalPrice: true, assignment: {
      select: { master: { select: { name: true } }, gpsLat: true, gpsLng: true }
    }},
    MASTER: { id: true, status: true, service: true, address: true, carBrand: true,
      carModel: true, carYear: true, comment: true,
      client: { select: { name: true } }  // телефон не включён
    },
    OWNER: true  // всё
  }[user.role];

  return prisma.order.findMany({ where, select });
};
```

---

## 7. Real-time архитектура (Socket.io)

### События

```
Клиент → Сервер:
  join:order        { orderId }          Подписаться на обновления заказа
  join:owner        { }                  Владелец подписывается на все события
  assignment:location { assignmentId, lat, lng }  Мастер отправляет GPS

Сервер → Клиент:
  order:status      { orderId, status }  Статус заказа изменился
  order:price       { orderId, finalPrice }  Мастер ввёл сумму
  master:location   { assignmentId, lat, lng }  GPS мастера (только владельцу)
```

### Реализация

```javascript
// Комнаты: каждый заказ — отдельная комната
// Владелец входит в комнату 'owner'

io.on('connection', (socket) => {
  socket.on('join:order', ({ orderId }) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('join:owner', () => {
    if (socket.user?.role === 'OWNER') socket.join('owner');
  });

  socket.on('assignment:location', async ({ assignmentId, lat, lng }) => {
    if (socket.user?.role !== 'MASTER') return;
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { gpsLat: lat, gpsLng: lng }
    });
    io.to('owner').emit('master:location', { assignmentId, lat, lng });
  });
});

// При смене статуса заказа (из обработчика API):
const notifyOrderStatus = (orderId, status) => {
  io.to(`order:${orderId}`).emit('order:status', { orderId, status });
  io.to('owner').emit('order:status', { orderId, status });
};
```

GPS мастер отправляет каждые 30 секунд при статусе `EN_ROUTE`.

---

## 8. Флоу оплаты по типу цены

### FIXED (масло, колодки, диагностика)

```
Создание заказа → Оплата 100% → Назначение мастера → Выполнение → DONE
```

Цена фиксируется при создании заказа из `Service.price`. Клиент платит сразу.

### ESTIMATED (шиномонтаж)

```
Создание заказа → Показываем вилку цен → Предоплата calloutFee
→ Назначение мастера → Мастер вводит finalPrice
→ Владелец подтверждает → Счёт клиенту → Оплата остатка → DONE
```

### ON_SITE (запуск двигателя)

```
Создание заказа → Клиент видит "цена на месте" → Предоплата calloutFee
→ Назначение мастера → EN_ROUTE → IN_PROGRESS
→ Мастер вводит finalPrice (status: AWAITING_FINAL)
→ Владелец подтверждает (priceApproved = true, status: FINAL_SENT)
→ Клиент получает счёт → Оплата → DONE
```

Мастер **вводит сумму**, но **не отправляет счёт** — это делает только владелец. Такой разрыв исключает договорённость «мимо кассы».

---

## 9. Структура проекта

```
/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── assignments.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── services.routes.js
│   │   │   ├── payments.routes.js
│   │   │   └── analytics.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      JWT проверка
│   │   │   ├── role.middleware.js      Проверка роли
│   │   │   ├── validate.middleware.js  Zod валидация
│   │   │   └── error.middleware.js     Глобальный обработчик ошибок
│   │   ├── services/
│   │   │   ├── order.service.js        Бизнес-логика заказов
│   │   │   ├── assignment.service.js   Логика назначений
│   │   │   ├── payment.service.js      Логика оплаты
│   │   │   ├── notify.service.js       Email/SMS уведомления
│   │   │   └── analytics.service.js   Аналитика
│   │   ├── schemas/
│   │   │   └── *.schema.js             Zod-схемы для валидации
│   │   ├── socket/
│   │   │   └── index.js               Socket.io обработчики
│   │   ├── lib/
│   │   │   ├── prisma.js              Singleton Prisma Client
│   │   │   └── logger.js              Winston logger
│   │   └── index.js                   Точка входа
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── store.js               Redux store
    │   │   └── router.jsx             React Router конфигурация
    │   ├── features/
    │   │   ├── auth/                  authSlice, authApi
    │   │   ├── orders/                ordersSlice, ordersApi
    │   │   ├── assignments/           assignmentsSlice, assignmentsApi
    │   │   └── analytics/             analyticsSlice, analyticsApi
    │   ├── pages/
    │   │   ├── Home/                  Главная, список услуг
    │   │   ├── Order/                 Форма заказа
    │   │   ├── OrderStatus/           Отслеживание заказа
    │   │   ├── Profile/               История заказов
    │   │   ├── MasterPanel/           Панель мастера
    │   │   └── OwnerPanel/            Панель владельца
    │   ├── components/
    │   │   ├── layout/                Header, Sidebar, Layout
    │   │   ├── orders/                OrderCard, OrderStatusBadge
    │   │   ├── map/                   LiveMap (карта выездов)
    │   │   └── ui/                    Переиспользуемые компоненты
    │   ├── hooks/
    │   │   ├── useSocket.js           Подключение к Socket.io
    │   │   ├── useAuth.js             Текущий пользователь
    │   │   └── useGps.js              Передача GPS (для мастера)
    │   ├── api/
    │   │   └── axiosClient.js         Axios с интерцепторами JWT
    │   └── main.jsx
    ├── index.html
    └── vite.config.js
```

---

## 10. Переменные окружения

```bash
# backend/.env

# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/autoservice"

# JWT
JWT_ACCESS_SECRET="your_access_secret_min_32_chars"
JWT_REFRESH_SECRET="your_refresh_secret_min_32_chars"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Сервер
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@email.com"
SMTP_PASS="your_app_password"

# Оплата (ЮKassa или Stripe)
PAYMENT_PROVIDER="yookassa"
YOOKASSA_SHOP_ID="your_shop_id"
YOOKASSA_SECRET_KEY="your_secret_key"
```

---

## 11. Обработка ошибок

### Стандартный формат ответа

```json
// Успех
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }

// Ошибка
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### Коды ошибок

| Код | HTTP | Описание |
|---|---|---|
| UNAUTHORIZED | 401 | Нет или неверный токен |
| FORBIDDEN | 403 | Нет прав (роль) |
| NOT_FOUND | 404 | Ресурс не найден |
| VALIDATION_ERROR | 422 | Ошибка валидации Zod |
| ORDER_WRONG_STATUS | 409 | Недопустимая смена статуса |
| PRICE_NOT_APPROVED | 409 | Цена не подтверждена владельцем |
| INTERNAL_ERROR | 500 | Неожиданная ошибка сервера |

---

## 12. PWA для мастеров

Мастера работают с телефона. Приложение настроено как PWA: после добавления на экран запускается без браузерного UI, работает при плохом интернете (кэш заказов на день), показывает push-уведомления о новых назначениях.

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'АвтоСервис — Мастер',
    short_name: 'Мастер',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1971c2',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }]
  },
  workbox: {
    runtimeCaching: [{
      urlPattern: /\/api\/orders/,
      handler: 'NetworkFirst',   // сначала сеть, при офлайне — кэш
      options: { cacheName: 'orders-cache', expiration: { maxAgeSeconds: 86400 } }
    }]
  }
})
```

---

## 13. Логирование и мониторинг

Все запросы логируются через Winston: метод, URL, статус, время выполнения, `userId`. Запросы к `/api/orders/:id/final-price` и `/api/orders/:id/approve-price` логируются отдельно с полным payload — это аудит-лог финансовых операций.

```javascript
// Пример лог-записи
{
  "level": "info",
  "timestamp": "2024-01-15T10:30:00Z",
  "method": "PATCH",
  "url": "/api/v1/orders/clr123/final-price",
  "status": 200,
  "userId": "clr456",
  "role": "MASTER",
  "duration": 45,
  "body": { "finalPrice": 1500 }
}
```

---

## 14. Фазы разработки

### Фаза 1 — MVP (3 недели)
- Авторизация (регистрация, вход, JWT)
- CRUD заказов с базовыми статусами
- Назначение мастеров владельцем
- Панели: клиент, мастер, владелец (без карты)
- Фиксированное ценообразование (FIXED)

### Фаза 2 — Real-time и гибкие цены (2 недели)
- Socket.io: обновления статусов в реальном времени
- GPS-трекинг мастеров
- Карта активных выездов для владельца
- Ценообразование ESTIMATED и ON_SITE
- Email-уведомления (смена статуса, счёт)

### Фаза 3 — Оплата и PWA (1–2 недели)
- Онлайн-оплата через ЮKassa/Stripe
- Двухэтапная оплата (предоплата + итог)
- PWA-конфигурация для мастеров
- Push-уведомления

### Фаза 4 — Аналитика и шлифовка (1 неделя)
- Дашборд аналитики для владельца
- Статистика по мастерам и услугам
- Аудит финансовых операций
- Нагрузочное тестирование

---

## 15. Соображения безопасности

**Контакты клиента** никогда не передаются мастеру через API — исключены через `select` в Prisma на уровне сервиса.

**Смена статусов** — строгий конечный автомат. Мастер может перевести заказ только по разрешённым переходам: `ASSIGNED → EN_ROUTE → IN_PROGRESS → DONE`. Обратные переходы и пропуск шагов запрещены.

**Ввод цены** — мастер вводит сумму, но счёт отправляет только владелец после явного подтверждения. Невозможно обойти этот шаг через API.

**Rate limiting** — 100 запросов в минуту на IP для всех эндпоинтов, 5 попыток в минуту для `/auth/login`.

**Refresh-токены** хранятся в httpOnly Secure SameSite=Strict cookie, инвалидируются при выходе.
