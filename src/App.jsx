import React, { useEffect, useMemo, useState } from 'react';
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

const difficultyWeight = {
  Baja: 0.85,
  Media: 1,
  Alta: 1.25,
};

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDaysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(`${dateValue}T00:00:00`);
  const diff = exam.getTime() - today.getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
}

function splitTopics(value) {
  return value
    .split(',')
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function buildStudyPlan(form) {
  const topics = splitTopics(form.topics);
  const daysUntilExam = getDaysUntil(form.examDate);
  const hoursPerDay = Number(form.hoursPerDay);
  const totalHours = daysUntilExam * hoursPerDay;
  const requiredHours = Math.max(6, topics.length * 3.5 * difficultyWeight[form.difficulty]);
  const coverage = Math.min(100, Math.round((totalHours / requiredHours) * 100));
  const pace = coverage >= 90 ? 'Comodo' : coverage >= 62 ? 'Constante' : 'Intenso';
  const sessions = Math.min(5, Math.max(3, topics.length));

  const dailyPlan = Array.from({ length: sessions }, (_, index) => {
    const topic = topics[index % topics.length] || form.subject;
    const dayNumber = index + 1;

    return {
      label: dayNumber === sessions ? 'Cierre' : `Sesion ${dayNumber}`,
      title: dayNumber === sessions ? 'Simulacro final' : topic,
      time: dayNumber === sessions ? `${hoursPerDay} h` : `${Math.max(1, hoursPerDay - 0.5)} h`,
      tasks:
        dayNumber === sessions
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

  const plan = useMemo(() => buildStudyPlan(form), [form]);
  const themeLabel = theme === 'morning' ? 'Noche' : 'Manana';

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
          <a className="brand" href="#inicio" aria-label={appInfo.name}>
            <span className="brandMark">
              <GraduationCap size={22} aria-hidden="true" />
            </span>
            {appInfo.name}
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
            <h1>{appInfo.name}</h1>
            <p>{appInfo.summary}</p>
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
                  {difficultyOptions.map((option) => (
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
              {focusOptions.map((option) => (
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
          {checklistItems.map((item) => (
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
          {studyMethods.map((method) => (
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
