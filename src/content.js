export const appInfo = {
  name: 'AgileFlow DevOps',
  tagline: 'Sistema ligero para controlar entregas agiles con evidencia DevOps.',
  summary:
    'Una landing funcional con tablero de sprint, control de calidad y flujo de despliegue pensado para explicar cambios en vivo.',
  repositoryUrl: 'https://github.com/JorkLucas03/agileflow-devops',
  cloudRunUrl: 'https://agileflow-devops-slttpg4z3a-uc.a.run.app',
};

export const qualityAttributes = [
  {
    title: 'Modificabilidad',
    description: 'Textos, metricas y tarjetas viven en un solo archivo de contenido.',
    score: 'Alta',
  },
  {
    title: 'Usabilidad',
    description: 'Interfaz clara, responsive y con acciones visibles para una demo rapida.',
    score: 'Alta',
  },
  {
    title: 'Disponibilidad',
    description: 'Preparado para Cloud Run con contenedor reproducible y puerto 8080.',
    score: 'Cloud',
  },
  {
    title: 'Mantenibilidad',
    description: 'Componentes separados, nombres simples y README con pasos de despliegue.',
    score: 'Simple',
  },
];

export const sprintItems = [
  {
    id: 1,
    title: 'Landing informativa',
    owner: 'Frontend',
    status: 'done',
    priority: 'Alta',
  },
  {
    id: 2,
    title: 'Dockerfile para Cloud Run',
    owner: 'DevOps',
    status: 'done',
    priority: 'Alta',
  },
  {
    id: 3,
    title: 'Workflow GitHub Actions',
    owner: 'CI/CD',
    status: 'review',
    priority: 'Media',
  },
  {
    id: 4,
    title: 'Evidencia de despliegue',
    owner: 'Equipo',
    status: 'todo',
    priority: 'Alta',
  },
];

export const pipelineSteps = [
  'Push hacia GitHub',
  'Instalar dependencias',
  'Compilar frontend',
  'Construir imagen',
  'Desplegar en Cloud Run',
];

export const demoChanges = [
  'Cambiar nombre del sistema en src/content.js',
  'Agregar una tarea al arreglo sprintItems',
  'Actualizar el enlace de Cloud Run despues del despliegue',
  'Modificar colores principales en src/styles.css',
];
