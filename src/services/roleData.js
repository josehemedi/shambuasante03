// Mock datasets backing the role-specific dashboards and the user management
// module. Each export maps to a future Spring Boot resource (noted in api.js).

// ---------------------------- SUBSCRIPTIONS ---------------------------------
export const subscriptionKpis = {
  activeSubscriptions: { value: 48, delta: 12 },
  mrr: { value: 284500, delta: 11 },
  arpu: { value: 156, delta: -3 },
  churnRate: { value: 2.4, delta: -1.2 },
}

export const subscriptionPlans = [
  {
    id: "P-ENTERPRISE",
    name: "Enterprise",
    nameFr: "Entreprise",
    price: 4200,
    priceFr: "4 200 €",
    priceUSD: "$4,200",
    features: ["Unlimited users", "Multi-site support", "Advanced analytics", "Priority support", "API access", "Custom integrations"],
    featuresFr: ["Utilisateurs illimités", "Support multi-sites", "Analyses avancées", "Support prioritaire", "Accès API", "Intégrations personnalisées"],
    popular: true,
  },
  {
    id: "P-GROWTH",
    name: "Growth",
    nameFr: "Croissance",
    price: 2400,
    priceFr: "2 400 €",
    priceUSD: "$2,400",
    features: ["Up to 300 users", "Single site", "Basic analytics", "Email support", "Standard API"],
    featuresFr: ["Jusqu'à 300 utilisateurs", "Site unique", "Analyses de base", "Support email", "API standard"],
    popular: false,
  },
  {
    id: "P-STARTER",
    name: "Starter",
    nameFr: "Démarrage",
    price: 800,
    priceFr: "800 €",
    priceUSD: "$800",
    features: ["Up to 100 users", "Basic features", "Limited analytics", "Community support"],
    featuresFr: ["Jusqu'à 100 utilisateurs", "Fonctionnalités de base", "Analyses limitées", "Support communautaire"],
    popular: false,
  },
]

export const subscriptionInvoices = [
  { id: "INV-2026-001", tenant: "Accra Central Hospital", amount: 12400, status: "paid", date: "2026-06-01", dueDate: "2026-06-05" },
  { id: "INV-2026-002", tenant: "Lagos Mainland Medical", amount: 11800, status: "paid", date: "2026-06-01", dueDate: "2026-06-05" },
  { id: "INV-2026-003", tenant: "Nairobi Health Group", amount: 6400, status: "paid", date: "2026-06-01", dueDate: "2026-06-05" },
  { id: "INV-2026-004", tenant: "Dakar Clinique Plus", amount: 2400, status: "pending", date: "2026-06-01", dueDate: "2026-06-05" },
  { id: "INV-2026-005", tenant: "Kigali Care Network", amount: 1800, status: "paid", date: "2026-06-01", dueDate: "2026-06-05" },
  { id: "INV-2026-006", tenant: "Abidjan Santé", amount: 800, status: "overdue", date: "2026-05-15", dueDate: "2026-05-20" },
]

export const subscriptionTimeline = [
  { id: 1, tenant: "Accra Central Hospital", action: "upgraded", plan: "Enterprise", date: "2026-05-15", amount: 12400 },
  { id: 2, tenant: "Dakar Clinique Plus", action: "trial", plan: "Growth", date: "2026-06-01", amount: 0 },
  { id: 3, tenant: "Abidjan Santé", action: "downgraded", plan: "Starter", date: "2026-04-20", amount: 800 },
  { id: 4, tenant: "Nairobi Health Group", action: "renewed", plan: "Growth", date: "2026-06-01", amount: 6400 },
  { id: 5, tenant: "Kigali Care Network", action: "renewed", plan: "Starter", date: "2026-06-01", amount: 1800 },
  { id: 6, tenant: "Lagos Mainland Medical", action: "renewed", plan: "Enterprise", date: "2026-06-01", amount: 11800 },
]

// ----------------------------- SUPER ADMIN --------------------------------
export const superAdminKpis = {
  hospitals: { value: 48, delta: 9.4 },
  activeUsers: { value: 12840, delta: 14.2 },
  mrr: { value: 284500, delta: 11.8 },
  growth: { value: 23.6, delta: 4.1 },
}

export const mrrSeries = [
  { month: "Jul", mrr: 198 },
  { month: "Aug", mrr: 214 },
  { month: "Sep", mrr: 231 },
  { month: "Oct", mrr: 248 },
  { month: "Nov", mrr: 266 },
  { month: "Dec", mrr: 284 },
]

export const planDistribution = [
  { name: "Enterprise", value: 14, color: "var(--color-chart-1)" },
  { name: "Growth", value: 19, color: "var(--color-chart-2)" },
  { name: "Starter", value: 15, color: "var(--color-chart-3)" },
]

export const tenants = [
  { id: "T-001", name: "Accra Central Hospital", country: "Ghana", plan: "Enterprise", users: 420, status: "active", mrr: 12400 },
  { id: "T-002", name: "Lagos Mainland Medical", country: "Nigeria", plan: "Enterprise", users: 380, status: "active", mrr: 11800 },
  { id: "T-003", name: "Nairobi Health Group", country: "Kenya", plan: "Growth", users: 210, status: "active", mrr: 6400 },
  { id: "T-004", name: "Dakar Clinique Plus", country: "Senegal", plan: "Growth", users: 145, status: "trial", mrr: 0 },
  { id: "T-005", name: "Kigali Care Network", country: "Rwanda", plan: "Starter", users: 64, status: "active", mrr: 1800 },
  { id: "T-006", name: "Abidjan Santé", country: "Côte d'Ivoire", plan: "Starter", users: 52, status: "suspended", mrr: 0 },
]

export const hospitalKpis = {
  total: { value: 48, delta: 9.4 },
  active: { value: 38, delta: 5.2 },
  trial: { value: 7, delta: 2.1 },
  suspended: { value: 3, delta: -1.5 },
  totalUsers: { value: 12840, delta: 14.2 },
  totalMrr: { value: 284500, delta: 11.8 },
}

export const hospitals = [
  { id: "T-001", name: "Accra Central Hospital", country: "Ghana", city: "Accra", plan: "Enterprise", users: 420, status: "active", mrr: 12400, specialty: "Multi-specialty", contact: "Dr. Kwame Mensah", email: "admin@accracentral.gh", phone: "+233 30 255 0182", joined: "2024-03-15", lastActive: "2 min ago" },
  { id: "T-002", name: "Lagos Mainland Medical", country: "Nigeria", city: "Lagos", plan: "Enterprise", users: 380, status: "active", mrr: 11800, specialty: "Cardiology & Surgery", contact: "Dr. Ngozi Achebe", email: "admin@lagosmainland.ng", phone: "+234 1 234 5678", joined: "2024-05-20", lastActive: "12 min ago" },
  { id: "T-003", name: "Nairobi Health Group", country: "Kenya", city: "Nairobi", plan: "Growth", users: 210, status: "active", mrr: 6400, specialty: "General Medicine", contact: "Dr. James Mwangi", email: "admin@nairobihealth.ke", phone: "+254 20 123 4567", joined: "2024-08-10", lastActive: "1 h ago" },
  { id: "T-004", name: "Dakar Clinique Plus", country: "Senegal", city: "Dakar", plan: "Growth", users: 145, status: "trial", mrr: 0, specialty: "Pediatrics", contact: "Dr. Aïcha Bello", email: "admin@dakarclinique.sn", phone: "+221 33 821 1234", joined: "2026-06-01", lastActive: "3 d ago" },
  { id: "T-005", name: "Kigali Care Network", country: "Rwanda", city: "Kigali", plan: "Starter", users: 64, status: "active", mrr: 1800, specialty: "Primary Care", contact: "Dr. Jean Baptiste", email: "admin@kigalicare.rw", phone: "+250 788 123 456", joined: "2025-11-05", lastActive: "5 h ago" },
  { id: "T-006", name: "Abidjan Santé", country: "Côte d'Ivoire", city: "Abidjan", plan: "Starter", users: 52, status: "suspended", mrr: 0, specialty: "General", contact: "Dr. Amina Touré", email: "admin@abidjansante.ci", phone: "+225 27 20 123 456", joined: "2025-09-18", lastActive: "15 d ago" },
  { id: "T-007", name: "Cape Town Medical", country: "South Africa", city: "Cape Town", plan: "Enterprise", users: 290, status: "active", mrr: 9800, specialty: "Oncology & Research", contact: "Dr. Sarah van der Merwe", email: "admin@capetownmed.co.za", phone: "+27 21 123 4567", joined: "2024-01-20", lastActive: "Just now" },
  { id: "T-008", name: "Lusaka General Hospital", country: "Zambia", city: "Lusaka", plan: "Growth", users: 175, status: "active", mrr: 4200, specialty: "Emergency & Trauma", contact: "Dr. Joseph Banda", email: "admin@lusakageneral.zm", phone: "+260 211 123 456", joined: "2025-03-10", lastActive: "30 min ago" },
  { id: "T-009", name: "Kampala Women's Health", country: "Uganda", city: "Kampala", plan: "Starter", users: 48, status: "trial", mrr: 0, specialty: "Maternity & Women", contact: "Dr. Grace Nakamya", email: "admin@kampalawomens.ug", phone: "+256 414 123 456", joined: "2026-06-15", lastActive: "1 d ago" },
  { id: "T-010", name: "Casablanca Heart Center", country: "Morocco", city: "Casablanca", plan: "Enterprise", users: 340, status: "active", mrr: 11200, specialty: "Cardiology", contact: "Dr. Youssef Amrani", email: "admin@casablancaheart.ma", phone: "+212 522 123 456", joined: "2024-07-01", lastActive: "45 min ago" },
]

export const hospitalActivity = [
  { id: "HA-001", hospitalId: "T-001", action: "user_created", user: "Dr. Kwame Mensah", timestamp: "2026-07-02 08:42:11", details: "Created new user account for Dr. Sila Mutua" },
  { id: "HA-002", hospitalId: "T-002", action: "plan_upgrade", user: "System", timestamp: "2026-07-01 14:22:05", details: "Upgraded from Growth to Enterprise plan" },
  { id: "HA-003", hospitalId: "T-003", action: "login", user: "Dr. James Mwangi", timestamp: "2026-07-02 09:15:33", details: "Successful login from 192.168.1.45" },
  { id: "HA-004", hospitalId: "T-007", action: "config_update", user: "Dr. Sarah van der Merwe", timestamp: "2026-07-01 16:45:22", details: "Updated clinic operating hours" },
  { id: "HA-005", hospitalId: "T-001", action: "export", user: "Fatou Ndiaye", timestamp: "2026-07-01 11:30:00", details: "Exported monthly patient report" },
  { id: "HA-006", hospitalId: "T-010", action: "subscription_renewed", user: "System", timestamp: "2026-07-01 00:00:00", details: "Enterprise subscription renewed for 12 months" },
]

export const hospitalPlans = [
  { name: "Enterprise", price: 4200, priceFr: "4 200 €", features: ["Unlimited users", "Multi-site support", "Advanced analytics", "Priority support", "API access", "Custom integrations"], popular: true },
  { name: "Growth", price: 2400, priceFr: "2 400 €", features: ["Up to 300 users", "Single site", "Basic analytics", "Email support", "Standard API"], popular: false },
  { name: "Starter", price: 800, priceFr: "800 €", features: ["Up to 100 users", "Basic features", "Limited analytics", "Community support"], popular: false },
]

// ---------------------------- REVENUE ANALYTICS ------------------------------
export const revenueKpis = {
  mrr: { value: 284500, delta: 11.8 },
  arr: { value: 3414000, delta: 11.8 },
  arpu: { value: 156, delta: -3.2 },
  churnRate: { value: 2.4, delta: -1.2 },
  ltv: { value: 8420, delta: 5.4 },
  nrr: { value: 118, delta: 2.1 },
}

export const revenueTrend = [
  { month: "Jan", mrr: 198, inpatient: 45, outpatient: 28, tele: 12, pharmacy: 8, lab: 5 },
  { month: "Feb", mrr: 214, inpatient: 48, outpatient: 30, tele: 14, pharmacy: 9, lab: 6 },
  { month: "Mar", mrr: 231, inpatient: 52, outpatient: 33, tele: 16, pharmacy: 10, lab: 7 },
  { month: "Apr", mrr: 248, inpatient: 55, outpatient: 36, tele: 18, pharmacy: 11, lab: 8 },
  { month: "May", mrr: 266, inpatient: 58, outpatient: 38, tele: 20, pharmacy: 12, lab: 9 },
  { month: "Jun", mrr: 284, inpatient: 62, outpatient: 41, tele: 22, pharmacy: 14, lab: 10 },
]

export const tenantRevenue = [
  { id: "T-001", name: "Accra Central Hospital", country: "Ghana", plan: "Enterprise", mrr: 12400, arr: 148800, growth: 12.5, status: "active", lastPayment: "2026-06-28" },
  { id: "T-002", name: "Lagos Mainland Medical", country: "Nigeria", plan: "Enterprise", mrr: 11800, arr: 141600, growth: 8.3, status: "active", lastPayment: "2026-06-27" },
  { id: "T-003", name: "Nairobi Health Group", country: "Kenya", plan: "Growth", mrr: 6400, arr: 76800, growth: 15.2, status: "active", lastPayment: "2026-06-25" },
  { id: "T-004", name: "Dakar Clinique Plus", country: "Senegal", plan: "Growth", mrr: 2400, arr: 28800, growth: -2.1, status: "trial", lastPayment: "2026-06-20" },
  { id: "T-005", name: "Kigali Care Network", country: "Rwanda", plan: "Starter", mrr: 1800, arr: 21600, growth: 5.8, status: "active", lastPayment: "2026-06-22" },
  { id: "T-006", name: "Abidjan Santé", country: "Côte d'Ivoire", plan: "Starter", mrr: 800, arr: 9600, growth: -15.3, status: "suspended", lastPayment: "2026-05-15" },
]

export const revenueByCategory = [
  { category: "Inpatient", value: 124500, delta: 8.2, color: "var(--color-chart-1)" },
  { category: "Outpatient", value: 89600, delta: 5.4, color: "var(--color-chart-2)" },
  { category: "Teleconsultation", value: 45200, delta: 22.1, color: "var(--color-chart-3)" },
  { category: "Pharmacy", value: 15800, delta: -3.2, color: "var(--color-chart-4)" },
  { category: "Laboratory", value: 9400, delta: 12.5, color: "var(--color-chart-5)" },
]

export const cohortData = [
  { month: "Jan", cohort0: 100, cohort1: 72, cohort2: 58, cohort3: 48 },
  { month: "Feb", cohort0: 100, cohort1: 75, cohort2: 62, cohort3: 52 },
  { month: "Mar", cohort0: 100, cohort1: 78, cohort2: 65, cohort3: 55 },
  { month: "Apr", cohort0: 100, cohort1: 76, cohort2: 63, cohort3: 54 },
  { month: "May", cohort0: 100, cohort1: 80, cohort2: 68, cohort3: 58 },
  { month: "Jun", cohort0: 100, cohort1: 82, cohort2: 70, cohort3: 60 },
]

// ------------------------------- DOCTOR -----------------------------------
export const doctorKpis = {
  todayAppointments: { value: 12, delta: 2 },
  patientQueue: { value: 5, delta: -1 },
  activeConsults: { value: 2, delta: 1 },
  pendingNotes: { value: 4, delta: -3 },
}

export const doctorSchedule = [
  { id: "A1", time: "09:00", patient: "Amara Diallo", reason: "Hypertension follow-up", status: "completed" },
  { id: "A2", time: "09:45", patient: "Kwesi Owusu", reason: "Post-op review", status: "completed" },
  { id: "A3", time: "10:30", patient: "Naledi Khumalo", reason: "Migraine consultation", status: "in-progress" },
  { id: "A4", time: "11:15", patient: "Thabo Nkosi", reason: "Diabetes management", status: "upcoming" },
  { id: "A5", time: "12:00", patient: "Zainab Bello", reason: "Cardiac screening", status: "upcoming" },
]

export const doctorQueue = [
  { id: "Q1", patient: "Naledi Khumalo", waited: "4 min", priority: "high", room: "Tele-2" },
  { id: "Q2", patient: "Thabo Nkosi", waited: "9 min", priority: "normal", room: "Room 14" },
  { id: "Q3", patient: "Zainab Bello", waited: "12 min", priority: "normal", room: "Room 14" },
  { id: "Q4", patient: "Sefu Abara", waited: "18 min", priority: "low", room: "Tele-1" },
]

// ------------------------------- PATIENT ----------------------------------
export const patientKpis = {
  upcoming: { value: 2, delta: 0 },
  prescriptions: { value: 3, delta: 1 },
  reports: { value: 5, delta: 2 },
  balance: { value: 120, delta: -45 },
}

export const patientAppointments = [
  { id: "PA1", date: "Jun 28", time: "10:30", doctor: "Dr. Ngozi Achebe", specialty: "Cardiology", mode: "Teleconsultation" },
  { id: "PA2", date: "Jul 12", time: "14:00", doctor: "Dr. Kwame Mensah", specialty: "General Medicine", mode: "In-person" },
]

export const patientPrescriptions = [
  { id: "RX1", drug: "Lisinopril 10mg", dosage: "1 tablet daily", refills: 2, status: "active" },
  { id: "RX2", drug: "Atorvastatin 20mg", dosage: "1 tablet at night", refills: 1, status: "active" },
  { id: "RX3", drug: "Metformin 500mg", dosage: "2 tablets daily", refills: 0, status: "ended" },
]

export const patientTimeline = [
  { id: "PT1", text: "Cardiology consultation with Dr. Achebe", date: "Jun 14", type: "visit" },
  { id: "PT2", text: "Blood panel results uploaded", date: "Jun 10", type: "lab" },
  { id: "PT3", text: "Prescription renewed — Lisinopril", date: "Jun 02", type: "rx" },
  { id: "PT4", text: "Annual physical examination", date: "May 21", type: "visit" },
]

// ---------------------------- LAB TECHNICIAN ------------------------------
export const labKpis = {
  pending: { value: 18, delta: 4 },
  inProgress: { value: 7, delta: -2 },
  completed: { value: 64, delta: 12 },
  critical: { value: 3, delta: 1 },
}

export const labQueue = [
  { id: "LB-9001", patient: "Amara Diallo", test: "Complete Blood Count", priority: "routine", status: "pending", received: "08:12" },
  { id: "LB-9002", patient: "Thabo Nkosi", test: "Lipid Panel", priority: "routine", status: "in-progress", received: "08:30" },
  { id: "LB-9003", patient: "Sefu Abara", test: "Troponin I", priority: "stat", status: "in-progress", received: "08:41" },
  { id: "LB-9004", patient: "Zainab Bello", test: "HbA1c", priority: "routine", status: "pending", received: "09:05" },
  { id: "LB-9005", patient: "Naledi Khumalo", test: "Blood Culture", priority: "stat", status: "completed", received: "07:55" },
]

export const labCritical = [
  { id: "C1", patient: "Sefu Abara", test: "Troponin I", value: "0.84 ng/mL", flag: "High", ref: "<0.04" },
  { id: "C2", patient: "Kwesi Owusu", test: "Potassium", value: "6.2 mmol/L", flag: "High", ref: "3.5–5.1" },
  { id: "C3", patient: "Ama Serwaa", test: "Hemoglobin", value: "6.1 g/dL", flag: "Low", ref: "12–16" },
]

// ---------------------------- SAMPLE TRACKING -------------------------------
export const sampleKpis = {
  total: { value: 90, delta: 12 },
  pendingCollection: { value: 24, delta: 3 },
  received: { value: 32, delta: 8 },
  inAnalysis: { value: 18, delta: -2 },
  validated: { value: 12, delta: 5 },
  rejected: { value: 2, delta: -1 },
}

export const samples = [
  {
    id: "SMP-00124",
    patient: "Amara Diallo",
    patientId: "PT-10293",
    sampleType: "blood",
    testRequested: "Complete Blood Count",
    collectionDate: "2026-06-30",
    collectionTime: "08:15",
    receivedDate: "2026-06-30",
    receivedTime: "08:45",
    status: "validated",
    priority: "routine",
    doctor: "Dr. Ngozi Achebe",
    barcode: "12457890",
    qrCode: "SMP-00124-PT10293-2026",
  },
  {
    id: "SMP-00125",
    patient: "Kwesi Owusu",
    patientId: "PT-10294",
    sampleType: "urine",
    testRequested: "Urinalysis",
    collectionDate: "2026-06-30",
    collectionTime: "09:20",
    receivedDate: "2026-06-30",
    receivedTime: "09:50",
    status: "in-progress",
    priority: "stat",
    doctor: "Dr. Kwame Mensah",
    barcode: "12457891",
    qrCode: "SMP-00125-PT10294-2026",
  },
  {
    id: "SMP-00126",
    patient: "Zainab Bello",
    patientId: "PT-10295",
    sampleType: "blood",
    testRequested: "Lipid Panel",
    collectionDate: "2026-06-30",
    collectionTime: "10:00",
    receivedDate: null,
    receivedTime: null,
    status: "pending",
    priority: "routine",
    doctor: "Dr. Ngozi Achebe",
    barcode: "12457892",
    qrCode: "SMP-00126-PT10295-2026",
  },
  {
    id: "SMP-00127",
    patient: "Thabo Nkosi",
    patientId: "PT-10296",
    sampleType: "biopsy",
    testRequested: "Histopathology",
    collectionDate: "2026-06-29",
    collectionTime: "14:30",
    receivedDate: "2026-06-29",
    receivedTime: "15:00",
    status: "rejected",
    priority: "routine",
    doctor: "Dr. Kwame Mensah",
    barcode: "12457893",
    qrCode: "SMP-00127-PT10296-2026",
    rejectionReason: "Insufficient sample volume",
  },
  {
    id: "SMP-00128",
    patient: "Naledi Khumalo",
    patientId: "PT-10297",
    sampleType: "blood",
    testRequested: "Glucose",
    collectionDate: null,
    collectionTime: null,
    receivedDate: null,
    receivedTime: null,
    status: "pending",
    priority: "stat",
    doctor: "Dr. Ngozi Achebe",
    barcode: "12457894",
    qrCode: "SMP-00128-PT10297-2026",
  },
]

export const sampleTimeline = {
  "SMP-00124": [
    { id: 1, status: "pending", date: "2026-06-30", time: "08:00", user: "System", comment: "Sample request created" },
    { id: 2, status: "collected", date: "2026-06-30", time: "08:15", user: "Fatou Ndiaye", comment: "Sample collected" },
    { id: 3, status: "received", date: "2026-06-30", time: "08:45", user: "Ibrahim Cissé", comment: "Sample received at lab" },
    { id: 4, status: "in-progress", date: "2026-06-30", time: "09:15", user: "Ibrahim Cissé", comment: "Analysis started" },
    { id: 5, status: "validation", date: "2026-06-30", time: "09:45", user: "Dr. Ngozi Achebe", comment: "Results under review" },
    { id: 6, status: "validated", date: "2026-06-30", time: "10:00", user: "Ibrahim Cissé", comment: "Results validated and ready" },
  ],
  "SMP-00125": [
    { id: 1, status: "pending", date: "2026-06-30", time: "08:30", user: "System", comment: "Sample request created" },
    { id: 2, status: "collected", date: "2026-06-30", time: "09:20", user: "Fatou Ndiaye", comment: "Sample collected" },
    { id: 3, status: "received", date: "2026-06-30", time: "09:50", user: "Ibrahim Cissé", comment: "Sample received at lab" },
    { id: 4, status: "in-progress", date: "2026-06-30", time: "10:15", user: "Ibrahim Cissé", comment: "Analysis in progress" },
  ],
  "SMP-00126": [
    { id: 1, status: "pending", date: "2026-06-30", time: "09:00", user: "System", comment: "Sample request created - pending collection" },
  ],
  "SMP-00127": [
    { id: 1, status: "pending", date: "2026-06-29", time: "13:00", user: "System", comment: "Sample request created" },
    { id: 2, status: "collected", date: "2026-06-29", time: "14:30", user: "Fatou Ndiaye", comment: "Sample collected" },
    { id: 3, status: "rejected", date: "2026-06-29", time: "15:30", user: "Ibrahim Cissé", comment: "Sample rejected - Insufficient volume" },
  ],
  "SMP-00128": [
    { id: 1, status: "pending", date: "2026-06-30", time: "09:45", user: "System", comment: "STAT request - urgent collection needed" },
  ],
}

export const notifications = [
  { id: "N1", type: "urgent", sampleId: "SMP-00125", message: "Urgent sample awaiting analysis", time: "5 min ago", read: false },
  { id: "N2", type: "delay", sampleId: "SMP-00126", message: "Collection delayed", time: "12 min ago", read: false },
  { id: "N3", type: "rejected", sampleId: "SMP-00127", message: "Sample rejected", time: "1 hour ago", read: true },
]

// ----------------------------- RECEPTIONIST -------------------------------
export const receptionKpis = {
  todayAppointments: { value: 34, delta: 6 },
  waiting: { value: 8, delta: 2 },
  checkedIn: { value: 21, delta: 5 },
  registrations: { value: 11, delta: 3 },
}

export const receptionQueue = [
  { id: "R1", patient: "Amara Diallo", appt: "10:30", doctor: "Dr. Achebe", status: "checked-in", waited: "6 min" },
  { id: "R2", patient: "Thabo Nkosi", appt: "10:45", doctor: "Dr. Mensah", status: "waiting", waited: "11 min" },
  { id: "R3", patient: "Zainab Bello", appt: "11:00", doctor: "Dr. Achebe", status: "waiting", waited: "3 min" },
  { id: "R4", patient: "Sefu Abara", appt: "11:15", doctor: "Dr. Mensah", status: "scheduled", waited: "—" },
  { id: "R5", patient: "Ama Serwaa", appt: "11:30", doctor: "Dr. Achebe", status: "scheduled", waited: "—" },
]

export const receptionRegSeries = [
  { hour: "8a", count: 3 },
  { hour: "9a", count: 5 },
  { hour: "10a", count: 8 },
  { hour: "11a", count: 6 },
  { hour: "12p", count: 4 },
  { hour: "1p", count: 7 },
]

// ---------------------------- USER MANAGEMENT ------------------------------
export const managedUsers = [
  { id: "U-1001", name: "Dr. Kwame Mensah", email: "kwame.mensah@shambua.health", role: "hospital_admin", tenant: "Accra Central Hospital", status: "active", lastActive: "2 min ago" },
  { id: "U-1002", name: "Dr. Ngozi Achebe", email: "ngozi.achebe@shambua.health", role: "doctor", tenant: "Accra Central Hospital", status: "active", lastActive: "12 min ago" },
  { id: "U-1003", name: "Ibrahim Cissé", email: "ibrahim.cisse@shambua.health", role: "lab_tech", tenant: "Accra Central Hospital", status: "active", lastActive: "1 h ago" },
  { id: "U-1004", name: "Fatou Ndiaye", email: "fatou.ndiaye@shambua.health", role: "receptionist", tenant: "Accra Central Hospital", status: "active", lastActive: "5 min ago" },
  { id: "U-1005", name: "Dr. Sila Mutua", email: "sila.mutua@nairobihealth.ke", role: "doctor", tenant: "Nairobi Health Group", status: "invited", lastActive: "—" },
  { id: "U-1006", name: "Adaeze Okonkwo", email: "adaeze@shambua.cloud", role: "superadmin", tenant: "All Tenants", status: "active", lastActive: "Just now" },
  { id: "U-1007", name: "Joseph Banda", email: "joseph.banda@kigalicare.rw", role: "hospital_admin", tenant: "Kigali Care Network", status: "suspended", lastActive: "3 d ago" },
  { id: "U-1008", name: "Amina Toure", email: "amina.toure@dakarclinique.sn", role: "receptionist", tenant: "Dakar Clinique Plus", status: "active", lastActive: "27 min ago" },
]

// ------------------------------ APPOINTMENTS -------------------------------
export const doctorAppointments = [
  { id: "A1", date: "2026-07-01", time: "09:00", patient: "Amara Diallo", patientId: "PT-10293", reason: "Hypertension follow-up", specialty: "Cardiology", mode: "In-person", status: "completed", duration: "30 min", room: "Room 14" },
  { id: "A2", date: "2026-07-01", time: "09:45", patient: "Kwesi Owusu", patientId: "PT-10294", reason: "Post-op review", specialty: "Orthopedics", mode: "Teleconsultation", status: "completed", duration: "20 min" },
  { id: "A3", date: "2026-07-01", time: "10:30", patient: "Naledi Khumalo", patientId: "PT-10297", reason: "Migraine consultation", specialty: "Neurology", mode: "In-person", status: "in-progress", duration: "30 min", room: "Room 12" },
  { id: "A4", date: "2026-07-01", time: "11:15", patient: "Thabo Nkosi", patientId: "PT-10296", reason: "Diabetes management", specialty: "Endocrinology", mode: "In-person", status: "upcoming", duration: "30 min", room: "Room 14" },
  { id: "A5", date: "2026-07-01", time: "12:00", patient: "Zainab Bello", patientId: "PT-10295", reason: "Cardiac screening", specialty: "Cardiology", mode: "In-person", status: "upcoming", duration: "45 min", room: "Room 14" },
  { id: "A6", date: "2026-07-02", time: "08:30", patient: "Fatou Sow", patientId: "PT-10298", reason: "Prenatal checkup", specialty: "Maternity", mode: "In-person", status: "upcoming", duration: "30 min", room: "Room 8" },
  { id: "A7", date: "2026-07-02", time: "09:30", patient: "Ibrahim Cissé", patientId: "PT-10299", reason: "Asthma review", specialty: "Pediatrics", mode: "Teleconsultation", status: "upcoming", duration: "20 min" },
  { id: "A8", date: "2026-07-03", time: "14:00", patient: "Sefu Abara", patientId: "PT-10300", reason: "Chest pain assessment", specialty: "Cardiology", mode: "In-person", status: "upcoming", duration: "45 min", room: "Room 14" },
  { id: "A9", date: "2026-06-28", time: "10:00", patient: "Amara Diallo", patientId: "PT-10293", reason: "Initial consultation", specialty: "Cardiology", mode: "In-person", status: "cancelled", duration: "30 min", room: "Room 14" },
  { id: "A10", date: "2026-06-25", time: "11:00", patient: "Kwesi Owusu", patientId: "PT-10294", reason: "Follow-up", specialty: "Orthopedics", mode: "In-person", status: "completed", duration: "20 min", room: "Room 6" },
]

// ------------------------------ AUDIT LOGS ----------------------------------
export const auditKpis = {
  totalEvents: { value: 14829, delta: 4.2 },
  securityAlerts: { value: 23, delta: -8.5 },
  dataChanges: { value: 3847, delta: 12.1 },
  complianceScore: { value: 98, delta: 0.5 },
}

export const auditLogs = [
  { id: "AUD-8901", timestamp: "2026-07-02 08:42:11", user: "Dr. Kwame Mensah", role: "hospital_admin", action: "LOGIN", resource: "Authentication", changes: "Successful login from 192.168.1.45", severity: "info", ip: "192.168.1.45", status: "success" },
  { id: "AUD-8900", timestamp: "2026-07-02 08:38:05", user: "Adaeze Okonkwo", role: "superadmin", action: "UPDATE", resource: "User Management", changes: "Updated role for user U-1005 from doctor to hospital_admin", severity: "warning", ip: "10.0.0.12", status: "success" },
  { id: "AUD-8899", timestamp: "2026-07-02 08:15:22", user: "Ibrahim Cissé", role: "lab_tech", action: "CREATE", resource: "Lab Results", changes: "Created results for sample SMP-00124 (CBC)", severity: "info", ip: "192.168.2.88", status: "success" },
  { id: "AUD-8898", timestamp: "2026-07-02 07:59:44", user: "Fatou Ndiaye", role: "receptionist", action: "CHECK_IN", resource: "Patient Queue", changes: "Checked in patient Amara Diallo (PT-10293)", severity: "info", ip: "192.168.3.15", status: "success" },
  { id: "AUD-8897", timestamp: "2026-07-02 07:45:10", user: "Unknown", role: "unknown", action: "LOGIN_FAILED", resource: "Authentication", changes: "3 failed login attempts for admin account", severity: "critical", ip: "203.0.113.42", status: "failed" },
  { id: "AUD-8896", timestamp: "2026-07-01 23:12:33", user: "Dr. Ngozi Achebe", role: "doctor", action: "PRESCRIBE", resource: "Prescriptions", changes: "E-prescribed Lisinopril 10mg for patient PT-10293", severity: "info", ip: "192.168.1.67", status: "success" },
  { id: "AUD-8895", timestamp: "2026-07-01 22:05:18", user: "System", role: "system", action: "BACKUP", resource: "Database", changes: "Automated daily backup completed (2.4 GB)", severity: "info", ip: "localhost", status: "success" },
  { id: "AUD-8894", timestamp: "2026-07-01 21:30:00", user: "Dr. Kwame Mensah", role: "hospital_admin", action: "CONFIG_UPDATE", resource: "Platform Settings", changes: "Updated maximum session timeout to 30 minutes", severity: "warning", ip: "10.0.0.12", status: "success" },
  { id: "AUD-8893", timestamp: "2026-07-01 20:18:45", user: "Ibrahim Cissé", role: "lab_tech", action: "DELETE", resource: "Lab Results", changes: "Deleted erroneous result for sample SMP-00122", severity: "critical", ip: "192.168.2.88", status: "success" },
  { id: "AUD-8892", timestamp: "2026-07-01 19:55:02", user: "Joseph Banda", role: "hospital_admin", action: "EXPORT", resource: "Reports", changes: "Exported monthly revenue report for June 2026", severity: "info", ip: "10.0.0.55", status: "success" },
  { id: "AUD-8891", timestamp: "2026-07-01 18:42:19", user: "Fatou Ndiaye", role: "receptionist", action: "REGISTER", resource: "Patient Registration", changes: "New patient registration for Ibrahim Cissé (PT-10299)", severity: "info", ip: "192.168.3.15", status: "success" },
  { id: "AUD-8890", timestamp: "2026-07-01 17:30:55", user: "System", role: "system", action: "ALERT", resource: "Security", changes: "Intrusion detection: 5 suspicious requests blocked from 198.51.100.23", severity: "critical", ip: "198.51.100.23", status: "failed" },
]

export const auditActionTypes = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "EXPORT", "PRESCRIBE", "CHECK_IN", "CONFIG_UPDATE", "BACKUP", "ALERT", "LOGIN_FAILED"]
export const auditSeverities = ["info", "warning", "critical"]

// ---------------------------- PLATFORM SETTINGS ------------------------------
export const brandingSettings = {
  platformName: "ShambuaSante",
  supportEmail: "support@shambua.health",
  primaryColor: "#4F46E5",
  logoUrl: "/logo.svg",
  faviconUrl: "/favicon.ico",
}

export const regions = [
  { id: "R-1", code: "US-EAST", name: "US East", nameFr: "US Est", status: "active", latency: "12ms", hospitals: 18, primary: true },
  { id: "R-2", code: "US-WEST", name: "US West", nameFr: "US Ouest", status: "active", latency: "45ms", hospitals: 12, primary: false },
  { id: "R-3", code: "EU-WEST", name: "EU West", nameFr: "UE Ouest", status: "active", latency: "89ms", hospitals: 8, primary: false },
  { id: "R-4", code: "AF-SOUTH", name: "Africa South", nameFr: "Afrique Sud", status: "active", latency: "120ms", hospitals: 10, primary: false },
]

export const featureFlags = [
  { id: "FF-001", key: "AI_DIAGNOSTICS", name: "AI Diagnostics", nameFr: "Diagnostics IA", description: "Enable AI-powered diagnostic suggestions", descriptionFr: "Activer les suggestions diagnostiques IA", enabled: true, rollout: 100, category: "AI" },
  { id: "FF-002", key: "TELE_CONSULTATION", name: "Teleconsultation", nameFr: "Téléconsultation", description: "Enable video consultations", descriptionFr: "Activer les consultations vidéo", enabled: true, rollout: 100, category: "Clinical" },
  { id: "FF-003", key: "E_PRESCRIBING", name: "E-Prescribing", nameFr: "E-Ordonnance", description: "Enable electronic prescription", descriptionFr: "Activer l'ordonnance électronique", enabled: true, rollout: 85, category: "Clinical" },
  { id: "FF-004", key: "LAB_INTERFACE", name: "Lab Interface", nameFr: "Interface Labo", description: "Enable HL7 lab results integration", descriptionFr: "Activer l'intégration résultats labo HL7", enabled: true, rollout: 92, category: "Laboratory" },
  { id: "FF-005", key: "PHARMACY_INVENTORY", name: "Pharmacy Inventory", nameFr: "Inventaire Pharmacie", description: "Enable real-time pharmacy stock tracking", descriptionFr: "Activer le suivi stock pharmacie temps réel", enabled: false, rollout: 0, category: "Pharmacy" },
  { id: "FF-006", key: "BILLING_AUTOMATION", name: "Billing Automation", nameFr: "Facturation Auto", description: "Enable automated insurance billing", descriptionFr: "Activer la facturation assurance automatisée", enabled: true, rollout: 78, category: "Finance" },
  { id: "FF-007", key: "PATIENT_PORTAL", name: "Patient Portal", nameFr: "Portail Patient", description: "Enable patient self-service portal", descriptionFr: "Activer le portail patient libre-service", enabled: true, rollout: 100, category: "Front Desk" },
  { id: "FF-008", key: "MULTI_TENANT", name: "Multi-Tenant", nameFr: "Multi-Locataires", description: "Enable multi-tenant architecture", descriptionFr: "Activer l'architecture multi-locataires", enabled: true, rollout: 100, category: "Platform" },
]

export const integrations = [
  { id: "INT-001", name: "Twilio", nameFr: "Twilio", type: "Communication", typeFr: "Communication", status: "active", lastSync: "2 min ago", apiVersion: "v2", endpoint: "api.twilio.com", icon: "MessageSquare" },
  { id: "INT-002", name: "Stripe", nameFr: "Stripe", type: "Payment", typeFr: "Paiement", status: "active", lastSync: "5 min ago", apiVersion: "v3", endpoint: "api.stripe.com", icon: "CreditCard" },
  { id: "INT-003", name: "AWS S3", nameFr: "AWS S3", type: "Storage", typeFr: "Stockage", status: "active", lastSync: "1 min ago", apiVersion: "v4", endpoint: "s3.amazonaws.com", icon: "HardDrive" },
  { id: "INT-004", name: "SendGrid", nameFr: "SendGrid", type: "Email", typeFr: "Email", status: "degraded", lastSync: "15 min ago", apiVersion: "v3", endpoint: "api.sendgrid.com", icon: "Mail" },
  { id: "INT-005", name: "HL7 Interface", nameFr: "Interface HL7", type: "Laboratory", typeFr: "Laboratoire", status: "active", lastSync: "3 min ago", apiVersion: "v2.5", endpoint: "hl7.internal", icon: "FlaskConical" },
  { id: "INT-006", name: "OpenAI", nameFr: "OpenAI", type: "AI", typeFr: "IA", status: "active", lastSync: "1 min ago", apiVersion: "v1", endpoint: "api.openai.com", icon: "Sparkles" },
]

export const securityPolicies = {
  passwordPolicy: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecialChars: true, expiryDays: 90, historyCount: 5 },
  sessionPolicy: { timeoutMinutes: 30, maxConcurrentSessions: 3, enforce2FA: true, ipWhitelistEnabled: true },
  auditPolicy: { retentionDays: 2555, logLevel: "verbose", alertOnAnomaly: true, notifyAdmins: true },
}
