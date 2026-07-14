import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button, Badge } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { CheckCircle, Clock, AlertTriangle, User, Calendar, Beaker } from 'lucide-react';

const statusConfig = {
  "Pending": { variant: "warning", icon: Clock },
  "In Progress": { variant: "info", icon: Clock },
  "Completed": { variant: "success", icon: CheckCircle },
};

const priorityConfig = {
    "Routine": { variant: "secondary" },
    "Urgent": { variant: "warning" },
    "STAT": { variant: "destructive" },
};

const DetailRow = ({ label, value, children }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-b-0">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="col-span-2 text-sm text-foreground">{children || value}</dd>
    </div>
);

export default function TestRequestDetailModal({ request, onClose }) {
  if (!request) return null;

  const sConf = statusConfig[request.status] || { variant: "default", icon: Clock };
  const pConf = priorityConfig[request.priority] || { variant: "secondary" };
  const StatusIcon = sConf.icon;

  return (
    <Dialog open={!!request} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Request Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <dl>
                <DetailRow label="Request ID" value={request.id} />
                <DetailRow label="Patient">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{request.patientName} ({request.patientId})</span>
                    </div>
                </DetailRow>
                <DetailRow label="Test Name">
                     <div className="flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-muted-foreground" />
                        <span>{request.testName}</span>
                    </div>
                </DetailRow>
                <DetailRow label="Requested By" value={request.requestedBy} />
                <DetailRow label="Request Date">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(request.date, { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </div>
                </DetailRow>
                <DetailRow label="Priority">
                    <Badge variant={pConf.variant}>{request.priority}</Badge>
                </DetailRow>
                <DetailRow label="Status">
                    <Badge variant={sConf.variant} className="flex items-center gap-1.5 w-fit">
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{request.status}</span>
                    </Badge>
                </DetailRow>
                {request.resultatTexte && (
                  <DetailRow label="Résultat labo" value={request.resultatTexte} />
                )}
                {request.interpretation && (
                  <DetailRow label="Interprétation" value={request.interpretation} />
                )}
                {request.notes && (
                  <DetailRow label="Notes médecin" value={request.notes} />
                )}
            </dl>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
