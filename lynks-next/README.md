# LYNKS

E-commerce de ropa deportiva desarrollado como trabajo práctico final para
**Programación Web (PW 2026 Q1)** en ITBA. Aplicación web full-stack con
catálogo, carrito, checkout integrado con Mercado Pago, autenticación de
usuarios y panel administrativo.

**Demo en producción:** https://lynks-one.vercel.app

---

## Funcionalidades

- **Catálogo navegable** por categorías (Tops, Bottoms, Gorros, Novedades).
- **Detalle de producto** con descripción, precio, imagen y selección de
  talle/cantidad.
- **Carrito persistente** en `localStorage` (sin perderse al recargar).
- **Autenticación de usuarios** con email + contraseña (Supabase Auth).
- **Checkout en 2 pasos**: datos de envío + selección de método de pago.
- **Pagos reales con Mercado Pago** (Checkout Pro, sandbox para entrega
  académica).
- **Panel administrativo** (rol `admin`) para gestionar productos
  (alta/baja/edición) y órdenes.
- **Roles diferenciados**: visitante, usuario logueado, administrador.

---

## Stack

| Capa            | Tecnología                          |
| --------------- | ----------------------------------- |
| Framework       | Next.js 16 (App Router) + React 19  |
| Estilos         | Tailwind CSS v4                     |
| Backend / DB    | Supabase (PostgreSQL + Auth + RLS)  |
| Pagos           | Mercado Pago Checkout Pro (SDK v2)  |
| Despliegue      | Vercel (CI/CD automático por push)  |
| Lenguaje        | JavaScript (sin TypeScript)         |

---

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- Una cuenta en [Supabase](https://supabase.com) con un proyecto creado
- Una cuenta de desarrollador en [Mercado Pago](https://developers.mercadopago.com)
  con una aplicación creada (para obtener credenciales de prueba)

---

## Setup local

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd lynks-next

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales (ver sección siguiente)

# 4. Levantar el dev server
npm run dev
```

La app queda corriendo en http://localhost:3000.

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto con las siguientes
variables:

```env
# Supabase — Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Mercado Pago — Tu app en developers.mercadopago.com → Credenciales de prueba
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx

# URL pública de la app (en local) / del deploy (en producción).
# Se usa para construir las back_urls del checkout de Mercado Pago.
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> En producción (Vercel) estas variables se configuran desde el panel:
> *Settings → Environment Variables*.

---

## Modelo de datos (Supabase)

| Tabla         | Propósito                                              |
| ------------- | ------------------------------------------------------ |
| `products`    | Catálogo de productos (nombre, precio, stock, imagen). |
| `profiles`    | Perfil del usuario (extiende `auth.users` de Supabase).|
| `orders`      | Órdenes de compra con estado, total y datos de envío.  |
| `order_items` | Ítems de cada orden (producto, cantidad, precio).      |

Las RLS (Row Level Security) están activadas en todas las tablas para
garantizar que cada usuario solo vea sus propias órdenes, mientras que el
rol `admin` (definido en `profiles.rol`) puede ver y modificar todo.

---

## Estructura del proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── admin/                    # Panel administrativo (productos, órdenes)
│   ├── api/                      # Route handlers (server-side)
│   │   ├── auth/rol/             # Endpoint para chequear rol del usuario
│   │   ├── carrito/              # Persistencia de carrito en servidor
│   │   ├── ordenes/              # CRUD de órdenes del usuario
│   │   ├── pagos/                # Creación de preferencia de Mercado Pago
│   │   ├── productos/            # API pública del catálogo
│   │   └── admin/                # Endpoints solo para rol admin
│   ├── checkout/                 # Flujo de checkout (envío + pago)
│   ├── login/, register/         # Auth de usuarios
│   ├── product/[id]/             # Detalle de producto
│   ├── shop/[category]/          # Listado por categoría
│   └── pago-completado/,
│       pago-fallido/,
│       pago-pendiente/           # Pantallas de retorno post-MP
├── components/                   # Componentes reutilizables (Hero, Grid, etc.)
├── context/                      # CartContext (estado global del carrito)
└── lib/                          # Helpers (Supabase clients, MP, formatters)
```

---

## Integración con Mercado Pago

El flujo de pago usa **Checkout Pro** (la pasarela hosteada de MP).

1. El usuario completa los datos de envío en `/checkout` → se crea una orden
   en Supabase con `status = 'pending'`.
2. En `/checkout/pago/[id]`, el cliente le pega a
   `POST /api/pagos/crear-preferencia` con el `orderId`.
3. El handler valida que la orden sea del usuario y esté pendiente, arma el
   body de la preferencia con los `order_items`, y la crea en MP usando el
   SDK v2.
4. MP devuelve un `init_point` (URL del checkout) → el cliente redirige al
   usuario allí.
5. El usuario paga en MP y vuelve a `/pago-completado` (o `/pago-fallido` /
   `/pago-pendiente` según el caso).
6. En paralelo MP envía un webhook a `/api/webhooks/mercado-pago` que
   actualiza el `status` de la orden en Supabase de forma asincrónica.

**Credenciales de prueba**: se obtienen de la pestaña *"Credenciales de
prueba"* dentro de la app en
[developers.mercadopago.com](https://developers.mercadopago.com). Los tokens
nuevos empiezan con `APP_USR-` (sandbox y producción se distinguen por la
sección donde los copiás, no por el prefijo).

---

## Despliegue

El proyecto está desplegado en Vercel con auto-deploy en cada push a `main`
y previews por cada Pull Request. Las variables de entorno se configuran
desde el panel de Vercel y se replican a Production, Preview y Development.

URL de producción: https://lynks-one.vercel.app

---

## Scripts útiles

```bash
npm run dev      # Servidor de desarrollo (puerto 3000)
npm run build    # Build de producción
npm run start    # Levanta el build de producción
npm run lint     # Corre ESLint sobre el código
```

---

## Contexto académico

Proyecto desarrollado individualmente por **Juana Arce Vega** para la
materia *Programación Web (PW 2026 Q1)* del ITBA, dictada por el profesor
Esteban Piazza. Sigue el cronograma de entregables E1–E6 (CI/CD, landing,
formularios, catálogo + API, CRUD con persistencia, checkout + webhooks)
y fue evaluado en la rúbrica adjunta.
