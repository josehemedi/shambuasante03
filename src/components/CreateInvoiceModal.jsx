import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { AnimatedModal } from '@/components/ui/AnimatedModal';

// Mock data for patients - in a real app, this would come from an API
const patients = [
  { value: 'Moussa Fall', label: 'Moussa Fall' },
  { value: 'Aissatou Diallo', label: 'Aissatou Diallo' },
  { value: 'Ibrahim Traoré', label: 'Ibrahim Traoré' },
  { value: 'Fatou Ndiaye', label: 'Fatou Ndiaye' },
  { value: 'Daouda Cissé', label: 'Daouda Cissé' },
  { value: 'Aminata Sarr', label: 'Aminata Sarr' },
  { value: 'Ousmane Sow', label: 'Ousmane Sow' },
];

export default function CreateInvoiceModal({ isOpen, onClose, onSave }) {
  const { t } = useI18n();
  const [newInvoice, setNewInvoice] = useState({
    patient: '',
    service: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Default to today
    status: 'Pending',
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setNewInvoice(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSelectChange = (name, value) => {
    setNewInvoice(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!newInvoice.patient || !newInvoice.service || newInvoice.amount <= 0) {
      alert('Please fill all required fields correctly.');
      return;
    }
    onSave(newInvoice);
  };

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-2xl">
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Create New Invoice</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Patient</label>
            <Select
              name="patient"
              value={newInvoice.patient}
              onValueChange={(value) => handleSelectChange('patient', value)}
              items={[{ value: '', label: 'Select a patient' }, ...patients]}
              className="mt-1 w-full"
            />
          </div>
           <div>
            <label className="text-sm font-medium text-muted-foreground">Invoice Date</label>
            <Input name="date" type="date" value={newInvoice.date} onChange={handleInputChange} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Service Description</label>
            <Input name="service" value={newInvoice.service} onChange={handleInputChange} placeholder="e.g., Cardiology Consultation & ECG" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Amount (XOF)</label>
            <Input name="amount" type="number" value={newInvoice.amount} onChange={handleInputChange} className="mt-1" />
          </div>
        </div>
        <div className="flex justify-end p-4 border-t">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSave}>Create and Send Invoice</Button>
        </div>
      </div>
    </AnimatedModal>
  );
}
