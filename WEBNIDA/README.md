# Delicias Bakery

Monorepo con:

- Frontend en Next.js 15 dentro de `frontend`
- Backend en NestJS 11 + Prisma dentro de `backend`
- Base de datos MySQL

## Estructura

```text
WEBNIDA/
├── backend/
├── frontend/
├── delicias_bakery.sql
└── package.json
```

## Requisitos

- Node.js 20 o superior
- MySQL 8
- npm

## Desarrollo local

Instalar todo:

```bash
npm run install-all
```

Levantar frontend y backend:

```bash
npm run dev
```

Puertos actuales:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`
- Swagger: `http://localhost:5001/api/docs`

## Variables de entorno

Backend en `backend/.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/delicias_bakery"
JWT_SECRET="cambia-esto"
DECOLECTA_TOKEN=""
DECOLECTA_BASE_URL=""
UPLOAD_PATH="uploads/"
MAX_FILE_SIZE=5242880
CORS_ORIGIN="http://localhost:3000"
```

Frontend en `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

## Produccion

### Backend en Render

- El blueprint recomendado esta en [`../render.yaml`](../render.yaml)
- La guia operativa esta en [`../GUIA_RENDER_INFINITYFREE.md`](../GUIA_RENDER_INFINITYFREE.md)
- El backend ya soporta `PORT` y `CORS_ORIGIN`

### Frontend en InfinityFree

- Si mantienes el frontend en InfinityFree, debe consumir la API publica de Render
- Usa la URL publica del backend en `NEXT_PUBLIC_API_BASE_URL`
- Agrega el dominio del frontend en `CORS_ORIGIN`

## Notas importantes

- InfinityFree gratis no permite conectar MySQL remoto desde Render
- Si quieres persistir `uploads`, en Render conviene usar disco persistente y plan `Starter`

## Scripts utiles

Raiz del monorepo:

```bash
npm run dev
npm run build
```

Backend:

```bash
cd backend
npm run build
npm run start:prod
npm run seed:admin
```
