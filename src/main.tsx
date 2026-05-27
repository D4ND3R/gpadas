import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  Printer,
  RotateCcw,
  School,
  UserRound,
} from "lucide-react";
import subjects from "./data/subjects.json";
import teachers from "./data/teachers.json";
import "./styles.css";

type CoverStyle = "minimalista" | "detallado" | "moderno";
type WorkType = "ada" | "laboratorio" | "producto";
type Group = "A" | "B" | "C";

interface FormState {
  style: CoverStyle;
  currentDate: string;
  workType: WorkType;
  workNumber: string;
  subject: string;
  semester: string;
  group: Group;
  deliveryDate: string;
  student: string;
  teacher: string;
}

const SCHOOL_NAME = "Preparatoria Siglo XXI";
const UNIVERSITY_NAME = "Universidad Autónoma de Yucatán";
const LOCATION = "Valladolid, Yucatán";
const COOKIE_PREFIX = "portada_ada_";

const semesterNames: Record<string, string> = {
  "1": "PRIMER SEMESTRE",
  "2": "SEGUNDO SEMESTRE",
  "3": "TERCER SEMESTRE",
  "4": "CUARTO SEMESTRE",
  "5": "QUINTO SEMESTRE",
  "6": "SEXTO SEMESTRE",
};

const styleOptions: Array<{ value: CoverStyle; label: string }> = [
  { value: "minimalista", label: "Minimalista" },
  { value: "detallado", label: "Detallado" },
  { value: "moderno", label: "Moderno" },
];

const workOptions: Array<{ value: WorkType; label: string }> = [
  { value: "ada", label: "ADA" },
  { value: "laboratorio", label: "Práctica de laboratorio" },
  { value: "producto", label: "Producto final" },
];

const todayIso = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCookie = (key: string) => {
  const name = `${COOKIE_PREFIX}${key}=`;
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(name))
    ?.slice(name.length);
};

const setCookie = (key: string, value: string) => {
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${COOKIE_PREFIX}${key}=${encodedValue}; max-age=15552000; path=/; SameSite=Lax`;
};

const clearAppCookies = () => {
  ["style", "subject", "semester", "group", "student", "teacher"].forEach(
    (key) => {
      document.cookie = `${COOKIE_PREFIX}${key}=; max-age=0; path=/; SameSite=Lax`;
    },
  );
};

const cookieValue = (key: string, fallback: string) => {
  const value = getCookie(key);
  return value ? decodeURIComponent(value) : fallback;
};

const buildInitialState = (): FormState => ({
  style: cookieValue("style", "minimalista") as CoverStyle,
  currentDate: todayIso(),
  workType: "ada",
  workNumber: "1",
  subject: cookieValue("subject", subjects[0]),
  semester: cookieValue("semester", "2"),
  group: cookieValue("group", "B") as Group,
  deliveryDate: todayIso(),
  student: cookieValue("student", ""),
  teacher: cookieValue("teacher", teachers[0]),
});

const formatLongDate = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatShortDate = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year.slice(2)}`;
};

const buildWorkTitle = (form: FormState) => {
  if (form.workType === "producto") return "PRODUCTO FINAL";
  const number = form.workNumber.trim() || "1";
  if (form.workType === "laboratorio") {
    return `PRÁCTICA DE LABORATORIO #${number}`;
  }
  return `ACTIVIDAD DE APRENDIZAJE #${number}`;
};

const fileSafe = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function CoverPage({ form }: { form: FormState }) {
  const coverClass = `cover-page cover-${form.style}`;
  const workTitle = buildWorkTitle(form);
  const semesterLine = `${semesterNames[form.semester]} GRUPO ${form.group}`;
  const currentDate = `${LOCATION}, ${formatLongDate(form.currentDate)}`;
  const deliveryDate = formatShortDate(form.deliveryDate);

  if (form.style === "detallado") {
    return (
      <article className={coverClass} data-testid="cover-page">
        <img className="logo-strip" src="/assets/logo-strip.png" alt="" />
        <section className="detailed-heading">
          <p>ESCUELA PREPARATORIA “SIGLO XXI”</p>
          <strong>Incorporada a la {UNIVERSITY_NAME}</strong>
        </section>
        <section className="title-block framed">
          <span>{workTitle}</span>
          <h1>{form.subject}</h1>
        </section>
        <dl className="info-grid">
          <div>
            <dt>Escuela</dt>
            <dd>{SCHOOL_NAME}</dd>
          </div>
          <div>
            <dt>Universidad</dt>
            <dd>{UNIVERSITY_NAME}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{currentDate}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{deliveryDate}</dd>
          </div>
          <div>
            <dt>Semestre y grupo</dt>
            <dd>{semesterLine}</dd>
          </div>
          <div>
            <dt>Maestro</dt>
            <dd>{form.teacher}</dd>
          </div>
        </dl>
        <section className="student-line detailed-student">
          <span>Alumno</span>
          <strong>{form.student || "Nombre del alumno"}</strong>
        </section>
        <img className="school-stamp detailed-stamp" src="/assets/school-stamp.png" alt="" />
      </article>
    );
  }

  if (form.style === "moderno") {
    return (
      <article className={coverClass} data-testid="cover-page">
        <img className="logo-strip modern-strip" src="/assets/logo-strip.png" alt="" />
        <section className="modern-hero">
          <span>{workTitle}</span>
          <h1>{form.subject}</h1>
          <p>{semesterLine}</p>
        </section>
        <section className="modern-meta">
          <div>
            <span>Fecha</span>
            <strong>{currentDate}</strong>
          </div>
          <div>
            <span>Entrega</span>
            <strong>{deliveryDate}</strong>
          </div>
          <div>
            <span>Maestro</span>
            <strong>{form.teacher}</strong>
          </div>
          <div>
            <span>Alumno</span>
            <strong>{form.student || "Nombre del alumno"}</strong>
          </div>
        </section>
        <footer className="modern-footer">
          <div>
            <strong>{SCHOOL_NAME}</strong>
            <span>Incorporada a la {UNIVERSITY_NAME}</span>
          </div>
          <img className="school-stamp modern-stamp" src="/assets/school-stamp.png" alt="" />
        </footer>
      </article>
    );
  }

  return (
    <article className={coverClass} data-testid="cover-page">
      <img className="logo-strip" src="/assets/logo-strip.png" alt="" />
      <section className="classic-heading">
        <h2>ESCUELA PREPARATORIA “SIGLO XXI”</h2>
        <strong>Incorporada a la {UNIVERSITY_NAME}</strong>
        <p>{currentDate}</p>
      </section>
      <section className="classic-title">
        <h1>{workTitle}</h1>
        <h2>{form.subject}</h2>
        <p>{semesterLine}</p>
      </section>
      <p className="delivery">Fecha de entrega: {deliveryDate}</p>
      <p className="teacher">Maestro: {form.teacher}</p>
      <section className="student-line">
        <span>Alumno:</span>
        <strong>- {form.student || "Nombre del alumno"}</strong>
      </section>
      <img className="school-stamp classic-stamp" src="/assets/school-stamp.png" alt="" />
    </article>
  );
}

function App() {
  const [form, setForm] = useState<FormState>(() => buildInitialState());
  const [isExporting, setIsExporting] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);

  const recurringValues = useMemo(
    () => ({
      style: form.style,
      subject: form.subject,
      semester: form.semester,
      group: form.group,
      student: form.student,
      teacher: form.teacher,
    }),
    [form.group, form.semester, form.student, form.style, form.subject, form.teacher],
  );

  useEffect(() => {
    Object.entries(recurringValues).forEach(([key, value]) => {
      setCookie(key, value);
    });
  }, [recurringValues]);

  const updateForm = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetSavedData = () => {
    clearAppCookies();
    setForm(buildInitialState());
  };

  const downloadPdf = async () => {
    if (!coverRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(coverRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [794, 1123],
      });
      pdf.addImage(image, "PNG", 0, 0, 794, 1123);
      pdf.save(`${fileSafe(buildWorkTitle(form)) || "portada"}-${fileSafe(form.student) || "alumno"}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="app-shell">
      <aside className="control-panel" aria-label="Datos de la portada">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Preparatoria Siglo XXI</span>
            <h1>Generador de portadas</h1>
          </div>
          <School aria-hidden="true" />
        </div>

        <div className="form-grid">
          <Field icon={<FileText aria-hidden="true" />} label="Estilo">
            <select value={form.style} onChange={(event) => updateForm("style", event.target.value as CoverStyle)}>
              {styleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field icon={<CalendarDays aria-hidden="true" />} label="Fecha actual">
            <input type="date" value={form.currentDate} onChange={(event) => updateForm("currentDate", event.target.value)} />
          </Field>

          <Field icon={<FileText aria-hidden="true" />} label="Tipo de trabajo">
            <select value={form.workType} onChange={(event) => updateForm("workType", event.target.value as WorkType)}>
              {workOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          {form.workType !== "producto" && (
            <Field icon={<FileText aria-hidden="true" />} label="Número">
              <input
                min="1"
                type="number"
                value={form.workNumber}
                onChange={(event) => updateForm("workNumber", event.target.value)}
              />
            </Field>
          )}

          <Field icon={<GraduationCap aria-hidden="true" />} label="Materia">
            <select value={form.subject} onChange={(event) => updateForm("subject", event.target.value)}>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </Field>

          <div className="two-columns">
            <Field icon={<GraduationCap aria-hidden="true" />} label="Semestre">
              <select value={form.semester} onChange={(event) => updateForm("semester", event.target.value)}>
                {["1", "2", "3", "4", "5", "6"].map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}°
                  </option>
                ))}
              </select>
            </Field>
            <Field icon={<GraduationCap aria-hidden="true" />} label="Grupo">
              <select value={form.group} onChange={(event) => updateForm("group", event.target.value as Group)}>
                {["A", "B", "C"].map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field icon={<CalendarDays aria-hidden="true" />} label="Fecha de entrega">
            <input type="date" value={form.deliveryDate} onChange={(event) => updateForm("deliveryDate", event.target.value)} />
          </Field>

          <Field icon={<UserRound aria-hidden="true" />} label="Alumno">
            <input
              type="text"
              value={form.student}
              placeholder="Nombre completo"
              onChange={(event) => updateForm("student", event.target.value)}
            />
          </Field>

          <Field icon={<UserRound aria-hidden="true" />} label="Maestro">
            <select value={form.teacher} onChange={(event) => updateForm("teacher", event.target.value)}>
              {teachers.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="actions">
          <button className="primary-action" type="button" onClick={downloadPdf} disabled={isExporting}>
            <Download aria-hidden="true" />
            {isExporting ? "Preparando..." : "Descargar PDF"}
          </button>
          <button type="button" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Imprimir
          </button>
          <button type="button" onClick={resetSavedData}>
            <RotateCcw aria-hidden="true" />
            Reiniciar
          </button>
        </div>
      </aside>

      <section className="preview-zone" aria-label="Vista previa">
        <div className="page-frame" ref={coverRef}>
          <CoverPage form={form} />
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
