import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  MinusCircle,
  Plus,
  Printer,
  RotateCcw,
  School,
  Trash2,
  UserRound,
} from "lucide-react";
import subjects from "./data/subjects.json";
import "./styles.css";

type CoverStyle = "minimalista" | "limpio" | "detallado" | "moderno";
type CoverOrientation = "vertical" | "horizontal";
type WorkType = "ada" | "laboratorio" | "producto" | "otro";
type Group = "" | "A" | "B" | "C";
interface SubjectRecord {
  name: string;
  teacher: string;
}
interface SubjectsData {
  subjects: Record<string, SubjectRecord>;
  semesters: Record<string, Record<Exclude<Group, "">, string[]>>;
}

interface FormState {
  style: CoverStyle;
  orientation: CoverOrientation;
  currentDate: string;
  workType: WorkType;
  customWorkType: string;
  workNumber: string;
  subject: string;
  semester: string;
  group: Group;
  deliveryDate: string;
  participants: string[];
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
  { value: "minimalista", label: "Base" },
  { value: "limpio", label: "Minimalista" },
  { value: "detallado", label: "Detallado" },
  { value: "moderno", label: "Moderno" },
];

const workOptions: Array<{ value: WorkType; label: string }> = [
  { value: "ada", label: "ADA" },
  { value: "laboratorio", label: "Práctica de laboratorio" },
  { value: "producto", label: "Producto final" },
  { value: "otro", label: "Otro" },
];

const orientationOptions: Array<{ value: CoverOrientation; label: string }> = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
];

const subjectsData = subjects as SubjectsData;
const getSubjectIdsFor = (semester: string, group: Group) => {
  if (!semester || !group) return [];
  return subjectsData.semesters[semester]?.[group] ?? [];
};
const getSubjectById = (subjectId: string) =>
  subjectId ? subjectsData.subjects[subjectId] : undefined;
const findSubjectId = (value: string) => {
  if (!value) return "";
  if (subjectsData.subjects[value]) return value;

  return (
    Object.entries(subjectsData.subjects).find(
      ([, subject]) => subject.name === value,
    )?.[0] ?? ""
  );
};

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
  [
    "style",
    "orientation",
    "subject",
    "semester",
    "group",
    "student",
    "participants",
    "teacher",
    "currentDate",
    "deliveryDate",
    "workType",
    "customWorkType",
    "workNumber",
  ].forEach((key) => {
    document.cookie = `${COOKIE_PREFIX}${key}=; max-age=0; path=/; SameSite=Lax`;
  });
};

const cookieValue = (key: string, fallback: string) => {
  const value = getCookie(key);
  return value ? decodeURIComponent(value) : fallback;
};

const cookieArrayValue = (key: string, fallback: string[]) => {
  const rawValue = getCookie(key);
  if (!rawValue) {
    const legacyStudent = getCookie("student");
    return legacyStudent ? [decodeURIComponent(legacyStudent)] : fallback;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue));
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : fallback;
  } catch {
    return fallback;
  }
};

const buildInitialState = (): FormState => ({
  style: cookieValue("style", "minimalista") as CoverStyle,
  orientation: cookieValue("orientation", "vertical") as CoverOrientation,
  currentDate: cookieValue("currentDate", ""),
  workType: cookieValue("workType", "ada") as WorkType,
  customWorkType: cookieValue("customWorkType", ""),
  workNumber: cookieValue("workNumber", ""),
  subject: findSubjectId(cookieValue("subject", "")),
  semester: cookieValue("semester", ""),
  group: cookieValue("group", "") as Group,
  deliveryDate: cookieValue("deliveryDate", ""),
  participants: cookieArrayValue("participants", [""]),
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
  if (form.workType === "otro") {
    return form.customWorkType.trim().toUpperCase() || "OTRO";
  }
  if (form.workType === "producto") return "PRODUCTO FINAL";
  const number = form.workNumber.trim();
  if (form.workType === "laboratorio") {
    return number ? `PRÁCTICA DE LABORATORIO #${number}` : "PRÁCTICA DE LABORATORIO";
  }
  return number ? `ACTIVIDAD DE APRENDIZAJE #${number}` : "ACTIVIDAD DE APRENDIZAJE";
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

function ParticipantsList({
  participants,
  className = "",
}: {
  participants: string[];
  className?: string;
}) {
  const names = participants.map((name) => name.trim()).filter(Boolean);
  const visibleNames = names.length > 0 ? names : ["Nombre del alumno"];

  return (
    <section className={`student-line ${className}`}>
      <span>{visibleNames.length > 1 ? "Alumnos:" : "Alumno:"}</span>
      <div className="participants-list">
        {visibleNames.map((name, index) => (
          <strong key={`${name}-${index}`}>{name}</strong>
        ))}
      </div>
    </section>
  );
}

function CoverPage({ form }: { form: FormState }) {
  const coverClass = `cover-page cover-${form.style} cover-${form.orientation}`;
  const workTitle = buildWorkTitle(form);
  const subject = getSubjectById(form.subject);
  const subjectName = subject?.name ?? "";
  const teacherName = subject?.teacher ?? "";
  const semesterLine =
    form.semester && form.group
      ? `${semesterNames[form.semester]} GRUPO ${form.group}`
      : "";
  const currentDate = form.currentDate
    ? `${LOCATION}, ${formatLongDate(form.currentDate)}`
    : LOCATION;
  const deliveryDate = formatShortDate(form.deliveryDate);
  const participantCount = form.participants.filter((name) => name.trim()).length;
  const participantLabel = participantCount > 1 ? "Alumnos" : "Alumno";

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
          <p>{semesterLine}</p>
          <h1>{subjectName || "Materia"}</h1>
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
            <dd>{teacherName}</dd>
          </div>
        </dl>
        <ParticipantsList participants={form.participants} className="detailed-student" />
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
          <p>{semesterLine}</p>
          <h1>{subjectName || "Materia"}</h1>
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
            <strong>{teacherName || "Sin maestro asignado"}</strong>
          </div>
          <div>
            <span>{participantLabel}</span>
            <div className="participants-list modern-participants">
              {(form.participants.map((name) => name.trim()).filter(Boolean).length
                ? form.participants.map((name) => name.trim()).filter(Boolean)
                : ["Nombre del alumno"]
              ).map((name, index) => (
                <strong key={`${name}-${index}`}>{name}</strong>
              ))}
            </div>
          </div>
        </section>
        <footer className="modern-footer">
          <div>
            <strong>{SCHOOL_NAME}</strong>
            <span>Incorporada a la {UNIVERSITY_NAME}</span>
          </div>
        </footer>
        <img className="school-stamp modern-stamp" src="/assets/school-stamp.png" alt="" />
      </article>
    );
  }

  if (form.style === "limpio") {
    return (
      <article className={coverClass} data-testid="cover-page">
        <img className="logo-strip clean-strip" src="/assets/logo-strip.png" alt="" />
        <header className="clean-heading">
          <p>{SCHOOL_NAME}</p>
          <strong>Incorporada a la {UNIVERSITY_NAME}</strong>
          <span>{currentDate}</span>
        </header>
        <section className="clean-title">
          <span>{workTitle}</span>
          <p>{semesterLine}</p>
          <h1>{subjectName || "Materia"}</h1>
        </section>
        <dl className="clean-details">
          <div>
            <dt>Entrega</dt>
            <dd>{deliveryDate}</dd>
          </div>
          <div>
            <dt>Maestro</dt>
            <dd>{teacherName || "Sin maestro asignado"}</dd>
          </div>
        </dl>
        <ParticipantsList participants={form.participants} className="clean-student" />
        <img className="school-stamp clean-stamp" src="/assets/school-stamp.png" alt="" />
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
        <p>{semesterLine}</p>
        <h2>{subjectName || "Materia"}</h2>
      </section>
      <p className="delivery">Fecha de entrega: {deliveryDate}</p>
      <p className="teacher">Maestro: {teacherName}</p>
      <ParticipantsList participants={form.participants} />
      <img className="school-stamp classic-stamp" src="/assets/school-stamp.png" alt="" />
    </article>
  );
}

function App() {
  const [form, setForm] = useState<FormState>(() => buildInitialState());
  const [isExporting, setIsExporting] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const coverRef = useRef<HTMLDivElement>(null);
  const subjectOptions = useMemo(
    () => getSubjectIdsFor(form.semester, form.group),
    [form.group, form.semester],
  );
  const selectedSubject = getSubjectById(form.subject);
  const pageSize =
    form.orientation === "horizontal"
      ? { width: 1123, height: 794, pdfOrientation: "landscape" as const }
      : { width: 794, height: 1123, pdfOrientation: "portrait" as const };
  const availablePreviewWidth =
    viewportWidth > 1120 ? viewportWidth - 420 - 72 : viewportWidth - 36;
  const previewScale = isExporting
    ? 1
    : Math.min(1, Math.max(0.28, availablePreviewWidth / pageSize.width));

  const recurringValues = useMemo(
    () => ({
      style: form.style,
      orientation: form.orientation,
      subject: form.subject,
      semester: form.semester,
      group: form.group,
      participants: JSON.stringify(form.participants),
      currentDate: form.currentDate,
      deliveryDate: form.deliveryDate,
      workType: form.workType,
      customWorkType: form.customWorkType,
      workNumber: form.workNumber,
    }),
    [
      form.currentDate,
      form.customWorkType,
      form.deliveryDate,
      form.group,
      form.orientation,
      form.participants,
      form.semester,
      form.style,
      form.subject,
      form.workNumber,
      form.workType,
    ],
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    Object.entries(recurringValues).forEach(([key, value]) => {
      setCookie(key, value);
    });
  }, [recurringValues]);

  useEffect(() => {
    if (form.subject && !subjectOptions.includes(form.subject)) {
      updateForm("subject", "");
    }
  }, [form.subject, subjectOptions]);

  const updateForm = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateParticipant = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      participants: current.participants.map((participant, participantIndex) =>
        participantIndex === index ? value : participant,
      ),
    }));
  };

  const addParticipant = () => {
    setForm((current) => ({
      ...current,
      participants: [...current.participants, ""],
    }));
  };

  const removeParticipant = (index: number) => {
    setForm((current) => ({
      ...current,
      participants:
        current.participants.length === 1
          ? [""]
          : current.participants.filter((_, participantIndex) => participantIndex !== index),
    }));
  };

  const resetSavedData = () => {
    clearAppCookies();
    setForm(buildInitialState());
  };

  const downloadPdf = async () => {
    if (!coverRef.current) return;
    setIsExporting(true);

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const canvas = await html2canvas(coverRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: pageSize.pdfOrientation,
        unit: "px",
        format: [pageSize.width, pageSize.height],
      });
      pdf.addImage(image, "PNG", 0, 0, pageSize.width, pageSize.height);
      const mainParticipant = form.participants.find((name) => name.trim()) ?? "alumnos";
      pdf.save(`${fileSafe(buildWorkTitle(form)) || "portada"}-${fileSafe(mainParticipant) || "alumnos"}.pdf`);
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
            <h1>GPADAS</h1>
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

          <Field icon={<FileText aria-hidden="true" />} label="Orientación">
            <select
              value={form.orientation}
              onChange={(event) => updateForm("orientation", event.target.value as CoverOrientation)}
            >
              {orientationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field icon={<CalendarDays aria-hidden="true" />} label="Fecha actual">
            <div className="clearable-row">
              <input
                type="date"
                value={form.currentDate}
                onChange={(event) => updateForm("currentDate", event.target.value)}
              />
              <button
                className="icon-action"
                type="button"
                onClick={() => updateForm("currentDate", "")}
                aria-label="Dejar sin fecha actual"
              >
                <MinusCircle aria-hidden="true" />
              </button>
            </div>
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

          {form.workType === "otro" && (
            <Field icon={<FileText aria-hidden="true" />} label="Nombre del trabajo">
              <input
                type="text"
                value={form.customWorkType}
                placeholder="Ej. Ensayo, exposición, proyecto..."
                onChange={(event) => updateForm("customWorkType", event.target.value)}
              />
            </Field>
          )}

          {form.workType !== "producto" && form.workType !== "otro" && (
            <Field icon={<FileText aria-hidden="true" />} label="Número">
              <div className="clearable-row">
                <input
                  min="1"
                  type="number"
                  value={form.workNumber}
                  placeholder="Sin número"
                  onChange={(event) => updateForm("workNumber", event.target.value)}
                />
                <button
                  className="icon-action"
                  type="button"
                  onClick={() => updateForm("workNumber", "")}
                  aria-label="Dejar sin número"
                >
                  <MinusCircle aria-hidden="true" />
                </button>
              </div>
            </Field>
          )}

          <div className="two-columns">
            <Field icon={<GraduationCap aria-hidden="true" />} label="Semestre">
              <select value={form.semester} onChange={(event) => updateForm("semester", event.target.value)}>
                <option value="">Ninguno</option>
                {["1", "2", "3", "4", "5", "6"].map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}°
                  </option>
                ))}
              </select>
            </Field>
            <Field icon={<GraduationCap aria-hidden="true" />} label="Grupo">
              <select value={form.group} onChange={(event) => updateForm("group", event.target.value as Group)}>
                <option value="">Ninguno</option>
                {["A", "B", "C"].map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field icon={<GraduationCap aria-hidden="true" />} label="Materia">
            <select value={form.subject} onChange={(event) => updateForm("subject", event.target.value)}>
              <option value="">Ninguna</option>
              {subjectOptions.map((subjectId) => (
                <option key={subjectId} value={subjectId}>
                  {subjectsData.subjects[subjectId]?.name ?? subjectId}
                </option>
              ))}
            </select>
          </Field>

          <Field icon={<CalendarDays aria-hidden="true" />} label="Fecha de entrega">
            <div className="clearable-row">
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(event) => updateForm("deliveryDate", event.target.value)}
              />
              <button
                className="icon-action"
                type="button"
                onClick={() => updateForm("deliveryDate", "")}
                aria-label="Dejar sin fecha de entrega"
              >
                <MinusCircle aria-hidden="true" />
              </button>
            </div>
          </Field>

          <section className="participants-editor" aria-label="Participantes">
            <div className="participants-heading">
              <span className="field-label">
                <UserRound aria-hidden="true" />
                {form.participants.length > 1 ? "Alumnos" : "Alumno"}
              </span>
              <button className="icon-action" type="button" onClick={addParticipant} aria-label="Agregar participante">
                <Plus aria-hidden="true" />
              </button>
            </div>
            <div className="participants-inputs">
              {form.participants.map((participant, index) => (
                <div className="participant-row" key={index}>
                  <input
                    type="text"
                    value={participant}
                    placeholder={`Nombre completo ${index + 1}`}
                    onChange={(event) => updateParticipant(index, event.target.value)}
                  />
                  <button
                    className="icon-action"
                    type="button"
                    onClick={() => removeParticipant(index)}
                    aria-label={`Quitar participante ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <Field icon={<UserRound aria-hidden="true" />} label="Maestro">
            <input
              readOnly
              type="text"
              value={selectedSubject?.teacher ?? "Selecciona una materia"}
            />
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
        <div
          className="page-preview"
          style={{
            height: pageSize.height * previewScale,
            width: pageSize.width * previewScale,
          }}
        >
          <div
            className={`page-frame page-${form.orientation}`}
            ref={coverRef}
            style={{ transform: `scale(${previewScale})` }}
          >
            <CoverPage form={form} />
          </div>
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
