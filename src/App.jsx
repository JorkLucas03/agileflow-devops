import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ListChecks,
  Moon,
  NotebookPen,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Sun,
  Target,
  Trash2,
} from 'lucide-react';
import {
  appInfo,
  checklistItems,
  defaultTopics,
  difficultyOptions,
  focusOptions,
  studyMethods,
} from './content';
import { createStudyPlan, fetchContent, fetchStudyPlans } from './api';

const difficultyWeight = {
  Baja: 0.85,
  Media: 1,
  Alta: 1.25,
};

const STORAGE_KEYS = {
  plans: 'studyflow-plans',
  activePlanId: 'studyflow-active-plan-id',
  theme: 'studyflow-theme',
};

const MIN_HOURS_PER_DAY = 1;
const MAX_HOURS_PER_DAY = 8;
const MAX_SUBJECT_LENGTH = 120;
const MAX_TOPICS_LENGTH = 600;

const fallbackPlan = {
  coverage: 0,
  dailyPlan: [],
  daysUntilExam: 0,
  pace: 'Sin plan',
  topics: [],
  totalHours: 0,
};

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function splitTopics(value) {
  return value
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function getDaysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(exam.getTime())) return 1;
  return Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / 86400000));
}

function getSafeHoursPerDay(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return MIN_HOURS_PER_DAY;
  return Math.min(MAX_HOURS_PER_DAY, Math.max(MIN_HOURS_PER_DAY, hours));
}

function formatHours(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`;
}

function buildLocalStudyPlan(form) {
  const subject = form.subject.trim() || 'Tu materia';
  const topics = splitTopics(form.topics);
  const daysUntilExam = getDaysUntil(form.examDate);
  const hoursPerDay = getSafeHoursPerDay(form.hoursPerDay);
  const totalHours = daysUntilExam * hoursPerDay;
  const requiredHours = Math.max(6, topics.length * 3.5 * (difficultyWeight[form.difficulty] || 1));
  const coverage = Math.min(100, Math.round((totalHours / requiredHours) * 100));
  const pace = coverage >= 90 ? 'Comodo' : coverage >= 62 ? 'Constante' : 'Intenso';
  const sessions = Math.min(5, Math.max(3, topics.length));

  const dailyPlan = Array.from({ length: sessions }, (_, index) => {
    const dayNumber = index + 1;
    const topic = topics[index % topics.length] || subject;
    const isFinalSession = dayNumber === sessions;

    return {
      label: isFinalSession ? 'Cierre' : `Sesion ${dayNumber}`,
      title: isFinalSession ? 'Simulacro final' : topic,
      time: isFinalSession ? formatHours(hoursPerDay) : formatHours(Math.max(1, hoursPerDay - 0.5)),
      tasks: isFinalSession
        ? ['Resolver un simulacro', 'Corregir errores', 'Preparar hoja de formulas o resumen']
        : ['Repasar conceptos clave', 'Resolver ejercicios', 'Anotar dudas para la siguiente sesion'],
    };
  });

  return {
    coverage,
    dailyPlan,
    daysUntilExam,
    pace,
    topics,
    totalHours,
  };
}

function validateStudyForm(form, content) {
  const errors = {};
  const subject = form.subject.trim();
  const hoursPerDay = Number(form.hoursPerDay);
  const exam = new Date(`${form.examDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!subject) {
    errors.subject = 'Escribe una materia para crear el plan.';
  } else if (subject.length > MAX_SUBJECT_LENGTH) {
    errors.subject = `La materia no puede superar ${MAX_SUBJECT_LENGTH} caracteres.`;
  }

  if (!form.examDate || Number.isNaN(exam.getTime())) {
    errors.examDate = 'Selecciona una fecha de examen valida.';
  } else if (exam < today) {
    errors.examDate = 'La fecha de examen no puede estar en el pasado.';
  }

  if (form.hoursPerDay === '' || !Number.isFinite(hoursPerDay)) {
    errors.hoursPerDay = 'Ingresa las horas de estudio por dia.';
  } else if (hoursPerDay < MIN_HOURS_PER_DAY || hoursPerDay > MAX_HOURS_PER_DAY) {
    errors.hoursPerDay = `Ingresa entre ${MIN_HOURS_PER_DAY} y ${MAX_HOURS_PER_DAY} horas por dia.`;
  }

  if (form.topics.length > MAX_TOPICS_LENGTH) {
    errors.topics = `Los temas pendientes no pueden superar ${MAX_TOPICS_LENGTH} caracteres.`;
  }

  if (!content.difficultyOptions.includes(form.difficulty)) {
    errors.difficulty = 'Selecciona una dificultad valida.';
  }

  if (!content.focusOptions.includes(form.focus)) {
    errors.focus = 'Selecciona un objetivo valido.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    message: Object.values(errors)[0] || '',
  };
}

function readJsonStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function sanitizePlanId(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  const isApiPlanId = /^api-\d{1,12}$/.test(trimmedValue);
  const isLocalPlanId = /^plan-\d{10,16}-[a-f0-9]{4,32}$/.test(trimmedValue);

  return isApiPlanId || isLocalPlanId ? trimmedValue : null;
}

function makeLocalId() {
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeTaskKey(sessionIndex, taskIndex) {
  return `${sessionIndex}:${taskIndex}`;
}

function countTasks(plan) {
  return plan.dailyPlan.reduce((total, session) => total + session.tasks.length, 0);
}

function buildStoredPlan(plan, form, source, existingPlan = {}) {
  const now = new Date().toISOString();
  return {
    ...plan,
    localId: plan.id ? `api-${plan.id}` : existingPlan.localId || makeLocalId(),
    backendId: plan.id ?? existingPlan.backendId ?? null,
    source,
    subject: form.subject.trim(),
    examDate: form.examDate,
    hoursPerDay: Number(form.hoursPerDay),
    difficulty: form.difficulty,
    focus: form.focus,
    topicsInput: form.topics.trim(),
    completedTasks: existingPlan.completedTasks || {},
    createdAt: plan.createdAt || existingPlan.createdAt || now,
    updatedAt: plan.updatedAt || existingPlan.updatedAt || now,
    savedAt: plan.updatedAt || now,
  };
}

function formFromApiPlan(plan) {
  return {
    subject: plan.subject || '',
    examDate: plan.examDate || formatInputDate(addDays(new Date(), 14)),
    hoursPerDay: plan.hoursPerDay || 2,
    difficulty: plan.difficulty || 'Media',
    focus: plan.focus || 'Examen parcial',
    topics: plan.topicsInput || plan.topics?.join(', ') || '',
  };
}

function App() {
  const agendaRef = useRef(null);
  const plannerRef = useRef(null);
  const isMountedRef = useRef(false);
  const apiSyncSignatureRef = useRef('');
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || 'morning');
  const [form, setForm] = useState(() => ({
    subject: 'Matematicas',
    examDate: formatInputDate(addDays(new Date(), 14)),
    hoursPerDay: 2,
    difficulty: 'Media',
    focus: 'Examen parcial',
    topics: defaultTopics.join(', '),
  }));
  const [content, setContent] = useState({
    appInfo,
    checklistItems,
    defaultTopics,
    difficultyOptions,
    focusOptions,
    studyMethods,
  });
  const [savedPlans, setSavedPlans] = useState(() => readJsonStorage(STORAGE_KEYS.plans, []));
  const [activePlanId, setActivePlanId] = useState(() =>
    sanitizePlanId(localStorage.getItem(STORAGE_KEYS.activePlanId)),
  );
  const [apiStatus, setApiStatus] = useState('idle');
  const [apiMessage, setApiMessage] = useState('');

  const validation = useMemo(() => validateStudyForm(form, content), [form, content]);
  const formErrors = validation.errors;
  const localPlan = useMemo(() => buildLocalStudyPlan(form), [form]);
  const activePlan = savedPlans.find((item) => item.localId === activePlanId) || null;
  const displayedPlan = activePlan || localPlan || fallbackPlan;
  const displayedSubject = activePlan?.subject || form.subject || 'Tu materia';
  const taskTotal = countTasks(displayedPlan);
  const completedTotal = activePlan ? Object.values(activePlan.completedTasks || {}).filter(Boolean).length : 0;
  const progressPercent = taskTotal ? Math.round((completedTotal / taskTotal) * 100) : 0;
  const themeLabel = theme === 'morning' ? 'Noche' : 'Dia';
  const activePlanSource = activePlan?.source === 'api' ? 'API' : activePlan ? 'Local' : 'Vista previa';

  const syncLatestApiPlan = useCallback(async ({ showMessage = false } = {}) => {
    if (showMessage) {
      setApiStatus('saving');
      setApiMessage('Sincronizando planes desde la API...');
    }

    try {
      const plans = await fetchStudyPlans();
      if (!isMountedRef.current) return;

      const latestPlan = plans[0];
      if (!latestPlan) {
        if (showMessage) {
          setApiStatus('ready');
          setApiMessage('La API no tiene planes guardados todavia.');
        }
        return;
      }

      const signature = `${latestPlan.id}:${latestPlan.updatedAt || latestPlan.createdAt || ''}`;
      if (apiSyncSignatureRef.current === signature) {
        if (showMessage) {
          setApiStatus('ready');
          setApiMessage('Ya estas viendo el ultimo plan guardado en la API.');
        }
        return;
      }

      apiSyncSignatureRef.current = signature;
      const nextForm = formFromApiPlan(latestPlan);
      const nextLocalId = `api-${latestPlan.id}`;

      setSavedPlans((current) => {
        const existingPlan = current.find((item) => item.backendId === latestPlan.id);
        const importedPlan = buildStoredPlan(latestPlan, nextForm, 'api', existingPlan);
        const otherPlans = current.filter(
          (item) => item.localId !== importedPlan.localId && item.backendId !== importedPlan.backendId,
        );
        return [importedPlan, ...otherPlans].slice(0, 8);
      });
      setForm(nextForm);
      setActivePlanId(nextLocalId);
      setApiStatus('ready');
      setApiMessage(`Plan de ${nextForm.subject} sincronizado desde la API.`);
    } catch {
      if (!isMountedRef.current || !showMessage) return;
      setApiStatus('error');
      setApiMessage('No se pudo sincronizar con la API en este momento.');
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const initialSyncId = window.setTimeout(() => syncLatestApiPlan(), 0);
    const intervalId = window.setInterval(() => syncLatestApiPlan(), 4000);
    return () => {
      window.clearTimeout(initialSyncId);
      window.clearInterval(intervalId);
    };
  }, [syncLatestApiPlan]);

  useEffect(() => {
    let isMounted = true;

    fetchContent()
      .then((remoteContent) => {
        if (isMounted) {
          setContent(remoteContent);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiMessage('No se pudo cargar contenido desde la API. Se usara la informacion local.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(savedPlans));
  }, [savedPlans]);

  useEffect(() => {
    const safeActivePlanId = sanitizePlanId(activePlanId);

    if (safeActivePlanId) {
      localStorage.setItem(STORAGE_KEYS.activePlanId, safeActivePlanId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.activePlanId);
    }
  }, [activePlanId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function scrollToPlanner() {
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function scrollToAgenda() {
    if (activePlan) {
      agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setApiMessage('Primero crea un plan para abrir la agenda guardada.');
      scrollToPlanner();
    }
  }

  function openPlan(plan) {
    setActivePlanId(plan.localId);
    setForm({
      subject: plan.subject,
      examDate: plan.examDate,
      hoursPerDay: plan.hoursPerDay,
      difficulty: plan.difficulty,
      focus: plan.focus,
      topics: plan.topicsInput,
    });
    setApiMessage(`Plan de ${plan.subject} abierto desde Mis planes.`);
    window.setTimeout(() => {
      agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function removePlan(localId) {
    setSavedPlans((current) => current.filter((item) => item.localId !== localId));
    if (activePlanId === localId) {
      setActivePlanId(null);
    }
  }

  function resetPlanForm() {
    setActivePlanId(null);
    setForm({
      subject: '',
      examDate: formatInputDate(addDays(new Date(), 14)),
      hoursPerDay: 2,
      difficulty: content.difficultyOptions[1] || 'Media',
      focus: content.focusOptions[0] || 'Examen parcial',
      topics: '',
    });
    setApiMessage('Formulario listo para crear un nuevo plan.');
    scrollToPlanner();
  }

  async function handleCreatePlan() {
    if (!validation.isValid) {
      setApiStatus('validation');
      setApiMessage(validation.message);
      scrollToPlanner();
      return;
    }

    setApiStatus('saving');
    setApiMessage('Generando plan de estudio...');

    const payload = {
      ...form,
      subject: form.subject.trim(),
      hoursPerDay: Number(form.hoursPerDay),
      topics: form.topics.trim(),
    };

    try {
      const apiPlan = await createStudyPlan(payload);
      const storedPlan = buildStoredPlan(apiPlan, form, 'api');
      setSavedPlans((current) => [storedPlan, ...current].slice(0, 8));
      setActivePlanId(storedPlan.localId);
      setApiStatus('ready');
      setApiMessage('Plan creado con FastAPI y guardado en este navegador.');
      window.setTimeout(scrollToAgenda, 120);
    } catch (error) {
      const storedPlan = buildStoredPlan(localPlan, form, 'local');
      setSavedPlans((current) => [storedPlan, ...current].slice(0, 8));
      setActivePlanId(storedPlan.localId);
      setApiStatus(error.status === 422 ? 'validation' : 'error');
      setApiMessage(
        error.status === 422
          ? error.message
          : 'No se pudo conectar con la API. Se creo una copia local para continuar la demo.',
      );
      window.setTimeout(scrollToAgenda, 120);
    }
  }

  function toggleTheme() {
    setTheme((current) => (current === 'morning' ? 'night' : 'morning'));
  }

  function toggleTask(sessionIndex, taskIndex) {
    if (!activePlan) return;

    const taskKey = makeTaskKey(sessionIndex, taskIndex);
    setSavedPlans((current) =>
      current.map((plan) =>
        plan.localId === activePlan.localId
          ? {
              ...plan,
              completedTasks: {
                ...plan.completedTasks,
                [taskKey]: !plan.completedTasks?.[taskKey],
              },
              savedAt: new Date().toISOString(),
            }
          : plan,
      ),
    );
  }

  return (
    <main>
      <section className="hero" id="inicio">
        <nav className="nav" aria-label="Principal">
          <a className="brand" href="#inicio" aria-label={content.appInfo.name}>
            <span className="brandMark">
              <GraduationCap size={22} aria-hidden="true" />
            </span>
            {content.appInfo.name}
          </a>
          <div className="navControls">
            <div className="navLinks">
              <a href="#planificador">Planificador</a>
              <button onClick={scrollToAgenda} type="button">
                Agenda
              </button>
              <a href="#checklist">Checklist</a>
            </div>
            <button className="themeToggle" onClick={toggleTheme} type="button">
              {theme === 'morning' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
              {themeLabel}
            </button>
          </div>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <span className="eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              Estudia con orden
            </span>
            <h1>{content.appInfo.name}</h1>
            <p>{content.appInfo.summary}</p>
            <div className="heroActions">
              <button className="button primary" onClick={handleCreatePlan} type="button">
                {apiStatus === 'saving' ? 'Generando...' : 'Crear plan'}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button className="button ghost" onClick={scrollToAgenda} type="button">
                Ver agenda
                <CalendarDays size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <section className="plannerPanel" id="planificador" ref={plannerRef} aria-label="Planificador StudyFlow">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">
                  <BrainCircuit size={16} aria-hidden="true" />
                  Planificador
                </span>
                <h2>Prepara tu proximo examen</h2>
              </div>
              <span className="paceBadge">{displayedPlan.pace}</span>
            </div>
            {apiMessage && (
              <p className={apiStatus === 'validation' ? 'apiMessage validation' : 'apiMessage'} role="status">
                {apiMessage}
              </p>
            )}

            <div className="formGrid">
              <label className={formErrors.subject ? 'field hasError' : 'field'}>
                <span>Materia</span>
                <input
                  aria-describedby={formErrors.subject ? 'subject-error' : undefined}
                  aria-invalid={Boolean(formErrors.subject)}
                  maxLength={MAX_SUBJECT_LENGTH}
                  required
                  value={form.subject}
                  onChange={(event) => updateForm('subject', event.target.value)}
                  type="text"
                />
                {formErrors.subject && (
                  <small className="fieldError" id="subject-error">
                    {formErrors.subject}
                  </small>
                )}
              </label>

              <label className={formErrors.examDate ? 'field hasError' : 'field'}>
                <span>Fecha de examen</span>
                <input
                  aria-describedby={formErrors.examDate ? 'examDate-error' : undefined}
                  aria-invalid={Boolean(formErrors.examDate)}
                  min={formatInputDate(new Date())}
                  required
                  value={form.examDate}
                  onChange={(event) => updateForm('examDate', event.target.value)}
                  type="date"
                />
                {formErrors.examDate && (
                  <small className="fieldError" id="examDate-error">
                    {formErrors.examDate}
                  </small>
                )}
              </label>

              <label className={formErrors.hoursPerDay ? 'field hasError' : 'field'}>
                <span>Horas por dia</span>
                <input
                  aria-describedby={formErrors.hoursPerDay ? 'hoursPerDay-error' : undefined}
                  aria-invalid={Boolean(formErrors.hoursPerDay)}
                  min={MIN_HOURS_PER_DAY}
                  max={MAX_HOURS_PER_DAY}
                  required
                  step="0.5"
                  value={form.hoursPerDay}
                  onChange={(event) => updateForm('hoursPerDay', event.target.value)}
                  type="number"
                />
                {formErrors.hoursPerDay && (
                  <small className="fieldError" id="hoursPerDay-error">
                    {formErrors.hoursPerDay}
                  </small>
                )}
              </label>

              <label className={formErrors.difficulty ? 'field hasError' : 'field'}>
                <span>Dificultad</span>
                <select
                  aria-describedby={formErrors.difficulty ? 'difficulty-error' : undefined}
                  aria-invalid={Boolean(formErrors.difficulty)}
                  required
                  value={form.difficulty}
                  onChange={(event) => updateForm('difficulty', event.target.value)}
                >
                  {content.difficultyOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                {formErrors.difficulty && (
                  <small className="fieldError" id="difficulty-error">
                    {formErrors.difficulty}
                  </small>
                )}
              </label>
            </div>

            <label className={formErrors.topics ? 'wideField field hasError' : 'wideField field'}>
              <span>Temas pendientes</span>
              <textarea
                aria-describedby={formErrors.topics ? 'topics-error' : undefined}
                aria-invalid={Boolean(formErrors.topics)}
                maxLength={MAX_TOPICS_LENGTH}
                value={form.topics}
                onChange={(event) => updateForm('topics', event.target.value)}
                rows="3"
              />
              {formErrors.topics && (
                <small className="fieldError" id="topics-error">
                  {formErrors.topics}
                </small>
              )}
            </label>

            <div className="focusGroup" aria-label="Tipo de objetivo">
              {content.focusOptions.map((option) => (
                <button
                  className={form.focus === option ? 'chip active' : 'chip'}
                  key={option}
                  onClick={() => updateForm('focus', option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="plannerFooter">
              <div>
                <span>{activePlan ? `Guardado: ${activePlanSource}` : 'Vista previa de cobertura'}</span>
                <strong>{displayedPlan.coverage}%</strong>
              </div>
              <div className="coverageTrack" aria-hidden="true">
                <span style={{ width: `${displayedPlan.coverage}%` }} />
              </div>
            </div>

            <div className="plannerActions">
              <button className="button primary" onClick={handleCreatePlan} type="button">
                {apiStatus === 'saving' ? 'Generando...' : 'Crear plan'}
                <Save size={18} aria-hidden="true" />
              </button>
              <button className="button ghost" onClick={resetPlanForm} type="button">
                Nuevo plan
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      </section>

      <section className="section savedPlansSection" aria-label="Mis planes guardados">
        <div className="sectionHeader compact">
          <div>
            <span className="eyebrow">
              <Save size={16} aria-hidden="true" />
              Mis planes
            </span>
            <h2>Planes guardados en este navegador</h2>
            <p>Tambien se importa aqui el ultimo plan creado desde /docs o cualquier cliente REST.</p>
          </div>
          <button className="button ghost syncButton" onClick={() => syncLatestApiPlan({ showMessage: true })} type="button">
            Sincronizar API
            <RefreshCw size={18} aria-hidden="true" />
          </button>
        </div>

        {savedPlans.length === 0 ? (
          <div className="emptyPlans">
            <p>Crea tu primer plan para verlo guardado aqui.</p>
          </div>
        ) : (
          <div className="savedPlansGrid">
            {savedPlans.map((item) => (
              <article className={item.localId === activePlanId ? 'savedPlan active' : 'savedPlan'} key={item.localId}>
                <div>
                  <span>{item.source === 'api' ? 'API' : 'Local'}</span>
                  <h3>{item.subject}</h3>
                  <p>
                    {item.pace} · {item.coverage}% · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="savedPlanActions">
                  <button onClick={() => openPlan(item)} type="button">
                    Abrir
                  </button>
                  <button aria-label={`Eliminar ${item.subject}`} onClick={() => removePlan(item.localId)} type="button">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section agendaSection" id="agenda" ref={agendaRef}>
        <div className="agendaIntro">
          <div>
            <span className="eyebrow">
              <NotebookPen size={16} aria-hidden="true" />
              Agenda de estudio
            </span>
            <h2>{activePlan ? `Tu ruta para ${displayedSubject}` : 'Crea un plan para activar tu agenda'}</h2>
            <p>
              {activePlan
                ? 'Marca cada tarea completada para ver tu avance real antes del examen.'
                : 'La agenda se guardara y quedara lista cuando presiones Crear plan.'}
            </p>
          </div>

          <div className="planSummary" aria-label="Resumen del plan">
            <div>
              <CalendarDays size={20} aria-hidden="true" />
              <strong>{displayedPlan.daysUntilExam}</strong>
              <span>Dias</span>
            </div>
            <div>
              <Clock3 size={20} aria-hidden="true" />
              <strong>{displayedPlan.totalHours}</strong>
              <span>Horas</span>
            </div>
            <div>
              <Target size={20} aria-hidden="true" />
              <strong>{activePlan ? `${completedTotal}/${taskTotal}` : `${displayedPlan.coverage}%`}</strong>
              <span>{activePlan ? 'Tareas' : 'Cobertura'}</span>
            </div>
          </div>
        </div>

        {activePlan && (
          <div className="progressPanel" aria-label="Progreso del checklist">
            <div>
              <strong>{completedTotal} de {taskTotal} tareas completadas</strong>
              <span>{progressPercent}%</span>
            </div>
            <div className="coverageTrack" aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="routeGrid">
          {displayedPlan.dailyPlan.map((item, sessionIndex) => {
            const sessionTaskKeys = item.tasks.map((_, taskIndex) => makeTaskKey(sessionIndex, taskIndex));
            const completedSession = activePlan && sessionTaskKeys.every((taskKey) => activePlan.completedTasks?.[taskKey]);

            return (
              <article className={completedSession ? 'routeCard completed' : 'routeCard'} key={`${item.label}-${item.title}`}>
                <div className="cardTop">
                  <span>{item.label}</span>
                  <small>{item.time}</small>
                </div>
                <h3>{item.title}</h3>
                <div className="taskList">
                  {item.tasks.map((task, taskIndex) => {
                    const taskKey = makeTaskKey(sessionIndex, taskIndex);
                    const checked = Boolean(activePlan?.completedTasks?.[taskKey]);

                    return (
                      <label className={checked ? 'taskItem checked' : 'taskItem'} key={task}>
                        <input
                          checked={checked}
                          disabled={!activePlan}
                          onChange={() => toggleTask(sessionIndex, taskIndex)}
                          type="checkbox"
                        />
                        <span>{task}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section checklistSection" id="checklist">
        <div className="sectionHeader">
          <span className="eyebrow">
            <ListChecks size={16} aria-hidden="true" />
            Antes del examen
          </span>
          <h2>Checklist para llegar con calma</h2>
          <p>
            Usa esta lista como guia general y marca las tareas concretas en la agenda de tu plan.
          </p>
        </div>

        <div className="checklistGrid">
          {content.checklistItems.map((item) => (
            <article className="checkCard" key={item.title}>
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section methodsSection">
        <div className="sectionHeader compact">
          <span className="eyebrow">
            <BookOpen size={16} aria-hidden="true" />
            Tecnicas de estudio
          </span>
          <h2>Metodos simples para estudiar mejor</h2>
        </div>

        <div className="methodsGrid">
          {content.studyMethods.map((method) => (
            <article className="methodCard" key={method.title}>
              <span>{method.label}</span>
              <h3>{method.title}</h3>
              <p>{method.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
