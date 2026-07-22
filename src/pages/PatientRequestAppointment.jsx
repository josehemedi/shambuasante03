import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Loader2,
  Search,
  Stethoscope,
  UserRound,
  Video,
  X,
  Phone,
  BadgeCheck,
} from "lucide-react"
import Swal from "sweetalert2"
import { PageHeader } from "@/components/PageHeader"
import { Field } from "@/components/auth/Field"
import { Avatar, Button, Card, CardContent, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useRolePath } from "@/hooks/useRolePath"
import { useAsync } from "@/hooks/useAsync"
import { patientPortalService } from "@/services/api"
import { cn } from "@/lib/utils"

export default function PatientRequestAppointment() {
  const { t } = useI18n()
  const { path } = useRolePath()
  const navigate = useNavigate()
  const { data: doctors, loading: loadingDoctors } = useAsync(() => patientPortalService.listDoctors(), [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [doctorQuery, setDoctorQuery] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [form, setForm] = useState({
    idMedecin: "",
    dateHeureRdv: "",
    canal: "PHYSIQUE",
    motifVisite: "",
    dureeEstimee: 30,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const doctorList = doctors || []
  const selectedDoctor = doctorList.find((d) => String(d.idMedecin) === String(form.idMedecin))

  const specialties = useMemo(() => {
    const set = new Set()
    for (const d of doctorList) {
      if (d.specialite) set.add(d.specialite)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))
  }, [doctorList])

  const filteredDoctors = useMemo(() => {
    const q = doctorQuery.trim().toLowerCase()
    return doctorList.filter((d) => {
      const matchesSpec = specialtyFilter === "all" || d.specialite === specialtyFilter
      const hay = `${d.nomComplet || ""} ${d.specialite || ""}`.toLowerCase()
      return matchesSpec && (!q || hay.includes(q))
    })
  }, [doctorList, doctorQuery, specialtyFilter])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function selectDoctor(doctor) {
    updateField("idMedecin", String(doctor.idMedecin))
    setPickerOpen(false)
    setDoctorQuery("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!form.idMedecin || !form.dateHeureRdv || !form.motifVisite) {
      setError(t("patientPortal.appointment.formRequired"))
      return
    }
    setSaving(true)
    try {
      const dateHeureRdv = form.dateHeureRdv.replace("T", " ")
      await patientPortalService.requestAppointment({
        idMedecin: Number(form.idMedecin),
        dateHeureRdv,
        canal: form.canal,
        motifVisite: form.motifVisite,
        dureeEstimee: Number(form.dureeEstimee) || 30,
      })
      await Swal.fire({
        icon: "success",
        title: t("patientPortal.appointment.requestSuccess"),
        text: t("patientPortal.appointment.requestPendingHint"),
        timer: 2800,
        showConfirmButton: false,
      })
      navigate(path("/appointments"), { replace: true })
    } catch (err) {
      setError(err?.payload?.message || err?.message || t("patientPortal.appointment.requestError"))
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title={t("patientPortal.appointment.title")}
        subtitle={t("patientPortal.appointment.subtitle")}
        actions={
          <Link to={path("/appointments")}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="max-w-3xl border-blue-900/10 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500" />
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  {t("appointments.doctor")}
                </label>

                {selectedDoctor ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-blue-800/20 bg-gradient-to-br from-blue-50/90 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={selectedDoctor.nomComplet}
                        className="h-14 w-14 text-base shrink-0 ring-2 ring-blue-800/20"
                      />
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-[#0b1f4a] truncate">
                          {selectedDoctor.nomComplet}
                        </p>
                        <p className="text-sm text-blue-900/70">{selectedDoctor.specialite}</p>
                        {selectedDoctor.telephone && (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {selectedDoctor.telephone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                        {t("patientPortal.appointment.changeDoctor")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => updateField("idMedecin", "")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    disabled={loadingDoctors}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-800/30 bg-blue-50/40 px-5 py-6 text-left transition hover:border-blue-800/50 hover:bg-blue-50/70"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-800 text-white shadow-md">
                        <UserRound className="h-6 w-6" />
                      </span>
                      <span>
                        <span className="block font-semibold text-[#0b1f4a]">
                          {t("appointments.selectDoctor")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("patientPortal.appointment.doctorPickerHint")}
                        </span>
                      </span>
                    </span>
                    {loadingDoctors ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-800" />
                    ) : (
                      <Badge variant="primary" className="gap-1">
                        <BadgeCheck className="h-3 w-3" />
                        {doctorList.length}
                      </Badge>
                    )}
                  </button>
                )}
              </div>

              <Field
                id="dateHeureRdv"
                type="datetime-local"
                label={t("appointments.date")}
                icon={CalendarDays}
                value={form.dateHeureRdv}
                onChange={(e) => updateField("dateHeureRdv", e.target.value)}
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">{t("appointments.type")}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "PHYSIQUE", icon: Stethoscope, label: t("appointments.types.in_person") },
                    { value: "TELECONSULTATION", icon: Video, label: t("appointments.types.teleconsultation") },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField("canal", value)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        form.canal === value
                          ? "border-blue-800 bg-blue-800 text-white"
                          : "border-border bg-background text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                id="motifVisite"
                label={t("appointments.reception.motifVisite")}
                icon={Stethoscope}
                value={form.motifVisite}
                onChange={(e) => updateField("motifVisite", e.target.value)}
                placeholder={t("appointments.reception.motifPlaceholder")}
                required
              />

              <Field
                id="dureeEstimee"
                type="number"
                min={15}
                max={120}
                step={15}
                label={t("appointments.duration")}
                value={form.dureeEstimee}
                onChange={(e) => updateField("dureeEstimee", e.target.value)}
              />

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full gap-2" disabled={saving || !form.idMedecin}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                {t("patientPortal.appointment.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1f4a]/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("appointments.selectDoctor")}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-blue-900/10 bg-white shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-border/80 bg-gradient-to-br from-blue-950 to-blue-800 px-5 py-5 text-white sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-200/90">
                      {t("patientPortal.appointment.doctorPickerEyebrow")}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
                      {t("appointments.selectDoctor")}
                    </h2>
                    <p className="mt-1 text-sm text-blue-100/85">
                      {t("patientPortal.appointment.doctorPickerSubtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                    aria-label={t("common.close")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
                  <input
                    value={doctorQuery}
                    onChange={(e) => setDoctorQuery(e.target.value)}
                    placeholder={t("patientPortal.appointment.searchDoctor")}
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-blue-200/70 outline-none ring-0 focus:border-white/30 focus:bg-white/15"
                    autoFocus
                  />
                </div>

                {specialties.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSpecialtyFilter("all")}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
                        specialtyFilter === "all"
                          ? "bg-white text-blue-950"
                          : "bg-white/10 text-blue-100 hover:bg-white/20",
                      )}
                    >
                        {t("patientPortal.appointment.allSpecialties")}
                      </button>
                    {specialties.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => setSpecialtyFilter(spec)}
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
                          specialtyFilter === spec
                            ? "bg-white text-blue-950"
                            : "bg-white/10 text-blue-100 hover:bg-white/20",
                        )}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {loadingDoctors ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
                    <Stethoscope className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {t("patientPortal.appointment.noDoctors")}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredDoctors.map((doctor, index) => {
                      const selected = String(form.idMedecin) === String(doctor.idMedecin)
                      return (
                        <motion.button
                          key={doctor.idMedecin}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                          onClick={() => selectDoctor(doctor)}
                          className={cn(
                            "group relative rounded-2xl border p-4 text-left transition-all",
                            selected
                              ? "border-blue-800 bg-blue-50/80 shadow-md shadow-blue-900/10"
                              : "border-border bg-card hover:-translate-y-0.5 hover:border-blue-800/30 hover:shadow-md",
                          )}
                        >
                          {selected && (
                            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-800 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <div className="flex items-start gap-3">
                            <Avatar
                              name={doctor.nomComplet}
                              className="h-12 w-12 shrink-0 text-sm ring-2 ring-blue-900/10"
                            />
                            <div className="min-w-0 pr-6">
                              <p className="font-semibold text-[#0b1f4a] truncate">{doctor.nomComplet}</p>
                              <p className="mt-0.5 text-sm text-blue-900/70 truncate">
                                {doctor.specialite || t("patientPortal.appointment.generalMedicine")}
                              </p>
                              {doctor.telephone && (
                                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {doctor.telephone}
                                </p>
                              )}
                              {doctor.disponible === false && (
                                <p className="mt-2 text-xs font-medium text-amber-700">
                                  {t("patientPortal.appointment.temporarilyUnavailable")}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
