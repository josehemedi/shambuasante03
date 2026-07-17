import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import Swal from "sweetalert2"
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Building2,
  CalendarDays,
  History,
  ArrowRight,
  FileBarChart2,
  Loader2,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAuth } from "@/auth/AuthProvider"
import { useRolePath } from "@/hooks/useRolePath"
import { useAsync } from "@/hooks/useAsync"
import { tenantSubscriptionService } from "@/services/api"
import SubscriptionPaymentModal from "@/components/SubscriptionPaymentModal"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/auth/SubscriptionProvider"
import { ALL_PLAN_FEATURES, normalizePlanName, PLAN_BADGE, PLAN_ORDER, planIncludesFeature } from "@/config/subscriptionPlans"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const statusStyles = {
  active: { badge: "success", icon: CheckCircle2, color: "text-success" },
  trial: { badge: "warning", icon: Clock, color: "text-warning" },
  due_soon: { badge: "warning", icon: AlertTriangle, color: "text-warning" },
  expired: { badge: "destructive", icon: XCircle, color: "text-destructive" },
  suspended: { badge: "destructive", icon: XCircle, color: "text-destructive" },
}

const planBadge = PLAN_BADGE

function formatDate(value, lang) {
  if (!value) return "—"
  const d = new Date(value)
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatMoney(value, lang) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export default function MySubscription() {
  const { t, lang } = useI18n()
  const { user, refreshSession } = useAuth()
  const [paying, setPaying] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [changingPlan, setChangingPlan] = useState(null)

  const { reload: reloadSubscriptionContext } = useSubscription()

  const { data: subscription, reload: reloadSubscription } = useAsync(
    () => tenantSubscriptionService.getCurrent(),
    [],
  )
  const { data: plans, reload: reloadPlans } = useAsync(() => tenantSubscriptionService.getPlans(), [])
  const { data: history, reload: reloadHistory } = useAsync(
    () => tenantSubscriptionService.getHistory(12),
    [],
  )

  const status = statusStyles[subscription?.uiStatus] || statusStyles.active
  const StatusIcon = status.icon

  const currentPlan = normalizePlanName(subscription?.planNom || "Basic")

  const sortedPlans = useMemo(() => {
    if (!plans) return []
    return [...plans].sort((a, b) => (PLAN_ORDER[a.name] || 99) - (PLAN_ORDER[b.name] || 99))
  }, [plans])

  const planFeatureList = (planName) =>
    ALL_PLAN_FEATURES.filter((feature) => planIncludesFeature(planName, feature))

  const reloadAll = () => {
    reloadSubscription()
    reloadPlans()
    reloadHistory()
    reloadSubscriptionContext()
  }

  const handleRepay = () => {
    setPaymentOpen(true)
  }

  const handleViewReport = async () => {
    if (reportLoading) return
    setReportLoading(true)
    try {
      await tenantSubscriptionService.downloadPaymentsReportPdf()
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("mySubscription.reportErrorTitle"),
        text: err?.message || t("mySubscription.reportError"),
      })
    } finally {
      setReportLoading(false)
    }
  }

  const processRepayment = async () => {
    setPaying(true)
    try {
      await tenantSubscriptionService.repay()
      reloadAll()
      await refreshSession?.()
      await Swal.fire({
        icon: "success",
        title: t("mySubscription.repaySuccessTitle"),
        text: t("mySubscription.repaySuccess"),
        timer: 2600,
        showConfirmButton: false,
      })
    } catch (err) {
      throw err
    } finally {
      setPaying(false)
    }
  }

  const handleChangePlan = async (planName) => {
    if (planName === currentPlan) return
    const plan = plans?.find((p) => p.name === planName)
    const amount = formatMoney(plan?.price, lang)
    const confirm = await Swal.fire({
      icon: "question",
      title: t("mySubscription.changePlanConfirmTitle"),
      html: t("mySubscription.changePlanConfirmText", { plan: planName, amount }),
      showCancelButton: true,
      confirmButtonText: t("mySubscription.confirmChange"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#0d9488",
    })
    if (!confirm.isConfirmed) return

    setChangingPlan(planName)
    try {
      await tenantSubscriptionService.changePlan(planName)
      reloadAll()
      await refreshSession?.()
      await Swal.fire({
        icon: "success",
        title: t("mySubscription.changeSuccessTitle"),
        text: t("mySubscription.changeSuccess", { plan: planName }),
        timer: 2600,
        showConfirmButton: false,
      })
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: err?.message || t("mySubscription.changeError"),
      })
    } finally {
      setChangingPlan(null)
    }
  }

  return (
    <motion.div className="space-y-5" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <PageHeader
          title={t("mySubscription.title")}
          subtitle={t("mySubscription.subtitle", { hospital: user?.tenantLabel || subscription?.hospitalName || "" })}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={reportLoading}
                onClick={handleViewReport}
                className="gap-2"
              >
                {reportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileBarChart2 className="h-4 w-4" />
                )}
                {reportLoading ? t("mySubscription.reportLoading") : t("mySubscription.viewReport")}
              </Button>
              <Button variant="outline" size="sm" onClick={reloadAll}>
                <RefreshCw className="h-4 w-4" />
                {t("common.refresh")}
              </Button>
            </div>
          }
        />
      </motion.div>

      {subscription?.needsPayment && (
        <motion.div variants={item}>
          <Card className="border-warning/40 bg-warning/8">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("mySubscription.paymentDueTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("mySubscription.paymentDueText")}</p>
                </div>
              </div>
              <Button size="sm" onClick={handleRepay} disabled={paying}>
                <CreditCard className="h-4 w-4" />
                {paying ? t("mySubscription.processing") : t("mySubscription.repayNow")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t("mySubscription.currentPlan")}
            </CardTitle>
            <CardDescription>{t("mySubscription.currentPlanSub")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={planBadge[currentPlan] || "default"} className="text-sm">
                    {currentPlan}
                  </Badge>
                  <Badge variant={status.badge}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {t(`mySubscription.status.${subscription?.uiStatus || "active"}`)}
                  </Badge>
                </div>
                <p className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">
                  {formatMoney(subscription?.montantMensuel, lang)}
                  <span className="text-base font-normal text-muted-foreground">{t("mySubscription.perMonth")}</span>
                </p>
              </div>
              <Button onClick={handleRepay} disabled={paying} size="md">
                <CreditCard className="h-4 w-4" />
                {paying ? t("mySubscription.processing") : t("mySubscription.repayNow")}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.staffUsage")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {subscription?.maxUsers != null
                    ? t("mySubscription.staffUsageValue", {
                        current: subscription?.currentUserCount ?? 0,
                        max: subscription.maxUsers,
                      })
                    : t("mySubscription.staffUnlimited", { current: subscription?.currentUserCount ?? 0 })}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.teleUsage")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {subscription?.teleconsultationMonthlyLimit != null
                    ? t("mySubscription.teleUsageValue", {
                        used: subscription?.teleconsultationUsedThisMonth ?? 0,
                        max: subscription.teleconsultationMonthlyLimit,
                      })
                    : t("mySubscription.teleUnlimited")}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.audience")}</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {lang === "fr" ? subscription?.targetAudienceFr : subscription?.targetAudienceEn}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">{t("mySubscription.includedFeatures")}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {planFeatureList(currentPlan).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <span>{t(`mySubscription.features.${feature}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.startDate")}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(subscription?.dateDebut, lang)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.nextDue")}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(subscription?.dateFin, lang)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("mySubscription.daysLeft")}</p>
                <p className={cn("mt-1 text-sm font-semibold", (subscription?.daysUntilDue ?? 0) <= 7 ? "text-warning" : "text-foreground")}>
                  {subscription?.daysUntilDue != null
                    ? t("mySubscription.daysLeftValue", { days: Math.max(0, subscription.daysUntilDue) })
                    : t("mySubscription.notSet")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              {t("mySubscription.quickInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t("mySubscription.infoBilling")}</p>
            <p>{t("mySubscription.infoSupport")}</p>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground">{user?.tenantLabel || subscription?.hospitalName}</p>
              <p className="mt-1">ID #{subscription?.idHopital ?? user?.idHopital ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>{t("mySubscription.availablePlans")}</CardTitle>
            <CardDescription>{t("mySubscription.availablePlansSub")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {sortedPlans.map((plan) => {
                const isCurrent = normalizePlanName(plan.name) === currentPlan
                const isChanging = changingPlan === plan.name
                const displayFeatures = lang === "fr" ? plan.features : (plan.featuresEn || plan.features)
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      "relative rounded-2xl border p-5 transition-all",
                      isCurrent ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20" : "border-border hover:shadow-md",
                      plan.popular && !isCurrent && "border-secondary/30",
                    )}
                  >
                    {plan.popular && (
                      <Badge variant="primary" className="absolute right-3 top-3 text-[10px] uppercase">
                        {t("mySubscription.popular")}
                      </Badge>
                    )}
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {lang === "fr" ? plan.targetAudienceFr : plan.targetAudienceEn}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-2 font-display text-3xl font-bold text-foreground">
                      {formatMoney(plan.price, lang)}
                      <span className="text-sm font-normal text-muted-foreground">{t("mySubscription.perMonth")}</span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {(displayFeatures || []).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-5 w-full"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || isChanging || paying}
                      onClick={() => handleChangePlan(plan.name)}
                    >
                      {isCurrent
                        ? t("mySubscription.currentBadge")
                        : isChanging
                          ? t("mySubscription.processing")
                          : t("mySubscription.selectPlan")}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>{t("mySubscription.history")}</CardTitle>
            <CardDescription>{t("mySubscription.historySub")}</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">{t("mySubscription.colPlan")}</th>
                    <th className="px-5 py-3 font-semibold">{t("mySubscription.colAmount")}</th>
                    <th className="px-5 py-3 font-semibold">{t("mySubscription.colStatus")}</th>
                    <th className="px-5 py-3 font-semibold">{t("mySubscription.colStart")}</th>
                    <th className="px-5 py-3 font-semibold">{t("mySubscription.colEnd")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(history || []).map((row) => (
                    <tr key={row.idAbonnement} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3.5">
                        <Badge variant={planBadge[row.planNom] || "default"}>{row.planNom}</Badge>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium">{formatMoney(row.montantMensuel, lang)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={row.statut === "actif" ? "success" : "default"}>
                          {t(`mySubscription.dbStatus.${row.statut || "actif"}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{formatDate(row.dateDebut, lang)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{formatDate(row.dateFin, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!history || history.length === 0) && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">{t("mySubscription.noHistory")}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <SubscriptionPaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        planName={subscription?.planNom || "Basic"}
        amountLabel={`${formatMoney(subscription?.montantMensuel, lang)}${t("mySubscription.perMonth")}`}
        onPay={processRepayment}
        paying={paying}
      />
    </motion.div>
  )
}

/** Bannière réutilisable sur le dashboard admin hôpital */
export function SubscriptionAlertBanner({ subscription, onRepay, paying }) {
  const { t } = useI18n()
  const { path } = useRolePath()
  if (!subscription?.needsPayment) return null

  return (
    <Card className="mb-4 border-warning/40 bg-warning/8">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t("mySubscription.paymentDueTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("mySubscription.paymentDueText")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onRepay} disabled={paying}>
            <CreditCard className="h-4 w-4" />
            {paying ? t("mySubscription.processing") : t("mySubscription.repayNow")}
          </Button>
          <Link
            to={path("/my-subscription")}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition-all hover:bg-muted"
          >
            {t("mySubscription.viewDetails")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
