import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Plus, ChevronDown, AlertTriangle } from 'lucide-react';
import { AnimatedDrawer } from '@/components/ui/AnimatedDrawer';

const Field = ({ label, children, error }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        {children}
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

const AppointmentDrawer = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        patient: null,
        doctor: '',
        department: '',
        date: '',
        startTime: '',
        duration: '30',
        consultationType: 'Présentiel',
        reason: '',
        notes: '',
        priority: 'Normale',
        status: 'Programmé',
    });
    const [errors, setErrors] = useState({});

    // Mock data
    const doctors = ["Dr. John Doe", "Dr. Jane Smith"];
    const departments = ["Cardiologie", "Neurologie", "Pédiatrie"];
    const patient = {
        fullName: "Jean Dupont",
        age: 45,
        gender: "Masculin",
        recordNumber: "P12345678",
        allergies: "Pénicilline"
    };

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const validate = () => {
        const newErrors = {};
        if (!formData.patient) newErrors.patient = 'Le patient est requis.';
        if (!formData.doctor) newErrors.doctor = 'Le médecin est requis.';
        if (!formData.date) newErrors.date = 'La date est requise.';
        if (!formData.startTime) newErrors.startTime = 'L\'heure est requise.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            console.log("Creating appointment:", formData);
            onClose();
        }
    };

    return (
        <AnimatedDrawer open={isOpen} onClose={onClose} panelClassName="bg-card">
                {/* Header */}
                <div className="p-6 border-b bg-gray-50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Nouveau rendez-vous</h2>
                                <p className="text-sm text-gray-500">Programmer une nouvelle consultation</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-grow p-6 overflow-y-auto space-y-8">
                    {/* Patient Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Patient</h3>
                        <Field label="Rechercher un patient" error={errors.patient}>
                            <div className="flex items-center space-x-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        placeholder="Nom, ID, ou numéro de téléphone"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        onChange={(e) => {
                                            if(e.target.value) setFormData({ ...formData, patient: patient });
                                            else setFormData({ ...formData, patient: null });
                                        }}
                                    />
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                                <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                                    <Plus size={16} /> Nouveau
                                </button>
                            </div>
                        </Field>
                        {formData.patient && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div><span className="font-semibold text-gray-600">Nom:</span> {formData.patient.fullName}</div>
                                <div><span className="font-semibold text-gray-600">Âge:</span> {formData.patient.age} ans</div>
                                <div><span className="font-semibold text-gray-600">Sexe:</span> {formData.patient.gender}</div>
                                <div><span className="font-semibold text-gray-600">Dossier:</span> {formData.patient.recordNumber}</div>
                                {formData.patient.allergies && (
                                    <div className="col-span-2 text-red-600 flex items-center">
                                        <AlertTriangle size={16} className="mr-2"/>
                                        <span className="font-semibold">Allergies:</span> {formData.patient.allergies}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Consultation Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Consultation</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Médecin" error={errors.doctor}>
                                <div className="relative">
                                    <select className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white" onChange={e => setFormData({...formData, doctor: e.target.value})}>
                                        <option value="">Sélectionner...</option>
                                        {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </Field>
                            <Field label="Spécialité">
                                <div className="relative">
                                    <select className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white" onChange={e => setFormData({...formData, department: e.target.value})}>
                                        <option value="">Sélectionner...</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Date" error={errors.date}>
                                <input type="date" className="w-full p-2 border border-gray-300 rounded-md" onChange={e => setFormData({...formData, date: e.target.value})} />
                            </Field>
                            <Field label="Heure" error={errors.startTime}>
                                <input type="time" className="w-full p-2 border border-gray-300 rounded-md" onChange={e => setFormData({...formData, startTime: e.target.value})} />
                            </Field>
                            <Field label="Durée (min)">
                                <input type="number" value={formData.duration} className="w-full p-2 border border-gray-300 rounded-md" onChange={e => setFormData({...formData, duration: e.target.value})} />
                            </Field>
                        </div>
                         <Field label="Type de consultation">
                            <div className="relative">
                                <select className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white" value={formData.consultationType} onChange={e => setFormData({...formData, consultationType: e.target.value})}>
                                    <option>Présentiel</option>
                                    <option>Téléconsultation</option>
                                    <option>Visite à domicile</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </Field>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Détails</h3>
                        <Field label="Motif de consultation">
                            <textarea rows="3" className="w-full p-2 border border-gray-300 rounded-md" onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
                        </Field>
                        <Field label="Notes">
                            <textarea rows="2" className="w-full p-2 border border-gray-300 rounded-md" onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Priorité">
                                <div className="relative">
                                    <select className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                                        <option>Normale</option>
                                        <option>Urgente</option>
                                        <option>Très urgente</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </Field>
                            <Field label="Statut">
                                <div className="relative">
                                    <select className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option>Programmé</option>
                                        <option>En attente</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors">
                            Annuler
                        </button>
                        <button type="button" className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors">
                            Enregistrer en brouillon
                        </button>
                        <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Créer le rendez-vous
                        </button>
                    </div>
                </div>
        </AnimatedDrawer>
    );
};

export default AppointmentDrawer;
