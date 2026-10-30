# CORRE · Gestión de carreras con MySQL

Frontend en React, backend en Node.js + Express y base de datos **MySQL 8.0.16 o superior**. Los registros del formulario se guardan en MySQL y pueden consultarse desde Workbench o una terminal con actualización automática.

## Incluye

- Roles **admin**, **organizador** y **participante**, con permisos validados en la API.
- Carreras con ubicación, fecha, descripción, cupo y distancias configurables: 5, 10, 15, 20, 42.195 km y otras, hasta 500 km con tres decimales.
- Categorías según la edad el día de la carrera: infantil (0–17), edad promedio (18–59), tercera edad (60+).
- Inscripciones con folio único, una por usuario y carrera, con control transaccional de cupo.
- Contraseñas con scrypt y sesiones JWT de ocho horas.
- Consulta de inscripciones: el administrador ve todas, el organizador las de sus carreras y el participante las propias.

Esta versión reemplaza la conexión SQLite por MySQL. No importa automáticamente los datos de la versión anterior: usuarios, carreras e inscripciones empiezan vacíos. No modifica tu instalación anterior ni incluye tu `.env`.

## Requisitos

- Node.js 24 o superior y npm.
- MySQL Server 8.0.16 o superior, iniciado.
- MySQL Workbench o un cliente SQL. Workbench es el cliente; también necesitas el servidor MySQL.
- Dos terminales CMD en VS Code; una tercera es opcional para monitorear registros.

Los comandos siguientes son para **CMD**, desde la raíz `gestion-carreras` de esta versión.

## 1. Crear la base en MySQL

1. Abre MySQL Workbench y conecta con tu servidor.
2. Abre **File → Open SQL Script** y selecciona `backend/database/schema.sql`.
3. Ejecuta el script completo con el botón del rayo.
4. Actualiza **Schemas**: aparecerá `carreras_db` con `users`, `races`, `distances` y `registrations`.

El script crea las tablas y las relaciones. No borra tablas ni datos existentes; utiliza una base vacía si ya tienes otra aplicación con una base llamada `carreras_db`. Si necesitas otro nombre, cambia ambas apariciones del nombre en el SQL y usa el mismo nombre en el `.env`.

Alternativa desde CMD, si `mysql` está en tu PATH:

```cmd
mysql -u TU_USUARIO -p < backend\database\schema.sql
```

Tu usuario necesita permiso para crear la base y las tablas. Para ejecutar la aplicación basta con permisos de lectura e inserción sobre estas tablas; puedes utilizar un usuario de aplicación separado del administrador de MySQL.

## 2. Instalar el backend

```cmd
cd backend
npm ci
copy .env.example .env
```

Si la terminal pregunta si deseas reemplazar un `.env` existente, consérvalo y añade personalmente las variables MySQL.

## 3. Configurar backend/.env tú mismo

```dotenv
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=PEGA_UN_SECRETO_ALEATORIO_DE_64_CARACTERES
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=carreras_db
MYSQL_USER=TU_USUARIO_MYSQL
MYSQL_PASSWORD=TU_CONTRASENA_MYSQL
MYSQL_SSL=false
ADMIN_NAME=Administrador
ADMIN_EMAIL=tu-correo@example.com
ADMIN_PASSWORD=TU_CLAVE_ADMIN_DE_12_A_128_CARACTERES
```

`MYSQL_USER` y `MYSQL_PASSWORD` son las credenciales **del servidor MySQL**. `ADMIN_EMAIL` y `ADMIN_PASSWORD` son para entrar **a la aplicación web**; son cuentas distintas.

| Variable | Para qué sirve |
| --- | --- |
| `PORT` | Puerto de la API. |
| `FRONTEND_ORIGIN` | Dirección exacta del frontend permitida por CORS. |
| `JWT_SECRET` | Secreto privado que firma las sesiones. Debe tener al menos 32 caracteres aleatorios. |
| `MYSQL_HOST` | Dirección del servidor MySQL; `127.0.0.1` para tu computadora. |
| `MYSQL_PORT` | Puerto MySQL, normalmente 3306. |
| `MYSQL_DATABASE` | Nombre de la base importada. |
| `MYSQL_USER` / `MYSQL_PASSWORD` | Credenciales con acceso a esa base. |
| `MYSQL_SSL` | `false` para la conexión local; `true` para un servidor con TLS y certificado de confianza. Si tu proveedor usa una CA propia, debes añadir su configuración de certificado al pool en `src/db.js`. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Datos del primer administrador de la aplicación, creado por `init-db`. |

Genera el secreto y pega el resultado en `JWT_SECRET`:

```cmd
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Si una contraseña contiene `#`, pon el valor entre comillas en `.env`. `DB_PATH` ya no se utiliza. Nunca subas el `.env` a GitHub ni pegues secretos en el frontend.

## 4. Crear el primer administrador e iniciar la API

Después de importar el SQL y configurar `.env`, desde `backend`:

```cmd
npm run init-db
npm run dev
```

`init-db` crea el administrador en las tablas ya importadas. Si ya existe un administrador, no cambia su contraseña ni crea otro. Cambiar las variables `ADMIN_*` después no modifica cuentas existentes.

Comprueba [http://localhost:3001/api/health](http://localhost:3001/api/health). Debe devolver:

```json
{"status":"ok","database":"mysql"}
```

Esta comprobación consulta MySQL; permite confirmar que la API tiene conexión. La ruta `/api` sola no está configurada.

## 5. Iniciar el frontend en otra terminal

Desde la raíz `gestion-carreras`:

```cmd
cd frontend
npm ci
copy .env.example .env
```

Configura `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

Esta variable es pública y le indica al navegador dónde está la API. No pongas claves MySQL ni secretos aquí.

```cmd
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173). Reinicia cada proceso si cambias su `.env`.

## 6. Ver los usuarios nuevos mientras se registran

### En MySQL Workbench

Abre `backend/database/consultas.sql` o ejecuta:

```sql
USE carreras_db;
SELECT id, name, email, role, birth_date, created_at
FROM users
ORDER BY id DESC;
```

Deja el navegador al lado. Pulsa **Crear cuenta de participante**, completa el formulario y regístrate. Vuelve a ejecutar la consulta: aparecerá el nuevo usuario. Workbench no actualiza automáticamente el resultado de una consulta ya ejecutada; el dato se guarda al completar el registro, pero debes refrescar la consulta para verlo.

### Actualización automática cada 2 segundos

Abre una tercera terminal en `backend`:

```cmd
npm run db:watch
```

Muestra los últimos 30 usuarios leyendo MySQL cada dos segundos, sin mostrar hashes de contraseñas. Registra usuarios desde el navegador y verás las nuevas filas sin volver a ejecutar consultas manualmente. Detén el monitor con **Ctrl+C**. Este monitor funciona independientemente del frontend.

## 7. Probar carreras e inscripciones

1. Entra como administrador con tus credenciales `ADMIN_*` originales.
2. En **Usuarios**, crea un organizador.
3. Sal e inicia sesión como organizador; crea una carrera con fecha actual o futura y distancias `5,10,15,20`.
4. Sal, crea una cuenta de participante e inicia sesión con ella.
5. Elige una distancia y pulsa **Inscribirme**.
6. En **Inscripciones**, consulta el folio y la categoría.
7. En Workbench ejecuta la segunda consulta de `backend/database/consultas.sql` para consultar el registro con sus relaciones.

## Modelo de datos

| Tabla | Contenido |
| --- | --- |
| `users` | Nombre, correo único, hash, rol, nacimiento y fecha de creación. |
| `races` | Evento, fecha, ubicación, cupo y organizador. |
| `distances` | Kilómetros disponibles por carrera. |
| `registrations` | Folio, usuario, carrera, distancia, categoría y fecha de registro. |

Las tablas usan InnoDB y claves foráneas. Una clave compuesta garantiza que la distancia corresponda a la carrera; las restricciones únicas impiden duplicados. La inscripción bloquea la fila de la carrera con `FOR UPDATE` durante la transacción para proteger el último lugar ante solicitudes simultáneas.

No hay pagos, cronometraje, recuperación de contraseñas, edición ni eliminación en esta versión. No se incluye migración de datos desde SQLite ni se despliega en un servidor externo.

## API

Usa `Authorization: Bearer <token>` en las rutas protegidas.

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/health` | Público, comprueba MySQL |
| POST | `/api/auth/register` | Público; crea participante |
| POST | `/api/auth/login` | Público; devuelve sesión |
| GET | `/api/me` | Autenticado |
| GET / POST | `/api/users` | Admin |
| GET | `/api/races` | Público |
| POST | `/api/races` | Admin u organizador |
| GET | `/api/registrations` | Filtrado según rol |
| POST | `/api/registrations` | Participante |

## Pruebas

Desde `backend`, `npm test` comprueba las categorías y las contraseñas sin necesitar conexión MySQL.

Para las pruebas HTTP, configura en la terminal credenciales MySQL de un usuario de pruebas que pueda crear y eliminar bases, luego ejecuta en CMD:

```cmd
set RUN_MYSQL_TESTS=true
set MYSQL_HOST=127.0.0.1
set MYSQL_PORT=3306
set MYSQL_USER=TU_USUARIO_DE_PRUEBAS
set MYSQL_PASSWORD=TU_CLAVE_DE_PRUEBAS
npm run test:integration
```

La prueba crea una base temporal con prefijo `corre_test_`, ejecuta el flujo y la elimina al terminar. No usa `MYSQL_DATABASE` para las tablas de prueba. No la ejecutes con credenciales de producción. Comprueba permisos, privacidad entre organizadores, folios, duplicados, cupo y dos solicitudes simultáneas al último lugar.

Desde `frontend`, ejecuta `npm run build` para verificar la compilación.

## Errores frecuentes

| Error | Qué revisar |
| --- | --- |
| `ECONNREFUSED` | Que MySQL Server esté iniciado y host/puerto sean correctos. |
| `ER_ACCESS_DENIED_ERROR` | Usuario, contraseña y permisos MySQL de `.env`. |
| `ER_BAD_DB_ERROR` | Importa primero `schema.sql` y comprueba `MYSQL_DATABASE`. |
| Tabla inexistente | Ejecuta el script SQL completo en la base configurada. |
| Error `JWT_SECRET` | Reemplaza el ejemplo con el secreto generado y reinicia. |
| `Failed to fetch` / CORS | Comprueba ambos procesos y usa `http://localhost:5173`. |
| Puerto 3001 ocupado | Detén la versión anterior del backend antes de iniciar esta. |
| No ves un nuevo usuario | Reejecuta la consulta y confirma que Workbench y `.env` apuntan al mismo servidor/base. |

## GitHub

El `.gitignore` excluye `.env`, dependencias y archivos generados. Se incluyen ejemplos de configuración y archivos de bloqueo. Desde la raíz, tú puedes ejecutar:

```cmd
git init
git add .
git status
git commit -m "Agregar gestor de carreras con MySQL"
```

Comprueba que no se incluyan secretos. Crea tu repositorio en GitHub y sigue sus instrucciones para conectar y subir el repositorio. No se realiza ninguna subida automáticamente.

## Referencia técnica

Conexión mediante el cliente [mysql2 con promesas](https://sidorares.github.io/node-mysql2/docs/documentation).
