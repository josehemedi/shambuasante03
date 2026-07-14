// Static mock data for demonstration only.
// Shapes mirror anticipated Spring Boot REST DTOs so the UI can swap
// these objects for live `fetch()` calls with minimal changes.

export const kpis = {
  totalPatients: { value: 48217, delta: 8.4 },
  activeConsultations: { value: 312, delta: 12.1 },
  revenueMtd: { value: 2847500, delta: 6.2 },
  occupancy: { value: 87.4, delta: -2.3 },
}

export const revenueSeries = [
  { month: "Jan", inpatient: 980, outpatient: 540, tele: 210 },
  { month: "Feb", inpatient: 1020, outpatient: 580, tele: 260 },
  { month: "Mar", inpatient: 1110, outpatient: 610, tele: 300 },
  { month: "Apr", inpatient: 1050, outpatient: 660, tele: 340 },
  { month: "May", inpatient: 1240, outpatient: 720, tele: 410 },
  { month: "Jun", inpatient: 1320, outpatient: 760, tele: 470 },
  { month: "Jul", inpatient: 1410, outpatient: 810, tele: 520 },
  { month: "Aug", inpatient: 1380, outpatient: 850, tele: 560 },
]

export const patientFlow = [
  { day: "Mon", admissions: 64, discharges: 52 },
  { day: "Tue", admissions: 72, discharges: 60 },
  { day: "Wed", admissions: 58, discharges: 66 },
  { day: "Thu", admissions: 81, discharges: 70 },
  { day: "Fri", admissions: 90, discharges: 78 },
  { day: "Sat", admissions: 54, discharges: 62 },
  { day: "Sun", admissions: 43, discharges: 49 },
]

export const departmentLoad = [
  { name: "Emergency", value: 92, color: "var(--color-destructive)" },
  { name: "Cardiology", value: 78, color: "var(--color-chart-1)" },
  { name: "Pediatrics", value: 64, color: "var(--color-chart-2)" },
  { name: "Oncology", value: 71, color: "var(--color-chart-3)" },
  { name: "Maternity", value: 58, color: "var(--color-chart-4)" },
]

export const emergencyAlerts = [
  {
    id: "AL-9921",
    level: "critical",
    title: "Code Blue — ICU Bed 4",
    titleFr: "Code Bleu — Lit USI 4",
    time: "2 min",
    dept: "Intensive Care",
  },
  {
    id: "AL-9920",
    level: "warning",
    title: "Blood bank low: O-negative",
    titleFr: "Banque de sang faible : O négatif",
    time: "14 min",
    dept: "Hematology",
  },
  {
    id: "AL-9918",
    level: "warning",
    title: "Ventilator maintenance due",
    titleFr: "Maintenance ventilateur requise",
    time: "38 min",
    dept: "Pulmonology",
  },
]

export const aiInsights = [
  {
    id: 1,
    title: "Readmission risk up 4%",
    titleFr: "Risque de réadmission +4%",
    detail: "Cardiology patients over 65 show elevated 30-day readmission likelihood.",
    detailFr: "Patients cardiologie de +65 ans : probabilité de réadmission à 30 jours élevée.",
    tone: "warning",
  },
  {
    id: 2,
    title: "Optimize OR scheduling",
    titleFr: "Optimiser le bloc opératoire",
    detail: "AI projects 11% throughput gain by shifting 3 afternoon slots.",
    detailFr: "L'IA projette +11% de débit en déplaçant 3 créneaux d'après-midi.",
    tone: "primary",
  },
  {
    id: 3,
    title: "Pharmacy demand forecast",
    titleFr: "Prévision demande pharmacie",
    detail: "Antibiotic demand expected to rise 18% next week.",
    detailFr: "Demande d'antibiotiques en hausse de 18% la semaine prochaine.",
    tone: "secondary",
  },
]

export const activityTimeline = [
  { id: 1, type: "admission", text: "Patient Amara Diallo admitted to Cardiology", textFr: "Patient Amara Diallo admis en Cardiologie", time: "09:42", actor: "Dr. Mensah" },
  { id: 2, type: "lab", text: "Lab results ready for #PT-10293", textFr: "Résultats labo prêts pour #PT-10293", time: "09:21", actor: "Lab System" },
  { id: 3, type: "tele", text: "Teleconsultation completed with K. Owusu", textFr: "Téléconsultation terminée avec K. Owusu", time: "08:58", actor: "Dr. Achebe" },
  { id: 4, type: "billing", text: "Insurance claim #IC-5521 approved", textFr: "Demande d'assurance #IC-5521 approuvée", time: "08:30", actor: "Finance" },
  { id: 5, type: "discharge", text: "Patient Fatou Sow discharged from Maternity", textFr: "Patiente Fatou Sow sortie de Maternité", time: "08:05", actor: "Dr. Bello" },
]

export const patients = [
  {
    id: "PT-10293",
    name: "Amara Diallo",
    age: 54,
    gender: "female",
    department: "Cardiology",
    lastVisit: "2026-06-24",
    condition: "stable",
    conditionLabel: "Hypertension",
    conditionLabelFr: "Hypertension",
    insurance: "AXA Health",
    bloodType: "O+",
    phone: "+233 24 555 0182",
    email: "amara.diallo@example.com",
    address: "12 Independence Ave, Accra",
    primaryDoctor: "Dr. Kwame Mensah",
    allergies: ["Penicillin", "Latex"],
    vitals: { bp: "128/82", hr: 74, temp: "36.8°C", o2: "98%" },
    policyNumber: "AXA-993-2210",
    coverage: "Premium — 90%",
    contacts: [
      { name: "Kofi Diallo", relation: "Husband", relationFr: "Mari", phone: "+233 24 555 0190" },
      { name: "Ama Diallo", relation: "Daughter", relationFr: "Fille", phone: "+233 20 555 0145" },
    ],
    history: [
      { date: "2026-06-24", title: "Cardiology follow-up", titleFr: "Suivi cardiologie", note: "BP controlled, continue medication.", noteFr: "Tension contrôlée, poursuite du traitement." },
      { date: "2026-03-12", title: "Echocardiogram", titleFr: "Échocardiogramme", note: "Mild left ventricular hypertrophy.", noteFr: "Légère hypertrophie ventriculaire gauche." },
      { date: "2025-11-02", title: "Initial diagnosis", titleFr: "Diagnostic initial", note: "Stage 1 hypertension diagnosed.", noteFr: "Hypertension stade 1 diagnostiquée." },
    ],
  },
  {
    id: "PT-10294",
    name: "Kwesi Owusu",
    age: 38,
    gender: "male",
    department: "Orthopedics",
    lastVisit: "2026-06-22",
    condition: "stable",
    conditionLabel: "Post-op recovery",
    conditionLabelFr: "Récupération post-op",
    insurance: "NHIS",
    bloodType: "A+",
    phone: "+233 27 555 0111",
    email: "kwesi.owusu@example.com",
    address: "45 Ring Road, Kumasi",
    primaryDoctor: "Dr. Ngozi Achebe",
    allergies: ["None"],
    vitals: { bp: "120/78", hr: 68, temp: "36.6°C", o2: "99%" },
    policyNumber: "NHIS-552-9921",
    coverage: "Standard — 70%",
    contacts: [{ name: "Akosua Owusu", relation: "Wife", relationFr: "Épouse", phone: "+233 27 555 0120" }],
    history: [
      { date: "2026-06-22", title: "Knee surgery follow-up", titleFr: "Suivi chirurgie genou", note: "Healing well, physiotherapy advised.", noteFr: "Bonne cicatrisation, physiothérapie conseillée." },
      { date: "2026-05-30", title: "ACL reconstruction", titleFr: "Reconstruction LCA", note: "Surgery successful.", noteFr: "Chirurgie réussie." },
    ],
  },
  {
    id: "PT-10295",
    name: "Fatou Sow",
    age: 29,
    gender: "female",
    department: "Maternity",
    lastVisit: "2026-06-20",
    condition: "stable",
    conditionLabel: "Prenatal care",
    conditionLabelFr: "Soins prénataux",
    insurance: "Sanlam",
    bloodType: "B+",
    phone: "+221 77 555 0133",
    email: "fatou.sow@example.com",
    address: "8 Rue Carnot, Dakar",
    primaryDoctor: "Dr. Aïcha Bello",
    allergies: ["Aspirin"],
    vitals: { bp: "118/75", hr: 80, temp: "36.9°C", o2: "99%" },
    policyNumber: "SAN-221-7740",
    coverage: "Premium — 85%",
    contacts: [{ name: "Mamadou Sow", relation: "Husband", relationFr: "Mari", phone: "+221 77 555 0140" }],
    history: [
      { date: "2026-06-20", title: "28-week checkup", titleFr: "Visite 28 semaines", note: "Healthy pregnancy, normal growth.", noteFr: "Grossesse saine, croissance normale." },
      { date: "2026-04-15", title: "20-week ultrasound", titleFr: "Échographie 20 semaines", note: "All measurements normal.", noteFr: "Toutes les mesures normales." },
    ],
  },
  {
    id: "PT-10296",
    name: "Tunde Bakare",
    age: 61,
    gender: "male",
    department: "Oncology",
    lastVisit: "2026-06-18",
    condition: "critical",
    conditionLabel: "Chemotherapy",
    conditionLabelFr: "Chimiothérapie",
    insurance: "AXA Health",
    bloodType: "AB+",
    phone: "+234 80 555 0177",
    email: "tunde.bakare@example.com",
    address: "23 Marina St, Lagos",
    primaryDoctor: "Dr. Kwame Mensah",
    allergies: ["Sulfa drugs"],
    vitals: { bp: "135/88", hr: 92, temp: "37.4°C", o2: "95%" },
    policyNumber: "AXA-110-5520",
    coverage: "Premium — 90%",
    contacts: [{ name: "Bisi Bakare", relation: "Wife", relationFr: "Épouse", phone: "+234 80 555 0188" }],
    history: [
      { date: "2026-06-18", title: "Chemotherapy cycle 4", titleFr: "Chimiothérapie cycle 4", note: "Tolerating treatment, monitor counts.", noteFr: "Traitement toléré, surveiller la numération." },
      { date: "2026-02-10", title: "Diagnosis confirmed", titleFr: "Diagnostic confirmé", note: "Stage 2 colorectal carcinoma.", noteFr: "Carcinome colorectal stade 2." },
    ],
  },
  {
    id: "PT-10297",
    name: "Naledi Khumalo",
    age: 45,
    gender: "female",
    department: "Neurology",
    lastVisit: "2026-06-15",
    condition: "stable",
    conditionLabel: "Migraine management",
    conditionLabelFr: "Gestion des migraines",
    insurance: "Discovery",
    bloodType: "O-",
    phone: "+27 82 555 0199",
    email: "naledi.k@example.com",
    address: "14 Vilakazi St, Johannesburg",
    primaryDoctor: "Dr. Ngozi Achebe",
    allergies: ["None"],
    vitals: { bp: "122/80", hr: 70, temp: "36.7°C", o2: "98%" },
    policyNumber: "DISC-770-3310",
    coverage: "Executive — 100%",
    contacts: [{ name: "Sipho Khumalo", relation: "Brother", relationFr: "Frère", phone: "+27 82 555 0210" }],
    history: [
      { date: "2026-06-15", title: "Neurology consult", titleFr: "Consultation neurologie", note: "Adjusted preventive medication.", noteFr: "Ajustement du traitement préventif." },
    ],
  },
  {
    id: "PT-10298",
    name: "Ibrahim Cissé",
    age: 7,
    gender: "male",
    department: "Pediatrics",
    lastVisit: "2026-06-12",
    condition: "stable",
    conditionLabel: "Asthma",
    conditionLabelFr: "Asthme",
    insurance: "NHIS",
    bloodType: "A-",
    phone: "+225 07 555 0166",
    email: "guardian.cisse@example.com",
    address: "Rue des Jardins, Abidjan",
    primaryDoctor: "Dr. Aïcha Bello",
    allergies: ["Dust mites", "Pollen"],
    vitals: { bp: "100/65", hr: 96, temp: "36.8°C", o2: "97%" },
    policyNumber: "NHIS-330-1180",
    coverage: "Standard — 70%",
    contacts: [{ name: "Mariam Cissé", relation: "Mother", relationFr: "Mère", phone: "+225 07 555 0170" }],
    history: [
      { date: "2026-06-12", title: "Asthma review", titleFr: "Suivi asthme", note: "Inhaler technique reviewed, well controlled.", noteFr: "Technique d'inhalation revue, bien contrôlé." },
    ],
  },
]

export const waitingRoom = [
  { id: "PT-10294", name: "Kwesi Owusu", reason: "Follow-up", reasonFr: "Suivi", waiting: "3 min", avatar: null },
  { id: "PT-10297", name: "Naledi Khumalo", reason: "Migraine", reasonFr: "Migraine", waiting: "7 min", avatar: null },
  { id: "PT-10298", name: "Ibrahim Cissé", reason: "Asthma check", reasonFr: "Contrôle asthme", waiting: "12 min", avatar: null },
]

export const teleSessions = [
  { id: "TC-5001", patient: "Amara Diallo", doctor: "Dr. Kwame Mensah", specialty: "Cardiology", reason: "Hypertension follow-up", time: "Now", status: "live" },
  { id: "TC-5002", patient: "Kwesi Owusu", doctor: "Dr. Ngozi Achebe", specialty: "Orthopedics", reason: "Post-op review", time: "10:30", status: "scheduled" },
  { id: "TC-5003", patient: "Naledi Khumalo", doctor: "Dr. Ngozi Achebe", specialty: "Neurology", reason: "Migraine management", time: "11:15", status: "scheduled" },
  { id: "TC-5004", patient: "Ibrahim Cissé", doctor: "Dr. Aïcha Bello", specialty: "Pediatrics", reason: "Asthma check", time: "11:45", status: "scheduled" },
]

export const teleChat = [
  { id: 1, from: "patient", text: "Good morning doctor, thank you for seeing me.", textFr: "Bonjour docteur, merci de me recevoir.", time: "09:01" },
  { id: 2, from: "doctor", text: "Good morning Amara. How have you been feeling since our last visit?", textFr: "Bonjour Amara. Comment vous sentez-vous depuis la dernière fois ?", time: "09:01" },
  { id: 3, from: "patient", text: "Much better, the new medication helps with the headaches.", textFr: "Bien mieux, le nouveau traitement aide pour les maux de tête.", time: "09:02" },
]

export const aiSuggestedPrompts = [
  { en: "Summarize Amara Diallo's recent visits", fr: "Résume les visites récentes d'Amara Diallo" },
  { en: "Check interactions for Lisinopril + Ibuprofen", fr: "Vérifie les interactions Lisinopril + Ibuprofène" },
  { en: "Suggest a hypertension treatment protocol", fr: "Propose un protocole de traitement de l'hypertension" },
  { en: "What is today's ICU occupancy trend?", fr: "Quelle est la tendance d'occupation des soins intensifs ?" },
]
