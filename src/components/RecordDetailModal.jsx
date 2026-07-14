import { useState } from "react"
import {
  Stethoscope,
  ClipboardList,
  Calendar,
  User,
  Building2,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Printer,
  Loader2,
} from "lucide-react"
import Swal from "sweetalert2"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button, Badge, Avatar } from "@/components/ui/primitives"
import { formatDate, formatDateTime, cn } from "@/lib/utils"
import { useI18n } from "@/i18n/I18nProvider"
import { patientPortalService, consultationService } from "@/services/api"
import { useAuth } from "@/auth/AuthProvider"
import { ROLE_KEYS } from "@/config/roles"

function DetailRow({ label, value, children, icon: Icon, alwaysShow = false }) {
  const content = children ?? value
  if (!alwaysShow && (content == null || content === "")) return null
  return (
    <div className="flex gap-3 rounded-xl bg-muted/30 px-3 py-2.5">
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 whitespace-pre-wrap text-sm font-medium text-foreground">
          {content == null || content === "" ? "—" : content}
        </dd>
      </div>
    </div>
  )
}

function VitalChip({ icon: Icon, label, value }) {
  if (value == null || value === "") return null
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
      <Icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function displayDoctor(record) {
  const d = record.detail || {}
  const name = record.doctor || d.medecin || d.nomMedecin
  return name && name !== "—" ? name : null
}

function displayDate(record) {
  const d = record.detail || {}
  return record.date || d.date || d.dateConsultation || null
}

function ModalHero({ record, t, locale }) {
  const isConsultation = record.kind === "consultation"
  const Icon = isConsultation ? Stethoscope : ClipboardList
  const doctor = displayDoctor(record)

  return (
    <div
      className={cn(
        "relative -mx-6 -mt-2 mb-4 overflow-hidden px-6 py-5",
        isConsultation
          ? "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
          : "bg-gradient-to-br from-accent/15 via-accent/5 to-transparent",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "rounded-2xl p-3",
            isConsultation ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent-foreground",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <Badge variant={isConsultation ? "primary" : "secondary"} className="mb-2">
            {record.recordType}
          </Badge>
          <p className="font-mono text-xs text-muted-foreground">{record.id}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(displayDate(record), locale)}
          </p>
          {doctor && (
            <div className="mt-3 flex items-center gap-2">
              <Avatar name={doctor} className="h-8 w-8 text-xs" />
              <span className="text-sm font-semibold text-foreground">{doctor}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsultationDetails({ record, t, locale }) {
  const d = record.detail || {}

  return (
    <div className="space-y-4">
      <dl className="space-y-2">
        {d.nomHopital && (
          <DetailRow label={t("records.detail.hospital")} value={d.nomHopital} icon={Building2} alwaysShow />
        )}
        <DetailRow label={t("records.detail.motif")} value={d.motif} icon={ClipboardList} alwaysShow />
        <DetailRow label={t("records.detail.diagnostic")} value={d.diagnostic} icon={Activity} />
        <DetailRow label={t("records.detail.observations")} value={d.observations} icon={FileTextIcon} />
      </dl>

      {(d.tension || d.frequence != null || d.temperature != null || d.poids != null || d.taille != null) && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("records.detail.vitals")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <VitalChip icon={Activity} label={t("records.detail.bp")} value={d.tension} />
            <VitalChip icon={Heart} label={t("records.detail.hr")} value={d.frequence != null ? `${d.frequence} bpm` : null} />
            <VitalChip icon={Thermometer} label={t("records.detail.temp")} value={d.temperature != null ? `${d.temperature} °C` : null} />
            <VitalChip icon={Scale} label={t("records.detail.weight")} value={d.poids != null ? `${d.poids} kg` : null} />
            <VitalChip icon={Ruler} label={t("records.detail.height")} value={d.taille != null ? `${d.taille} cm` : null} />
          </div>
        </div>
      )}
    </div>
  )
}

function FileTextIcon(props) {
  return <ClipboardList {...props} />
}

function AntecedentDetails({ record, t, locale }) {
  const d = record.detail || {}
  return (
    <dl className="space-y-2">
      <DetailRow label={t("records.detail.type")} value={d.type || record.department} icon={ClipboardList} alwaysShow />
      <DetailRow label={t("records.detail.label")} value={d.libelle} icon={Activity} alwaysShow />
      <DetailRow label={t("records.detail.description")} value={d.description} icon={FileTextIcon} />
      <DetailRow label={t("records.detail.date")} value={formatDate(displayDate(record), locale)} icon={Calendar} alwaysShow />
      <DetailRow label={t("records.detail.status")} alwaysShow>
        <Badge variant={d.statut === "ACTIF" ? "success" : "secondary"}>{d.statut || "—"}</Badge>
      </DetailRow>
      {d.critique && (
        <DetailRow label={t("records.detail.critical")}>
          <Badge variant="destructive">{t("records.detail.criticalYes")}</Badge>
        </DetailRow>
      )}
    </dl>
  )
}

function MockDetails({ record, t, locale }) {
  return (
    <dl className="space-y-2">
      <DetailRow label={t("records.detail.patient")} value={`${record.patientName} (${record.patientId})`} icon={User} alwaysShow />
      <DetailRow label={t("records.detail.doctor")} value={record.doctor} icon={Stethoscope} alwaysShow />
      <DetailRow label={t("records.detail.department")} value={record.department} icon={Building2} alwaysShow />
      <DetailRow label={t("records.detail.date")} value={formatDate(record.date, locale)} icon={Calendar} alwaysShow />
    </dl>
  )
}

function extractConsultationId(record) {
  const fromDetail = record?.detail?.id
  if (fromDetail != null) return Number(fromDetail)
  const raw = String(record?.id || "")
  const match = raw.match(/^CONS-(\d+)$/i)
  return match ? Number(match[1]) : null
}

export default function RecordDetailModal({ record, onClose }) {
  const { t, locale } = useI18n()
  const { roleKey } = useAuth()
  const [printing, setPrinting] = useState(false)

  if (!record) return null

  const isPatient = roleKey === ROLE_KEYS.PATIENT
  const consultationId = record.kind === "consultation" ? extractConsultationId(record) : null

  async function handlePrintPdf() {
    if (!consultationId) return
    setPrinting(true)
    try {
      if (isPatient) {
        await patientPortalService.downloadConsultationPdf(consultationId)
      } else {
        await consultationService.downloadFichePdf(consultationId)
      }
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("records.detail.printPdfError"),
      })
    } finally {
      setPrinting(false)
    }
  }

  const title =
    record.kind === "consultation"
      ? t("records.detail.consultationTitle")
      : record.kind === "antecedent"
        ? t("records.detail.antecedentTitle")
        : record.recordType

  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pb-0">
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
        </DialogHeader>

        <ModalHero record={record} t={t} locale={locale} />

        <div className="pb-2">
          {record.kind === "consultation" && (
            <ConsultationDetails record={record} t={t} locale={locale} />
          )}
          {record.kind === "antecedent" && (
            <AntecedentDetails record={record} t={t} locale={locale} />
          )}
          {record.kind !== "consultation" && record.kind !== "antecedent" && (
            <MockDetails record={record} t={t} locale={locale} />
          )}
        </div>

        <DialogFooter className="border-t border-border/60 pt-4">
          {record.kind === "consultation" && consultationId && (
            <Button
              variant="default"
              onClick={handlePrintPdf}
              disabled={printing}
              className="w-full sm:w-auto"
            >
              {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              {t("records.detail.printPdf")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
