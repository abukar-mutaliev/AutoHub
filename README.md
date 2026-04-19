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

- Базовая FSD-структура фронта (`app/pages/features/entities/shared`)
- Роутер и стартовая страница
- HTTP клиент `axios`
- Express приложение и health endpoint `/api/v1/health`
- Prisma-схема на основе архитектуры из `task.md`
