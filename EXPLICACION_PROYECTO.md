# Explicacion del proyecto StudyFlow

Este documento explica que hace StudyFlow hasta este momento, que tecnologias usa, como se conecta el frontend con el backend, que papel cumple FastAPI, como funciona el guardado local con `localStorage` y como encaja el despliegue con Google Cloud Run y AWS.

## 1. Que es StudyFlow

StudyFlow es una aplicacion web para ayudar a estudiantes a organizar un plan de estudio antes de un examen.

La idea principal es que una persona pueda ingresar:

- Materia.
- Fecha de examen.
- Horas disponibles por dia.
- Dificultad.
- Objetivo del estudio.
- Temas pendientes.

Con esos datos, el sistema genera una agenda de estudio con sesiones, calcula dias disponibles, horas totales, cobertura estimada y ritmo de estudio.

El objetivo del proyecto es demostrar una arquitectura completa:

```text
Usuario
  |
  v
Frontend React en Google Cloud Run
  |
  | Peticiones HTTP / API REST
  v
Backend FastAPI en AWS Elastic Beanstalk
  |
  v
Base de datos o almacenamiento temporal
```

## 2. Lenguajes usados

El proyecto usa principalmente dos lenguajes:

```text
JavaScript
```

Se usa en el frontend con React. Sirve para construir la interfaz, manejar formularios, cambiar el tema visual, llamar la API y guardar informacion en `localStorage`.

```text
Python
```

Se usa en el backend con FastAPI. Sirve para crear la API, validar datos, calcular planes de estudio y guardar informacion usando SQLAlchemy.

Tambien se usan:

- HTML: estructura base de la pagina.
- CSS: estilos, animaciones, tema claro y tema oscuro.
- JSON: formato de intercambio de datos entre frontend y backend.

## 3. Tecnologias principales

### Frontend

El frontend usa:

- React.
- Vite.
- JavaScript moderno.
- CSS personalizado.
- Lucide React para iconos.
- Playwright para pruebas end-to-end.

React permite dividir la interfaz en componentes y manejar estados como:

- Datos del formulario.
- Tema claro u oscuro.
- Plan activo.
- Planes guardados.
- Mensajes de la API.
- Progreso del checklist.

Vite se usa para levantar el servidor de desarrollo y compilar el proyecto para produccion.

### Backend

El backend usa:

- Python.
- FastAPI.
- Uvicorn / Gunicorn.
- SQLAlchemy.
- Pydantic.
- Pytest.

FastAPI permite crear endpoints REST como:

```text
GET    /health
GET    /api/content
POST   /api/study-plans
GET    /api/study-plans
GET    /api/study-plans/{id}
PUT    /api/study-plans/{id}
DELETE /api/study-plans/{id}
```

Pydantic valida los datos que llegan al backend. SQLAlchemy se encarga de la conexion con la base de datos.

## 4. Como funciona el frontend

El frontend vive principalmente en:

```text
src/App.jsx
```

Ese archivo contiene la pantalla principal de StudyFlow.

Actualmente la pagina tiene estas partes:

- Navegacion superior.
- Boton para cambiar entre tema de dia y tema de noche.
- Formulario del planificador.
- Panel de planes guardados.
- Agenda de estudio.
- Checklist de tareas.
- Metodos de estudio.

El formulario recoge los datos que escribe el estudiante. Cuando se presiona **Crear plan**, el frontend prepara un objeto con los datos del formulario y llama al backend usando funciones de:

```text
src/api.js
```

## 5. Como funciona src/api.js

El archivo:

```text
src/api.js
```

es el puente entre React y FastAPI.

Ese archivo decide a que URL se deben enviar las peticiones.

La logica actual es:

- Si existe `VITE_API_URL`, usa esa URL.
- Si la app corre en `localhost` o `127.0.0.1`, usa `http://localhost:8000`.
- Si no hay URL configurada, el frontend puede caer en modo local.

Ejemplo:

```js
const configuredApiUrl = import.meta.env.VITE_API_URL || '';
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = (configuredApiUrl || (isLocalHost ? 'http://localhost:8000' : '')).replace(/\/$/, '');
```

Las funciones principales son:

```js
fetchContent()
createStudyPlan(payload)
updateStudyPlan(id, payload)
```

`createStudyPlan()` hace una peticion `POST` a:

```text
/api/study-plans
```

y envia los datos del formulario en formato JSON.

## 6. Que hace FastAPI

FastAPI es el backend del proyecto. En otras palabras, es el cerebro de StudyFlow.

El archivo principal es:

```text
backend/app/main.py
```

Aqui se crea la aplicacion:

```python
app = FastAPI(title="StudyFlow API", version="1.0.0", lifespan=lifespan)
```

FastAPI recibe solicitudes HTTP del frontend y responde con JSON.

Por ejemplo, cuando el usuario crea un plan, el frontend envia:

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

FastAPI valida esos datos, calcula el plan y devuelve algo como:

```json
{
  "id": 1,
  "subject": "Matematicas",
  "coverage": 100,
  "pace": "Comodo",
  "daysUntilExam": 14,
  "totalHours": 28,
  "dailyPlan": [
    {
      "label": "Sesion 1",
      "title": "Limites",
      "time": "1.5 h",
      "tasks": [
        "Repasar conceptos clave",
        "Resolver ejercicios",
        "Anotar dudas para la siguiente sesion"
      ]
    }
  ]
}
```

Luego React muestra esa respuesta en la interfaz.

## 7. Calculo del plan de estudio

La logica que calcula el plan esta en:

```text
backend/app/planner.py
```

Esa logica hace varias cosas:

- Separa los temas por coma.
- Calcula cuantos dias faltan para el examen.
- Calcula horas totales disponibles.
- Ajusta el esfuerzo segun la dificultad.
- Calcula una cobertura estimada.
- Define un ritmo: `Comodo`, `Constante` o `Intenso`.
- Genera sesiones de estudio.

Ejemplo:

```text
Temas: Limites, Derivadas, Integrales
Horas por dia: 2
Dias hasta el examen: 14
Total: 28 horas
Ritmo: Comodo
```

## 8. Como funciona localStorage

`localStorage` es un almacenamiento del navegador. Sirve para guardar informacion pequena directamente en el navegador del usuario.

En StudyFlow se usa para guardar datos aunque no exista una base de datos definitiva para el frontend.

Se planea usar estas claves:

```text
studyflow-plans
studyflow-active-plan-id
studyflow-theme
```

### studyflow-plans

Guarda los planes creados en el navegador.

Ejemplo conceptual:

```json
[
  {
    "localId": "plan-123",
    "subject": "Matematicas",
    "source": "API",
    "coverage": 100,
    "dailyPlan": [],
    "completedTasks": {}
  }
]
```

### studyflow-active-plan-id

Guarda cual es el plan seleccionado actualmente.

Esto permite que al recargar la pagina el usuario siga viendo el mismo plan.

### studyflow-theme

Guarda si el usuario esta usando:

```text
morning
night
```

Asi el tema claro u oscuro se conserva al recargar.

## 9. Diferencia entre localStorage y base de datos

`localStorage`:

- Vive en el navegador.
- Solo lo ve ese usuario en ese navegador.
- Es util para demostraciones rapidas.
- No necesita servidor.
- Se borra si el usuario limpia los datos del navegador.

Base de datos:

- Vive en el backend o en un servicio externo.
- Puede ser compartida entre usuarios.
- Es mas profesional para produccion.
- Requiere configuracion y conexion.

En este proyecto, el backend ya tiene soporte para base de datos usando SQLAlchemy.

En desarrollo puede usar SQLite.

En AWS puede usar PostgreSQL/RDS con:

```text
DATABASE_URL
```

## 10. Base de datos en el backend

La conexion con la base de datos esta en:

```text
backend/app/database.py
```

Si no se configura `DATABASE_URL`, usa SQLite:

```text
sqlite:///./studyflow.db
```

Si se configura una URL de PostgreSQL, el backend la adapta para usar `psycopg`.

El modelo principal esta en:

```text
backend/app/models.py
```

Alli se define la tabla para guardar planes de estudio.

Se guardan datos como:

- Materia.
- Fecha de examen.
- Horas por dia.
- Dificultad.
- Objetivo.
- Temas ingresados.
- Agenda calculada.
- Cobertura.
- Ritmo.
- Fechas de creacion y actualizacion.

## 11. Flujo completo al crear un plan

El flujo esperado es:

```text
1. El usuario escribe datos en el formulario.
2. Presiona Crear plan.
3. React valida los campos.
4. React llama a FastAPI con POST /api/study-plans.
5. FastAPI valida los datos con Pydantic.
6. FastAPI calcula el plan con planner.py.
7. FastAPI guarda el plan usando SQLAlchemy.
8. FastAPI responde con JSON.
9. React muestra la agenda.
10. React guarda una copia en localStorage.
11. El usuario puede marcar tareas completadas.
12. El progreso queda guardado en el navegador.
```

## 12. Checklist marcable

La idea del checklist es que el estudiante pueda marcar lo que ya hizo.

Cada sesion de estudio tiene tareas como:

- Repasar conceptos clave.
- Resolver ejercicios.
- Anotar dudas.

Cuando el usuario marca una tarea, el frontend actualiza el progreso.

Ejemplo:

```text
3 de 12 tareas completadas
25%
```

Ese progreso se guarda en `localStorage` para que no se pierda al recargar la pagina.

## 13. Tema dia y tema noche

StudyFlow tiene dos temas visuales:

```text
Dia
Noche
```

El tema dia esta pensado para estudiar en la manana o en ambientes claros.

El tema noche esta pensado para estudiar con menos brillo y menos cansancio visual.

El archivo principal de estilos es:

```text
src/styles.css
```

El cambio de tema se maneja con variables CSS y con el atributo:

```text
data-theme="night"
```

El valor elegido se guarda en:

```text
localStorage["studyflow-theme"]
```

## 14. Despliegue del frontend

El frontend se despliega en:

```text
Google Cloud Run
```

Cloud Run ejecuta un contenedor Docker. El proyecto tiene:

```text
Dockerfile
nginx.conf
```

La app React se compila con:

```bash
npm run build
```

Luego Nginx sirve los archivos estaticos generados en `dist/`.

El puerto usado por Cloud Run es:

```text
8080
```

## 15. Despliegue del backend

El backend FastAPI se despliega en:

```text
AWS Elastic Beanstalk
```

El backend esta dentro de:

```text
backend/
```

Archivos importantes:

```text
backend/requirements.txt
backend/Procfile
backend/package_aws.py
backend/app/main.py
```

Elastic Beanstalk ejecuta la API usando Gunicorn/Uvicorn.

La API publica actual indicada para el proyecto es:

```text
http://studyflow-api-elrojo22.us-east-2.elasticbeanstalk.com
```

Rutas para probar:

```text
http://studyflow-api-elrojo22.us-east-2.elasticbeanstalk.com/health
http://studyflow-api-elrojo22.us-east-2.elasticbeanstalk.com/docs
```

## 16. Como se conecta frontend con backend en produccion

Hay dos formas:

### Usando VITE_API_URL

El frontend puede apuntar directamente al backend:

```text
VITE_API_URL=http://studyflow-api-elrojo22.us-east-2.elasticbeanstalk.com
```

Entonces `src/api.js` envia las peticiones a esa URL.

### Usando proxy de Nginx

Tambien se puede configurar el frontend para que las peticiones a:

```text
/api
```

se reenvien al backend.

Esto evita problemas de CORS o de contenido mixto entre HTTPS y HTTP.

## 17. Pruebas del proyecto

El proyecto tiene pruebas de frontend y backend.

### Frontend

Se usa:

```text
Playwright
```

El test principal esta en:

```text
tests/studyflow.spec.js
```

Sirve para verificar que la pagina carga, que se puede crear un plan, que se muestra la agenda y que el checklist persiste.

### Backend

Se usa:

```text
pytest
```

Los tests estan en:

```text
backend/tests/
```

Verifican endpoints como:

- `/health`
- `/api/content`
- `/api/study-plans`

Tambien prueban la logica de `planner.py`.

## 18. Comandos importantes

Instalar dependencias del frontend:

```bash
npm install
```

Ejecutar frontend:

```bash
npm run dev
```

Ejecutar backend:

```bash
npm run dev:api
```

Compilar frontend:

```bash
npm run build
```

Ejecutar lint:

```bash
npm run lint
```

Ejecutar tests del backend:

```bash
npm run test:api
```

Ejecutar pruebas end-to-end:

```bash
npm run test:e2e
```

## 19. Estado actual del proyecto

Hasta ahora StudyFlow tiene:

- Frontend funcional en React.
- Tema claro y oscuro.
- Formulario de plan de estudio.
- Conexion preparada con FastAPI.
- Backend FastAPI con endpoints REST.
- Calculo de planes de estudio.
- Soporte de base de datos con SQLAlchemy.
- Despliegue de frontend pensado para Google Cloud Run.
- Despliegue de backend pensado para AWS Elastic Beanstalk.
- Pruebas automatizadas.
- Guardado local planeado con `localStorage` para demostrar persistencia sin depender completamente de una base de datos.

## 20. Que falta o que se puede mejorar despues

Mejoras futuras posibles:

- Login de usuarios.
- Historial de planes por usuario.
- Guardar checklist directamente en backend.
- Integracion con calendario.
- Temporizador Pomodoro.
- Notificaciones de estudio.
- Exportar plan a PDF.
- Estadisticas de avance.
- Panel de administrador.

La siguiente mejora mas natural seria guardar el progreso del checklist en el backend para que el usuario pueda abrirlo desde cualquier navegador.
