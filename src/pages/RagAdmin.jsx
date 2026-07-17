import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Activity,
  AlertTriangle,
  DollarSign,
  Database,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useAsync } from "@/hooks/useAsync"
import { ragService } from "@/services/api"
import { ROLE_KEYS } from "@/config/roles"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"

export default function RagAdmin() {
  const { t } = useI18n()
  const { roleKey } = useAuth()
  const isSuper = roleKey === ROLE_KEYS.SUPER_ADMIN
  const [reloadKey, setReloadKey] = useState(0)

  const { data: documents, loading: docsLoading, reload: reloadDocs } = useAsync(
    () => ragService.listDocuments(),
    [reloadKey],
  )
  const { data: analytics, loading: analyticsLoading, reload: reloadAnalytics } = useAsync(
    () => ragService.getAnalytics(),
    [reloadKey],
  )
  const { data: categories } = useAsync(() => ragService.getCategories(), [])

  const docs = documents || []
  const stats = analytics || {}

  async function refresh() {
    setReloadKey((k) => k + 1)
    await Promise.all([reloadDocs(), reloadAnalytics()])
  }

  async function handleCreate() {
    const { value: form } = await Swal.fire({
      title: t("ragAdmin.createTitle"),
      html: `
        <input id="rag-titre" class="swal2-input" placeholder="${t("ragAdmin.titre")}" />
        <select id="rag-cat" class="swal2-input">${(categories || ["PROTOCOLE", "GUIDE", "RECOMMANDATION"]).map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
        <textarea id="rag-contenu" class="swal2-textarea" placeholder="${t("ragAdmin.contenu")}"></textarea>
        <input id="rag-version" class="swal2-input" value="1.0" placeholder="Version" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const titre = document.getElementById("rag-titre")?.value?.trim()
        const contenu = document.getElementById("rag-contenu")?.value?.trim()
        if (!titre || !contenu) {
          Swal.showValidationMessage(t("ragAdmin.required"))
          return null
        }
        return {
          titre,
          contenu,
          categorie: document.getElementById("rag-cat")?.value,
          versionLabel: document.getElementById("rag-version")?.value || "1.0",
          statut: "ACTIF",
          audience: isSuper ? "SUPER_ADMIN" : "MEDECIN",
        }
      },
    })
    if (!form) return
    try {
      await ragService.createDocument(form)
      await refresh()
      Swal.fire({ icon: "success", title: t("ragAdmin.created"), timer: 1600, showConfirmButton: false })
    } catch (e) {
      Swal.fire({ icon: "error", title: t("common.error"), text: e?.message || "" })
    }
  }

  async function handleDelete(doc) {
    const ok = await Swal.fire({
      icon: "warning",
      title: t("ragAdmin.deleteTitle"),
      text: doc.titre,
      showCancelButton: true,
    })
    if (!ok.isConfirmed) return
    try {
      await ragService.deleteDocument(doc.id)
      await refresh()
    } catch (e) {
      Swal.fire({ icon: "error", title: t("common.error"), text: e?.message || "" })
    }
  }

  const kpis = useMemo(
    () => [
      {
        label: t("ragAdmin.kpiCalls"),
        value: stats.total_calls ?? stats.totalCalls ?? 0,
        icon: Activity,
      },
      {
        label: t("ragAdmin.kpiErrors"),
        value: stats.error_calls ?? stats.errorCalls ?? 0,
        icon: AlertTriangle,
      },
      {
        label: t("ragAdmin.kpiCost"),
        value: `$${Number(stats.total_cost_usd ?? stats.totalCostUsd ?? 0).toFixed(4)}`,
        icon: DollarSign,
      },
      {
        label: t("ragAdmin.kpiDocs"),
        value: stats.documents ?? docs.length,
        icon: Database,
      },
    ],
    [stats, docs.length, t],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ragAdmin.title")}
        subtitle={isSuper ? t("ragAdmin.subtitleSuper") : t("ragAdmin.subtitleAdmin")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className={cn("mr-1.5 h-4 w-4", (docsLoading || analyticsLoading) && "animate-spin")} />
              {t("common.refresh")}
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t("ragAdmin.addDoc")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="font-display text-lg font-semibold">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {t("ragAdmin.documents")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docsLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}…</p>}
            {!docsLoading && docs.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("ragAdmin.emptyDocs")}</p>
            )}
            {docs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-foreground">{doc.titre}</p>
                    <Badge variant="secondary">{doc.categorie}</Badge>
                    <Badge variant={doc.statut === "ACTIF" ? "default" : "outline"}>
                      {doc.statut} · v{doc.versionLabel}
                    </Badge>
                    {doc.hopitalId == null && (
                      <Badge className="bg-slate-800 text-white">{t("ragAdmin.platform")}</Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.contenu}</p>
                </div>
                {(isSuper ? doc.hopitalId == null : doc.hopitalId != null) && (
                  <Button size="icon" variant="ghost" className="shrink-0 text-rose-500" onClick={() => handleDelete(doc)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              {t("ragAdmin.security")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("ragAdmin.multiTenant")}</p>
            <p className="font-medium text-foreground">{t("ragAdmin.model")}: {stats.model || "—"}</p>
            <p>
              {t("ragAdmin.quota")}: {stats.monthlyTokenQuota?.toLocaleString?.() || stats.monthlyTokenQuota || "—"}
            </p>
            {Array.isArray(stats.forbiddenForAdmin) && (
              <div>
                <p className="mb-1 font-medium text-foreground">{t("ragAdmin.forbidden")}</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs">
                  {stats.forbiddenForAdmin.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(stats.recentErrors) && stats.recentErrors.length > 0 && (
              <div>
                <p className="mb-1 font-medium text-foreground">{t("ragAdmin.errors")}</p>
                <ul className="space-y-1 text-xs">
                  {stats.recentErrors.slice(0, 5).map((e) => (
                    <li key={e.id} className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700">
                      {e.error_message || e.errorMessage}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
