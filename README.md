# Gestor Estratégico de Tareas

Aplicación web para gestionar tareas personales, con autenticación de usuarios, persistencia en tiempo real y notificaciones por correo electrónico. Cada usuario solo puede ver y modificar sus propias tareas.

**Demo en producción:** https://proyecto-m4-webster-fievre-3i38.vercel.app/
**Repositorio:** https://github.com/WebsterFever/ProyectoM4_WebsterFievre

---

## Capturas de la aplicación

| Registro | Login |
|---|---|
| ![Registro](./docs/screenshots/register.png) | ![Login](./docs/screenshots/login.png) |

| Dashboard con tareas | Resumen enviado por correo |
|---|---|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Correo enviado](./docs/screenshots/dashboard-email-sent.png) |

| Correo recibido |
|---|
| ![Email recibido](./docs/screenshots/email-received.png) |

> Las imágenes de esta sección deben guardarse en `docs/screenshots/` con los nombres indicados arriba (`register.png`, `login.png`, `dashboard.png`, `dashboard-email-sent.png`, `email-received.png`).

---

## Descripción del proyecto

El Gestor Estratégico de Tareas permite a un usuario registrarse, iniciar sesión y administrar una lista personal de tareas (crear, completar, editar, eliminar), sincronizada en tiempo real. Además, el usuario puede solicitar el envío de un resumen de sus tareas por correo electrónico, procesado de forma segura a través de una función serverless propia.

## Tecnologías utilizadas

- **React 19 + TypeScript** — interfaz de usuario
- **Vite** — herramienta de build y servidor de desarrollo
- **Tailwind CSS v4** — estilos
- **React Router v7** — rutas y navegación del lado del cliente
- **Firebase Authentication** — registro, login, sesión de usuarios
- **Cloud Firestore** — base de datos de tareas, con Security Rules
- **Vercel** — hosting y funciones serverless
- **AWS SES** (vía Vercel Function) — envío de correos electrónicos
- **Vitest + React Testing Library** — testing

## Arquitectura

```text
project-root/
├── src/
│   ├── pages/          # Pantallas completas (Register, Login, Dashboard)
│   ├── components/      # Piezas reutilizables (ProtectedRoute)
│   ├── context/          # AuthContext (estado global de sesión)
│   ├── services/         # Lógica de datos: Firebase, Firestore, email
│   ├── types/             # Interfaces de TypeScript (Task)
│   └── test/               # Configuración de testing
├── api/
│   └── send-email.ts    # Función serverless (Vercel), llama a AWS SES
├── firestore.rules        # Reglas de seguridad de Firestore
├── vercel.json             # Configuración de rutas SPA en Vercel
├── .env / .env.example
└── README.md
```

### Recorrido de los datos

**Autenticación y tareas:**
```text
Usuario → React → Firebase Authentication → Firestore
                                              (protegido por Security Rules
                                               basadas en el UID del usuario)
```

**Envío de email:**
```text
Usuario → React → Vercel Function (/api/send-email) → AWS SES → Email
```

React **nunca** llama directamente a AWS SES. Las credenciales de AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) solo existen como variables de entorno del servidor, en la función serverless — nunca se envían al navegador. Esto evita que cualquier persona pueda extraerlas inspeccionando el código del cliente.

## Instalación

```bash
git clone https://github.com/WebsterFever/ProyectoM4_WebsterFievre.git
cd ProyectoM4_WebsterFievre
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores reales:

```env
# Firebase (públicas, se exponen al navegador — protegidas por Security Rules, no por ocultarlas)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AWS SES (privadas — solo usadas por la función serverless, nunca por el frontend)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
SES_FROM_EMAIL=
```

Las variables con prefijo `VITE_` son incluidas por Vite en el bundle del navegador; las demás solo existen en el entorno de ejecución de la función serverless.

Para correr el proyecto localmente, incluyendo la función serverless:

```bash
npm run dev        # solo frontend (Vite)
vercel dev          # frontend + función serverless (/api/send-email)
```

## Firebase

El proyecto usa dos productos de Firebase:

- **Authentication**, con el proveedor de **email/contraseña** (sin login social ni MFA, fuera del alcance del proyecto).
- **Cloud Firestore**, como base de datos de tareas.

### Flujo de autenticación

1. `registerUser` / `loginUser` (`src/services/authService.ts`) llaman al SDK de Firebase Auth.
2. `AuthContext` (`src/context/AuthContext.tsx`) se suscribe a `onAuthStateChanged`, manteniendo un estado global `{ currentUser, loading }`, accesible desde cualquier componente vía el hook `useAuth()`.
3. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) usa ese estado para redirigir a `/login` si no hay sesión activa, mostrando un estado de carga mientras Firebase confirma la sesión (evitando expulsar por error a un usuario con conexión lenta).

## Firestore — modelo de datos y Security Rules

### Modelo `Task`

```ts
interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Security Rules (`firestore.rules`)

```text
match /tasks/{taskId} {
  allow read, update, delete: if request.auth != null
                                && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null
                 && request.auth.uid == request.resource.data.userId;
}
```

Estas reglas garantizan que un usuario **nunca** pueda leer, editar o eliminar tareas de otro usuario, sin importar lo que haga el frontend. Se verificaron manualmente con el Rules Playground de Firebase, simulando lecturas cruzadas entre dos usuarios distintos (ver sección "Uso de IA" más abajo).

## Flujo de tareas (CRUD)

Toda la lógica de datos vive en `src/services/taskService.ts`, separada de la UI (`src/pages/DashboardPage.tsx`):

1. **Listar** — sincronización en tiempo real con `onSnapshot` (no `getDocs`): cualquier cambio en Firestore se refleja automáticamente en la UI, sin recargar. La suscripción se cancela en la limpieza de `useEffect` para evitar memory leaks.
2. **Crear** — `createTask`, vía `addDoc`.
3. **Completar** — `toggleTaskCompleted`, vía `updateDoc`.
4. **Editar** — `updateTaskTitle`, edición inline en la lista.
5. **Eliminar** — `deleteTask`, vía `deleteDoc`, con confirmación (`window.confirm`).

## Flujo de AWS SES

```text
React (DashboardPage) → sendEmail() → fetch("/api/send-email")
   → api/send-email.ts (Vercel Function) → AWS SES → Email
```

- El frontend solo conoce su propio endpoint `/api/send-email`, nunca AWS directamente.
- La función serverless valida el método HTTP y los campos requeridos, usa el SDK `@aws-sdk/client-ses` con credenciales del entorno del servidor, y devuelve `200`/`400`/`500` según el resultado.
- La UI maneja explícitamente los estados `idle | sending | success | error`.

**Limitación conocida (decisión documentada):** la cuenta de AWS SES está en **modo sandbox**, que solo permite enviar correos a direcciones verificadas. Para efectos de demostración, el resumen de tareas se envía siempre a una dirección fija verificada (`webster.fievre@al.infnet.edu.br`), independientemente del usuario logueado. En un entorno de producción real, se solicitaría "production access" a AWS para levantar esta restricción.

## Testing

```bash
npm test
```

Tests con **Vitest** + **React Testing Library**, sobre `RegisterPage` y `LoginPage`:

- Renderizado correcto de los formularios.
- Actualización de inputs controlados al escribir (interacción de usuario simulada con `@testing-library/user-event`).
- Flujo exitoso: navegación a la siguiente ruta tras registro/login correcto.
- Flujo de error: mensaje de error visible cuando Firebase rechaza la operación.

Firebase (`authService`) está **mockeado** con `vi.mock`, para que los tests no dependan de red ni generen usuarios reales — se prueba el comportamiento del componente, no el de Firebase.

## Deploy

Desplegado en **Vercel**, con despliegue automático en cada `git push` a `main`.

- **Variables de entorno**: configuradas en el dashboard de Vercel (Settings → Environment Variables) para el ambiente de producción — nunca se suben vía Git.
- **Rutas SPA**: `vercel.json` incluye una regla de *rewrite* que redirige cualquier ruta que no sea `/api/*` hacia `index.html`, para que React Router pueda manejar rutas como `/dashboard` correctamente al refrescar o entrar directo por URL.

## Decisiones técnicas

- **Arquitectura de carpetas**: `services/` separa la lógica de datos (Firebase, Firestore, email) de la UI (`pages/`, `components/`), facilitando el testing y el mantenimiento.
- **Context API** (`AuthContext`) en vez de prop drilling: la sesión del usuario se necesita en múltiples componentes no relacionados jerárquicamente (`ProtectedRoute`, `DashboardPage`); centralizarla evita múltiples suscripciones duplicadas a `onAuthStateChanged`.
- **`onSnapshot` en vez de `getDocs`** para listar tareas: sincronización en tiempo real sin refrescos manuales tras cada operación.
- **Modelo `Task` mínimo** (6 campos): campos como `priority` o `dueDate` se dejaron fuera del alcance obligatorio, reservados como posibles extras futuros.
- **IAM de AWS con permisos mínimos**: el usuario `gestor-tareas-ses-sender` solo tiene la política `AmazonSESFullAccess`, no acceso administrativo completo a la cuenta de AWS (principio de menor privilegio).
- **Email fijo en modo sandbox**: ver sección "Flujo de AWS SES".

## Uso de inteligencia artificial

Este proyecto se desarrolló con acompañamiento de un asistente de IA (Claude), en modalidad de mentoría paso a paso: el asistente explicaba conceptos y proponía código, y cada cambio se implementó, probó y verificó manualmente antes de avanzar. A continuación, un registro de los prompts y decisiones más relevantes (no se documentan pasos triviales):

---

**Prompt utilizado:** Guía paso a paso para inicializar un proyecto React + TypeScript con Vite, configurando Git y revisando `.gitignore` antes del primer commit.

**Qué aprendí:** Diferencia entre repositorio remoto (GitHub) y local (`git init`); `git init/add/commit` son operaciones locales, solo `git push` requiere red; el `.gitignore` por defecto de Vite no protege archivos `.env`.

**Decisión que tomé:** Agregar `.env` y `.env.local` al `.gitignore` desde el primer hito, antes de que existiera ningún archivo `.env` real, para evitar subir credenciales por accidente en commits futuros.

---

**Prompt utilizado:** Guía para activar Firebase Authentication con el proveedor email/contraseña, y explicación del patrón Observer detrás de `onAuthStateChanged`.

**Qué aprendí:** Firebase Authentication requiere activar explícitamente cada proveedor de login; el token de sesión se persiste en el navegador, por eso la sesión sobrevive a un refresh.

**Decisión que tomé:** Usar únicamente el proveedor "Email/contraseña", sin login social ni MFA, para mantener el alcance del proyecto acotado a los requisitos definidos.

---

**Prompt utilizado:** Diseño de Firestore Security Rules para que un usuario no pueda leer ni modificar tareas de otro, y verificación práctica antes de construir el CRUD.

**Qué aprendí:** La diferencia entre `resource.data` (datos ya existentes) y `request.resource.data` (datos que se están escribiendo) en las reglas de Firestore; cómo usar el Rules Playground para simular peticiones con distintos UID sin necesitar código de la app.

**Decisión que tomé:** Verificar explícitamente, con dos simulaciones cruzadas (Usuario A leyendo datos de Usuario B, y el propio dueño leyendo los suyos), que el aislamiento de datos funcionaba antes de avanzar al CRUD — no se avanzó hasta confirmar ambos casos.

---

**Prompt utilizado:** Explicación de por qué React no debe llamar directamente a AWS SES, y diseño de la arquitectura React → Vercel Function → AWS SES.

**Qué aprendí:** La diferencia entre variables de entorno públicas (`VITE_...`, incluidas en el bundle del navegador) y privadas (sin prefijo, solo disponibles en funciones serverless); el principio de menor privilegio aplicado a credenciales de AWS (IAM con permisos limitados a SES, no acceso total a la cuenta).

**Decisión que tomé:** Restringir el usuario IAM de AWS a la política `AmazonSESFullAccess` únicamente, y mantener el envío de correos limitado a una dirección verificada mientras la cuenta de SES esté en modo sandbox, documentando esta limitación en vez de intentar levantarla fuera del alcance del proyecto.

---

**Prompt utilizado:** Migración de la carga de tareas de `getDocs` (consulta única) a `onSnapshot` (sincronización en tiempo real), y explicación del riesgo de memory leaks si no se cancela la suscripción.

**Qué aprendí:** La diferencia entre pedir datos una vez y suscribirse a cambios continuos; por qué la función de limpieza de `useEffect` es obligatoria para cancelar suscripciones activas cuando un componente se desmonta o sus dependencias cambian.

**Decisión que tomé:** Eliminar todas las llamadas manuales de "refrescar datos" después de crear/editar/eliminar tareas, dejando que `onSnapshot` actualice la UI automáticamente — reduciendo código duplicado y la posibilidad de que la UI quede desincronizada de Firestore.

---

**Prompt utilizado:** Configuración de tests con Vitest + React Testing Library, incluyendo mockeo de llamadas a Firebase con `vi.mock`.

**Qué aprendí:** Por qué no conviene que los tests llamen a servicios externos reales (lentitud, dependencia de red, efectos secundarios no deterministas como crear usuarios reales); cómo `vi.mock` reemplaza un módulo completo durante la ejecución de un test, y la diferencia entre `mockResolvedValue` (éxito) y `mockRejectedValueOnce` (error, para un solo caso).

**Decisión que tomé:** Escribir al menos un test de caso de error por componente probado (no solo el camino feliz), verificando que los mensajes de error se muestran correctamente cuando Firebase rechaza una operación.

