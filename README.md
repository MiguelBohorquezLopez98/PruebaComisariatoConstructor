# Gestor de Solicitudes

Sistema web para la gestión de solicitudes internas. Construido con Angular 21 en el frontend y ASP.NET Core 8 en el backend, con SQL Server como base de datos.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 + Angular Material |
| Backend | ASP.NET Core 8 Web API |
| Base de datos | SQL Server 2022 |
| Reverse proxy | Nginx |
| Contenedores | Docker + Docker Compose |

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Puerto **80** disponible (frontend)
- Puerto **1433** disponible (SQL Server, opcional para acceso externo)

No se requiere tener instalado .NET, Node.js ni SQL Server en la máquina local.

---

## Arquitectura del despliegue

```
Navegador
    │
    ▼
Nginx :80  (gestor_frontend)
    ├── /          →  Sirve Angular (archivos estáticos)
    └── /api/*     →  Proxy a backend:8080
                            │
                            ▼
                   API .NET 8 :8080  (gestor_backend)
                            │
                            ▼
                   SQL Server :1433  (gestor_sqlserver)
                   [Base de datos: GestorSolicitudesDB]
```

---

## Instrucciones de despliegue con Docker

### 1. Clonar o descargar el repositorio

```bash
git clone <url-del-repositorio>
cd PruebaComisariatoConstructor
```

### 2. Construir y levantar los contenedores

Desde la **raíz del proyecto** (donde está `docker-compose.yml`), ejecutar:

```bash
docker compose up --build -d
```

Este comando:
- Descarga las imágenes base (.NET 8, Node 22, Nginx, SQL Server 2022)
- Compila el backend en modo Release
- Compila el frontend con `ng build --configuration production`
- Levanta los 3 contenedores en background

> **Primera vez:** la descarga de imágenes puede tardar varios minutos dependiendo de la conexión.

### 3. Esperar que los contenedores estén listos

```bash
docker compose ps
```

Esperar hasta ver los 3 servicios con estado `Up`:

```
NAME               STATUS
gestor_sqlserver   Up (healthy)
gestor_backend     Up
gestor_frontend    Up
```

> SQL Server tarda ~30-40 segundos en inicializarse. El backend espera automáticamente a que esté `healthy` antes de arrancar.

### 4. Abrir la aplicación

Abrir el navegador en:

```
http://localhost
```

---

## Credenciales de acceso

| Usuario | Contraseña | Rol | Permisos |
|---|---|---|---|
| `admin` | `Admin1234!` | Administrador | Ver, crear, editar solicitudes y cambiar estados |
| `operador` | `Operador1234!` | Operador | Ver solicitudes y cambiar estado de las que tiene asignadas |

> Los usuarios se crean automáticamente en la primera ejecución si la base de datos está vacía.

---

## Base de datos

La base de datos `GestorSolicitudesDB` se crea y migra automáticamente al iniciar el backend. No se requiere ninguna configuración manual de SQL Server.

Los datos persisten en un volumen Docker llamado `pruebacomisariatoconstructor_sqldata`. Al hacer `docker compose down` los datos se conservan. Para borrarlos:

```bash
docker compose down -v
```

---

## Comandos útiles

```bash
# Levantar (sin rebuild si las imágenes ya existen)
docker compose up -d

# Levantar con rebuild forzado
docker compose up --build -d

# Ver estado de los contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f sqlserver

# Detener los contenedores (conserva datos)
docker compose down

# Detener y eliminar también los datos (volumen SQL)
docker compose down -v
```

---

## Estructura del proyecto

```
PruebaComisariatoConstructor/
├── docker-compose.yml                         # Orquestación de contenedores
├── README.md
│
├── backend/
│   └── GestorSolicitudes/
│       └── GestorSolicitudes.API/
│           ├── Dockerfile                     # Build multi-stage .NET 8
│           ├── appsettings.json               # Config desarrollo (localhost)
│           ├── appsettings.Production.json    # Config Docker (SQL Server en contenedor)
│           ├── Controllers/
│           ├── Services/
│           ├── Models/
│           ├── DTOs/
│           ├── Data/
│           └── Migrations/
│
└── frontend/
    └── GestorSolicitudes.Web/
        ├── Dockerfile                         # Build multi-stage Angular + Nginx
        ├── nginx.conf                         # SPA routing + proxy /api/
        ├── src/
        │   ├── app/
        │   │   ├── auth/                      # Login
        │   │   ├── dashboard/                 # Dashboard con resumen y tabla
        │   │   ├── solicitudes/
        │   │   │   ├── listado/               # Lista paginada con filtros
        │   │   │   ├── detalle/               # Vista detalle + historial
        │   │   │   └── formulario/            # Crear / editar solicitud
        │   │   └── core/
        │   │       ├── guards/                # authGuard, adminGuard
        │   │       ├── interceptors/          # JWT en cada request
        │   │       └── services/              # AuthService, SolicitudService
        │   └── environments/
        │       ├── environment.ts             # apiUrl: localhost (desarrollo)
        │       └── environment.production.ts  # apiUrl: /api (Docker)
        └── package.json
```

---

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend/GestorSolicitudes/GestorSolicitudes.API
dotnet run
```

Requiere SQL Server local en `localhost\SQLEXPRESS`. La cadena de conexión está en `appsettings.json`.

### Frontend

```bash
cd frontend/GestorSolicitudes.Web
pnpm install
pnpm start
```

La app queda disponible en `http://localhost:4200` y apunta a la API en `https://localhost:7226`.
