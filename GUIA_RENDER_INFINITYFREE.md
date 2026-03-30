# Guia Render + InfinityFree

## 1. Antes de desplegar

- El backend esta en `WEBNIDA/backend`.
- El blueprint principal para Render esta en `render.yaml` en la raiz del repo.
- La API usa `PORT`, `DATABASE_URL`, `JWT_SECRET`, `DECOLECTA_TOKEN`, `DECOLECTA_BASE_URL`, `UPLOAD_PATH` y `CORS_ORIGIN`.

## 2. Crear el backend en Render desde cero

1. En Render entra a `New` -> `Blueprint`.
2. Conecta el repositorio `Nid1000/APPNID`.
3. Usa la rama `main`.
4. Deja que Render lea `render.yaml` desde la raiz.
5. Completa los secretos:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `DECOLECTA_TOKEN`
   - `DECOLECTA_BASE_URL`
   - `CORS_ORIGIN`
6. Despliega.

Valores recomendados:

- `PORT`: dejar vacio para que Render lo maneje.
- `CORS_ORIGIN`: `https://delicias.page.gd`
- `UPLOAD_PATH`: `/var/data/uploads`

Valores de ejemplo:

- `DATABASE_URL`: `mysql://usuario:password@host:3306/delicias_bakery`
- `JWT_SECRET`: una clave larga y privada
- `DECOLECTA_TOKEN`: el token real de tu proveedor
- `DECOLECTA_BASE_URL`: la URL base real de tu proveedor

## 3. Base de datos

Tu schema Prisma usa MySQL. Para Render tienes dos caminos:

1. Usar un MySQL externo ya existente.
2. Crear tu propio MySQL fuera de Render o en otro VPS.

Nota importante:

- InfinityFree gratis no permite conexiones MySQL remotas desde una app externa. Por eso el backend en Render no deberia usar una base MySQL gratuita de InfinityFree.

## 4. Archivos subidos

- Si dejas el plan `free`, los archivos en `uploads/` pueden perderse en redeploys o reinicios.
- Si quieres conservar imagenes y comprobantes, cambia el servicio a `Starter` y agrega un persistent disk montado en `/var/data`.

## 5. Probar despues del deploy

Revisa estas rutas:

- `https://TU-SERVICIO.onrender.com/api/docs`
- `https://TU-SERVICIO.onrender.com/api/categorias`

## 6. Conectar tu frontend en InfinityFree

Si tu frontend sigue en InfinityFree:

1. Publica el frontend con `NEXT_PUBLIC_API_BASE_URL` apuntando al backend de Render.
2. Si no usaras subdominio propio para la API, usa la URL `https://TU-SERVICIO.onrender.com`.
3. En el backend, `CORS_ORIGIN` debe incluir el dominio del frontend.

Ejemplo:

- Frontend publico: `https://delicias.page.gd`
- Backend publico: `https://webnida-backend.onrender.com`
- `NEXT_PUBLIC_API_BASE_URL=https://webnida-backend.onrender.com`
- `CORS_ORIGIN=https://delicias.page.gd`

## 7. Usar dominio propio o subdominio para la API

Escenario recomendado:

- Frontend: `https://delicias.page.gd`
- Backend: `https://api.tudominio.com` o `https://webnida-backend.onrender.com`

Si tienes un dominio propio con DNS editable:

1. En Render abre tu servicio.
2. Ve a `Settings` -> `Custom Domains` -> `Add Custom Domain`.
3. Agrega `api.tudominio.com`.
4. En tu DNS crea el registro que Render indique.
   - Para subdominios normalmente sera `CNAME`.
   - Para dominio raiz puede ser `A` hacia `216.24.57.1`, segun la guia de Render.

## 8. Sobre `delicias.page.gd`

- `delicias.page.gd` es un subdominio gratis de InfinityFree.
- Lo mas seguro es dejar ese subdominio para el frontend y usar otra URL para el backend.
- Si quieres que la API tenga subdominio propio, lo ideal es usar un dominio tuyo con control DNS completo.

## 9. Pasos exactos en InfinityFree

Si solo vas a dejar el frontend ahi:

1. Entra a tu panel de InfinityFree.
2. Abre `File Manager` del sitio `delicias.page.gd`.
3. Sube el frontend ya compilado o los archivos estaticos que correspondan a tu despliegue actual.
4. Confirma que el frontend haga llamadas a la URL publica del backend de Render.

Si luego compras o conectas un dominio propio:

1. Apunta el frontend al hosting que prefieras.
2. En Render agrega `api.tudominio.com` como custom domain.
3. En el DNS crea el registro que Render te indique.

## 10. Limitacion importante

InfinityFree sirve muy bien para hosting PHP/estatico, pero no es una plataforma adecuada para ejecutar tu backend NestJS con Node.js. Por eso la division correcta en tu caso es:

- Backend en Render
- Frontend o pagina estatica en InfinityFree
