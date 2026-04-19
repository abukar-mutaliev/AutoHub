# AutoHub

Стартовый каркас проекта по `task.md`:
- `client` — React + Vite, структура в стиле FSD
- `server` — Express + Prisma

## Быстрый старт

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

## Что уже готово

### Client (React + Vite)

- Слои в стиле FSD: `app`, `pages`, `features`, `entities`, `shared`, `widgets`
- Роутинг на `react-router-dom` v6 (`createBrowserRouter`): главная, вход и регистрация, каталог услуг, заказы и профиль (только для авторизованных), панели владельца и мастера с проверкой роли
- Охрана маршрутов: редирект для уже вошедших пользователей, `RequireAuth`, `RequireRole`
- Контекст сессии и восстановление пользователя при загрузке (`/auth/me`, при необходимости обновление access-токена)
- HTTP-клиент на `axios`: базовый URL из `VITE_API_URL`, `Authorization` для access-токена, повтор запроса после `401` через `/auth/refresh`, `withCredentials` для cookie
- Фичи с вызовами API: аутентификация, услуги, заказы, назначения мастерам, пользователи; виджет шапки приложения
- Простые уведомления (toast) и базовые стили приложения

### Server (Express + Prisma)

- Приложение Express: JSON, `helmet`, CORS с учётом фронта, `morgan`, разбор cookie, `X-Request-Id`
- REST под префиксом `/api/v1`: `health`, `auth`, `services`, `orders`, `assignments`, `users`
- Аутентификация: JWT access-токен, refresh в httpOnly cookie; эндпоинты регистрации, входа, обновления сессии, `/me`, выход
- Middleware: JWT, проверка роли, валидация тела запросов через Zod, единый обработчик ошибок
- Prisma-схема PostgreSQL по модели из `task.md`: пользователи, услуги, заказы, назначения, платежи и перечисления статусов
- Скрипты Prisma: `generate`, `migrate`, `seed` для первичного наполнения БД
