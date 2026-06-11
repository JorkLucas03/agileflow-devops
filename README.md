# StudyFlow

Frontend React y backend FastAPI para un planificador de estudio personalizado. La app permite ingresar materia, fecha de examen, horas disponibles, dificultad y temas pendientes para generar y guardar una ruta inicial de estudio.

## Que incluye

- Interfaz responsive construida con React y Vite.
- Backend FastAPI con endpoints REST para contenido y planes de estudio.
- Formulario funcional conectado a la API para crear y actualizar un plan de estudio.
- Agenda de estudio generada por el backend a partir de los temas ingresados.
- Resumen del plan con dias, horas y cobertura estimada.
- Checklist de repaso antes del examen.
- Tecnicas de estudio para orientar la preparacion.
- Tema claro para estudiar en la manana y tema oscuro para estudiar en la noche.
- Dockerfile listo para Cloud Run en el puerto `8080`.
- Persistencia local con SQLite y soporte para PostgreSQL/RDS usando `DATABASE_URL`.
- Workflow de GitHub Actions para probar y desplegar el backend en AWS Elastic Beanstalk.

## Ejecutar localmente

```bash
npm install
npm run dev
```

La app queda disponible normalmente en `http://localhost:5173`.

En otra terminal, instala y ejecuta el backend:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
cd ..
npm run dev:api
```

La API queda disponible en `http://localhost:8000`.

Abre estas rutas para comprobarla:

```text
http://localhost:8000/health
http://localhost:8000/docs
http://localhost:8000/
```

Si el backend esta en otra URL, crea un archivo `.env.local` para el frontend:

```text
VITE_API_URL=http://localhost:8000
```

## Compilar

```bash
npm run build
```

## Verificar

```bash
npm run lint
npm run test:api
npm run test:e2e
```

## API FastAPI

Endpoints principales:

```text
GET    /health
GET    /api/content
POST   /api/study-plans
GET    /api/study-plans
GET    /api/study-plans/{id}
PUT    /api/study-plans/{id}
DELETE /api/study-plans/{id}
```

Payload para crear o actualizar un plan:

```json
{
  "subject": "Matematicas",
  "examDate": "2026-06-24",
  "hoursPerDay": 2,
  "difficulty": "Media",
  "focus": "Examen parcial",
  "topics": "Limites, Derivadas, Integrales"
}
```

## Contenido editable

La mayor parte del contenido esta en:

```text
src/content.js
```

Puedes cambiar:

- Nombre del sistema: `appInfo.name`
- Temas iniciales: `defaultTopics`
- Opciones de dificultad: `difficultyOptions`
- Objetivos de estudio: `focusOptions`
- Checklist: `checklistItems`
- Tecnicas de estudio: `studyMethods`

La apariencia principal esta en:

```text
src/styles.css
```

## Arquitectura planteada

```text
Usuario
  |
  v
Frontend StudyFlow React/Vite
  |
  | HTTP con VITE_API_URL
  v
Backend FastAPI en AWS Elastic Beanstalk
  |
  v
PostgreSQL en Amazon RDS
```

El frontend y el backend se mantienen separados. En desarrollo el backend usa SQLite; en AWS usa PostgreSQL configurando `DATABASE_URL`.

## Despliegue backend en AWS Elastic Beanstalk

El backend esta preparado en `backend/` con:

- `requirements.txt`
- `Procfile`
- `.ebextensions/01_environment.config`
- GitHub Actions en `.github/workflows/backend-aws.yml`

Configura estos secretos en GitHub:

```text
AWS_REGION
AWS_ROLE_TO_ASSUME
EB_APPLICATION_NAME
EB_ENVIRONMENT_NAME
EB_S3_BUCKET
```

En Elastic Beanstalk configura variables de entorno:

- `DATABASE_URL`: URL de PostgreSQL/RDS.
- `CORS_ORIGINS`: dominio del frontend, por ejemplo `https://tu-frontend.com`.

## Estructura

```text
.
|-- Dockerfile
|-- .github/
|   `-- workflows/
|       `-- backend-aws.yml
|-- backend/
|   |-- app/
|   |-- tests/
|   |-- Procfile
|   |-- requirements-dev.txt
|   `-- requirements.txt
|-- nginx.conf
|-- src/
|   |-- App.jsx
|   |-- api.js
|   |-- content.js
|   |-- main.jsx
|   `-- styles.css
|-- tests/
|   `-- studyflow.spec.js
`-- README.md
```
