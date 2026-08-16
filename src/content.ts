export type Metric = { value: number; suffix?: string; prefix?: string; label: string };

export type Bullet = string | { text: string; highlight?: boolean };

export type Section = {
  id: string;
  index: string;
  kicker: string;
  title: string;
  body?: string;
  bullets?: Bullet[];
  metrics?: Metric[];
  note?: string;
};

export const brand = {
  name: "Velox Solutions",
  tagline: "Agentes que construyen agentes.",
  contacts: [
    { name: "Nicolás Echeverri", role: "CEO y Co-fundador", email: "necheverri@veloxsolutions.tech" },
    { name: "Germán Perrone", role: "CTO y Co-fundador", email: "gperrone@veloxsolutions.tech" },
  ],
};

export const sections: Section[] = [
  {
    id: "hook",
    index: "",
    kicker: "Velox Solutions",
    title: "Agentes que construyen agentes.",
    body: "Partner AI-first de Agentforce en LATAM.",
  },
  {
    id: "problema",
    index: "",
    kicker: "El problema",
    title: "El contexto se pierde entre fases.",
  },
  {
    id: "consecuencia",
    index: "",
    kicker: "La consecuencia",
    title: "Deals que mueren desde el inicio.",
  },
  {
    id: "solucion",
    index: "",
    kicker: "La solución",
    title: "Veleiro: nuestra operación entera es agéntica.",
    body: "Agentes supervisados de la preventa al soporte. Agentforce en producción.",
  },
  {
    id: "como",
    index: "",
    kicker: "Cómo funciona",
    title: "Un activo de datos único.",
    body: "Flujos pre-construidos, gobernanza y human-in-the-loop en cada agente.",
    metrics: [{ value: 60, suffix: "%", label: "Menos esfuerzo de análisis funcional" }],
  },
  {
    id: "diferencial",
    index: "",
    kicker: "El diferencial",
    title: "Por qué Velox.",
    bullets: [
      "Alcance fijo, precio fijo, arquitectos senior + IA",
      "Time-to-production en semanas, no trimestres",
      "Un partner que genera pipeline",
      { text: "Agentes hasta en 4 semanas", highlight: true },
    ],
  },
  {
    id: "cencor",
    index: "",
    kicker: "La prueba · Cencor",
    title: "Servicios financieros regulados, México.",
    body: "IA desde la preventa hasta el delivery, sobre Oracle Fusion como fuente maestra.",
    metrics: [{ value: 12, label: "Semanas hasta el go-live" }],
  },
  {
    id: "cronista",
    index: "",
    kicker: "La prueba · El Cronista",
    title: "Dos frentes de negocio en paralelo.",
    body: "Croni en producción y órdenes de trabajo automáticas por sector.",
    note: "Salesforce planteó llevar el caso a Dreamforce.",
  },
  {
    id: "adium",
    index: "",
    kicker: "La prueba · Adium",
    title: "Profundidad en un vertical regulado.",
    body: "Asistente 24/7 al paciente y copiloto del equipo PSP dentro del CRM.",
    metrics: [
      { value: 85, suffix: "%", label: "Consultas resueltas sin humano" },
      { value: 100, suffix: "%", label: "Derivación correcta en casos sensibles" },
      { value: 60, suffix: "%", label: "Menos tiempo de respuesta" },
    ],
    note: "Resultados de piloto, en revisión final antes del pase a producción.",
  },
  {
    id: "cta",
    index: "",
    kicker: "Partner Connect",
    title: "Agenda el diagnóstico.",
    body: "Diagnóstico Agéntico + roadmap de 4 semanas + un POC de Agentforce en vivo.",
  },
];
