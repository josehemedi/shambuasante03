import { useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { AnimatedModal } from "@/components/ui/AnimatedModal"
import Swal from "sweetalert2"
import {
  Building2,
  Search,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  Activity,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  X,
  Ban,
  Power,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Avatar, Progress } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { hospitalService } from "@/services/api"
import { exportHospitalsToExcel } from "@/lib/exportHospitalsExcel"
import { cn } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statusConfig = {
  active: { badge: "success", dot: "bg-success" },
  trial: { badge: "warning", dot: "bg-warning" },
  suspended: { badge: "destructive", dot: "bg-destructive" },
}

const planConfig = {
  Entreprise: "primary",
  Professionnel: "secondary",
  Basic: "default",
  Enterprise: "primary",
  Growth: "secondary",
  Starter: "default",
}

const HOSPITAL_TYPES = [
  { value: "CLINIQUE", labelKey: "hospitals.typeClinic" },
  { value: "HOPITAL_GENERAL", labelKey: "hospitals.typeGeneral" },
  { value: "CENTRE_MEDICAL", labelKey: "hospitals.typeMedicalCenter" },
  { value: "MATERNITE", labelKey: "hospitals.typeMaternity" },
  { value: "LABORATOIRE", labelKey: "hospitals.typeLaboratory" },
]

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

const EMPTY_FORM = {
  nom: "",
  nomCommercial: "",
  sousDomaine: "",
  type: "CLINIQUE",
  estActif: true,
  adresse: "",
  adresseComplete: "",
  ville: "",
  pays: "",
  telephone: "",
  email: "",
  logoUrl: "",
  plan: "Starter",
  adminPrenom: "",
  adminNom: "",
  adminEmail: "",
  adminTelephone: "",
}

const inputClass =
  "h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"

export default function Hospitals() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { data: kpis, reload: reloadKpis } = useAsync(() => hospitalService.getKpis(), [])
  const { data: hospitals, reload: reloadHospitals } = useAsync(() => hospitalService.getAll(), [])
  const { data: plans, reload: reloadPlans } = useAsync(() => hospitalService.getPlans(), [])
  const { data: activity, reload: reloadActivity } = useAsync(() => hospitalService.getAllActivity(), [])

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("create")
  const [editingId, setEditingId] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewDetail, setViewDetail] = useState(null)
  const [viewActivity, setViewActivity] = useState([])
  const [loadingModal, setLoadingModal] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const sousDomaineEdited = useRef(false)

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleNomChange = (nom) => {
    const slug = slugifyHospitalName(nom)
    setForm((prev) => ({
      ...prev,
      nom,
      ...(!sousDomaineEdited.current && slug.length >= 3 ? { sousDomaine: slug } : {}),
    }))
  }

  const handleSousDomaineChange = (sousDomaine) => {
    sousDomaineEdited.current = true
    updateForm({ sousDomaine: sousDomaine.toLowerCase().replace(/[^a-z0-9-]/g, "") })
  }

  const openModal = () => {
    sousDomaineEdited.current = false
    setModalMode("create")
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const closeFormModal = () => {
    setIsModalOpen(false)
    setModalMode("create")
    setEditingId(null)
    sousDomaineEdited.current = false
    setForm(EMPTY_FORM)
  }

  const closeViewModal = () => {
    setIsViewOpen(false)
    setViewDetail(null)
    setViewActivity([])
  }

  const openViewHospital = async (hospital) => {
    const idHopital = hospital._backendId
    if (!idHopital) return
    setLoadingModal(true)
    setIsViewOpen(true)
    setViewDetail(null)
    setViewActivity([])
    try {
      const [detail, acts] = await Promise.all([
        hospitalService.getById(idHopital),
        hospitalService.getActivity(hospital.id),
      ])
      setViewDetail(detail)
      setViewActivity(acts || [])
    } catch (err) {
      closeViewModal()
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("hospitals.loadingDetails"),
      })
    } finally {
      setLoadingModal(false)
    }
  }

  const openEditHospital = async (hospital) => {
    const idHopital = hospital._backendId
    if (!idHopital) return
    setLoadingModal(true)
    try {
      const detail = await hospitalService.getById(idHopital)
      sousDomaineEdited.current = true
      setModalMode("edit")
      setEditingId(idHopital)
      setForm({
        ...EMPTY_FORM,
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
      })
      setIsModalOpen(true)
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("hospitals.loadingDetails"),
      })
    } finally {
      setLoadingModal(false)
    }
  }

  const reloadAll = () => {
    reloadKpis()
    reloadHospitals()
    reloadPlans()
    reloadActivity()
  }

  const handleRegisterHospital = async () => {
    const required = [form.nom, form.ville, form.pays, form.email, form.sousDomaine]
    if (required.some((v) => !String(v || "").trim())) {
      await Swal.fire({
        icon: "warning",
        title: t("hospitals.formRequiredTitle"),
        text: t("hospitals.formRequired"),
      })
      return
    }
    if (form.sousDomaine.trim().length < 3) {
      await Swal.fire({
        icon: "warning",
        title: t("hospitals.formRequiredTitle"),
        text: t("hospitals.formSubdomainInvalid"),
      })
      return
    }
    const adminRequired = [form.adminPrenom, form.adminNom, form.adminEmail]
    if (adminRequired.some((v) => !String(v || "").trim()) || !String(form.adminEmail || "").includes("@")) {
      await Swal.fire({
        icon: "warning",
        title: t("hospitals.formRequiredTitle"),
        text: t("hospitals.formAdminRequired"),
      })
      return
    }

    setIsSubmitting(true)
    try {
      await hospitalService.create(form)
      closeFormModal()
      reloadAll()
      await Swal.fire({
        icon: "success",
        title: t("hospitals.createSuccessTitle"),
        text: t("hospitals.createSuccessWithInvite"),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("hospitals.createErrorTitle"),
        text: err?.message || t("hospitals.createError"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateHospital = async () => {
    const required = [form.nom, form.ville, form.pays, form.email, form.sousDomaine]
    if (required.some((v) => !String(v || "").trim())) {
      await Swal.fire({
        icon: "warning",
        title: t("hospitals.formRequiredTitle"),
        text: t("hospitals.formRequired"),
      })
      return
    }
    if (form.sousDomaine.trim().length < 3) {
      await Swal.fire({
        icon: "warning",
        title: t("hospitals.formRequiredTitle"),
        text: t("hospitals.formSubdomainInvalid"),
      })
      return
    }

    setIsSubmitting(true)
    try {
      await hospitalService.update(editingId, form)
      closeFormModal()
      reloadAll()
      await Swal.fire({
        icon: "success",
        title: t("hospitals.updateSuccessTitle"),
        text: t("hospitals.updateSuccess"),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("hospitals.updateErrorTitle"),
        text: err?.message || t("hospitals.updateError"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitHospital = () => {
    if (modalMode === "edit") {
      handleUpdateHospital()
      return
    }
    handleRegisterHospital()
  }

  const getTypeLabel = (type) => {
    const found = HOSPITAL_TYPES.find((opt) => opt.value === type)
    return found ? t(found.labelKey) : type
  }

  const handleToggleHospitalStatus = async (hospital) => {
    const idHopital = hospital._backendId
    if (!idHopital) return

    const isActive = hospital.estActif !== false
    const result = await Swal.fire({
      icon: "warning",
      title: isActive ? t("hospitals.deactivateConfirmTitle") : t("hospitals.activateConfirmTitle"),
      html: isActive
        ? t("hospitals.deactivateConfirmText", { name: hospital.name })
        : t("hospitals.activateConfirmText", { name: hospital.name }),
      showCancelButton: true,
      confirmButtonText: isActive ? t("hospitals.suspendHospital") : t("hospitals.activateHospital"),
      cancelButtonText: t("hospitals.formCancel"),
      confirmButtonColor: isActive ? "#dc2626" : "#16a34a",
      reverseButtons: true,
      focusCancel: true,
    })

    if (!result.isConfirmed) return

    setTogglingId(idHopital)
    try {
      await hospitalService.setStatus(idHopital, !isActive)
      if (viewDetail?._backendId === idHopital) {
        setViewDetail((prev) => (prev ? { ...prev, estActif: !isActive, status: !isActive ? "suspended" : "active" } : prev))
      }
      reloadAll()
      await Swal.fire({
        icon: "success",
        title: isActive ? t("hospitals.deactivateSuccessTitle") : t("hospitals.activateSuccessTitle"),
        text: isActive ? t("hospitals.deactivateSuccess") : t("hospitals.activateSuccess"),
        timer: 2200,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || (isActive ? t("hospitals.deactivateError") : t("hospitals.activateError")),
      })
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (!hospitals) return []
    return hospitals.filter((h) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || h.status === statusFilter
      const matchesPlan = planFilter === "all" || h.plan === planFilter
      return matchesQuery && matchesStatus && matchesPlan
    })
  }, [hospitals, query, statusFilter, planFilter])

  const totalUsers = useMemo(() => (hospitals || []).reduce((sum, h) => sum + h.users, 0), [hospitals])
  const totalMrr = useMemo(() => (hospitals || []).reduce((sum, h) => sum + h.mrr, 0), [hospitals])

  const handleExportExcel = async () => {
    if (!filtered.length) {
      await Swal.fire({
        icon: "warning",
        title: t("hospitals.exportEmptyTitle"),
        text: t("hospitals.exportEmpty"),
      })
      return
    }

    const filterParts = []
    if (query.trim()) filterParts.push(`${lang === "fr" ? "Recherche" : "Search"} : "${query.trim()}"`)
    if (statusFilter !== "all") filterParts.push(`${lang === "fr" ? "Statut" : "Status"} : ${statusFilter}`)
    if (planFilter !== "all") filterParts.push(`${lang === "fr" ? "Forfait" : "Plan"} : ${planFilter}`)

    setExporting(true)
    try {
      const { filename, count } = exportHospitalsToExcel(filtered, {
        exportedBy: user?.name || "",
        lang,
        sheetSubtitle: t("hospitals.exportSheetSubtitle"),
        platformName: "ShambuaSante",
        filterSummary: filterParts.length
          ? `${lang === "fr" ? "Filtres" : "Filters"} : ${filterParts.join(" | ")}`
          : "",
      })
      await Swal.fire({
        icon: "success",
        title: t("hospitals.exportSuccessTitle"),
        text: t("hospitals.exportSuccess", { count, filename }),
        timer: 2800,
        showConfirmButton: false,
      })
    } catch (err) {
      if (err?.message === "EMPTY") {
        await Swal.fire({
          icon: "warning",
          title: t("hospitals.exportEmptyTitle"),
          text: t("hospitals.exportEmpty"),
        })
        return
      }
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("hospitals.exportError"),
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("hospitals.title")}
          subtitle={t("hospitals.subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={reloadAll}>
                <RefreshCw className="h-4 w-4" />
                {t("common.refresh")}
              </Button>
              <Button size="sm" onClick={openModal}>
                <Plus className="h-4 w-4" />
                {t("common.new")}
              </Button>
            </div>
          }
        />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: t("hospitals.totalHospitals"), value: kpis?.total.value ?? 0, delta: kpis?.total.delta ?? 0, icon: Building2, color: "text-primary", bg: "bg-primary/12" },
          { label: t("hospitals.active"), value: kpis?.active.value ?? 0, delta: kpis?.active.delta ?? 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/12" },
          { label: t("hospitals.trial"), value: kpis?.trial.value ?? 0, delta: kpis?.trial.delta ?? 0, icon: Clock, color: "text-warning", bg: "bg-warning/12" },
          { label: t("hospitals.suspended"), value: kpis?.suspended.value ?? 0, delta: kpis?.suspended.delta ?? 0, icon: XCircle, color: "text-destructive", bg: "bg-destructive/12" },
          { label: t("hospitals.totalUsers"), value: totalUsers, delta: kpis?.totalUsers.delta ?? 0, icon: Users, color: "text-accent-foreground", bg: "bg-accent/12" },
          { label: t("hospitals.totalMrr"), value: totalMrr, delta: kpis?.totalMrr.delta ?? 0, prefix: "$", icon: DollarSign, color: "text-secondary", bg: "bg-secondary/15" },
        ].map((kpi, i) => {
          const positive = (kpi.delta || 0) >= 0
          const TrendIcon = positive ? ChevronUp : ChevronDown
          return (
            <Card key={i} className={cn("relative overflow-hidden border-l-4", kpi.bg, kpi.color, "border-l-current")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.bg, kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {kpi.delta !== undefined && (
                    <span className={cn("flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold", positive ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive")}>
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(kpi.delta)}%
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <p className="font-display text-[26px] font-bold tracking-tight text-foreground">
                    {kpi.prefix || ""}
                    {(kpi.value || 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("hospitals.searchPlaceholder")}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">{t("hospitals.filterAll")}</option>
                <option value="active">{t("hospitals.active")}</option>
                <option value="trial">{t("hospitals.trial")}</option>
                <option value="suspended">{t("hospitals.suspended")}</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="all">{t("hospitals.filterPlan")}</option>
                <option value="Basic">{t("hospitals.planBasic")}</option>
                <option value="Professionnel">{t("hospitals.planProfessionnel")}</option>
                <option value="Entreprise">{t("hospitals.planEntreprise")}</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {t("hospitals.title")}
                </CardTitle>
                <CardDescription>{filtered.length} {t("hospitals.totalHospitals").toLowerCase()}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
                <Download className="h-4 w-4" />
                {exporting ? t("hospitals.exporting") : t("common.export")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colName")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colCountry")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colPlan")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colUsers")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colMrr")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colStatus")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colLastActive")}</th>
                    <th className="px-5 py-3 font-semibold">{t("hospitals.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(filtered || []).map((hospital, i) => {
                    const status = statusConfig[hospital.status] || statusConfig.active
                    return (
                      <motion.tr
                        key={hospital.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={hospital.name} className="h-9 w-9 text-xs" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{hospital.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{hospital.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            {hospital.country}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={planConfig[hospital.plan] || "default"}>{hospital.plan}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {hospital.users.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm font-medium text-foreground">
                            ${hospital.mrr.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", status.dot)} />
                            <Badge variant={status.badge}>{t(`hospitals.${hospital.status}`)}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{hospital.lastActive}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={t("hospitals.actionViewTooltip")}
                              aria-label={t("hospitals.viewDetails")}
                              onClick={() => openViewHospital(hospital)}
                              disabled={loadingModal}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={t("hospitals.actionEditTooltip")}
                              aria-label={t("hospitals.editHospital")}
                              onClick={() => openEditHospital(hospital)}
                              disabled={loadingModal || togglingId === hospital._backendId}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {hospital.estActif !== false ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title={t("hospitals.actionDeactivateTooltip")}
                                aria-label={t("hospitals.suspendHospital")}
                                onClick={() => handleToggleHospitalStatus(hospital)}
                                disabled={loadingModal || togglingId === hospital._backendId}
                              >
                                {togglingId === hospital._backendId ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
                                title={t("hospitals.actionActivateTooltip")}
                                aria-label={t("hospitals.activateHospital")}
                                onClick={() => handleToggleHospitalStatus(hospital)}
                                disabled={loadingModal || togglingId === hospital._backendId}
                              >
                                {togglingId === hospital._backendId ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("hospitals.noHospitals")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t("hospitals.activity")}
            </CardTitle>
            <CardDescription>{t("hospitals.activitySub")}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <div className="space-y-0">
                {(activity || []).slice(0, 6).map((act, i) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 border-b border-border/60 last:border-0 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{act.details}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{act.hospitalId}</span>
                        <span>•</span>
                        <span>{act.timestamp.split(" ")[0]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            {(!activity || activity.length === 0) && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("hospitals.noActivity")}</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("hospitals.plans")}</CardTitle>
            <CardDescription>{t("hospitals.plansSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(plans || []).map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-md",
                    plan.popular ? "border-primary/30 shadow-sm" : "border-border",
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="primary" className="text-[10px] uppercase tracking-wider">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-foreground">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">{t("hospitals.perMonth")}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatedModal open={isViewOpen} onClose={closeViewModal} contentClassName="max-w-3xl">
          <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{t("hospitals.modalViewHospital")}</h2>
                <p className="text-sm text-muted-foreground">{t("hospitals.modalViewHospitalSub")}</p>
              </div>
              <button
                onClick={closeViewModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingModal || !viewDetail ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("hospitals.loadingDetails")}
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <Avatar name={viewDetail.name} className="h-14 w-14 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold text-foreground">{viewDetail.name}</h3>
                      <Badge variant={statusConfig[viewDetail.status]?.badge || "default"}>
                        {t(`hospitals.${viewDetail.status}`)}
                      </Badge>
                      <Badge variant={planConfig[viewDetail.plan] || "default"}>{viewDetail.plan}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{viewDetail.id}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{viewDetail.nomCommercial}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" size="sm" onClick={() => { closeViewModal(); openEditHospital(viewDetail) }}>
                      <Edit className="h-4 w-4" />
                      {t("hospitals.editHospital")}
                    </Button>
                    <Button
                      variant={viewDetail.estActif !== false ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleHospitalStatus(viewDetail)}
                      disabled={togglingId === viewDetail._backendId}
                    >
                      {togglingId === viewDetail._backendId ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : viewDetail.estActif !== false ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                      {viewDetail.estActif !== false ? t("hospitals.suspendHospital") : t("hospitals.activateHospital")}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { icon: Globe, label: t("hospitals.colCountry"), value: `${viewDetail.city}, ${viewDetail.country}` },
                    { icon: MapPin, label: t("hospitals.viewSubdomain"), value: viewDetail.sousDomaine || "—" },
                    { icon: Mail, label: t("hospitals.colEmail"), value: viewDetail.email || "—" },
                    { icon: Phone, label: t("hospitals.colPhone"), value: viewDetail.phone || "—" },
                    { icon: Users, label: t("hospitals.colUsers"), value: viewDetail.users.toLocaleString() },
                    { icon: DollarSign, label: t("hospitals.colMrr"), value: `$${viewDetail.mrr.toLocaleString()}` },
                    { icon: Stethoscope, label: t("hospitals.viewFacilityType"), value: getTypeLabel(viewDetail.type) },
                    { icon: Clock, label: t("hospitals.colLastActive"), value: viewDetail.lastActive },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-3 rounded-xl border border-border/70 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <row.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{row.label}</p>
                        <p className="mt-1 text-sm font-medium text-foreground break-words">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    {t("hospitals.viewActivity")}
                  </h4>
                  <div className="rounded-xl border border-border/70">
                    {viewActivity.length > 0 ? (
                      viewActivity.slice(0, 8).map((act) => (
                        <div key={act.id} className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{act.details}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{act.user} • {act.timestamp}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("hospitals.viewNoActivity")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
      </AnimatedModal>

      <AnimatedModal open={isModalOpen} onClose={closeFormModal} contentClassName="max-w-2xl">
          <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {modalMode === "edit" ? t("hospitals.modalEditHospital") : t("hospitals.modalNewHospital")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {modalMode === "edit" ? t("hospitals.modalEditHospitalSub") : t("hospitals.modalNewHospitalSub")}
                </p>
              </div>
              <button
                onClick={closeFormModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("hospitals.formSectionIdentity")}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formNom")} *</label>
                    <input value={form.nom} onChange={(e) => handleNomChange(e.target.value)} className={inputClass} placeholder="Hôpital Général de Kinshasa" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formNomCommercial")}</label>
                    <input value={form.nomCommercial} onChange={(e) => updateForm({ nomCommercial: e.target.value })} className={inputClass} placeholder={form.nom || "Nom affiché publiquement"} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formSousDomaine")} *</label>
                    <input value={form.sousDomaine} onChange={(e) => handleSousDomaineChange(e.target.value)} className={inputClass} placeholder="hopital-kinshasa" />
                    <p className="text-xs text-muted-foreground">{t("hospitals.formSousDomaineHint")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formType")} *</label>
                    <select value={form.type} onChange={(e) => updateForm({ type: e.target.value })} className={inputClass}>
                      {HOSPITAL_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input
                      id="estActif"
                      type="checkbox"
                      checked={form.estActif}
                      onChange={(e) => updateForm({ estActif: e.target.checked })}
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor="estActif" className="text-sm text-foreground">{t("hospitals.formEstActif")}</label>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("hospitals.formSectionLocation")}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formAdresse")}</label>
                    <input value={form.adresse} onChange={(e) => updateForm({ adresse: e.target.value })} className={inputClass} placeholder="Gombe, Avenue de la Paix" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formAdresseComplete")}</label>
                    <input value={form.adresseComplete} onChange={(e) => updateForm({ adresseComplete: e.target.value })} className={inputClass} placeholder="Adresse postale complète" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formVille")} *</label>
                    <input value={form.ville} onChange={(e) => updateForm({ ville: e.target.value })} className={inputClass} placeholder="Kinshasa" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formPays")} *</label>
                    <input value={form.pays} onChange={(e) => updateForm({ pays: e.target.value })} className={inputClass} placeholder="RDC" />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("hospitals.formSectionContact")}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formEmail")} *</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} className={inputClass} placeholder="contact@hopital.cd" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formTelephone")}</label>
                    <input value={form.telephone} onChange={(e) => updateForm({ telephone: e.target.value })} className={inputClass} placeholder="+243810000001" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formLogoUrl")}</label>
                    <input value={form.logoUrl} onChange={(e) => updateForm({ logoUrl: e.target.value })} className={inputClass} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("hospitals.formSectionSubscription")}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("hospitals.formPlan")}</label>
                    <select value={form.plan} onChange={(e) => updateForm({ plan: e.target.value })} className={inputClass}>
                      <option value="Basic">Basic</option>
                      <option value="Professionnel">Professionnel</option>
                      <option value="Entreprise">Entreprise</option>
                    </select>
                    <p className="text-xs text-muted-foreground">{t("hospitals.formPlanHint")}</p>
                  </div>
                </div>
              </div>

              {modalMode === "create" && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("hospitals.formSectionAdmin")}
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">{t("hospitals.formAdminHint")}</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("hospitals.formAdminPrenom")} *</label>
                      <input
                        value={form.adminPrenom || ""}
                        onChange={(e) => updateForm({ adminPrenom: e.target.value })}
                        className={inputClass}
                        placeholder="Kwame"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("hospitals.formAdminNom")} *</label>
                      <input
                        value={form.adminNom || ""}
                        onChange={(e) => updateForm({ adminNom: e.target.value })}
                        className={inputClass}
                        placeholder="Mensah"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("hospitals.formAdminEmail")} *</label>
                      <input
                        type="email"
                        value={form.adminEmail || ""}
                        onChange={(e) => updateForm({ adminEmail: e.target.value })}
                        className={inputClass}
                        placeholder="admin@hopital.cd"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("hospitals.formAdminTelephone")}</label>
                      <input
                        value={form.adminTelephone || ""}
                        onChange={(e) => updateForm({ adminTelephone: e.target.value })}
                        className={inputClass}
                        placeholder="+243…"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeFormModal} disabled={isSubmitting}>
                {t("hospitals.formCancel")}
              </Button>
              <Button onClick={handleSubmitHospital} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {modalMode === "edit" ? t("hospitals.formSaving") : t("hospitals.formRegistering")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {modalMode === "edit" ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {modalMode === "edit" ? t("hospitals.formSave") : t("hospitals.formRegister")}
                  </span>
                )}
              </Button>
            </div>
          </div>
      </AnimatedModal>
    </motion.div>
  )
}
