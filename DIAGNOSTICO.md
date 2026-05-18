# DIAGNOSTICO.md — Escenarios de Servidores y Rendimiento

Documento técnico del proyecto **Gestor de Solicitudes Internas**.  
Responde preguntas sobre qué pasa cuando el sistema enfrenta situaciones reales de producción y cómo se pueden resolver.

---

## Escenario 1 — ¿Qué pasa si muchos usuarios usan la app al mismo tiempo?

**Situación:**  
En lugar de 1 o 2 usuarios de prueba, ahora 50 personas de la empresa están usando el sistema al mismo tiempo. La app empieza a responder lento y el spinner de carga no desaparece.

**¿Por qué ocurre esto?**  
Cada vez que alguien abre el listado de solicitudes, el backend hace una consulta a la base de datos. Si 50 personas lo hacen al mismo tiempo, son 50 consultas simultáneas. Si cada consulta tarda 1 segundo, el servidor se satura.

**¿Cómo está manejado actualmente?**  
La API usa paginación: en lugar de traer todas las solicitudes de la base de datos de una sola vez, solo trae 10 por página. Esto reduce mucho el trabajo del servidor:

```
GET /api/solicitudes?page=1&pageSize=10
```

**¿Qué se podría mejorar?**  
Agregar índices a la base de datos. Un índice es como el índice de un libro: en lugar de leer página por página para encontrar algo, vas directo a la página correcta. Sin índice, SQL Server revisa todas las filas; con índice, va directo a las que necesita.

```sql
-- Estos índices harían las búsquedas por estado y prioridad mucho más rápidas
CREATE INDEX IX_Solicitudes_Estado    ON Solicitudes (Estado);
CREATE INDEX IX_Solicitudes_Prioridad ON Solicitudes (Prioridad);
```

---

## Escenario 2 — ¿Qué pasa si la base de datos tiene miles de registros?

**Situación:**  
Con el tiempo, la empresa acumula 10.000 solicitudes. El listado empieza a tardar varios segundos aunque se apliquen filtros.

**¿Por qué ocurre esto?**  
Sin los índices mencionados en el escenario anterior, SQL Server tiene que revisar los 10.000 registros uno por uno para encontrar los que coinciden con el filtro. A esto se le llama "full table scan" (escaneo completo de la tabla).

**¿Cómo está manejado actualmente?**  
El backend construye la consulta con filtros opcionales. Solo agrega una condición WHERE si el usuario realmente filtró por ese campo:

```csharp
// Solo filtra por estado si el usuario seleccionó uno
if (!string.IsNullOrEmpty(estado))
    query = query.Where(s => s.Estado == estadoFiltro);
```

Esto evita consultas innecesariamente pesadas cuando no hay filtros activos.

**¿Qué se podría mejorar?**  
Para una empresa con muchas solicitudes, se podrían archivar las solicitudes cerradas de más de un año en una tabla separada, dejando la tabla principal más liviana y rápida.

---

## Escenario 3 — ¿Qué pasa si el servidor se cae?

**Situación:**  
Son las 3 AM y nadie está mirando. El contenedor del backend falla por algún error inesperado. Los usuarios que lleguen en la mañana verán un error en la pantalla.

**¿Por qué ocurre esto?**  
Los contenedores Docker, por defecto, si fallan no se reinician solos. Se quedan en estado "caído" hasta que alguien los reinicie manualmente.

**¿Cómo está manejado actualmente?**  
El proyecto tiene un middleware que captura todos los errores del backend antes de que cierren el proceso. En vez de que la aplicación se caiga, devuelve un mensaje de error controlado al usuario:

```
// ErrorHandlingMiddleware.cs
// Si ocurre cualquier error no esperado, el middleware lo atrapa
// y responde con un JSON de error en lugar de dejar caer el servidor
```

**¿Qué se podría mejorar?**  
Agregar la instrucción `restart: unless-stopped` en el `docker-compose.yml`. Esto le dice a Docker que si el contenedor falla, lo reinicie automáticamente:

```yaml
backend:
  restart: unless-stopped  # Si falla, Docker lo levanta solo
```

---

## Escenario 4 — ¿Qué pasa si un usuario deja la sesión abierta mucho tiempo?

**Situación:**  
Un empleado deja la computadora encendida todo el fin de semana con la app abierta. El lunes intenta hacer algo y recibe un error porque su sesión venció.

**¿Por qué ocurre esto?**  
El sistema usa JWT (JSON Web Token) para manejar la sesión. Este token tiene una fecha de vencimiento: en este proyecto, 8 horas. Después de ese tiempo, el token ya no es válido y el backend rechaza las peticiones.

**¿Cómo está manejado actualmente?**  
El interceptor de Angular adjunta el token a cada petición HTTP automáticamente. Si el backend responde con error 401 (no autorizado), el guard de Angular detecta que el usuario no está logueado y lo redirige al login:

```
Usuario hace click → Angular envía petición con token → 
Backend dice "token vencido" → Angular redirige al login
```

Además, cuando el usuario hace logout, el sistema incrementa un número de versión del token en la base de datos. Aunque alguien tuviera el token guardado, ya no funcionaría porque la versión no coincide.

**¿Qué se podría mejorar?**  
En sistemas más avanzados se usa un "refresh token": un segundo token de larga duración que permite renovar el token de sesión sin que el usuario tenga que volver a escribir su contraseña. Para el alcance de este proyecto, el tiempo de 8 horas es razonable para una jornada laboral.

---

## Escenario 5 — ¿Qué pasa con los datos si el contenedor de la base de datos se reinicia?

**Situación:**  
Se ejecuta `docker compose down` para detener el sistema. Al volver a levantarlo, la base de datos aparece vacía y todos los datos se perdieron.

**¿Por qué ocurre esto?**  
Por defecto, todo lo que se guarda dentro de un contenedor Docker desaparece cuando el contenedor se elimina. Los contenedores son "temporales" por diseño.

**¿Cómo está manejado actualmente?**  
El `docker-compose.yml` usa un **volumen** de Docker. Un volumen es una carpeta especial que vive fuera del contenedor, en el disco del servidor real. Aunque el contenedor se elimine, el volumen con los datos se conserva:

```yaml
volumes:
  sqldata:              # Este volumen vive en el disco del servidor

services:
  sqlserver:
    volumes:
      - sqldata:/var/opt/mssql   # SQL Server guarda sus datos aquí
```

Con esto:
- `docker compose down` → datos conservados ✅
- `docker compose down -v` → datos eliminados (hay que escribirlo explícitamente) ⚠️

**¿Qué se podría mejorar?**  
En un entorno real de empresa, se programarían backups automáticos de la base de datos cada noche, guardados en una carpeta segura o en la nube.

---

## Escenario 6 — ¿Qué pasa si dos personas editan la misma solicitud al mismo tiempo?

**Situación:**  
La coordinadora abre la solicitud SOL-2026-0005 para cambiar la prioridad. Al mismo tiempo, el técnico abre la misma solicitud para actualizar la descripción. El técnico guarda primero y la coordinadora guarda después, borrando sin querer el cambio del técnico.

**¿Por qué ocurre esto?**  
Cuando los dos abren la solicitud, cada uno tiene una "copia" en su pantalla. Al guardar, el backend reemplaza todos los datos con lo que llegó en la petición, sin saber que alguien más hizo cambios en el medio.

**¿Cómo está manejado actualmente?**  
Por el alcance del proyecto, este caso no está implementado. En un sistema pequeño de empresa con pocos usuarios, la probabilidad de que esto ocurra es baja.

**¿Cómo se resolvería en producción?**  
Se agrega un campo de "versión" a la solicitud. Cuando alguien guarda, el backend verifica que la versión en la base de datos sea la misma que tenía cuando abrió el formulario. Si no coincide, significa que alguien más ya guardó cambios y se le avisa al usuario:

```
"Esta solicitud fue modificada por otro usuario mientras la tenías abierta. 
Por favor recarga la página antes de guardar."
```

---

## Escenario 7 — ¿Cómo saber si el sistema está funcionando bien sin revisar manualmente?

**Situación:**  
El sistema lleva semanas en producción. ¿Cómo sabe el equipo de TI que todo sigue funcionando sin tener que abrir la app cada hora?

**¿Cómo está manejado actualmente?**  
El backend tiene un endpoint de salud que responde si el servidor está vivo:

```
GET /health
Respuesta: { "status": "ok", "timestamp": "2026-05-18T..." }
```

Docker también tiene configurado un healthcheck para SQL Server: cada 10 segundos verifica que la base de datos responda. Si falla 10 veces seguidas, Docker marca el contenedor como "unhealthy".

Los logs de todos los servicios se pueden revisar con:
```bash
docker compose logs -f backend    # Ver logs del backend en tiempo real
docker compose logs -f sqlserver  # Ver logs de la base de datos
```

**¿Qué se podría mejorar?**  
En producción se configurarían herramientas de monitoreo automático como **UptimeRobot** (gratuito) que revisa el endpoint `/health` cada 5 minutos y envía un correo o mensaje de WhatsApp si el servidor no responde.

---

## Escenario 8 — ¿Qué pasa si la empresa crece y necesita más capacidad?

**Situación:**  
La empresa pasa de 50 a 500 empleados usando el sistema. Un solo servidor ya no es suficiente.

**¿Por qué el sistema actual escala bien?**  
El backend no guarda ninguna información de sesión en su propia memoria. Todo el estado del usuario está en el JWT que viaja en cada petición. Esto significa que se podrían correr varias copias del backend al mismo tiempo sin que se "confundan" entre sí.

**¿Cómo se escalaría?**  
La arquitectura actual con Nginx ya está preparada para esto. Nginx puede repartir el tráfico entre varias copias del backend (esto se llama "load balancing" o balanceo de carga):

```
Usuarios
   ↓
Nginx (reparte el tráfico)
   ├── Backend 1
   ├── Backend 2
   └── Backend 3
        ↓
   SQL Server (compartido)
```

Para el frontend no hay problema: son archivos estáticos que Nginx sirve directamente, sin importar cuántos usuarios haya.

---

## Resumen de decisiones técnicas tomadas

| Decisión | Por qué se tomó |
|---|---|
| **SQL Server en Docker** | Así cualquier persona puede correr el proyecto sin instalar SQL Server en su máquina |
| **JWT con verificación de versión** | Permite cerrar sesión de forma segura sin necesidad de una lista negra compleja |
| **Migraciones automáticas al iniciar** | El sistema crea y actualiza la base de datos solo, sin pasos manuales |
| **Nginx como intermediario** | Hace que solo el puerto 80 esté expuesto; el backend nunca queda expuesto directamente a internet |
| **Paginación en el servidor** | Si hubiera 10.000 solicitudes y se mandaran todas al navegador de una vez, la app sería muy lenta |
| **Variables de entorno por ambiente** | La URL de la API es diferente en desarrollo (`localhost:7226`) y en producción (`/api`); los environments de Angular lo manejan automáticamente |

## Limitaciones del proyecto actual y próximos pasos

| Limitación | Qué se haría con más tiempo |
|---|---|
| No hay HTTPS | Agregar un certificado SSL para que la comunicación vaya cifrada |
| Los logs desaparecen si el contenedor se reinicia | Guardar los logs en un archivo o servicio externo |
| No hay pruebas automatizadas | Escribir tests que verifiquen que los endpoints funcionan correctamente |
| Un solo servidor de base de datos | En producción real, tener una base de datos de respaldo en caso de fallo |
| No hay límite de intentos de login | Agregar bloqueo temporal después de varios intentos fallidos para evitar ataques de fuerza bruta |
