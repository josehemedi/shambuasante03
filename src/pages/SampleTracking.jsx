import { useMemo, useState } from "react"
import { Search, Filter, Download, Eye, Edit, Plus, MapPin, Beaker, User, Calendar, Clock, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/primitives"
import { useI18n } from "@/i18n/I18nProvider"
import { formatDate } from "@/lib/utils"

// Mock data - replace with API call
const mockSamples = [
  {
    id: "SAM-2026-0706-001",
    patientName: "Fatima Zahra",
    patientId: "PT-10301",
    sampleType: "Blood (Serum)",
    collectionDate: "2026-07-06T09:00:00Z",
    collectedBy: "Nurse A. Diallo",
    status: "In Transit",
    location: "Courier to Central Lab",
    testRequested: "Lipid Panel",
  },
  {
    id: "SAM-2026-0706-002",
    patientName: "Jean-Pierre Faye",
    patientId: "PT-10302",
    sampleType: "Urine",
    collectionDate: "2026-07-06T09:30:00Z",
    collectedBy: "Nurse B. Sarr",
    status: "Received",
    location: "Central Lab - Reception",
    testRequested: "Urinalysis",
  },
  {
    id: "SAM-2026-0705-089",
    patientName: "Ngozi Okoro",
    patientId: "PT-10299",
    sampleType: "Tissue Biopsy",
    collectionDate: "2026-07-05T14:15:00Z",
    collectedBy: "Dr. C. Mensah",
    status: "In Storage",
    location: "Pathology Dept. - Fridge A2",
    testRequested: "Histopathology",
  },
  {
    id: "SAM-2026-0705-088",
    patientName: "Kwame Appiah",
    patientId: "PT-10300",
    sampleType: "Blood (Plasma)",
    collectionDate: "2026-07-05T11:00:00Z",
    collectedBy: "Phlebotomist D. Traoré",
    status: "Processing",
    location: "Hematology Analyzer",
    testRequested: "CBC",
  },
    {
    id: "SAM-2026-0704-087",
    patientName: "Amina Benali",
    patientId: "PT-10295",
    sampleType: "Saliva",
    collectionDate: "2026-07-04T16:00:00Z",
    collectedBy: "Self-collected",
    status: "Awaiting Collection",
    location: "Patient's Home",
    testRequested: "Genetic Test",
  },
  {
    id: "SAM-2026-0704-086",
    patientName: "David Chen",
    patientId: "PT-10294",
    sampleType: "Blood (Whole)",
    collectionDate: "2026-07-04T10:20:00Z",
    collectedBy: "Phlebotomist E. Gueye",
    status: "Disposed",
    location: "Biohazard Waste",
    testRequested: "Blood Type",
  },
];

const statusConfig = {
  "Awaiting Collection": { variant: "secondary", icon: Clock },
  "In Transit": { variant: "info", icon: MapPin },
  "Received": { variant: "primary", icon: Eye },
  "Processing": { variant: "warning", icon: Beaker },
  "In Storage": { variant: "default", icon: MapPin },
  "Disposed": { variant: "destructive", icon: Eye },
  "Completed": { variant: "success", icon: CheckCircle },
};

export default function SampleTracking() {
  const { t } = useI18n();
  const [samples, setSamples] = useState(mockSamples);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredSamples = useMemo(() => {
    return samples.filter(sample => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        sample.id.toLowerCase().includes(searchLower) ||
        sample.patientName.toLowerCase().includes(searchLower) ||
        sample.patientId.toLowerCase().includes(searchLower) ||
        sample.sampleType.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === "All" || sample.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [samples, searchTerm, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Sample Tracking"
        subtitle="Monitor laboratory samples from collection to disposal."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register New Sample
          </Button>
        }
      />

      <Card className="m-6">
        <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Sample ID, Patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select onValueChange={setStatusFilter} defaultValue="All">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {Object.keys(statusConfig).map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sample ID</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Sample Type</th>
                <th className="px-4 py-3 font-medium">Collection Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Current Location</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSamples.map((sample) => {
                const config = statusConfig[sample.status] || { variant: "default", icon: Beaker };
                const Icon = config.icon;
                return (
                  <tr key={sample.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-mono text-xs">{sample.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{sample.patientName}</div>
                      <div className="text-xs text-muted-foreground">{sample.patientId}</div>
                    </td>
                    <td className="px-4 py-3">{sample.sampleType}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(sample.collectionDate, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3">
                      <Badge variant={config.variant} className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{sample.status}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{sample.location}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredSamples.length === 0 && (
            <div className="text-center p-10 text-muted-foreground">
                <p>No samples found.</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
        )}
      </Card>
    </div>
  );
}
