import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/primitives';
import { Input } from '@/components/ui/primitives';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives';

export default function CreateLabResultModal({ isOpen, onClose, onSave }) {
  const [patientId, setPatientId] = useState('');
  const [testName, setTestName] = useState('');
  const [value, setValue] = useState('');
  const [units, setUnits] = useState('');
  const [interpretation, setInterpretation] = useState('Normal');

  const resetForm = () => {
    setPatientId('');
    setTestName('');
    setValue('');
    setUnits('');
    setInterpretation('Normal');
  };

  const handleSave = () => {
    // Basic validation
    if (!patientId || !testName || !value) {
      alert('Please fill all required fields.');
      return;
    }
    
    const newResult = {
      patientId,
      // For now, we'll just use the ID as the name. In a real app, you'd fetch this.
      patientName: `Patient ${patientId}`, 
      testName,
      value: `${value} ${units}`,
      interpretation,
      status: 'Completed',
      resultDate: new Date().toISOString(),
      range: 'N/A', // This would be dynamic based on the test
    };
    onSave(newResult);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Reset form when modal is closed and re-opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter New Lab Result</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientId" className="text-right">
              Patient ID
            </Label>
            <Input id="patientId" value={patientId} onChange={(e) => setPatientId(e.target.value)} className="col-span-3" placeholder="e.g., PT-10301" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="testName" className="text-right">
              Test Name
            </Label>
            <Input id="testName" value={testName} onChange={(e) => setTestName(e.target.value)} className="col-span-3" placeholder="e.g., Hemoglobin A1c" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              Result Value
            </Label>
            <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} className="col-span-2" placeholder="e.g., 5.7" />
            <Input id="units" value={units} onChange={(e) => setUnits(e.target.value)} className="col-span-1" placeholder="e.g., %" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interpretation" className="text-right">
              Interpretation
            </Label>
            <Select onValueChange={setInterpretation} value={interpretation}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select interpretation" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Abnormal">Abnormal</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Result</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
