import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Settings,
  Palette,
  Globe,
  Flag,
  Plug,
  Shield,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  MessageSquare,
  CreditCard,
  HardDrive,
  Mail,
  FlaskConical,
  Sparkles,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Switch, Progress } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { useAsync } from "@/hooks/useAsync"
import { settingsService } from "@/services/api"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "branding", labelKey: "platformSettings.branding", icon: Palette },
  { key: "regions", labelKey: "platformSettings.regions", icon: Globe },
  { key: "flags", labelKey: "platformSettings.featureFlags", icon: Flag },
  { key: "integrations", labelKey: "platformSettings.integrations", icon: Plug },
  { key: "security", labelKey: "platformSettings.security", icon: Shield },
]

const statusBadge = {
  active: "success",
  enabled: "success",
  online: "success",
  degraded: "warning",
  inactive: "default",
  disabled: "default",
  offline: "destructive",
}

const integrationIconMap = {
  MessageSquare: MessageSquare,
  CreditCard: CreditCard,
  HardDrive: HardDrive,
  Mail: Mail,
  FlaskConical: FlaskConical,
  Sparkles: Sparkles,
}

export default function PlatformSettings() {
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState("branding")
  const [saveMessage, setSaveMessage] = useState("")
  const [testingId, setTestingId] = useState(null)

  const { data: branding, mutate: mutateBranding } = useAsync(() => settingsService.getBranding(), [])
  const { data: regions } = useAsync(() => settingsService.getRegions(), [])
  const { data: flags } = useAsync(() => settingsService.getFeatureFlags(), [])
  const { data: integrations } = useAsync(() => settingsService.getIntegrations(), [])
  const { data: security } = useAsync(() => settingsService.getSecurityPolicies(), [])

  const [form, setForm] = useState({
    platformName: "",
    supportEmail: "",
    primaryColor: "",
    logoUrl: "",
    faviconUrl: "",
  })

  const [securityForm, setSecurityForm] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    expiryDays: 90,
    historyCount: 5,
    timeoutMinutes: 30,
    maxConcurrentSessions: 3,
    enforce2FA: true,
    ipWhitelistEnabled: true,
    retentionDays: 2555,
    logLevel: "verbose",
    alertOnAnomaly: true,
    notifyAdmins: true,
  })

  const [flagStates, setFlagStates] = useState({})

  const handleBrandingChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSecurityChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setSecurityForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleFlag = (id) => {
    setFlagStates((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    setSaveMessage(t("platformSettings.saving"))
    await settingsService.updateBranding(form)
    await settingsService.updateSecurityPolicies(securityForm)
    setSaveMessage(t("platformSettings.saved"))
    setTimeout(() => setSaveMessage(""), 3000)
  }

  const handleTestConnection = async (id) => {
    setTestingId(id)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setTestingId(null)
  }

  const activeFlags = useMemo(() => (flags || []).filter((f) => f.enabled || (flagStates[f.id] && !f.enabled)), [flags, flagStates])
  const inactiveFlags = useMemo(() => (flags || []).filter((f) => !f.enabled && !flagStates[f.id]), [flags, flagStates])

  return (
    <div>
      <PageHeader
        title={t("platformSettings.title")}
        subtitle={t("platformSettings.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            {saveMessage && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="h-4 w-4" />
                {saveMessage}
              </span>
            )}
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
              {t("platformSettings.save")}
            </Button>
          </div>
        }
      />

      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="mt-4">
        {activeTab === "branding" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.branding")}</CardTitle>
                <CardDescription>{t("platformSettings.brandingSub")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("platformSettings.platformName")}</label>
                    <Input value={form.platformName} onChange={handleBrandingChange("platformName")} placeholder={branding?.platformName || "ShambuaSante"} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("platformSettings.supportEmail")}</label>
                    <Input value={form.supportEmail} onChange={handleBrandingChange("supportEmail")} placeholder={branding?.supportEmail || "support@shambua.health"} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("platformSettings.primaryColor")}</label>
                    <div className="flex items-center gap-3">
                      <Input
                        value={form.primaryColor}
                        onChange={handleBrandingChange("primaryColor")}
                        placeholder={branding?.primaryColor || "#4F46E5"}
                        className="font-mono"
                      />
                      <div className="h-10 w-10 rounded-xl border border-border" style={{ backgroundColor: form.primaryColor || branding?.primaryColor || "#4F46E5" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("platformSettings.logoUrl")}</label>
                    <Input value={form.logoUrl} onChange={handleBrandingChange("logoUrl")} placeholder={branding?.logoUrl || "/logo.svg"} />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-medium text-foreground">{t("platformSettings.faviconUrl")}</label>
                    <Input value={form.faviconUrl} onChange={handleBrandingChange("faviconUrl")} placeholder={branding?.faviconUrl || "/favicon.ico"} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "regions" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.regions")}</CardTitle>
                <CardDescription>{t("platformSettings.regionsSub")}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colName")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colCode")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colStatus")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colLatency")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colHospitals")}</th>
                        <th className="px-5 py-3 font-semibold">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(regions || []).map((region, i) => (
                        <motion.tr
                          key={region.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Globe className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{lang === "fr" && region.nameFr ? region.nameFr : region.name}</p>
                                {region.primary && <span className="text-xs text-primary">{t("platformSettings.primary")}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{region.code}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={statusBadge[region.status] || "default"}>{t(`platformSettings.${region.status}`)}</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{region.latency}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{region.hospitals}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Switch checked={region.status === "active"} onCheckedChange={() => {}} />
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(!regions || regions.length === 0) && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("platformSettings.noRegions")}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "flags" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.featureFlags")}</CardTitle>
                <CardDescription>{t("platformSettings.featureFlagsSub")}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colName")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colKey")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colCategory")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colRollout")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colDescription")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colStatus")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(flags || []).map((flag, i) => {
                        const isEnabled = flag.enabled || flagStates[flag.id]
                        return (
                          <motion.tr
                            key={flag.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={cn(
                              "border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40",
                              isEnabled && "bg-success/5",
                            )}
                          >
                            <td className="px-5 py-3.5 text-sm font-medium text-foreground">{lang === "fr" && flag.nameFr ? flag.nameFr : flag.name}</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{flag.key}</td>
                            <td className="px-5 py-3.5">
                              <Badge variant="secondary">{flag.category}</Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <Progress value={flag.rollout} className="h-1.5 w-20" />
                                <span className="text-xs text-muted-foreground">{flag.rollout}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[200px] truncate" title={lang === "fr" && flag.descriptionFr ? flag.descriptionFr : flag.description}>
                              {lang === "fr" && flag.descriptionFr ? flag.descriptionFr : flag.description}
                            </td>
                            <td className="px-5 py-3.5">
                              <Switch checked={isEnabled} onCheckedChange={() => toggleFlag(flag.id)} />
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {(!flags || flags.length === 0) && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("platformSettings.noFlags")}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "integrations" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.integrations")}</CardTitle>
                <CardDescription>{t("platformSettings.integrationsSub")}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colName")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colType")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colStatus")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colLastSync")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colVersion")}</th>
                        <th className="px-5 py-3 font-semibold">{t("platformSettings.colEndpoint")}</th>
                        <th className="px-5 py-3 font-semibold">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(integrations || []).map((integration, i) => {
                        const IconComponent = integrationIconMap[integration.icon] || Plug
                        return (
                          <motion.tr
                            key={integration.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{lang === "fr" && integration.nameFr ? integration.nameFr : integration.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant="secondary">{lang === "fr" && integration.typeFr ? integration.typeFr : integration.type}</Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {integration.status === "active" && <CheckCircle2 className="h-4 w-4 text-success" />}
                                {integration.status === "degraded" && <AlertTriangle className="h-4 w-4 text-warning" />}
                                {integration.status === "inactive" && <XCircle className="h-4 w-4 text-muted-foreground" />}
                                <Badge variant={statusBadge[integration.status] || "default"}>
                                  {t(`platformSettings.${integration.status}`)}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">{integration.lastSync}</td>
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-xs text-muted-foreground">{integration.apiVersion}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-xs text-muted-foreground">{integration.endpoint}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestConnection(integration.id)}
                                disabled={testingId === integration.id}
                              >
                                {testingId === integration.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4" />
                                    {t("platformSettings.testConnection")}
                                  </>
                                )}
                              </Button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {(!integrations || integrations.length === 0) && (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">{t("platformSettings.noIntegrations")}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.passwordPolicy")}</CardTitle>
                <CardDescription>{t("platformSettings.passwordPolicy")}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.minLength")}</label>
                  <Input type="number" value={securityForm.minLength} onChange={handleSecurityChange("minLength")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.expiryDays")}</label>
                  <Input type="number" value={securityForm.expiryDays} onChange={handleSecurityChange("expiryDays")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.historyCount")}</label>
                  <Input type="number" value={securityForm.historyCount} onChange={handleSecurityChange("historyCount")} />
                </div>
                <div className="space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("platformSettings.requireUppercase")}</p>
                    </div>
                    <Switch checked={securityForm.requireUppercase} onCheckedChange={handleSecurityChange("requireUppercase")} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("platformSettings.requireNumbers")}</p>
                    </div>
                    <Switch checked={securityForm.requireNumbers} onCheckedChange={handleSecurityChange("requireNumbers")} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("platformSettings.requireSpecialChars")}</p>
                    </div>
                    <Switch checked={securityForm.requireSpecialChars} onCheckedChange={handleSecurityChange("requireSpecialChars")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.sessionPolicy")}</CardTitle>
                <CardDescription>{t("platformSettings.sessionPolicy")}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.timeoutMinutes")}</label>
                  <Input type="number" value={securityForm.timeoutMinutes} onChange={handleSecurityChange("timeoutMinutes")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.maxSessions")}</label>
                  <Input type="number" value={securityForm.maxConcurrentSessions} onChange={handleSecurityChange("maxConcurrentSessions")} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 lg:col-span-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("platformSettings.require2FA")}</p>
                  </div>
                  <Switch checked={securityForm.enforce2FA} onCheckedChange={handleSecurityChange("enforce2FA")} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 lg:col-span-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("platformSettings.ipWhitelist")}</p>
                  </div>
                  <Switch checked={securityForm.ipWhitelistEnabled} onCheckedChange={handleSecurityChange("ipWhitelistEnabled")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("platformSettings.auditPolicy")}</CardTitle>
                <CardDescription>{t("platformSettings.auditPolicy")}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.retentionDays")}</label>
                  <Input type="number" value={securityForm.retentionDays} onChange={handleSecurityChange("retentionDays")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("platformSettings.logLevel")}</label>
                  <select
                    value={securityForm.logLevel}
                    onChange={handleSecurityChange("logLevel")}
                    className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="verbose">Verbose</option>
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 lg:col-span-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("platformSettings.alertAnomaly")}</p>
                  </div>
                  <Switch checked={securityForm.alertOnAnomaly} onCheckedChange={handleSecurityChange("alertOnAnomaly")} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 lg:col-span-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("platformSettings.notifyAdmins")}</p>
                  </div>
                  <Switch checked={securityForm.notifyAdmins} onCheckedChange={handleSecurityChange("notifyAdmins")} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
