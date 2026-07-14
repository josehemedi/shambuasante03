import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Archive, ArrowLeft, Loader2, History, Lock } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { archiveService } from "@/services/archiveService"
import { ROLE_KEYS } from "@/config/roles"
import Swal from "sweetalert2"

const DETAIL_TABS = ["resume", "patient", "historique", "acces"]

export default function ArchiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { roleKey } = useAuth()
  const [activeTab, setActiveTab] = useState("resume")
  const [actionLoading, setActionLoading] = useState(false)

  const { data: archive, loading, reload } = useAsync(
    () => archiveService.getById(id),
    [id],
  )

  const { data: historique } = useAsync(
    () => (activeTab === "historique" ? archiveService.getHistorique(id) : Promise.resolve([])),
    [id, activeTab],
  )

  const isArchived = archive?.statutArchive === "ARCHIVE"
  const canArchive = roleKey === ROLE_KEYS.ARCHIVIST
  const actions = archive?.actionsAutorisees || []

  async function handleAction(action) {
    if (action === "ARCHIVER") {
      const result = await Swal.fire({
        title: t("archives.confirmArchive"),
        input: "textarea",
        inputLabel: t("archives.motif"),
        showCancelButton: true,
        confirmButtonText: t("archives.archiveAction"),
      })
      if (!result.isConfirmed) return
      setActionLoading(true)
      try {
        await archiveService.archiver(id, {
          motif: result.value,
          emplacementPhysique: result.value,
        })
        await reload()
        Swal.fire(t("archives.success"), "", "success")
      } catch (e) {
        Swal.fire(t("common.error"), e.message, "error")
      } finally {
        setActionLoading(false)
      }
    }

    if (action === "RESTAURER") {
      const result = await Swal.fire({
        title: t("archives.confirmRestore"),
        input: "textarea",
        inputLabel: t("archives.motifRequired"),
        inputValidator: (v) => (!v ? t("archives.motifRequired") : undefined),
        showCancelButton: true,
      })
      if (!result.isConfirmed) return
      setActionLoading(true)
      try {
        await archiveService.restaurer(id, { motif: result.value })
        await reload()
      } catch (e) {
        Swal.fire(t("common.error"), e.message, "error")
      } finally {
        setActionLoading(false)
      }
    }

    if (action === "MARQUER_INCOMPLET") {
      const result = await Swal.fire({
        title: t("archives.markIncomplete"),
        input: "textarea",
        showCancelButton: true,
      })
      if (!result.isConfirmed) return
      setActionLoading(true)
      try {
        await archiveService.marquerIncomplet(id, { observation: result.value })
        await reload()
      } finally {
        setActionLoading(false)
      }
    }

    if (action === "VERIFIER") {
      setActionLoading(true)
      try {
        await archiveService.pretAArchiver(id, {})
        await reload()
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!archive) {
    return <p className="text-center py-12 text-muted-foreground">{t("archives.notFound")}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/archives")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${t("archives.detailTitle")} #${archive.id}`}
          subtitle={archive.nomPatient}
          icon={Archive}
        />
        {isArchived && (
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <Lock className="h-3 w-3" />
            {t("archives.readOnly")}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {canArchive && actions.map((action) => (
          <Button
            key={action}
            size="sm"
            disabled={actionLoading}
            onClick={() => handleAction(action)}
          >
            {t(`archives.actions.${action}`, action)}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {DETAIL_TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {t(`archives.detailTabs.${tab}`)}
          </Button>
        ))}
      </div>

      {activeTab === "resume" && (
        <Card className="p-6 grid gap-4 sm:grid-cols-2">
          <Info label={t("archives.columns.type")} value={archive.typeEpisode} />
          <Info label={t("archives.columns.statut")} value={archive.statutArchive} />
          <Info label={t("archives.columns.medecin")} value={archive.nomMedecin} />
          <Info label={t("archives.columns.dateFin")} value={formatDate(archive.dateFinEpisode)} />
          <Info label={t("archives.emplacement")} value={archive.emplacementPhysique} />
          <Info label={t("archives.archiviste")} value={archive.nomArchiviste} />
          <Info label={t("archives.dateArchivage")} value={formatDate(archive.dateArchivage)} />
          <Info label={t("archives.observation")} value={archive.observation} />
        </Card>
      )}

      {activeTab === "patient" && (
        <Card className="p-6">
          <Info label={t("archives.columns.patient")} value={archive.nomPatient} />
          <Info label={t("archives.columns.dossier")} value={archive.numeroDossier} />
          <Info label="ID patient" value={archive.patientId} />
        </Card>
      )}

      {activeTab === "historique" && (
        <Card className="p-4">
          {(historique || []).length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("archives.noHistory")}</p>
          ) : (
            <ul className="space-y-3">
              {historique.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm border-b pb-2 last:border-0">
                  <History className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{h.action}</p>
                    <p className="text-muted-foreground">
                      {h.ancienStatut} → {h.nouveauStatut} · {formatDate(h.dateAction)}
                    </p>
                    {h.motif && <p className="text-xs mt-1">{h.motif}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {activeTab === "acces" && isArchived && (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-4">{t("archives.accessHint")}</p>
          <Button
            size="sm"
            onClick={async () => {
              const result = await Swal.fire({
                title: t("archives.requestAccess"),
                input: "textarea",
                inputLabel: t("archives.motif"),
                showCancelButton: true,
              })
              if (result.isConfirmed) {
                await archiveService.creerDemandeAcces(id, { motif: result.value })
                Swal.fire(t("archives.success"), "", "success")
              }
            }}
          >
            {t("archives.requestAccess")}
          </Button>
        </Card>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}
