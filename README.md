# NeoBill

Sistema de gestión de licitaciones — control de clientes, productos, pagos y documentos, con notificaciones automáticas por correo.

!\[Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat\&logo=supabase\&logoColor=white)
!\[PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat\&logo=postgresql\&logoColor=white)
!\[Hono](https://img.shields.io/badge/Hono-E36002?style=flat\&logo=hono\&logoColor=white)
!\[React](https://img.shields.io/badge/React-61DAFB?style=flat\&logo=react\&logoColor=black)
!\[Vite](https://img.shields.io/badge/Vite-646CFF?style=flat\&logo=vite\&logoColor=white)
!\[TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat\&logo=tailwindcss\&logoColor=white)
!\[Render](https://img.shields.io/badge/Render-46E3B7?style=flat\&logo=render\&logoColor=white)
!\[Vercel](https://img.shields.io/badge/Vercel-000000?style=flat\&logo=vercel\&logoColor=white)
!\[Brevo](https://img.shields.io/badge/Brevo-0B996E?style=flat\&logo=sendinblue\&logoColor=white)

## Stack

|Capa|Tecnología|
|-|-|
|Base de datos|Supabase (PostgreSQL)|
|Backend|Hono + TypeScript|
|Frontend|React + Vite|
|Estilos|Tailwind CSS|
|Hosting backend|Render|
|Hosting frontend|Vercel|
|Correo|Brevo|

## Instalación

### 1\. Clonar el repositorio

```bash
git clone https://github.com/your-org/neobill.git
cd neobill
```

### 2\. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3\. Configurar variables de entorno

Cada carpeta (`backend/` y `frontend/`) incluye un archivo `example.env` con todas las variables necesarias y una breve descripción de cada una. Copia ese archivo a `.env` y completa los valores correspondientes:

```bash
cp example.env .env
```

> Revisa `example.env` en cada carpeta para conocer exactamente qué claves se necesitan (Supabase, base de datos, Brevo, URLs de frontend/backend, etc.) — ahí están documentadas todas las variables requeridas.


### 4\. Crear el usuario administrador inicial

El proyecto no expone un registro público — el primer usuario administrador se crea mediante un script:

```bash
cd backend
npm run seed:admin
```

Sigue las instrucciones en consola para definir el correo y la contraseña del administrador. Desde ahí, ese usuario puede gestionar el resto de las cuentas desde el módulo de Configuraciones.


### 5\. Levantar el proyecto en desarrollo

```bash
# Backend
cd backend
npm run dev

# Frontend (en otra terminal)
cd frontend
npm run dev
```

Por defecto el backend corre en `http://localhost:3000` y el frontend en `http://localhost:5173`.


## Documentación de la API

La API está documentada con OpenAPI y disponible en producción en:

[**https://neobill.onrender.com/docs**](https://neobill.onrender.com/docs)

Ahí se pueden consultar todos los endpoints disponibles, esquemas de request/response y probar llamadas directamente.


## Despliegue

* **Backend (Render)**: desplegado como Web Service, apuntando a la carpeta `backend/`. Requiere las mismas variables definidas en `example.env` configuradas en el dashboard de Render.
* **Frontend (Vercel)**: desplegado apuntando a la carpeta `frontend/`. Requiere la variable `VITE\_API\_URL` apuntando al backend en Render.
* **CORS**: el backend restringe los orígenes permitidos — al agregar un nuevo dominio de frontend (por ejemplo, un dominio propio en Vercel), debe añadirse a la configuración de CORS en el backend.


Notas
---

* Los documentos de licitaciones se almacenan en Supabase Storage como archivos **privados**; el acceso se controla mediante URLs firmadas con expiración, generadas bajo demanda por el backend.
* Los estados de una licitación (`borrador`, `activa`, `finalizada`, `por\_cobrar`, `cobrada`, `perdida`) siguen un flujo controlado — no todas las transiciones son válidas manualmente; algunas ocurren automáticamente (por ejemplo, al subir un documento o al completar un pago).
* Las notificaciones por correo (activación de licitación, actualización de documento, recordatorio de vencimiento) se envían mediante Brevo y requieren un remitente verificado — ver `example.env` para las variables correspondientes.

