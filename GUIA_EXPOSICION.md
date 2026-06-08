# Guia de exposicion - AgileFlow DevOps

## 1. Idea principal

Este proyecto es una aplicacion frontend hecha con React y Vite para demostrar un flujo DevOps completo:

- Desarrollo de una interfaz web responsive.
- Pruebas y validaciones locales.
- Construccion de una imagen Docker.
- Despliegue automatico en Google Cloud Run usando GitHub Actions.

Nombre del sistema: `AgileFlow DevOps`

URL desplegada:

```text
https://agileflow-devops-slttpg4z3a-uc.a.run.app
```

Repositorio configurado en la app:

```text
https://github.com/JorkLucas03/agileflow-devops
```

## 2. Como ejecutar localmente

En PowerShell de Windows, usa `npm.cmd` para evitar el bloqueo de scripts:

```powershell
npm.cmd ci
npm.cmd run dev
```

La app queda disponible en:

```text
http://localhost:5173
```

## 3. Comandos de verificacion

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

Si Playwright no tiene navegador instalado:

```powershell
npx.cmd playwright install chromium
```

## 4. Como se construye para produccion

El comando:

```powershell
npm.cmd run build
```

genera la carpeta `dist/` con archivos estaticos listos para publicar.

## 5. Como funciona Docker

El `Dockerfile` usa dos etapas:

1. `node:24-alpine`: instala dependencias y ejecuta `npm run build`.
2. `nginx:1.29-alpine`: sirve la carpeta `dist/` como sitio estatico.

Cloud Run espera que el contenedor escuche en el puerto `8080`, por eso `nginx.conf` tiene:

```text
listen 8080;
```

## 6. Como se desplego

El despliegue esta automatizado en:

```text
.github/workflows/deploy-cloud-run.yml
```

El flujo se ejecuta cuando hay `push` a la rama `main` o manualmente desde GitHub Actions.

Pasos principales:

- Descarga el codigo del repositorio.
- Instala o valida Google Cloud CLI.
- Se autentica contra Google Cloud con Workload Identity Federation.
- Ejecuta `gcloud run deploy`.
- Publica el servicio `agileflow-devops` en la region `us-central1`.

Comando clave del workflow:

```bash
gcloud run deploy agileflow-devops --source . --region us-central1 --allow-unauthenticated --quiet
```

## 7. Que mostrar durante la defensa

Orden recomendado:

1. Abrir la app desplegada en Cloud Run.
2. Mostrar el tablero de sprint y cambiar filtros: Todo, Pendiente, Revision, Listo.
3. Explicar atributos de calidad: modificabilidad, usabilidad, disponibilidad y mantenibilidad.
4. Abrir `src/content.js` y explicar que la mayoria del contenido editable vive ahi.
5. Abrir `Dockerfile` y explicar que la app se compila y luego se sirve con Nginx.
6. Abrir `.github/workflows/deploy-cloud-run.yml` y explicar el despliegue automatico.
7. Mostrar una ejecucion exitosa en GitHub Actions.
8. Mostrar el servicio en Cloud Run y su URL publica.

## 8. Cambio en vivo recomendado

Modifica una tarea en `src/content.js`, por ejemplo cambia:

```js
title: 'Evidencia de despliegue',
```

por:

```js
title: 'Evidencia de despliegue en Cloud Run',
```

Luego ejecuta:

```powershell
npm.cmd run build
```

Si vas a demostrar CI/CD completo, sube el cambio a GitHub:

```powershell
git add .
git commit -m "Update sprint evidence text"
git push
```

Eso dispara GitHub Actions y redepliega en Cloud Run.

## 9. Guion corto

"AgileFlow DevOps es una aplicacion React construida con Vite. La hice para demostrar una practica completa de DevOps: codigo versionado en GitHub, validacion local, construccion de produccion, contenedor Docker y despliegue automatico a Google Cloud Run. La app no depende de backend, por eso es facil de desplegar como sitio estatico. El contenido esta centralizado en `src/content.js`, lo que mejora la modificabilidad. El `Dockerfile` compila la app y la sirve con Nginx por el puerto `8080`, que es el puerto usado por Cloud Run. El workflow de GitHub Actions se autentica con Google Cloud mediante Workload Identity Federation y ejecuta `gcloud run deploy`. Cada push a `main` puede publicar una nueva version del servicio."

