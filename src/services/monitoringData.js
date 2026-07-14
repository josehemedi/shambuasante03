export const monitoringKpis = {
  uptime: { value: 99.98, delta: 0.02 },
  latency: { value: 142, delta: -12 },
  errorRate: { value: 0.12, delta: -0.05 },
  activeIncidents: { value: 2, delta: -1 },
  cpu: { value: 67, delta: -3.2 },
  memory: { value: 82, delta: 5.1 },
}

export const uptimeSeries = [
  { day: "Mon", uptime: 99.95 },
  { day: "Tue", uptime: 99.92 },
  { day: "Wed", uptime: 99.97 },
  { day: "Thu", uptime: 99.99 },
  { day: "Fri", uptime: 99.98 },
  { day: "Sat", uptime: 100 },
  { day: "Sun", uptime: 99.98 },
]

export const latencySeries = [
  { hour: "00", latency: 120 },
  { hour: "02", latency: 115 },
  { hour: "04", latency: 135 },
  { hour: "06", latency: 155 },
  { hour: "08", latency: 180 },
  { hour: "10", latency: 142 },
  { hour: "12", latency: 128 },
  { hour: "14", latency: 118 },
  { hour: "16", latency: 132 },
  { hour: "18", latency: 145 },
  { hour: "20", latency: 122 },
  { hour: "22", latency: 110 },
]

export const incidentTrends = [
  { day: "Mon", critical: 2, warning: 4, info: 8 },
  { day: "Tue", critical: 1, warning: 3, info: 6 },
  { day: "Wed", critical: 3, warning: 5, info: 9 },
  { day: "Thu", critical: 0, warning: 2, info: 7 },
  { day: "Fri", critical: 1, warning: 6, info: 10 },
  { day: "Sat", critical: 2, warning: 1, info: 4 },
  { day: "Sun", critical: 0, warning: 2, info: 5 },
]

export const incidents = [
  { id: "INC-2024-001", title: "Database failover", titleFr: "Basculement base de données", severity: "critical", status: "resolved", started: "Jun 28 14:32", resolved: "Jun 28 15:18", duration: "46 min", assignedTo: "DBA Team", priority: "high", description: "Automatic failover triggered during peak load", descriptionFr: "Basculement automatique déclenché pendant la charge de pointe", affectedServices: ["Database", "API Gateway"] },
  { id: "INC-2024-002", title: "API gateway timeout", titleFr: "Timeout passerelle API", severity: "warning", status: "resolved", started: "Jun 27 09:15", resolved: "Jun 27 09:42", duration: "27 min", assignedTo: "Platform Team", priority: "medium", description: "Upstream provider experienced latency spike", descriptionFr: "Le fournisseur amont a connu un pic de latence", affectedServices: ["API Gateway"] },
  { id: "INC-2024-003", title: "Teleconsultation disruption", titleFr: "Interruption téléconsultation", severity: "critical", status: "active", started: "Jun 30 08:45", resolved: null, duration: "52 min", assignedTo: "Infra Team", priority: "high", description: "STUN/TURN server connectivity issues", descriptionFr: "Problèmes de connectivité serveur STUN/TURN", affectedServices: ["Teleconsultation", "WebRTC"] },
  { id: "INC-2024-004", title: "Lab results delayed", titleFr: "Résultats labo en retard", severity: "warning", status: "active", started: "Jun 30 07:20", resolved: null, duration: "1 h 38 min", assignedTo: "Lab Ops", priority: "medium", description: "HL7 message queue backlog", descriptionFr: "Retard dans la file d'attente des messages HL7", affectedServices: ["Lab Results", "HL7 Interface"] },
  { id: "INC-2024-005", title: "Pharmacy inventory sync", titleFr: "Synchronisation inventaire pharmacie", severity: "info", status: "resolved", started: "Jun 29 16:00", resolved: "Jun 29 16:45", duration: "45 min", assignedTo: "Pharmacy Team", priority: "low", description: "Scheduled sync completed with minor delay", descriptionFr: "Synchronisation planifiée terminée avec un léger retard", affectedServices: ["Pharmacy"] },
]

export const alerts = [
  { id: "AL-001", service: "Auth Service", metric: "Response time", value: "420ms", threshold: ">300ms", time: "2 min ago", severity: "warning", description: "P99 latency exceeded threshold" },
  { id: "AL-002", service: "Database", metric: "Connection pool", value: "92%", threshold: ">90%", time: "5 min ago", severity: "warning", description: "Connection pool utilization near capacity" },
  { id: "AL-003", service: "Teleconsultation API", metric: "Error rate", value: "1.8%", threshold: ">1%", time: "12 min ago", severity: "critical", description: "5xx errors elevated above baseline" },
  { id: "AL-004", service: "AI Assistant", metric: "Latency", value: "2.1s", threshold: ">2s", time: "18 min ago", severity: "warning", description: "Inference latency above target" },
  { id: "AL-005", service: "Storage", metric: "Disk usage", value: "87%", threshold: ">85%", time: "25 min ago", severity: "warning", description: "Primary volume approaching capacity" },
  { id: "AL-006", service: "Email Service", metric: "Queue depth", value: "1.2k", threshold: ">1k", time: "32 min ago", severity: "info", description: "Message queue depth elevated but processing normally" },
]

export const serviceStatus = [
  { name: "API Gateway", status: "online", uptime: 99.99, region: "US-East", load: 34, responseTime: "45ms", version: "v2.4.1" },
  { name: "Auth Service", status: "online", uptime: 99.95, region: "US-East", load: 28, responseTime: "38ms", version: "v1.8.3" },
  { name: "Database", status: "online", uptime: 99.98, region: "US-East", load: 72, responseTime: "12ms", version: "v15.2" },
  { name: "Storage", status: "online", uptime: 100, region: "EU-West", load: 45, responseTime: "8ms", version: "v3.1.0" },
  { name: "Teleconsultation", status: "degraded", uptime: 98.5, region: "US-East", load: 89, responseTime: "210ms", version: "v2.1.4" },
  { name: "AI Assistant", status: "online", uptime: 99.87, region: "US-West", load: 56, responseTime: "1.4s", version: "v3.0.2" },
  { name: "Email Service", status: "online", uptime: 99.92, region: "EU-West", load: 22, responseTime: "95ms", version: "v1.2.7" },
  { name: "HL7 Interface", status: "online", uptime: 99.94, region: "US-East", load: 41, responseTime: "65ms", version: "v2.0.1" },
]

// AI Analytics mock data
export const aiAnalyticsKpis = {
  modelUsage: { value: 42847, delta: 18.4 },
  inferenceCost: { value: 2847, delta: -12.3 },
  adoption: { value: 78, delta: 5.2 },
  qualityScore: { value: 94.2, delta: 1.1 },
}

export const modelUsageSeries = [
  { day: "Mon", gpt4: 1240, claude: 980, medllm: 1560 },
  { day: "Tue", gpt4: 1320, claude: 1050, medllm: 1680 },
  { day: "Wed", gpt4: 1180, claude: 1120, medllm: 1720 },
  { day: "Thu", gpt4: 1450, claude: 1280, medllm: 1890 },
  { day: "Fri", gpt4: 1560, claude: 1340, medllm: 2010 },
  { day: "Sat", gpt4: 1120, claude: 980, medllm: 1620 },
  { day: "Sun", gpt4: 1080, claude: 890, medllm: 1540 },
]

export const inferenceCostSeries = [
  { day: "Mon", cost: 420 },
  { day: "Tue", cost: 445 },
  { day: "Wed", cost: 398 },
  { day: "Thu", cost: 480 },
  { day: "Fri", cost: 520 },
  { day: "Sat", cost: 380 },
  { day: "Sun", cost: 345 },
]

export const adoptionByTenant = [
  { name: "Accra Central", adoption: 89 },
  { name: "Lagos Mainland", adoption: 76 },
  { name: "Nairobi Health", adoption: 82 },
  { name: "Dakar Clinique", adoption: 64 },
  { name: "Kigali Care", adoption: 71 },
  { name: "Abidjan Santé", adoption: 58 },
]

export const qualityMetrics = [
  { model: "Med-LLM v2", accuracy: 96, precision: 94, recall: 92, f1: 93 },
  { model: "GPT-4 Turbo", accuracy: 92, precision: 89, recall: 91, f1: 90 },
  { model: "Claude 3", accuracy: 88, precision: 85, recall: 87, f1: 86 },
]

export const aiInsights = [
  { id: 1, text: "Diagnostic suggestions improved 15% after Med-LLM v2 update", textFr: "Les suggestions diagnostiques ont amélioré de 15% après la mise à jour Med-LLM v2", category: "improvement", time: "2h ago" },
  { id: 2, text: "Drug interaction check most used feature this week", textFr: "Vérification d'interactions médicamenteuses fonctionnalité la plus utilisée cette semaine", category: "usage", time: "4h ago" },
  { id: 3, text: "New protocol recommendations showing high engagement", textFr: "Nouveaux protocoles recommandés affichent un fort engagement", category: "engagement", time: "6h ago" },
]