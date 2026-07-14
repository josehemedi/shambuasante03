import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/I18nProvider";
import { AnimatedModal } from "@/components/ui/AnimatedModal";
import toast from "react-hot-toast";

// Mock patients - in a real app, this would come from an API
const mockPatients = [
  { id: "PT-10293", name: "Amara Diallo" },
  { id: "PT-10296", name: "Tunde Bakare" },
  { id: "PT-10297", name: "Naledi Khumalo" },
  { id: "PT-10298", name: "Ibrahim Cissé" },
];

function NewPrescriptionModal({ isOpen = true, onClose, onSave }) {
  const { t } = useI18n();
  const [patientId, setPatientId] = useState("");
  const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "" }]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "" }]);
  };

  const handleMedicationChange = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleRemoveMedication = (index) => {
    const newMedications = medications.filter((_, i) => i !== index);
    setMedications(newMedications);
  };

  // Helper to simulate network delay
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient || medications.some(m => !m.name || !m.dosage || !m.frequency)) {
      toast.error("Please fill all fields correctly.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await sleep(1500); 

      onSave({
        patientName: patient.name,
        patientId,
        medications,
      });
      
      toast.success(`Prescription for ${patient.name} issued successfully!`);
      onClose();

    } catch (error) {
      console.error("Failed to issue prescription.", error);
      toast.error("Failed to issue prescription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-2xl" zIndex={9999}>
        <Card
          className="w-full"
          as="form"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">New Prescription</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="patient" className="block text-sm font-medium text-muted-foreground mb-1">
                Patient
              </label>
              <select
                id="patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="" disabled>Select a patient</option>
                {mockPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-md font-semibold mb-2">Medications</h3>
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-3 border border-border rounded-md relative">
                     <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Medication Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Lisinopril"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                        className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g., 10mg"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                        className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g., Once a day"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                        className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-6 w-6"
                        onClick={() => handleRemoveMedication(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMedication} className="mt-4">
                Add Medication
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                "Issue Prescription"
              )}
            </Button>
          </div>
        </Card>
    </AnimatedModal>
  );
}

export default NewPrescriptionModal;
