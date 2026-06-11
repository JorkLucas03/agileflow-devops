# StudyFlow

Frontend para un planificador de estudio personalizado. La app permite ingresar materia, fecha de examen, horas disponibles, dificultad y temas pendientes para generar una ruta inicial de estudio desde la interfaz.

## Que incluye

- Interfaz responsive construida con React y Vite.
- Formulario funcional para crear un plan de estudio.
- Agenda de estudio generada a partir de los temas ingresados.
- Resumen del plan con dias, horas y cobertura estimada.
- Checklist de repaso antes del examen.
- Tecnicas de estudio para orientar la preparacion.
- Dockerfile listo para Cloud Run en el puerto `8080`.

## Ejecutar localmente

```bash
npm install
npm run dev
```

La app queda disponible normalmente en `http://localhost:5173`.

## Compilar

```bash
npm run build
```

## Verificar

```bash
npm run lint
npm run test:e2e
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
Frontend StudyFlow en Google Cloud Run
  |
  | POST /api/study-plan
  v
Backend FastAPI en AWS
```

Por ahora el plan se genera en el frontend para dejar lista la experiencia visual. En la siguiente fase, el formulario puede enviar los mismos datos a un backend FastAPI desplegado en AWS sin cambiar la pantalla principal.

## Despliegue en Google Cloud Run

El contenedor sirve la app con Nginx en el puerto `8080`, compatible con Cloud Run.

```bash
docker build -t studyflow-frontend .
docker run -p 8080:8080 studyflow-frontend
```

## Estructura

```text
.
├── Dockerfile
├── nginx.conf
├── src/
│   ├── App.jsx
│   ├── content.js
│   ├── main.jsx
│   └── styles.css
├── tests/
│   └── studyflow.spec.js
└── README.md
```
