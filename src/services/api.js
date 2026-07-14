// Service layer — connecté au backend Hospicloud avec repli mock si indisponible.

import { http, USE_LIVE_API, getToken, getHopitalId, API_BASE_URL } from "./httpClient"
import { ROLE_KEYS } from "@/config/roles"
import {
  kpis,
  revenueSeries,
  patientFlow,
  departmentLoad,
  emergencyAlerts,
  aiInsights,
  activityTimeline,
  patients,
  waitingRoom,
  teleChat,
  teleSessions,
  aiSuggestedPrompts,
} from "./mockData"
import {
  superAdminKpis,
  mrrSeries,
  planDistribution,
  tenants,
  patientKpis,
  patientAppointments,
  patientPrescriptions,
  patientTimeline,
  labKpis,
  labQueue,
  labCritical,
  sampleKpis,
  samples,
  sampleTimeline,
  notifications,
  receptionKpis,
  receptionQueue,
  receptionRegSeries,
  managedUsers,
  auditKpis,
  auditLogs,
  auditActionTypes,
  auditSeverities,
  brandingSettings,
  regions,
  featureFlags,
  integrations,
  securityPolicies,
  revenueKpis,
  revenueTrend,
  tenantRevenue,
  revenueByCategory,
  cohortData,
  hospitalKpis,
  hospitals,
  hospitalActivity,
  hospitalPlans,
} from "./roleData"
import {
  monitoringKpis,
  uptimeSeries,
  latencySeries,
  incidents,
  alerts,
  serviceStatus,
  incidentTrends,
  aiAnalyticsKpis,
  modelUsageSeries,
  inferenceCostSeries,
  adoptionByTenant,
  qualityMetrics,
} from "./monitoringData"

const LATENCY = 200

function mockResolve(data) {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), LATENCY))
}

async function withLiveApi(liveCall, mockData) {
  if (!USE_LIVE_API) {
    return mockResolve(mockData)
  }
  try {
    return await liveCall()
  } catch (error) {
    console.warn("[api] Repli mock:", error?.message || error)
    return structuredClone(mockData)
  }
}

/** Appels API obligatoires — aucun repli mock (données réelles ou erreur). */
async function liveApiOnly(liveCall) {
  if (!USE_LIVE_API) {
    throw new Error("Les appels API en direct sont désactivés (VITE_USE_LIVE_API=false).")
  }
  return liveCall()
}

async function fetchPdfBlob(path) {
  const token = getToken()
  const hopitalId = getHopitalId()
  const headers = { Accept: "application/pdf" }
  if (token) headers.Authorization = `Bearer ${token}`
  if (hopitalId != null) headers["X-Hopital-Id"] = String(hopitalId)
  const response = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (!response.ok) {
    let detail = null
    try {
      const body = await response.json()
      detail = body?.message || body?.details
    } catch {
      /* réponse non-JSON (ex. HTML proxy) */
    }
    if (response.status === 403) {
      throw new Error(detail || "Accès refusé.")
    }
    if (response.status === 404) throw new Error(detail || "Document introuvable.")
    throw new Error(detail || "Impossible de générer le PDF.")
  }
  return response.blob()
}

function openPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, "_blank")
  if (!opened) {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function kpi(value, delta = 0) {
  return { value: Number(value) || 0, delta: Number(delta) || 0 }
}

function mapPatientActivityType(typeActivite) {
  const label = (typeActivite || "").toLowerCase()
  if (label.includes("ordonnance") || label.includes("prescription")) return "rx"
  if (label.includes("facture") || label.includes("lab") || label.includes("analyse")) return "lab"
  return "visit"
}

function formatPatientActivityDate(value) {
  if (!value) return "—"
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  } catch {
    return String(value)
  }
}

function calcAge(dateNaissance) {
  if (!dateNaissance) return null
  const birth = new Date(dateNaissance)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

function mapPatient(p) {
  const contact = parseContactUrgence(p.contactUrgence)
  return {
    idPatient: p.idPatient,
    idHopital: p.idHopital ?? null,
    codePatient: p.codePatient || null,
    nom: p.nom || "",
    prenom: p.prenom || "",
    sexe: p.sexe || null,
    dateNaissance: p.dateNaissance || null,
    groupeSanguin: p.groupeSanguin || null,
    adresse: p.adresse || null,
    telephone: p.telephone || null,
    email: p.email || null,
    profession: p.profession || null,
    estActif: Boolean(p.estActif),
    dateEnregistrement: p.dateEnregistrement || null,
    contactUrgence: p.contactUrgence || null,
    contactUrgenceParsed: contact,
    idSociete: p.idSociete ?? null,
    numeroMatricule: p.numeroMatricule || null,
    statutClinique: p.statutClinique || "AMBULATOIRE",
    creePar: p.creePar ?? null,
    modifiePar: p.modifiePar ?? null,
    // Champs UI dérivés (rétrocompatibilité)
    id: p.codePatient || `PT-${p.idPatient}`,
    name: `${p.prenom || ""} ${p.nom || ""}`.trim(),
    age: calcAge(p.dateNaissance),
    gender: p.sexe === "F" ? "female" : "male",
    department: "General",
    lastVisit: p.dateEnregistrement ? String(p.dateEnregistrement).split("T")[0] : null,
    condition: p.estActif ? "stable" : "inactive",
    conditionLabel: p.estActif ? "Active" : "Inactive",
    conditionLabelFr: p.estActif ? "Actif" : "Inactif",
    insurance: p.idSociete ? String(p.idSociete) : "—",
    bloodType: p.groupeSanguin || "—",
    phone: p.telephone || "",
    address: p.adresse || "",
    primaryDoctor: "—",
    allergies: [],
    vitals: { bp: "—", hr: "—", temp: "—", o2: "—" },
    _backendId: p.idPatient,
  }
}

function parseContactUrgence(raw) {
  if (!raw) return null
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw
  } catch {
    return { nom: raw, telephone: null, relation: null }
  }
}

function mapPatientRdv(rdv) {
  return {
    id: rdv.idRdv,
    date: rdv.dateHeureRdv,
    motif: rdv.motifVisite || "—",
    canal: rdv.canal || "PHYSIQUE",
    statut: rdv.statutRdv || "PROGRAMME",
    duree: rdv.dureeEstimee,
    medecin: rdv.nomMedecin || "—",
    urlVisio: rdv.urlVisio || null,
  }
}

function mapPatientConsultation(c) {
  const medecinName = (c.nomMedecin || c.medecin || "").trim() || "—"
  const dateValue = c.dateConsultation || c.date || null
  return {
    id: c.idConsultation ?? c.id,
    dateConsultation: dateValue,
    date: dateValue,
    motif: c.motifVisite || c.motif || "—",
    diagnostic: c.diagnostic || "—",
    observations: c.observations || "",
    medecin: medecinName,
    nomMedecin: c.nomMedecin || medecinName,
    nomHopital: c.nomHopital || null,
    tension: c.tensionArterielle,
    frequence: c.frequenceCardiaque,
    temperature: c.temperature,
    poids: c.poids,
    taille: c.taille,
  }
}

function mapPatientAntecedent(a) {
  return {
    id: a.idAntecendent,
    type: a.typeAntecedent || "—",
    libelle: a.libelle || "—",
    description: a.description || "",
    critique: Boolean(a.est_critique ?? a.estCritique),
    statut: a.statut ? String(a.statut) : "—",
    date: a.dateDiagnostic || a.dateEnregistrement,
  }
}

function mapPatientDossier(data) {
  const p = data.patient || {}
  const base = mapPatient(p)
  const contact = parseContactUrgence(p.contactUrgence)
  const consultations = (data.consultations || []).map(mapPatientConsultation)
  const antecedents = (data.antecedents || []).map(mapPatientAntecedent)
  const latest = consultations[0] || null

  return {
    ...base,
    codePatient: p.codePatient,
    nom: p.nom,
    prenom: p.prenom,
    dateNaissance: p.dateNaissance,
    profession: p.profession || "",
    estActif: p.estActif !== false,
    statutClinique: p.statutClinique || "AMBULATOIRE",
    dateEnregistrement: p.dateEnregistrement,
    idSociete: p.idSociete,
    numeroMatricule: p.numeroMatricule || "",
    contactUrgence: contact,
    rendezVous: (data.rendezVous || []).map(mapPatientRdv),
    consultations,
    antecedents,
    vitals: latest
      ? {
          bp: latest.tension || "—",
          hr: latest.frequence != null ? String(latest.frequence) : "—",
          temp: latest.temperature != null ? `${latest.temperature}°C` : "—",
          o2: "—",
        }
      : base.vitals,
    history: consultations.map((c) => ({
      date: c.date,
      title: c.motif || "Consultation",
      titleFr: c.motif || "Consultation",
      note: c.observations || c.diagnostic || "",
      noteFr: c.observations || c.diagnostic || "",
    })),
    allergies: antecedents
      .filter((a) => a.type.toLowerCase().includes("allerg"))
      .map((a) => a.libelle),
    contacts: contact?.nom
      ? [
          {
            name: contact.nom,
            phone: contact.telephone || "—",
            relation: contact.relation || "—",
            relationFr: contact.relation || "—",
          },
        ]
      : [],
  }
}

function filterPatientsByHopital(list, hopitalId) {
  if (hopitalId == null) return []
  return list.filter((p) => p.idHopital != null && Number(p.idHopital) === Number(hopitalId))
}

function formatRelativeTime(value) {
  if (!value) return "—"
  const d = new Date(String(value).replace(" ", "T"))
  if (Number.isNaN(d.getTime())) return "—"
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} d ago`
  return d.toLocaleDateString()
}

function mapHospitalOverview(h) {
  return {
    id: h.id,
    name: h.name,
    country: h.country || "—",
    city: h.city || "—",
    plan: h.plan || "Starter",
    users: Number(h.users) || 0,
    status: h.status || "active",
    mrr: Number(h.mrr) || 0,
    specialty: h.specialty || "General",
    contact: h.contact || "—",
    email: h.email || "",
    phone: h.phone || "",
    joined: h.joined ? String(h.joined).split("T")[0] : "—",
    lastActive: formatRelativeTime(h.lastActive),
    _backendId: h.idHopital,
    estActif: h.estActif !== false,
  }
}

function mapHospitalDetail(h) {
  return {
    ...mapHospitalOverview(h),
    nomCommercial: h.nomCommercial || h.name || "",
    sousDomaine: h.sousDomaine || "",
    adresse: h.adresse || "",
    adresseComplete: h.adresseComplete || "",
    type: h.type || "CLINIQUE",
    estActif: h.estActif !== false,
    logoUrl: h.logoUrl || "",
    joinedAt: h.joined ? String(h.joined).split("T")[0] : "—",
    lastActiveRaw: h.lastActive || null,
  }
}

function hospitalDetailToForm(detail) {
  return {
    nom: detail.name || "",
    nomCommercial: detail.nomCommercial || detail.name || "",
    sousDomaine: detail.sousDomaine || "",
    type: detail.type || "CLINIQUE",
    estActif: detail.estActif !== false,
    adresse: detail.adresse || "",
    adresseComplete: detail.adresseComplete || "",
    ville: detail.city && detail.city !== "—" ? detail.city : "",
    pays: detail.country && detail.country !== "—" ? detail.country : "",
    telephone: detail.phone || "",
    email: detail.email || "",
    logoUrl: detail.logoUrl || "",
    plan: detail.plan || "Starter",
  }
}

function buildHospitalUpdatePayload(form) {
  return {
    nom: form.nom.trim(),
    nomCommercial: form.nomCommercial?.trim() || form.nom.trim(),
    sousDomaine: form.sousDomaine.trim().toLowerCase(),
    type: form.type || "CLINIQUE",
    estActif: form.estActif !== false,
    adresse: form.adresse?.trim() || null,
    adresseComplete: form.adresseComplete?.trim() || form.adresse?.trim() || null,
    ville: form.ville.trim(),
    pays: form.pays.trim(),
    telephone: form.telephone?.trim() || null,
    email: form.email.trim(),
    logoUrl: form.logoUrl?.trim() || null,
    planNom: form.plan || "Starter",
  }
}

function mapHospitalActivity(a) {
  const ts = a.timestamp ? String(a.timestamp).replace("T", " ").slice(0, 19) : "—"
  return {
    id: a.id,
    hospitalId: a.hospitalId,
    action: a.action,
    user: a.user,
    timestamp: ts,
    details: a.details,
  }
}

function mapHopital(h) {
  return {
    id: `T-${h.idHopital}`,
    name: h.nom,
    country: "—",
    city: h.adresse || "—",
    plan: "Enterprise",
    users: 0,
    status: h.estActif ? "active" : "suspended",
    mrr: 0,
    specialty: "Multi-specialty",
    contact: h.nom,
    email: h.email || "",
    phone: h.telephone || "",
    joined: h.dateCreation ? String(h.dateCreation).split("T")[0] : "—",
    lastActive: "—",
    _backendId: h.idHopital,
  }
}

function mapReceptionStats(stats) {
  return {
    todayAppointments: kpi(stats.rendezVousJour, stats.deltaRendezVousJour),
    waiting: kpi(stats.patientsEnAttente, stats.deltaPatientsEnAttente),
    checkedIn: kpi(stats.patientsEnregistres, stats.deltaPatientsEnregistres),
    registrations: kpi(stats.nouvellesInscriptions, stats.deltaNouvellesInscriptions),
  }
}

function mapAdmissionStatus(statut) {
  const s = String(statut || "").toUpperCase()
  if (s === "EN_ATTENTE") return "waiting"
  if (s === "ENREGISTRE" || s === "CONFIRME") return "checked-in"
  if (s === "PROGRAMME") return "scheduled"
  if (s === "EN_CONSULTATION" || s === "TERMINE") return "in-progress"
  return "waiting"
}

function formatQueueTime(value) {
  if (!value) return "—"
  const raw = String(value).replace(" ", "T")
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatRegistrationHour(hour) {
  const h = Number(hour)
  if (Number.isNaN(h)) return "—"
  if (h === 0) return "12a"
  if (h < 12) return `${h}a`
  if (h === 12) return "12p"
  return `${h - 12}p`
}

function mapAdmission(a) {
  return {
    id: a.idAdmission,
    patient: a.nomCompletPatient || a.nomPatient || "Patient",
    doctor: a.nomMedecin || "—",
    appt: formatQueueTime(a.tempsArrivee),
    status: mapAdmissionStatus(a.statut),
    waited: a.tempsAttenteMinutes != null ? `${a.tempsAttenteMinutes} min` : "—",
  }
}

function mapRegistrationPoint(point) {
  return {
    hour: formatRegistrationHour(point.hour),
    count: Number(point.count) || 0,
  }
}

export function resolveAppointmentError(err, t) {
  if (err?.status === 403) {
    return err?.message || t("appointments.patientNotInHospital")
  }
  if (err?.status === 409) {
    return err?.message || t("appointments.slotConflict")
  }
  return err?.message || t("appointments.createError")
}

/** Payload aligné sur la table rendez_vous01 (réception). */
export function buildRendezVous01Payload(formData, user) {
  const motifBase = formData.motifVisite?.trim() || formData.motif || ""
  const motif = formData.notes?.trim()
    ? (motifBase ? `${motifBase} — ${formData.notes.trim()}` : formData.notes.trim())
    : motifBase

  return {
    idPatient: Number(formData.patientId),
    idMedecin: Number(formData.doctorId),
    dateHeureRdv: `${formData.date}T${formData.time}:00`,
    dureeEstimee: Number(formData.duration) || 30,
    motifVisite: motif,
    canal: formData.canal || "PHYSIQUE",
    statutRdv: formData.statutRdv || "PROGRAMME",
    inscrireFileAttente: formData.inscrireFileAttente !== false,
  }
}

function mapRendezVous01(rdv) {
  return {
    idRdv: rdv.idRdv,
    idHopital: rdv.idHopital,
    idPatient: rdv.idPatient,
    idMedecin: rdv.idMedecin,
    dateHeureRdv: rdv.dateHeureRdv,
    dureeEstimee: rdv.dureeEstimee,
    motifVisite: rdv.motifVisite,
    canal: rdv.canal,
    statutRdv: rdv.statutRdv,
    urlVisio: rdv.urlVisio,
    dateCreation: rdv.dateCreation,
    creePar: rdv.creePar,
    nomPatient: rdv.nomPatient,
    nomMedecin: rdv.nomMedecin,
    ...mapDoctorAppointmentListItem(rdv),
  }
}

export const dashboardService = {
  getKpis: () =>
    withLiveApi(async () => {
      const data = await http.get("/dashboard")
      const stats = data.statistiques || {}
      return {
        totalPatients: kpi(stats.totalPatients || stats.nombrePatients || 0),
        activeConsultations: kpi(stats.consultationsActives || 0),
        revenueMtd: kpi(stats.revenuMensuel || 0),
        occupancy: kpi(stats.tauxOccupation || 0),
      }
    }, kpis),
  getRevenueSeries: () => mockResolve(revenueSeries),
  getPatientFlow: () => mockResolve(patientFlow),
  getDepartmentLoad: () => mockResolve(departmentLoad),
  getEmergencyAlerts: () => mockResolve(emergencyAlerts),
  getAiInsights: () => mockResolve(aiInsights),
  getActivityTimeline: () => mockResolve(activityTimeline),
}

function formatMonthLabel(month, year, lang) {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { month: "short" }).format(
    new Date(year, month - 1, 1),
  )
}

function mapHospitalAdminDashboard(data, lang = "fr") {
  const kpis = data.kpis || {}
  return {
    hospitalName: data.hospitalName || "",
    kpis: {
      totalPatients: kpi(kpis.totalPatients, kpis.deltaTotalPatients),
      activeConsultations: kpi(kpis.activeConsultations, kpis.deltaActiveConsultations),
      revenueMtd: kpi(kpis.revenueMtd, kpis.deltaRevenueMtd),
      occupancy: kpi(kpis.occupancy, kpis.deltaOccupancy),
    },
    revenueSeries: (data.revenueSeries || []).map((p) => ({
      month: formatMonthLabel(p.month, p.year, lang),
      inpatient: Number(p.inpatient) / 1000,
      outpatient: Number(p.outpatient) / 1000,
      tele: Number(p.tele) / 1000,
    })),
    patientFlow: (data.patientFlow || []).map((p) => ({
      dayKey: p.dayKey,
      day: p.dayKey,
      admissions: Number(p.admissions) || 0,
      discharges: Number(p.discharges) || 0,
    })),
    departmentLoad: data.departmentLoad || [],
    emergencyAlerts: data.emergencyAlerts || [],
    aiInsights: data.aiInsights || [],
    activityTimeline: data.activityTimeline || [],
  }
}

export const hospitalAdminDashboardService = {
  getDashboard: (lang = "fr") =>
    liveApiOnly(async () => {
      const data = await http.get("/tenant-admin/dashboard")
      return mapHospitalAdminDashboard(data, lang)
    }),
}

function mapTenantReportsOverview(data) {
  return {
    hopitalId: data.hopitalId != null ? Number(data.hopitalId) : null,
    hospitalName: data.hospitalName || "",
    dateFrom: data.dateFrom || "",
    dateTo: data.dateTo || "",
    totalPatients: Number(data.totalPatients) || 0,
    totalAppointments: Number(data.totalAppointments) || 0,
    totalRevenue: Number(data.totalRevenue) || 0,
    totalInvoices: Number(data.totalInvoices) || 0,
    monthlyAppointments: (data.monthlyAppointments || []).map((p) => ({
      name: p.name,
      month: p.month,
      year: p.year,
      total: Number(p.total) || 0,
      consultation: Number(p.consultation) || 0,
      followUp: Number(p.followUp) || 0,
    })),
    revenueSeries: (data.revenueSeries || []).map((p) => ({
      name: p.name,
      month: p.month,
      year: p.year,
      revenue: Number(p.revenue) || 0,
    })),
    patientDemographics: (data.patientDemographics || []).map((d) => ({
      name: d.name,
      nameFr: d.nameFr,
      value: Number(d.value) || 0,
      color: d.color ? `#${String(d.color).replace("#", "")}` : undefined,
    })),
  }
}

export const reportsService = {
  getOverview: ({ from, to } = {}) =>
    liveApiOnly(async () => {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      const query = params.toString()
      const data = await http.get(`/tenant-admin/reports/overview${query ? `?${query}` : ""}`)
      return mapTenantReportsOverview(data)
    }),
}

function mapLaboratoryOverview(data) {
  const kpis = data.kpis || {}
  return {
    kpis: {
      total: Number(kpis.total) || 0,
      pending: Number(kpis.pending) || 0,
      inProgress: Number(kpis.inProgress) || 0,
      completed: Number(kpis.completed) || 0,
    },
    tests: (data.tests || []).map((t) => ({
      id: t.id,
      idAnalyse: t.idAnalyse,
      patient: t.patient || "—",
      testName: t.testName || "—",
      date: t.date || null,
      status: t.status || "pending",
      collectedBy: t.collectedBy || "—",
      processedBy: t.processedBy || "",
    })),
  }
}

export const laboratoryService = {
  getOverview: () =>
    liveApiOnly(async () => {
      const data = await http.get("/tenant-admin/laboratory/overview")
      return mapLaboratoryOverview(data)
    }),
}

function mapBillingOverview(data) {
  const kpis = data.kpis || {}
  return {
    hopitalId: data.hopitalId != null ? Number(data.hopitalId) : null,
    hospitalName: data.hospitalName || "",
    kpis: {
      totalRevenueYtd: Number(kpis.totalRevenueYtd) || 0,
      totalPaid: Number(kpis.totalPaid) || 0,
      outstanding: Number(kpis.outstanding) || 0,
      overdue: Number(kpis.overdue) || 0,
      invoiceCount: Number(kpis.invoiceCount) || 0,
    },
    invoices: (data.invoices || []).map((inv) => ({
      id: inv.numeroFacture,
      idFacture: inv.idFacture,
      numeroFacture: inv.numeroFacture,
      patient: inv.patient || "—",
      date: inv.dateFacture || null,
      amount: Number(inv.montantTtc) || 0,
      montantHt: Number(inv.montantHt) || 0,
      tva: Number(inv.tva) || 0,
      montantTtc: Number(inv.montantTtc) || 0,
      status: inv.uiStatus || "pending",
      statutPaiement: inv.statutPaiement,
      service: inv.service || "—",
    })),
    revenueSeries: (data.revenueSeries || []).map((p) => ({
      name: p.label,
      label: p.label,
      month: p.month,
      year: p.year,
      revenue: Number(p.revenue) || 0,
    })),
  }
}

export const billingService = {
  getOverview: () =>
    liveApiOnly(async () => {
      const data = await http.get("/tenant-admin/billing/overview")
      const mapped = mapBillingOverview(data)
      const hopitalId = getHopitalId()
      if (hopitalId != null && mapped.hopitalId != null && mapped.hopitalId !== hopitalId) {
        throw new Error("Tenant mismatch — données d'un autre établissement")
      }
      return mapped
    }),
}

function mapPharmacyStatutKey(statut) {
  return String(statut || "DISPONIBLE").toLowerCase()
}

function mapPharmacieMedicament(m) {
  const statutKey = mapPharmacyStatutKey(m.statut)
  return {
    id: m.id,
    hopitalId: m.hopitalId,
    nomMedicament: m.nomMedicament || "",
    nomGenerique: m.nomGenerique || "",
    categorie: m.categorie || "",
    dosage: m.dosage || "",
    forme: m.forme || "",
    unite: m.unite || "",
    quantiteStock: Number(m.quantiteStock) || 0,
    stockMinimum: Number(m.stockMinimum) || 0,
    prixAchat: m.prixAchat != null ? Number(m.prixAchat) : null,
    prixVente: m.prixVente != null ? Number(m.prixVente) : null,
    numeroLot: m.numeroLot || "",
    dateExpiration: m.dateExpiration || null,
    fournisseur: m.fournisseur || "",
    statut: m.statut || "DISPONIBLE",
    statutKey,
    dateCreation: m.dateCreation || null,
    displayId: m.id != null ? `MED-${String(m.id).padStart(4, "0")}` : "—",
  }
}

function buildCreateMedicamentPayload(form) {
  const payload = {
    nomMedicament: form.nomMedicament?.trim(),
    nomGenerique: form.nomGenerique?.trim() || null,
    categorie: form.categorie?.trim() || null,
    dosage: form.dosage?.trim() || null,
    forme: form.forme || null,
    unite: form.unite || null,
    quantiteStock: Number(form.quantiteStock) || 0,
    stockMinimum: Number(form.stockMinimum) || 0,
    numeroLot: form.numeroLot?.trim() || null,
    dateExpiration: form.dateExpiration || null,
    fournisseur: form.fournisseur?.trim() || null,
  }
  if (form.prixAchat !== "" && form.prixAchat != null) {
    payload.prixAchat = Number(form.prixAchat)
  }
  if (form.prixVente !== "" && form.prixVente != null) {
    payload.prixVente = Number(form.prixVente)
  }
  return payload
}

export const pharmacyService = {
  listMedicaments: () =>
    liveApiOnly(async () => {
      const list = await http.get("/tenant-admin/pharmacy/medicaments")
      return (list || []).map(mapPharmacieMedicament)
    }),
  getStockAlerts: () =>
    liveApiOnly(async () => {
      const list = await http.get("/tenant-admin/pharmacy/alerts")
      return (list || []).map(mapPharmacieStockAlert)
    }),
  createMedicament: (form) =>
    liveApiOnly(async () => {
      const created = await http.post("/tenant-admin/pharmacy/medicaments", buildCreateMedicamentPayload(form))
      return mapPharmacieMedicament(created)
    }),
  dispense: (payload) =>
    liveApiOnly(async () => {
      return http.post("/tenant-admin/pharmacy/dispense", payload)
    }),
}

export const tariffService = {
  list: () =>
    liveApiOnly(async () => {
      const list = await http.get("/tenant-admin/tariffs")
      return (list || []).map((row) => ({
        idTarif: row.idTarif,
        idHopital: row.idHopital,
        code: row.code,
        libelle: row.libelle,
        categorie: row.categorie,
        prixUnitaire: Number(row.prixUnitaire) || 0,
        actif: row.actif !== false,
      }))
    }),
  upsert: (tarif) =>
    liveApiOnly(async () => {
      return http.put("/tenant-admin/tariffs", tarif)
    }),
}

function mapPharmacieStockAlert(a) {
  const typeKey = String(a.typeAlerte || "").toLowerCase()
  return {
    id: a.id,
    medicamentId: a.medicamentId,
    nomMedicament: a.nomMedicament || "",
    typeAlerte: a.typeAlerte || "",
    typeKey,
    quantiteStock: Number(a.quantiteStock) || 0,
    stockMinimum: Number(a.stockMinimum) || 0,
    level: a.level || "warning",
    message: a.message || "",
    messageFr: a.messageFr || a.message || "",
    dateCreation: a.dateCreation || null,
  }
}

export const patientService = {
  getAll: () =>
    liveApiOnly(async () => {
      const list = await http.get("/patients")
      return (list || []).map(mapPatient)
    }),
  /** Patients de l'hôpital connecté — tous par défaut, filtre optionnel mine=true. */
  getByHopital: (hopitalId, { mine } = {}) =>
    liveApiOnly(async () => {
      const qs = mine ? "?mine=true" : ""
      const list = await http.get(`/patients${qs}`)
      return filterPatientsByHopital((list || []).map(mapPatient), hopitalId)
    }),
  /** Liste patients selon le rôle : médecin → tous les patients de l'établissement (filtre mine = attribués). */
  listAccessible: (hopitalId, { roleKey, mine } = {}) =>
    liveApiOnly(async () => {
      if (roleKey === ROLE_KEYS.DOCTOR) {
        const qs = mine ? "?mine=true" : ""
        const list = await http.get(`/medecins/patients${qs}`)
        return (list || []).map(mapPatient)
      }
      const qs = mine ? "?mine=true" : ""
      const list = await http.get(`/patients${qs}`)
      return filterPatientsByHopital((list || []).map(mapPatient), hopitalId)
    }),
  getById: (id) =>
    liveApiOnly(async () => {
      const raw = await http.get(`/patients/${id}`)
      return mapPatientDossier({ patient: raw, rendezVous: [], consultations: [], antecedents: [] })
    }),
  getDossier: (id) => liveApiOnly(() => http.get(`/patients/${id}/dossier`).then(mapPatientDossier)),
  downloadDossierPdf: (id) =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob(`/patients/${id}/dossier/pdf`)
      openPdfBlob(blob, `dossier_patient_${id}.pdf`)
    }),
  downloadListReportPdf: ({ mine } = {}) =>
    liveApiOnly(async () => {
      const qs = mine ? "?mine=true" : ""
      const blob = await fetchPdfBlob(`/patients/rapport/pdf${qs}`)
      openPdfBlob(blob, "rapport_patients.pdf")
    }),
  create: (payload) => liveApiOnly(() => http.post("/patients", payload)),
}

export const dischargeService = {
  getContexte: (patientId) => liveApiOnly(() => http.get(`/v1/sortie/patient/${patientId}/contexte`)),
  autoriser: (payload) => liveApiOnly(() => http.post("/v1/sortie/autoriser", payload)),
  listPretes: () => liveApiOnly(() => http.get("/v1/sortie/pretes").then((list) => (list || []).map(mapPretSortie))),
  delivrer: (idBonSortie, paiementConfirme = true) =>
    liveApiOnly(() =>
      http.post(`/v1/sortie/${idBonSortie}/delivrer`, { paiementConfirme }).then(mapPretSortie),
    ),
  downloadBulletin: (idBonSortie) =>
    liveApiOnly(async () => {
      const token = getToken()
      const hopitalId = getHopitalId()
      const headers = {}
      if (token) headers.Authorization = `Bearer ${token}`
      if (hopitalId != null) headers["X-Hopital-Id"] = String(hopitalId)
      const response = await fetch(`${API_BASE_URL}/v1/discharge-notes/${idBonSortie}/bulletin`, { headers })
      if (!response.ok) throw new Error("Impossible de générer le bulletin de sortie.")
      return response.blob()
    }),
}

const PLAN_COLORS = {
  Enterprise: "var(--color-chart-1)",
  Growth: "var(--color-chart-2)",
  Starter: "var(--color-chart-3)",
}

const SUBSCRIPTION_PLAN_I18N = {
  Enterprise: {
    nameFr: "Entreprise",
    featuresFr: [
      "Utilisateurs illimités",
      "Support multi-sites",
      "Analyses avancées",
      "Support prioritaire",
      "Accès API",
      "Intégrations personnalisées",
    ],
  },
  Growth: {
    nameFr: "Croissance",
    featuresFr: [
      "Jusqu'à 300 utilisateurs",
      "Site unique",
      "Analyses de base",
      "Support email",
      "API standard",
    ],
  },
  Starter: {
    nameFr: "Démarrage",
    featuresFr: [
      "Jusqu'à 100 utilisateurs",
      "Fonctionnalités de base",
      "Analyses limitées",
      "Support communautaire",
    ],
  },
}

function mapSubscriptionPlan(plan) {
  const i18n = SUBSCRIPTION_PLAN_I18N[plan.name] || {}
  return {
    id: `P-${(plan.name || "Starter").toUpperCase()}`,
    name: plan.name || "Starter",
    nameFr: i18n.nameFr || plan.name || "Starter",
    price: Number(plan.price) || 0,
    popular: Boolean(plan.popular),
    subscribers: Number(plan.subscribers) || 0,
    features: plan.features || [],
    featuresFr: i18n.featuresFr || plan.features || [],
  }
}

function mapAuditKpis(data) {
  const metric = (m) => ({
    value: Number(m?.value) || 0,
    delta: Number(m?.delta) || 0,
  })
  return {
    totalEvents: metric(data?.totalEvents),
    securityAlerts: metric(data?.securityAlerts),
    dataChanges: metric(data?.dataChanges),
    complianceScore: metric(data?.complianceScore),
    openTickets: metric(data?.openTickets),
  }
}

function buildAuditQuery(filters = {}) {
  const params = new URLSearchParams()
  const entries = {
    hopitalId: filters.hopitalId,
    userId: filters.userId,
    userEmail: filters.userEmail,
    module: filters.module,
    action: filters.action,
    status: filters.status,
    requestId: filters.requestId,
    endpoint: filters.endpoint,
    search: filters.search,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: filters.limit,
  }
  Object.entries(entries).forEach(([key, value]) => {
    if (value != null && value !== "" && value !== "all") {
      params.append(key, String(value))
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function formatAuditTimestamp(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function mapTechnicalLog(log) {
  const status = (log?.status || "INFO").toUpperCase()
  return {
    id: log?.id != null ? `LOG-${log.id}` : "—",
    rawId: log?.id,
    hopitalId: log?.hopitalId,
    hopitalNom: log?.hopitalNom || "—",
    userId: log?.userId,
    user: log?.userEmail || "—",
    userEmail: log?.userEmail,
    role: log?.userRole || "—",
    module: log?.module || "—",
    action: log?.action || "—",
    endpoint: log?.endpoint || "—",
    httpMethod: log?.httpMethod || "",
    status,
    message: log?.message || "",
    errorDetails: log?.errorDetails,
    requestId: log?.requestId || "—",
    ip: log?.ipAddress || "—",
    timestamp: formatAuditTimestamp(log?.createdAt),
    severity: status === "ERROR" ? "critical" : status === "WARNING" ? "warning" : "info",
    eventStatus: status === "ERROR" ? "failed" : "success",
  }
}

function mapSupportTicket(ticket) {
  return {
    id: ticket?.id,
    hopitalId: ticket?.hopitalId,
    hopitalNom: ticket?.hopitalNom || "—",
    subject: ticket?.subject || "",
    description: ticket?.description || "",
    module: ticket?.module || "—",
    priority: ticket?.priority || "MEDIUM",
    status: ticket?.status || "OPEN",
    requestId: ticket?.requestId || "—",
    createdByEmail: ticket?.createdByEmail || "—",
    createdByRole: ticket?.createdByRole || "—",
    assignedTo: ticket?.assignedTo,
    resolutionNotes: ticket?.resolutionNotes,
    createdAt: formatAuditTimestamp(ticket?.createdAt),
    updatedAt: formatAuditTimestamp(ticket?.updatedAt),
  }
}

function buildSupportTicketQuery(filters = {}) {
  const params = new URLSearchParams()
  const entries = {
    hopitalId: filters.hopitalId,
    status: filters.status,
    module: filters.module,
    priority: filters.priority,
    requestId: filters.requestId,
    search: filters.search,
    limit: filters.limit,
  }
  Object.entries(entries).forEach(([key, value]) => {
    if (value != null && value !== "" && value !== "all") {
      params.append(key, String(value))
    }
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function mapSubscriptionKpis(data) {
  const metric = (m) => ({
    value: Number(m?.value) || 0,
    delta: Number(m?.delta) || 0,
  })
  return {
    activeSubscriptions: metric(data?.activeSubscriptions),
    mrr: metric(data?.mrr),
    arpu: metric(data?.arpu),
    churnRate: metric(data?.churnRate),
  }
}

function mapSubscriptionInvoice(invoice) {
  return {
    id: invoice.id || "",
    tenant: invoice.tenant || "",
    plan: invoice.plan || "Starter",
    amount: Number(invoice.amount) || 0,
    status: invoice.status || "pending",
    date: invoice.date || "",
    dueDate: invoice.dueDate || "",
  }
}

function mapSubscriptionTimelineEvent(event) {
  return {
    id: Number(event.id) || 0,
    tenant: event.tenant || "",
    action: event.action || "renewed",
    plan: event.plan || "Starter",
    date: event.date || "",
    amount: Number(event.amount) || 0,
  }
}

export const superAdminService = {
  getKpis: () =>
    withLiveApi(async () => {
      const stats = await http.get("/dashboard/stats")
      return {
        hospitals: kpi(stats.hopitauxActifs, stats.pourcentageCroissanceHopitaux),
        activeUsers: kpi(stats.utilisateursActifs, stats.pourcentageCroissanceUtilisateurs),
        mrr: kpi(stats.mrr, stats.pourcentageCroissanceMrr),
        growth: kpi(stats.croissanceSaaS, stats.pourcentageCroissanceMrr),
        mrrGrowth: stats.pourcentageCroissanceMrr ?? 0,
      }
    }, superAdminKpis),
  getMrrSeries: () =>
    withLiveApi(async () => {
      const list = await http.get("/dashboard/mrr-series?months=6")
      return (list || []).map((p) => ({
        month: p.month,
        mrr: Math.round((Number(p.mrr) || 0) / 1000),
      }))
    }, mrrSeries),
  getPlanDistribution: () =>
    withLiveApi(async () => {
      const list = await http.get("/dashboard/plan-distribution")
      return (list || []).map((p) => ({
        name: p.name,
        value: Number(p.value) || 0,
        color: PLAN_COLORS[p.name] || "var(--color-chart-4)",
      }))
    }, planDistribution),
  getTenants: () =>
    withLiveApi(async () => {
      const list = await http.get("/dashboard/tenants")
      return (list || []).map((t) => ({
        id: t.id,
        name: t.name,
        country: t.country,
        plan: t.plan,
        users: Number(t.users) || 0,
        mrr: Number(t.mrr) || 0,
        status: t.status || "active",
      }))
    }, tenants),
}

export const appointmentService = {
  getAll: ({ mine } = {}) =>
    liveApiOnly(() => {
      const qs = mine ? "?mine=true" : ""
      return http.get(`/rendezvous${qs}`).then((list) => (list || []).map(mapRendezVous01))
    }),
  create: (payload) => liveApiOnly(() => http.post("/rendezvous", payload)),
}

export const doctorService = {
  getDashboard: () =>
    liveApiOnly(async () => {
      const data = await http.get("/dashboard/medecin")
      const schedule = (data.rendezVousDuJour || []).map(mapDoctorAppointment)
      const queue = (data.filePatients || []).map(mapDoctorQueueItem)
      const activeConsults = (data.consultationsActives || []).map(mapDoctorActiveConsult)
      const pendingNotes = (data.notesEnAttente || []).map(mapDoctorPendingNote)

      return {
        kpis: {
          todayAppointments: kpi(schedule.length),
          patientQueue: kpi(queue.length),
          activeConsults: kpi(activeConsults.length),
          pendingNotes: kpi(pendingNotes.length),
        },
        schedule,
        queue,
        activeConsults,
        pendingNotes,
      }
    }),
  downloadDashboardPdf: () =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob("/dashboard/medecin/pdf")
      openPdfBlob(blob, "tableau_bord_medecin.pdf")
    }),
  getKpis: () => doctorService.getDashboard().then((d) => d.kpis),
  getSchedule: () => doctorService.getDashboard().then((d) => d.schedule),
  getQueue: () => doctorService.getDashboard().then((d) => d.queue),
  getLiveQueue: () =>
    liveApiOnly(async () => {
      const list = await http.get("/medecin/file-attente")
      return (list || []).map(mapDoctorQueueItem)
    }),
  callPatient: (item) =>
    liveApiOnly(async () => {
      if (item?.idAdmission) {
        return http.post(`/medecin/file-attente/${item.idAdmission}/appeler`)
      }
      if (item?.idRendezVous) {
        return http.post(`/medecin/file-attente/rdv/${item.idRendezVous}/appeler`)
      }
      throw new Error("Aucun patient sélectionné")
    }),
  startConsultation: (idAdmission) =>
    liveApiOnly(() => http.post(`/medecin/file-attente/${idAdmission}/commencer`)),
  getAppointments: (_opts = {}) =>
    liveApiOnly(async () => {
      const list = await http.get("/rendezvous/medecin/historique")
      return (list || []).map(mapDoctorAppointmentListItem)
    }),
  completeAppointment: (idRdv) =>
    liveApiOnly(() => http.patch(`/rendezvous/${idRdv}/terminer`)),
  createAppointment: (payload) => appointmentService.create(payload),
}

export const medecinLabService = {
  list: () =>
    liveApiOnly(async () => {
      const list = await http.get("/medecin/laboratoire/demandes")
      return (list || []).map(mapMedecinLabRequest)
    }),
  create: (payload) =>
    liveApiOnly(async () => {
      const created = await http.post("/medecin/laboratoire/demandes", payload)
      return mapMedecinLabRequest(created)
    }),
}

export const labTechService = {
  listAnalyses: () =>
    liveApiOnly(async () => {
      const list = await http.get("/v1/lab/analyses")
      return (list || []).map(mapMedecinLabRequest)
    }),
  submitResult: (idAnalyse, payload) =>
    liveApiOnly(async () => {
      const updated = await http.put(`/v1/lab/analyses/${idAnalyse}/resultat`, payload)
      return mapMedecinLabRequest(updated)
    }),
}

function mapMedecinLabRequest(item) {
  return {
    id: item.id || (item.idAnalyse ? `LAB-${String(item.idAnalyse).padStart(4, "0")}` : "—"),
    idAnalyse: item.idAnalyse ?? null,
    patientName: item.patientName || "—",
    patientId: item.patientId || "—",
    numericPatientId: item.idPatient ?? null,
    idConsultation: item.idConsultation ?? null,
    testName: item.testName || "—",
    requestedBy: item.requestedBy || "—",
    date: item.date || new Date().toISOString(),
    status: item.status || "Pending",
    priority: item.priority || "Routine",
    notes: item.notes || item.observationsMedecin || "",
    observationsMedecin: item.observationsMedecin || item.notes || "",
    fastingRequired: Boolean(item.fastingRequired),
    resultatTexte: item.resultatTexte || "",
    interpretation: item.interpretation || "",
    valeursReference: item.valeursReference || "",
  }
}

export const ordonnanceService = {
  create: (payload) => liveApiOnly(() => http.post("/ordonnances", payload)),
  listByPatient: (idPatient) => liveApiOnly(() => http.get(`/ordonnances/patient/${idPatient}`)),
  getById: (id) => liveApiOnly(() => http.get(`/ordonnances/${id}`)),
  openPdf: async (idOrdonnance) => {
    const blob = await fetchPdfBlob(`/ordonnances/${idOrdonnance}/pdf`)
    openPdfBlob(blob, `ordonnance_${idOrdonnance}.pdf`)
  },
}

export const medecinService = {
  getAll: () => liveApiOnly(() => http.get("/medecins")),
  /** Patients de l'établissement pour le médecin connecté (mine=true → patients attribués). */
  getMyPatients: ({ mine } = {}) =>
    liveApiOnly(async () => {
      const qs = mine ? "?mine=true" : ""
      const list = await http.get(`/medecins/patients${qs}`)
      return (list || []).map(mapPatient)
    }),
}

export const consultationService = {
  create: (payload) => liveApiOnly(() => http.post("/consultations", payload)),
  getById: (idConsultation) =>
    liveApiOnly(() => http.get(`/consultations/${idConsultation}`)),
  openFicheByRdv: (idRdv) =>
    liveApiOnly(() => http.post(`/consultations/rendezvous/${idRdv}/fiche`)),
  getByRdv: (idRdv) =>
    liveApiOnly(() => http.get(`/consultations/rendezvous/${idRdv}`)),
  saveFiche: (idConsultation, payload) =>
    liveApiOnly(() => http.put(`/consultations/${idConsultation}/fiche`, payload)),
  getMedecinHistorique: () =>
    liveApiOnly(() => http.get("/consultations/medecin/historique")),
  downloadFichePdf: (idConsultation) =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob(`/consultations/${idConsultation}/pdf`)
      openPdfBlob(blob, `fiche_consultation_${idConsultation}.pdf`)
    }),
  signer: (idConsultation, payload) =>
    liveApiOnly(() => http.post(`/medecin/consultations/${idConsultation}/signer`, payload)),
}

export const workspaceService = {
  getData: () =>
    liveApiOnly(async () => {
      const data = await http.get("/workspace/medecin")
      const agenda = (data.agendaDuJour || []).map(mapWorkspaceAgendaItem)
      return {
        stats: {
          appointmentsToday: Number(data.rendezVousAujourdhui) || agenda.length,
          pendingLabResults: Number(data.resultatsLaboEnAttente) || 0,
          unreadMessages: Number(data.messagesNonLus) || 0,
        },
        agenda,
        recentActivity: (data.activitesRecentes || []).map(mapWorkspaceActivity),
      }
    }),
}

function mapDoctorAppointment(rdv) {
  const dateTime = rdv.dateHeureRdv ? new Date(rdv.dateHeureRdv) : null
  const valid = dateTime && !Number.isNaN(dateTime.getTime())
  const today = new Date()
  const isToday =
    valid &&
    dateTime.getFullYear() === today.getFullYear() &&
    dateTime.getMonth() === today.getMonth() &&
    dateTime.getDate() === today.getDate()
  const dateLabel = valid
    ? isToday
      ? null
      : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(dateTime)
    : null

  return {
    id: rdv.idRdv,
    time: formatDoctorTime(rdv.dateHeureRdv),
    dateLabel,
    dateHeureRdv: rdv.dateHeureRdv || null,
    patient: rdv.nomPatient || "—",
    reason: rdv.motifVisite || "—",
    status: mapDoctorRdvStatus(rdv.statutRdv, rdv.dateHeureRdv, rdv.dureeEstimee),
    canal: rdv.canal || "PHYSIQUE",
    duration: rdv.dureeEstimee,
  }
}

function mapDoctorAppointmentListItem(rdv) {
  const dateTime = rdv.dateHeureRdv ? new Date(rdv.dateHeureRdv) : null
  const date = dateTime && !Number.isNaN(dateTime.getTime())
    ? dateTime.toISOString().split("T")[0]
    : "—"

  return {
    id: rdv.idRdv,
    date,
    dateHeureRdv: rdv.dateHeureRdv || null,
    time: formatDoctorTime(rdv.dateHeureRdv),
    patient: rdv.nomPatient || "—",
    patientId: rdv.idPatient ? `PT-${rdv.idPatient}` : "—",
    reason: rdv.motifVisite || "—",
    specialty: "—",
    mode: rdv.canal === "TELECONSULTATION" ? "Teleconsultation" : "In-person",
    canal: rdv.canal || "PHYSIQUE",
    statutRdv: rdv.statutRdv || "",
    status: mapDoctorRdvStatusForList(rdv.statutRdv, rdv.dateHeureRdv, rdv.dureeEstimee),
    duration: rdv.dureeEstimee ? `${rdv.dureeEstimee} min` : "—",
    room: rdv.sallePhysique || (rdv.canal === "TELECONSULTATION" ? "Téléconsultation" : "—"),
  }
}

function mapDoctorQueueItem(item) {
  const statut = item.statut || "EN_ATTENTE"
  return {
    id: item.idAdmission || item.id || item.idRendezVous,
    idAdmission: item.idAdmission ?? null,
    idRendezVous: item.idRendezVous ?? null,
    idPatient: item.idPatient ?? null,
    patient: item.patientName || item.patient || "—",
    waited: item.waited || "—",
    priority: item.priority || "normal",
    room: item.salle || item.room || "—",
    numeroPassage: item.numeroPassage ?? null,
    statut,
    canCall: item.canCall ?? ["EN_ATTENTE", "ENREGISTRE", "APPELE"].includes(statut),
    canStart: item.canStart ?? statut === "APPELE",
  }
}

function mapDoctorActiveConsult(item) {
  return {
    id: item.id,
    patient: item.patientName,
    motif: item.motif || "—",
    canal: item.canal || "PHYSIQUE",
    startedAt: formatDoctorTime(item.startedAt),
  }
}

function mapDoctorPendingNote(item) {
  return {
    id: item.id,
    patient: item.patientName,
    motif: item.motif || "—",
    consultationDate: formatDoctorTime(item.consultationDate),
  }
}

function mapWorkspaceAgendaItem(rdv) {
  const statut = (rdv.statutRdv || "").toUpperCase()
  let statusKey = "pending"
  if (statut === "CONFIRME") statusKey = "confirmed"
  else if (statut === "VALIDE") statusKey = "arrived"

  const canal = (rdv.canal || "").toUpperCase()
  let typeKey = "followup"
  if (canal === "TELECONSULTATION") typeKey = "teleconsultation"
  else if ((rdv.motifVisite || "").toLowerCase().includes("bilan")) typeKey = "checkup"
  else if ((rdv.motifVisite || "").toLowerCase().includes("initial")) typeKey = "newPatient"

  return {
    id: rdv.idRdv,
    time: formatDoctorTime(rdv.dateHeureRdv),
    patientName: rdv.nomPatient || "—",
    motif: rdv.motifVisite || "—",
    typeKey,
    statusKey,
    canal: rdv.canal || "PHYSIQUE",
  }
}

function mapWorkspaceActivity(item) {
  return {
    id: item.id,
    type: item.type || "NOTIFICATION",
    patient: item.patientName || null,
    detail: item.detail || "—",
    time: formatDoctorTime(item.occurredAt),
  }
}

function mapDoctorRdvStatus(statut, dateHeure, dureeEstimee) {
  const normalized = (statut || "").toUpperCase()
  if (normalized === "VALIDE") return "completed"
  if (normalized === "ANNULE" || normalized === "ABSENT") return "ended"
  return mapDoctorRdvStatusForList(statut, dateHeure, dureeEstimee)
}

function parseDurationMinutes(value) {
  if (value == null) return 30
  if (typeof value === "number" && !Number.isNaN(value)) return value
  const match = String(value).match(/(\d+)/)
  return match ? Number(match[1]) : 30
}

function mapDoctorRdvStatusForList(statut, dateHeure, dureeEstimee) {
  const normalized = (statut || "").toUpperCase()
  if (normalized === "VALIDE") return "completed"
  if (normalized === "ANNULE" || normalized === "ABSENT") return "cancelled"

  const start = dateHeure ? new Date(dateHeure) : null
  if (!start || Number.isNaN(start.getTime())) return "upcoming"

  const durationMin = parseDurationMinutes(dureeEstimee)
  const endMs = start.getTime() + durationMin * 60_000
  const now = Date.now()

  if (endMs < now) return "past"
  if (start.getTime() <= now && now <= endMs) return "in-progress"
  return "upcoming"
}

function formatDoctorTime(value) {
  if (!value) return "—"
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date)
  } catch {
    return String(value)
  }
}

function mapPatientAppointmentCard(rdv) {
  const dateTime = rdv.dateHeureRdv || rdv.date || null
  const dt = dateTime ? new Date(String(dateTime).replace(" ", "T")) : null
  const validDate = dt && !Number.isNaN(dt.getTime())
  const isTele = (rdv.canal || "").toUpperCase() === "TELECONSULTATION"
  const statut = rdv.statutRdv || rdv.statut || "PROGRAMME"

  return {
    id: rdv.idRdv ?? rdv.id,
    idRdv: rdv.idRdv ?? rdv.id,
    dateHeureRdv: dateTime,
    date: validDate ? dt.toLocaleDateString("fr-FR") : "—",
    dateIso: validDate ? dt.toISOString().split("T")[0] : null,
    dateLabel: validDate
      ? dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
      : "—",
    monthKey: validDate ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}` : "unknown",
    monthLabel: validDate
      ? dt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : "—",
    time: formatDoctorTime(dateTime),
    doctor: rdv.nomMedecin || rdv.medecin || "—",
    reason: rdv.motifVisite || rdv.motif || "—",
    specialty: rdv.motifVisite || rdv.motif || "—",
    mode: isTele ? "Teleconsultation" : "In-person",
    isTele,
    canal: rdv.canal || "PHYSIQUE",
    statutRdv: statut,
    status: mapDoctorRdvStatusForList(statut, dateTime, rdv.dureeEstimee || rdv.duree),
    duration: rdv.dureeEstimee || rdv.duree ? `${rdv.dureeEstimee || rdv.duree} min` : "30 min",
    urlVisio: rdv.urlVisio || null,
  }
}

export const patientPortalService = {
  getKpis: () =>
    withLiveApi(async () => {
      const data = await http.get("/v1/patients/me/dashboard")
      const stats = data.stats || {}
      return {
        upcoming: kpi(stats.rendezVousCount ?? stats.upcomingAppointments ?? stats.rendezVousAVenir ?? 0),
        prescriptions: kpi(stats.ordonnancesCount ?? stats.activePrescriptions ?? stats.ordonnancesActives ?? 0),
        reports: kpi(stats.rapportsCount ?? stats.labResults ?? stats.resultatsLabo ?? 0),
        balance: kpi(stats.soldeA_Regler ?? stats.balance ?? stats.solde ?? 0),
      }
    }, patientKpis),
  getAppointments: () =>
    liveApiOnly(async () => {
      const data = await http.get("/v1/patients/me/dossier")
      const list = (data.rendezVous || [])
        .map(mapPatientAppointmentCard)
        .sort((a, b) => {
          const da = a.dateHeureRdv ? new Date(String(a.dateHeureRdv).replace(" ", "T")).getTime() : 0
          const db = b.dateHeureRdv ? new Date(String(b.dateHeureRdv).replace(" ", "T")).getTime() : 0
          return db - da
        })
      return list
    }),
  getPrescriptions: () => mockResolve(patientPrescriptions),
  getTimeline: () =>
    withLiveApi(async () => {
      const data = await http.get("/v1/patients/me/dashboard")
      return (data.recentActivities || []).map((activity, index) => ({
        id: `activity-${index}-${activity.dateHeure || index}`,
        text: activity.description || activity.typeActivite || "—",
        date: formatPatientActivityDate(activity.dateHeure),
        type: mapPatientActivityType(activity.typeActivite),
      }))
    }, patientTimeline),
  getDossier: () =>
    liveApiOnly(async () => {
      const data = await http.get("/v1/patients/me/dossier")
      return mapPatientDossier(data)
    }),
  getMessageConversations: () =>
    liveApiOnly(async () => {
      const list = await http.get("/v1/patients/me/messages/conversations")
      return (list || []).map(mapPatientMessageConversation)
    }),
  downloadConsultationPdf: (idConsultation) =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob(`/v1/patients/me/consultations/${idConsultation}/pdf`)
      openPdfBlob(blob, `fiche_consultation_${idConsultation}.pdf`)
    }),
  downloadDossierPdf: () =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob("/v1/patients/me/dossier/pdf")
      openPdfBlob(blob, "mon_dossier_medical.pdf")
    }),
}

export const labService = {
  getKpis: () =>
    withLiveApi(async () => {
      const stats = await http.get("/v1/lab/dashboard/stats")
      return {
        pendingTests: kpi(stats.commandesEnAttente || stats.pendingTests || 0),
        completedToday: kpi(stats.resultatsDuJour || stats.completedToday || 0),
        criticalResults: kpi(stats.resultatsCritiques || stats.criticalResults || 0),
        avgTurnaround: kpi(stats.delaiMoyenHeures || stats.avgTurnaround || 0),
      }
    }, labKpis),
  getQueue: () => mockResolve(labQueue),
  getCritical: () =>
    withLiveApi(async () => {
      const list = await http.get("/v1/lab/dashboard/critiques")
      return (list || []).map((r) => ({
        id: r.id,
        patient: r.nomPatient || r.patientNom,
        test: r.nomAnalyse || r.testName,
        value: r.valeur || r.value,
        severity: r.severite || "high",
        time: r.dateResultat || r.time,
      }))
    }, labCritical),
}

export const sampleTrackingService = {
  getKpis: () => mockResolve(sampleKpis),
  getAll: () => mockResolve(samples),
  getTimeline: (id) => mockResolve(sampleTimeline[id] || []),
  updateStatus: (id, status, comment) => mockResolve({ id, status, comment, success: true }),
  getNotifications: () => mockResolve(notifications),
}

export const receptionService = {
  getKpis: () => liveApiOnly(() => http.get("/v1/reception/dashboard/stats").then(mapReceptionStats)),
  getQueue: () =>
    liveApiOnly(() => http.get("/v1/reception/dashboard/file-attente").then((list) => (list || []).map(mapAdmission))),
  getRegistrationSeries: () =>
    liveApiOnly(() =>
      http.get("/v1/reception/dashboard/inscriptions-jour").then((list) => (list || []).map(mapRegistrationPoint)),
    ),
  getRendezVousJour: () =>
    liveApiOnly(() =>
      http.get("/v1/reception/dashboard/rendezvous").then((list) => (list || []).map(mapRendezVous01)),
    ),
  createRendezVous: (formData, user) =>
    liveApiOnly(() =>
      http.post("/v1/reception/dashboard/rendezvous", buildRendezVous01Payload(formData, user)).then(mapRendezVous01),
    ),
  getAppointments: ({ mine } = {}) =>
    liveApiOnly(() => {
      const qs = mine ? "?mine=true" : ""
      return http.get(`/rendezvous${qs}`).then((list) => (list || []).map(mapRendezVous01))
    }),
  createAppointment: (formData, user) =>
    liveApiOnly(() =>
      http.post("/v1/reception/dashboard/rendezvous", buildRendezVous01Payload(formData, user)).then(mapRendezVous01),
    ),
  checkInPatient: (idAdmission) =>
    liveApiOnly(() =>
      http.post(
        `/v1/reception/dashboard/admissions/${idAdmission}/statut?nouveauStatut=ENREGISTRE`,
      ),
    ),
  listSpecialites: () =>
    liveApiOnly(() => http.get("/v1/reception/dashboard/specialites")),
  listMedecinsDisponibles: ({ specialite, service, uniquementEnHoraire } = {}) =>
    liveApiOnly(() => {
      const params = new URLSearchParams()
      if (specialite) params.set("specialite", specialite)
      if (service) params.set("service", service)
      if (uniquementEnHoraire) params.set("uniquementEnHoraire", "true")
      const qs = params.toString() ? `?${params}` : ""
      return http.get(`/v1/reception/dashboard/medecins-disponibles${qs}`)
    }),
  registerWalkIn: (payload) =>
    liveApiOnly(() => http.post("/v1/reception/dashboard/arrivees", payload)),
}

function mapPretSortie(item) {
  return {
    idBonSortie: item.idBonSortie,
    numeroBon: item.numeroBon,
    idPatient: item.idPatient,
    nomPatient: item.nomPatient,
    diagnosticFinal: item.diagnosticFinal,
    etatSortie: item.etatSortie,
    autorisePar: item.autorisePar,
    statutWorkflow: item.statutWorkflow,
    statutPaiementFinal: item.statutPaiementFinal,
    dateSortie: item.dateSortie,
    recommandations: item.recommandations,
  }
}

export const userService = {
  getAll: () => mockResolve(managedUsers),
}

export const subscriptionService = {
  getKpis: () =>
    liveApiOnly(async () => {
      const data = await http.get("/subscriptions/kpis")
      return mapSubscriptionKpis(data)
    }),
  getPlans: () =>
    liveApiOnly(async () => {
      const list = await http.get("/subscriptions/plans")
      return (list || []).map(mapSubscriptionPlan)
    }),
  getInvoices: () =>
    liveApiOnly(async () => {
      const list = await http.get("/subscriptions/invoices?limit=50")
      return (list || []).map(mapSubscriptionInvoice)
    }),
  getTimeline: () =>
    liveApiOnly(async () => {
      const list = await http.get("/subscriptions/timeline?limit=20")
      return (list || []).map(mapSubscriptionTimelineEvent)
    }),
}

export const monitoringService = {
  getKpis: () =>
    withLiveApi(async () => {
      const stats = await http.get("/monitoring/system-stats")
      return {
        uptime: kpi(stats.uptimePercentage || stats.uptime || 99.9),
        avgLatency: kpi(stats.averageLatencyMs || stats.avgLatency || 0),
        activeIncidents: kpi(stats.activeIncidents || 0),
        servicesHealthy: kpi(stats.healthyServices || 0),
      }
    }, monitoringKpis),
  getUptimeSeries: () => mockResolve(uptimeSeries),
  getLatencySeries: () => mockResolve(latencySeries),
  getIncidents: () => mockResolve(incidents),
  getAlerts: () => mockResolve(alerts),
  getServiceStatus: () => mockResolve(serviceStatus),
  getIncidentTrends: () => mockResolve(incidentTrends),
}

export const aiAnalyticsService = {
  getKpis: () => mockResolve(aiAnalyticsKpis),
  getModelUsageSeries: () => mockResolve(modelUsageSeries),
  getInferenceCostSeries: () => mockResolve(inferenceCostSeries),
  getAdoptionByTenant: () => mockResolve(adoptionByTenant),
  getQualityMetrics: () => mockResolve(qualityMetrics),
}

export const auditService = {
  getKpis: () =>
    withLiveApi(async () => {
      const data = await http.get("/audit/kpis")
      return mapAuditKpis(data)
    }, auditKpis),
  getLogs: (filters = {}) =>
    withLiveApi(async () => {
      const list = await http.get(`/audit/logs${buildAuditQuery(filters)}`)
      return (list || []).map(mapTechnicalLog)
    }, auditLogs),
  getModules: () =>
    withLiveApi(async () => {
      const list = await http.get("/audit/modules")
      return list || []
    }, ["caisse", "auth", "patients", "api"]),
  getActions: () =>
    withLiveApi(async () => {
      const list = await http.get("/audit/actions")
      return list || []
    }, auditActionTypes),
  getSeverities: () => mockResolve(["INFO", "WARNING", "ERROR"]),
  getSupportTickets: (filters = {}) =>
    withLiveApi(async () => {
      const list = await http.get(`/support/tickets${buildSupportTicketQuery(filters)}`)
      return (list || []).map(mapSupportTicket)
    }, []),
  updateTicketStatus: (id, payload) =>
    liveApiOnly(async () => {
      const updated = await http.patch(`/support/tickets/${id}/status`, payload)
      return mapSupportTicket(updated)
    }),
}

export const revenueService = {
  getKpis: () => mockResolve(revenueKpis),
  getTrend: () => mockResolve(revenueTrend),
  getTenantRevenue: () => mockResolve(tenantRevenue),
  getCategories: () => mockResolve(revenueByCategory),
  getCohorts: () => mockResolve(cohortData),
}

function slugifyHospitalName(value) {
  if (!value) return ""
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
}

function buildHospitalPayload(form) {
  return {
    nom: form.nom.trim(),
    nomCommercial: form.nomCommercial?.trim() || form.nom.trim(),
    sousDomaine: form.sousDomaine.trim().toLowerCase(),
    type: form.type || "CLINIQUE",
    estActif: form.estActif !== false,
    adresse: form.adresse?.trim() || null,
    adresseComplete: form.adresseComplete?.trim() || form.adresse?.trim() || null,
    ville: form.ville.trim(),
    pays: form.pays.trim(),
    telephone: form.telephone?.trim() || null,
    email: form.email.trim(),
    logoUrl: form.logoUrl?.trim() || null,
    planNom: form.plan || "Starter",
  }
}

export const hospitalService = {
  getAll: () =>
    withLiveApi(async () => {
      const list = await http.get("/hopitaux/overview")
      return (list || []).map(mapHospitalOverview)
    }, hospitals),
  getKpis: () =>
    withLiveApi(async () => {
      const stats = await http.get("/hopitaux/stats")
      return {
        total: kpi(stats.total, stats.deltaTotal),
        active: kpi(stats.active, stats.deltaActive),
        trial: kpi(stats.trial, stats.deltaTrial),
        suspended: kpi(stats.suspended, stats.deltaSuspended),
        totalUsers: kpi(stats.totalUsers, stats.deltaTotalUsers),
        totalMrr: kpi(stats.totalMrr, stats.deltaTotalMrr),
      }
    }, hospitalKpis),
  getPlans: () =>
    withLiveApi(async () => {
      const list = await http.get("/hopitaux/plans")
      return (list || []).map((p) => ({
        name: p.name,
        price: Number(p.price) || 0,
        subscribers: Number(p.subscribers) || 0,
        popular: Boolean(p.popular),
        features: p.features || [],
      }))
    }, hospitalPlans),
  getActivity: (id) =>
    withLiveApi(async () => {
      const list = await http.get("/hopitaux/activity?limit=50")
      return (list || []).map(mapHospitalActivity).filter((a) => a.hospitalId === id)
    }, hospitalActivity.filter((a) => a.hospitalId === id)),
  getAllActivity: () =>
    withLiveApi(async () => {
      const list = await http.get("/hopitaux/activity?limit=20")
      return (list || []).map(mapHospitalActivity)
    }, hospitalActivity),
  create: (form) =>
    liveApiOnly(async () => {
      const created = await http.post("/hopitaux/register", buildHospitalPayload(form))
      return mapHospitalOverview(created)
    }),
  getById: (idHopital) =>
    liveApiOnly(async () => {
      const detail = await http.get(`/hopitaux/overview/${idHopital}`)
      return mapHospitalDetail(detail)
    }),
  update: (idHopital, form) =>
    liveApiOnly(async () => {
      const updated = await http.put(`/hopitaux/${idHopital}/platform`, buildHospitalUpdatePayload(form))
      return mapHospitalDetail(updated)
    }),
  setStatus: (idHopital, active) =>
    liveApiOnly(async () => {
      const updated = await http.patch(`/hopitaux/${idHopital}/status`, { active })
      return mapHospitalDetail(updated)
    }),
}

function mapTenantSubscription(s) {
  return {
    idAbonnement: s.idAbonnement ?? null,
    idHopital: s.idHopital ?? null,
    hospitalName: s.hospitalName || "",
    planNom: s.planNom || "Basic",
    montantMensuel: Number(s.montantMensuel) || 0,
    statut: s.statut || "actif",
    uiStatus: s.uiStatus || "active",
    dateDebut: s.dateDebut || null,
    dateFin: s.dateFin || null,
    daysUntilDue: s.daysUntilDue ?? null,
    needsPayment: Boolean(s.needsPayment),
    maxUsers: s.maxUsers ?? null,
    currentUserCount: Number(s.currentUserCount) || 0,
    features: s.features || [],
    teleconsultationMonthlyLimit: s.teleconsultationMonthlyLimit ?? null,
    teleconsultationUsedThisMonth: Number(s.teleconsultationUsedThisMonth) || 0,
    targetAudienceFr: s.targetAudienceFr || "",
    targetAudienceEn: s.targetAudienceEn || "",
  }
}

function mapTenantSubscriptionHistory(h) {
  return {
    idAbonnement: h.idAbonnement,
    planNom: h.planNom || "Starter",
    montantMensuel: Number(h.montantMensuel) || 0,
    statut: h.statut || "actif",
    action: h.action || "closed",
    dateDebut: h.dateDebut || null,
    dateFin: h.dateFin || null,
  }
}

const tenantSubscriptionMock = {
  idAbonnement: 1,
  idHopital: 1,
  hospitalName: "Accra Central Hospital",
  planNom: "Growth",
  montantMensuel: 2400,
  statut: "actif",
  uiStatus: "due_soon",
  dateDebut: new Date(Date.now() - 20 * 86400000).toISOString(),
  dateFin: new Date(Date.now() + 5 * 86400000).toISOString(),
  daysUntilDue: 5,
  needsPayment: true,
}

const tenantSubscriptionPlansMock = [
  { name: "Basic", price: 499, subscribers: 0, popular: false, maxUsers: 10, features: ["Jusqu'à 10 employés", "Patients, RDV, consultations"] },
  { name: "Professionnel", price: 1499, subscribers: 0, popular: true, maxUsers: 50, features: ["Labo, pharmacie, facturation", "Téléconsultation limitée"] },
  { name: "Entreprise", price: 3999, subscribers: 0, popular: false, maxUsers: null, features: ["Tous les modules", "Support prioritaire & intégrations"] },
]

const tenantSubscriptionHistoryMock = [
  {
    idAbonnement: 1,
    planNom: "Growth",
    montantMensuel: 2400,
    statut: "actif",
    action: "active",
    dateDebut: new Date(Date.now() - 20 * 86400000).toISOString(),
    dateFin: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
]

export const tenantSubscriptionService = {
  getCurrent: () =>
    liveApiOnly(async () => {
      const data = await http.get("/tenant-admin/subscription")
      return mapTenantSubscription(data)
    }),
  getPlans: () =>
    withLiveApi(async () => {
      const list = await http.get("/tenant-admin/subscription/plans")
      return (list || []).map((p) => ({
        name: p.name,
        price: Number(p.price) || 0,
        subscribers: Number(p.subscribers) || 0,
        popular: Boolean(p.popular),
        features: p.features || [],
        featuresEn: p.featuresEn || p.features || [],
        featureKeys: p.featureKeys || [],
        maxUsers: p.maxUsers ?? null,
        teleconsultationMonthlyLimit: p.teleconsultationMonthlyLimit ?? null,
        targetAudienceFr: p.targetAudienceFr || "",
        targetAudienceEn: p.targetAudienceEn || "",
      }))
    }, tenantSubscriptionPlansMock),
  getHistory: (limit = 12) =>
    withLiveApi(async () => {
      const list = await http.get(`/tenant-admin/subscription/history?limit=${limit}`)
      return (list || []).map(mapTenantSubscriptionHistory)
    }, tenantSubscriptionHistoryMock),
  repay: () =>
    liveApiOnly(async () => {
      const data = await http.post("/tenant-admin/subscription/repay")
      return mapTenantSubscription(data)
    }),
  changePlan: (planNom) =>
    liveApiOnly(async () => {
      const data = await http.post("/tenant-admin/subscription/change-plan", { planNom })
      return mapTenantSubscription(data)
    }),
  downloadPaymentsReportPdf: () =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob("/tenant-admin/subscription/payments-report/pdf")
      openPdfBlob(blob, "rapport_paiements_abonnement.pdf")
    }),
}

export const settingsService = {
  getBranding: () => mockResolve(brandingSettings),
  updateBranding: (data) => mockResolve({ ...brandingSettings, ...data }),
  getRegions: () => mockResolve(regions),
  updateRegion: (id, data) => mockResolve({ id, ...data }),
  getFeatureFlags: () => mockResolve(featureFlags),
  updateFeatureFlag: (id, data) => mockResolve({ id, ...data }),
  getIntegrations: () => mockResolve(integrations),
  updateIntegration: (id, data) => mockResolve({ id, ...data }),
  getSecurityPolicies: () => mockResolve(securityPolicies),
  updateSecurityPolicies: (data) => mockResolve({ ...securityPolicies, ...data }),
}

function mapTeleSession(rdv) {
  const item = mapDoctorAppointmentListItem(rdv)
  return {
    id: item.id,
    idRdv: rdv.idRdv,
    patient: item.patient,
    doctor: rdv.nomMedecin || "—",
    reason: item.reason,
    time: item.time,
    date: item.date,
    dateHeureRdv: rdv.dateHeureRdv,
    canal: rdv.canal,
    statutRdv: rdv.statutRdv,
    status: item.status === "in-progress" ? "live" : "upcoming",
    specialty: "—",
  }
}

function mapPatientTeleSession(appointment) {
  const dateTime = appointment.dateHeureRdv ? new Date(appointment.dateHeureRdv) : null
  return {
    id: appointment.idRdv,
    idRdv: appointment.idRdv,
    patient: "—",
    doctor: appointment.nomMedecin || appointment.doctorName || "—",
    reason: appointment.motifVisite || appointment.type || "—",
    time:
      dateTime && !Number.isNaN(dateTime.getTime())
        ? dateTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "—",
    date:
      dateTime && !Number.isNaN(dateTime.getTime())
        ? dateTime.toISOString().split("T")[0]
        : appointment.date || "—",
    status: "upcoming",
    specialty: "—",
    canal: appointment.canal || "TELECONSULTATION",
  }
}

function mapPatientMessageConversation(c) {
  return {
    idRdv: c.idRdv,
    idHopital: c.idHopital ?? null,
    doctorName: c.doctorName || "—",
    motifVisite: c.motifVisite || "",
    dateHeureRdv: c.dateHeureRdv,
    statutRdv: c.statutRdv,
    unreadCount: Number(c.unreadCount) || 0,
    lastMessagePreview: c.lastMessagePreview || "",
    lastMessageAt: c.lastMessageAt,
    lastSenderRole: c.lastSenderRole,
  }
}

function mapTeleChatMessage(msg) {
  return {
    id: msg.id,
    idRdv: msg.idRdv,
    senderRole: msg.senderRole,
    senderName: msg.senderName,
    content: msg.content,
    createdAt: msg.createdAt,
    readByRecipient: msg.readByRecipient,
    readAt: msg.readAt,
  }
}

function mapLiveKitToken(data) {
  return {
    token: data?.token,
    roomName: data?.roomName,
    participantIdentity: data?.participantIdentity,
    serverUrl: data?.serverUrl,
    displayName: data?.displayName,
  }
}

export const teleService = {
  getSessions: ({ role } = {}) =>
    liveApiOnly(async () => {
      if (role === "patient") {
        try {
          const data = await http.get("/v1/patients/me/dashboard")
          return (data.upcomingAppointments || [])
            .filter((a) => (a.canal || "").toUpperCase() === "TELECONSULTATION")
            .map(mapPatientTeleSession)
        } catch (err) {
          // Repli : RDV téléconsultation du patient connecté
          const list = await http.get("/v1/patients/me/dashboard/teleconsultations")
          return (list || []).map(mapPatientTeleSession)
        }
      }
      const list = await http.get("/rendezvous")
      return (list || [])
        .filter((rdv) => (rdv.canal || "").toUpperCase() === "TELECONSULTATION")
        .filter((rdv) => !["ANNULE", "ABSENT"].includes((rdv.statutRdv || "").toUpperCase()))
        .map(mapTeleSession)
    }),
  getRendezVous: (idRendezVous) =>
    liveApiOnly(() => http.get(`/rendezvous/${idRendezVous}`).then(mapRendezVous01)),
  getToken: (idRendezVous) =>
    liveApiOnly(() =>
      http.post("/consultations/teleconsultation/token", { idRendezVous }).then(mapLiveKitToken),
    ),
  getChatMessages: (idRdv) =>
    liveApiOnly(() =>
      http.get(`/consultations/teleconsultation/${idRdv}/messages`).then((list) =>
        (list || []).map(mapTeleChatMessage),
      ),
    ),
  sendChatMessage: (idRdv, content) =>
    liveApiOnly(() =>
      http.post(`/consultations/teleconsultation/${idRdv}/messages`, { content }).then(mapTeleChatMessage),
    ),
  markChatRead: (idRdv) =>
    liveApiOnly(() => http.post(`/consultations/teleconsultation/${idRdv}/messages/read`)),
  getWaitingRoom: () => mockResolve(waitingRoom),
  scheduleSession: (payload) => liveApiOnly(() => http.post("/rendezvous", payload)),
}

export const aiService = {
  getStatus: () => liveApiOnly(() => http.get("/ai/status")),
  getSuggestedPrompts: () =>
    withLiveApi(() => http.get("/ai/prompts"), aiSuggestedPrompts),
  sendMessage: ({ message, analysisType, history }) =>
    liveApiOnly(() =>
      http.post("/ai/chat", { message, analysisType, history }).then((res) => ({
        role: res.role || "assistant",
        content: res.content || "",
        model: res.model,
        sources: res.sources || [],
        confidence: res.confidence,
      })),
    ),
  analyze: ({ message, analysisType, history }) =>
    liveApiOnly(() =>
      http.post("/ai/analyze", { message, analysisType, history }).then((res) => ({
        role: res.role || "assistant",
        content: res.content || "",
        model: res.model,
        sources: res.sources || [],
        confidence: res.confidence,
      })),
    ),
}

// ——— Caissier (multi-tenant : données isolées par id_hopital JWT) ———

function mapCashierFeeLine(line) {
  return {
    id: line.id,
    label: line.label || "—",
    qty: Number(line.qty) || 1,
    unitPrice: Number(line.unitPrice) || 0,
    total: Number(line.total) || 0,
  }
}

function mapCashierQueueItem(row) {
  return {
    id: row.id || (row.idFacture != null ? `bill-${row.idFacture}` : ""),
    idFacture: row.idFacture,
    idPatientDb: row.idPatientDb != null ? Number(row.idPatientDb) : null,
    patientId: row.patientId || "—",
    patientName: row.patientName || "—",
    age: row.age,
    sex: row.sex,
    visitDate: row.visitDate || null,
    department: row.department || "—",
    doctorName: row.doctorName || "—",
    invoiceNumber: row.invoiceNumber || "—",
    status: row.status || "pending",
    totalAmount: Number(row.totalAmount) || 0,
    paidAmount: Number(row.paidAmount) || 0,
    balanceDue: Number(row.balanceDue) || 0,
    sousTotalSoins: Number(row.sousTotalSoins) || Number(row.totalAmount) || 0,
    montantAssurance: Number(row.montantAssurance) || 0,
    montantRemise: Number(row.montantRemise) || 0,
    montantAvances: Number(row.montantAvances) || 0,
    tauxAssurance: Number(row.tauxAssurance) || 0,
    priority: row.priority || "normal",
    awaitingAdminDischarge: Boolean(row.awaitingAdminDischarge),
    adminDischargeValidated: Boolean(row.adminDischargeValidated),
    consultationFees: (row.consultationFees || []).map(mapCashierFeeLine),
    laboratoryFees: (row.laboratoryFees || []).map(mapCashierFeeLine),
    pharmacyItems: (row.pharmacyItems || []).map(mapCashierFeeLine),
    hospitalizationFees: (row.hospitalizationFees || []).map(mapCashierFeeLine),
    medicalActFees: (row.medicalActFees || []).map(mapCashierFeeLine),
    otherFees: (row.otherFees || []).map(mapCashierFeeLine),
  }
}

function mapCashierHistoryItem(row) {
  return {
    id: row.id || `pay-${row.receiptNumber}`,
    receiptNumber: row.receiptNumber,
    invoiceNumber: row.invoiceNumber,
    patientName: row.patientName || "—",
    patientId: row.patientId,
    paidAt: row.paidAt || null,
    amount: Number(row.amount) || 0,
    paymentType: row.paymentType || "total",
    method: row.method || "cash",
    cashierName: row.cashierName || "",
    balanceAfter: Number(row.balanceAfter) || 0,
  }
}

function mapCashierWorkspace(data) {
  const kpis = data.kpis || {}
  return {
    hopitalId: data.hopitalId != null ? Number(data.hopitalId) : null,
    hospitalName: data.hospitalName || "",
    kpis: {
      waitingPayment: { value: Number(kpis.waitingPayment) || 0, delta: 0 },
      collectedToday: { value: Number(kpis.collectedToday) || 0, delta: 0 },
      partialPayments: { value: Number(kpis.partialPayments) || 0, delta: 0 },
      adminDischargePending: { value: Number(kpis.adminDischargePending) || 0, delta: 0 },
    },
    queue: (data.queue || []).map(mapCashierQueueItem),
    history: (data.history || []).map(mapCashierHistoryItem),
  }
}

function resolveFactureId(invoiceRef) {
  if (invoiceRef == null) return null
  if (typeof invoiceRef === "number") return invoiceRef
  if (typeof invoiceRef === "object" && invoiceRef.idFacture != null) return Number(invoiceRef.idFacture)
  const str = String(invoiceRef)
  if (str.startsWith("bill-")) return Number(str.replace("bill-", ""))
  const parsed = Number(str)
  return Number.isNaN(parsed) ? null : parsed
}

export const cashierService = {
  getKpis: () =>
    liveApiOnly(async () => {
      const data = await http.get("/tenant/cashier/workspace")
      return mapCashierWorkspace(data).kpis
    }),

  getWorkspace: () =>
    liveApiOnly(async () => {
      const data = await http.get("/tenant/cashier/workspace")
      const mapped = mapCashierWorkspace(data)
      const hopitalId = getHopitalId()
      if (hopitalId != null && mapped.hopitalId != null && mapped.hopitalId !== hopitalId) {
        throw new Error("Tenant mismatch — données d'un autre établissement")
      }
      return mapped
    }),

  collectPayment: (invoiceRef, payload, cashierName = "") =>
    liveApiOnly(async () => {
      const idFacture = resolveFactureId(invoiceRef)
      if (idFacture == null) throw new Error("Invoice not found")
      const result = await http.post("/tenant/cashier/payments", {
        idFacture,
        amount: payload.amount,
        paymentType: payload.paymentType,
        method: payload.method,
        reference: payload.reference || null,
        notes: payload.notes || null,
      })
      const receipt = result.receipt || {}
      return {
        receipt: {
          ...receipt,
          cashierName: cashierName || receipt.cashierName || "",
          patientName: receipt.patientName || "",
          invoiceNumber: receipt.invoiceNumber || String(idFacture),
        },
        invoiceRemoved: Boolean(result.invoiceRemoved),
      }
    }),

  validateAdminDischarge: () =>
    liveApiOnly(async () => {
      throw new Error("Administrative discharge validation is not yet available for live tenant data")
    }),

  downloadDashboardPdf: () =>
    liveApiOnly(async () => {
      const blob = await fetchPdfBlob("/tenant/cashier/rapport/pdf")
      openPdfBlob(blob, "tableau_bord_caissier.pdf")
    }),

  downloadInvoicePdf: (invoiceRef) =>
    liveApiOnly(async () => {
      const idFacture = resolveFactureId(invoiceRef)
      if (idFacture == null) throw new Error("Invoice not found")
      return fetchPdfBlob(`/tenant/cashier/factures/${idFacture}/pdf`)
    }),

  composeInvoice: (payload) =>
    liveApiOnly(async () => {
      return http.post("/tenant/cashier/invoices/compose", payload)
    }),

  refreshInvoices: () =>
    liveApiOnly(async () => {
      return http.post("/tenant/cashier/invoices/refresh", {})
    }),

  recordAdvance: (payload) =>
    liveApiOnly(async () => {
      return http.post("/tenant/cashier/advances", payload)
    }),
}

function mapTenantPublic(d) {
  if (!d) return null
  return {
    idHopital: d.idHopital,
    sousDomaine: d.sousDomaine,
    name: d.name,
    nomCommercial: d.nomCommercial,
    ville: d.ville,
    pays: d.pays,
    type: d.type,
    email: d.email,
    telephone: d.telephone,
    adresseComplete: d.adresseComplete,
    logoUrl: d.logoUrl,
    planNom: d.planNom,
    estActif: d.estActif !== false,
  }
}

export const tenantPublicService = {
  getBySubdomain: (subdomain) =>
    liveApiOnly(async () => {
      const data = await http.get(`/public/tenant?subdomain=${encodeURIComponent(subdomain)}`)
      return mapTenantPublic(data)
    }),
}
