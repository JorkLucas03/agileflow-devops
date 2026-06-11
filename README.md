# StudyFlow

Frontend para un planificador de estudio personalizado. La app permite ingresar materia, fecha de examen, horas disponibles, dificultad y temas pendientes para generar una ruta inicial de estudio desde la interfaz.

## Que incluye

- Interfaz responsive construida con React y Vite.
- Formulario funcional para crear un plan de estudio.
- Agenda de estudio generada a partir de los temas ingresados.
- Resumen del plan con dias, horas y cobertura estimada.
- Checklist de repaso antes del examen.
- Tecnicas de estudio para orientar la preparacion.
- Tema claro para estudiar en la manana y tema oscuro para estudiar en la noche.
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

## Despliegue recomendado en Google Cloud Run

El proyecto esta preparado para desplegarse como contenedor en Cloud Run usando el puerto `8080`.

Para esta practica, la forma mas simple y estable es desplegar desde Google Cloud Run conectado al repositorio:

1. Ir a Cloud Run.
2. Crear o editar el servicio `studyflow`.
3. Elegir despliegue desde repositorio.
4. Conectar el repositorio de GitHub.
5. Usar el Dockerfile del proyecto.
6. Configurar el puerto del contenedor en `8080`.
7. Desplegar una nueva revision.

Configuracion recomendada:

```text
Nombre del servicio: studyflow
Puerto del contenedor: 8080
```

Si quieres probar el contenedor localmente:

```bash
docker build -t studyflow-frontend .
docker run -p 8080:8080 studyflow-frontend
```

## Estructura

```text
.
|-- Dockerfile
|-- nginx.conf
|-- src/
|   |-- App.jsx
|   |-- content.js
|   |-- main.jsx
|   `-- styles.css
|-- tests/
|   `-- studyflow.spec.js
`-- README.md
```
