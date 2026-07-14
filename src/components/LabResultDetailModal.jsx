import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const statusConfig = {
  "Pending": { variant: "secondary", icon: Clock },
  "In Progress": { variant: "warning", icon: Clock },
  "Completed": { variant: "success", icon: CheckCircle },
};

const interpretationConfig = {
  "Normal": { variant: "success" },
  "High": { variant: "destructive" },
  "Low": { variant: "warning" },
  "Abnormal": { variant: "destructive" },
  "N/A": { variant: "secondary" },
};

const DetailRow = ({ label, value, children }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-b-0">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="col-span-2 text-sm text-foreground">{children || value}</dd>
    </div>
);

export default function LabResultDetailModal({ result, onClose }) {
  if (!result) return null;

  const sConf = statusConfig[result.status] || { variant: "default", icon: Clock };
  const iConf = interpretationConfig[result.interpretation] || { variant: "secondary" };
  const StatusIcon = sConf.icon;

  return (
    <Dialog open={!!result} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lab Result Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <dl>
                <DetailRow label="Result ID" value={result.id} />
                <DetailRow label="Patient">
                    <div>{result.patientName} ({result.patientId})</div>
                </DetailRow>
                <DetailRow label="Test Name" value={result.testName} />
                <DetailRow label="Result Date" value={result.status === "Completed" ? formatDate(result.resultDate, { dateStyle: 'full', timeStyle: 'short' }) : 'N/A'} />
                <DetailRow label="Status">
                    <Badge variant={sConf.variant} className="flex items-center gap-1.5 w-fit">
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{result.status}</span>
                    </Badge>
                </DetailRow>
                <DetailRow label="Result Value" value={result.value} />
                <DetailRow label="Reference Range" value={result.range} />
                <DetailRow label="Interpretation">
                    <Badge variant={iConf.variant}>{result.interpretation}</Badge>
                </DetailRow>
            </dl>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
