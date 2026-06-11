APP_INFO = {
    "name": "StudyFlow",
    "tagline": "Planificador de estudio personalizado para estudiantes.",
    "summary": (
        "Crea una agenda clara para preparar examenes, ordenar temas pendientes "
        "y estudiar con sesiones faciles de seguir."
    ),
}

DEFAULT_TOPICS = ["Limites", "Derivadas", "Integrales", "Aplicaciones"]

DIFFICULTY_OPTIONS = ["Baja", "Media", "Alta"]

FOCUS_OPTIONS = ["Examen parcial", "Final acumulativo", "Recuperacion"]

CHECKLIST_ITEMS = [
    {
        "title": "Resumen principal",
        "description": "Condensa formulas, conceptos y pasos que siempre debes recordar.",
    },
    {
        "title": "Practica guiada",
        "description": "Resuelve ejercicios por tema antes de mezclar todo en un simulacro.",
    },
    {
        "title": "Dudas pendientes",
        "description": "Separa lo que no entiendes para repasarlo con tiempo o pedir ayuda.",
    },
    {
        "title": "Simulacro final",
        "description": "Ensaya con tiempo limitado y corrige errores antes del dia del examen.",
    },
]

STUDY_METHODS = [
    {
        "label": "25 min",
        "title": "Pomodoro",
        "description": "Estudia en bloques cortos, descansa y vuelve con una meta concreta.",
    },
    {
        "label": "Activo",
        "title": "Preguntas propias",
        "description": "Convierte cada tema en preguntas para comprobar si realmente lo entendiste.",
    },
    {
        "label": "Repaso",
        "title": "Errores frecuentes",
        "description": "Guarda los fallos que repites y revisalos antes de pasar al siguiente tema.",
    },
]


def get_content() -> dict:
    return {
        "appInfo": APP_INFO,
        "defaultTopics": DEFAULT_TOPICS,
        "difficultyOptions": DIFFICULTY_OPTIONS,
        "focusOptions": FOCUS_OPTIONS,
        "checklistItems": CHECKLIST_ITEMS,
        "studyMethods": STUDY_METHODS,
    }
