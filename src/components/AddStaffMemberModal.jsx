import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui/primitives';
import { useI18n } from '@/i18n/I18nProvider';
import { AnimatedModal } from '@/components/ui/AnimatedModal';

const departments = [
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Nursing', label: 'Nursing' },
  { value: 'Administration', label: 'Administration' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'General Medicine', label: 'General Medicine' },
  { value: 'Radiology', label: 'Radiology' },
];

const roles = [
    { value: 'Cardiologist', label: 'Cardiologist' },
    { value: 'Head Nurse', label: 'Head Nurse' },
    { value: 'Receptionist', label: 'Receptionist' },
    { value: 'Pediatrician', label: 'Pediatrician' },
    { value: 'Lab Technician', label: 'Lab Technician' },
    { value: 'Pharmacist', label: 'Pharmacist' },
    { value: 'General Practitioner', label: 'General Practitioner' },
    { value: 'Radiologist', label: 'Radiologist' },
];


export default function AddStaffMemberModal({ isOpen, onClose, onSave }) {
  const { t } = useI18n();
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    status: 'Active',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setNewStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Basic validation
    if (!newStaff.name || !newStaff.role || !newStaff.department || !newStaff.email) {
      // Here you could add a more robust notification to the user
      alert('Please fill all required fields.');
      return;
    }
    onSave(newStaff);
    onClose(); // Close modal after saving
  };

  return (
    <AnimatedModal open={isOpen} onClose={onClose} contentClassName="max-w-2xl">
      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add New Staff Member</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
            <Input name="name" value={newStaff.name} onChange={handleInputChange} placeholder="e.g., Mariama Diallo" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
            <Input name="email" type="email" value={newStaff.email} onChange={handleInputChange} placeholder="mariama.diallo@clinic.com" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
            <Input name="phone" value={newStaff.phone} onChange={handleInputChange} placeholder="+221 77 123 45 67" className="mt-1" />
          </div>
           <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <Select
              name="role"
              value={newStaff.role}
              onValueChange={(value) => handleSelectChange('role', value)}
              items={roles}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Department</label>
            <Select
              name="department"
              value={newStaff.department}
              onValueChange={(value) => handleSelectChange('department', value)}
              items={departments}
              className="mt-1 w-full"
            />
          </div>
        </div>
        <div className="flex justify-end p-4 border-t">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Member</Button>
        </div>
      </div>
    </AnimatedModal>
  );
}
