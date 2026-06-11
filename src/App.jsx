import React, { useEffect, useState } from 'react';
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
  Sparkles,
  Sun,
  Target,
} from 'lucide-react';
import {
  appInfo,
  checklistItems,
  defaultTopics,
  difficultyOptions,
  focusOptions,
  studyMethods,
} from './content';
import { createStudyPlan, fetchContent, updateStudyPlan } from './api';

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatInputDate(date) {
  return date.toISOString().slice(0, 10);
}

const fallbackPlan = {
  coverage: 0,
  dailyPlan: [],
  daysUntilExam: 0,
  pace: 'Cargando',
  topics: [],
  totalHours: 0,
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('studyflow-theme') || 'morning');
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
  const [plan, setPlan] = useState(fallbackPlan);
  const [planId, setPlanId] = useState(null);
  const [apiStatus, setApiStatus] = useState('idle');

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
          setApiStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setApiStatus('saving');
      const payload = {
        ...form,
        hoursPerDay: Number(form.hoursPerDay),
      };

      try {
        const nextPlan = planId
          ? await updateStudyPlan(planId, payload, { signal: controller.signal })
          : await createStudyPlan(payload, { signal: controller.signal });
        setPlan(nextPlan);
        setPlanId(nextPlan.id);
        setApiStatus('ready');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApiStatus('error');
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [form, planId]);

  const themeLabel = theme === 'morning' ? 'Noche' : 'Dia';

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTheme() {
    setTheme((current) => (current === 'morning' ? 'night' : 'morning'));
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('studyflow-theme', theme);
  }, [theme]);

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
              <a href="#agenda">Agenda</a>
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
              <a className="button primary" href="#planificador">
                Crear plan
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="button ghost" href="#agenda">
                Ver agenda
                <CalendarDays size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          <section className="plannerPanel" id="planificador" aria-label="Planificador StudyFlow">
            <div className="panelHeader">
              <div>
                <span className="eyebrow">
                  <BrainCircuit size={16} aria-hidden="true" />
                  Planificador
                </span>
                <h2>Prepara tu proximo examen</h2>
              </div>
              <span className="paceBadge">{plan.pace}</span>
            </div>
            {apiStatus === 'error' && (
              <p className="apiMessage" role="status">
                No se pudo conectar con la API. Revisa que FastAPI este activo.
              </p>
            )}

            <div className="formGrid">
              <label>
                <span>Materia</span>
                <input
                  value={form.subject}
                  onChange={(event) => updateForm('subject', event.target.value)}
                  type="text"
                />
              </label>

              <label>
                <span>Fecha de examen</span>
                <input
                  value={form.examDate}
                  onChange={(event) => updateForm('examDate', event.target.value)}
                  type="date"
                />
              </label>

              <label>
                <span>Horas por dia</span>
                <input
                  min="1"
                  max="8"
                  value={form.hoursPerDay}
                  onChange={(event) => updateForm('hoursPerDay', event.target.value)}
                  type="number"
                />
              </label>

              <label>
                <span>Dificultad</span>
                <select
                  value={form.difficulty}
                  onChange={(event) => updateForm('difficulty', event.target.value)}
                >
                  {content.difficultyOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="wideField">
              <span>Temas pendientes</span>
              <textarea
                value={form.topics}
                onChange={(event) => updateForm('topics', event.target.value)}
                rows="3"
              />
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
                <span>Cobertura estimada</span>
                <strong>{plan.coverage}%</strong>
              </div>
              <div className="coverageTrack" aria-hidden="true">
                <span style={{ width: `${plan.coverage}%` }} />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="section agendaSection" id="agenda">
        <div className="agendaIntro">
          <div>
            <span className="eyebrow">
              <NotebookPen size={16} aria-hidden="true" />
              Agenda de estudio
            </span>
            <h2>Tu ruta para {form.subject}</h2>
            <p>
              Divide tus temas en sesiones cortas, con practica y cierre antes del examen.
            </p>
          </div>

          <div className="planSummary" aria-label="Resumen del plan">
            <div>
              <CalendarDays size={20} aria-hidden="true" />
              <strong>{plan.daysUntilExam}</strong>
              <span>Dias</span>
            </div>
            <div>
              <Clock3 size={20} aria-hidden="true" />
              <strong>{plan.totalHours}</strong>
              <span>Horas</span>
            </div>
            <div>
              <Target size={20} aria-hidden="true" />
              <strong>{plan.coverage}%</strong>
              <span>Cobertura</span>
            </div>
          </div>
        </div>

        <div className="routeGrid">
          {plan.dailyPlan.map((item) => (
            <article className="routeCard" key={`${item.label}-${item.title}`}>
              <div className="cardTop">
                <span>{item.label}</span>
                <small>{item.time}</small>
              </div>
              <h3>{item.title}</h3>
              <ul>
                {item.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </article>
          ))}
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
            Usa esta lista para saber si ya tienes teoria, practica y simulacro cubiertos.
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
