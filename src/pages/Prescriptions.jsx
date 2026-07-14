import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Filter, Download, Printer, Eye } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { formatDate } from "@/lib/utils"

// Mock data for prescriptions - replace with API call
const mockPrescriptions = [
  {
    id: "PRES-001",
    patientName: "Amara Diallo",
    patientId: "PT-10293",
    doctorName: "Dr. Kwame Mensah",
    date: "2026-07-05",
    status: "Active",
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once a day" },
      { name: "Amlodipine", dosage: "5mg", frequency: "Once a day" },
    ],
  },
  {
    id: "PRES-002",
    patientName: "Tunde Bakare",
    patientId: "PT-10296",
    doctorName: "Dr. Kwame Mensah",
    date: "2026-07-03",
    status: "Filled",
    medications: [{ name: "Fluorouracil", dosage: "Cycle 4", frequency: "As directed" }],
  },
  {
    id: "PRES-003",
    patientName: "Naledi Khumalo",
    patientId: "PT-10297",
    doctorName: "Dr. Ngozi Achebe",
    date: "2026-06-28",
    status: "Expired",
    medications: [{ name: "Sumatriptan", dosage: "50mg", frequency: "As needed" }],
  },
    {
    id: "PRES-004",
    patientName: "Ibrahim Cissé",
    patientId: "PT-10298",
    doctorName: "Dr. Aïcha Bello",
    date: "2026-06-25",
    status: "Active",
    medications: [{ name: "Salbutamol Inhaler", dosage: "2 puffs", frequency: "As needed" }],
  },
];

const statuses = ["All", "Active", "Filled", "Expired"];

export default function Prescriptions() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState(mockPrescriptions);
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All")

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      const matchesQuery =
        p.patientName.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "All" || p.status === status
      return matchesQuery && matchesStatus
    })
  }, [prescriptions, query, status])

  return (
    <div>
      <PageHeader
        title={t("nav.prescriptions")}
        subtitle="Manage and issue new patient prescriptions"
        actions={
          <>
            <Button variant="outline" size="md">
              <Download className="h-4 w-4" />
              {t("common.export")}
            </Button>
            <Button size="md">
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </>
        }
      />

      <main className="p-6 space-y-6">
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-card p-4 shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Prescription ID</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Date Issued</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Prescribing Doctor</th>
                  <th className="w-28 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((p) => (
                  <tr key={p.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3 font-medium">{p.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{p.patientName}</div>
                      <div className="text-xs text-muted-foreground">{p.patientId}</div>
                    </td>
                    <td className="px-5 py-3">{formatDate(p.date)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          p.status === "Active" ? "success" : p.status === "Expired" ? "destructive" : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">{p.doctorName}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
