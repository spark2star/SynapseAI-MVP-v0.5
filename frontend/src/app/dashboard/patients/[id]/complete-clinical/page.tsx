'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/api';
import { PatientDemographicsResponse, PatientClinicalInfoRequest } from '@/types/patient';
import { FileText, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CompleteClinicalInfoPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [patient, setPatient] = useState<PatientDemographicsResponse | null>(null);
    const [formData, setFormData] = useState<PatientClinicalInfoRequest>({
        bloodGroup: '',
        allergies: '',
        medicalHistory: '',
        currentMedications: '',
        notes: '',
        tags: ''
    });

    useEffect(() => {
        loadPatientDemographics();
    }, [patientId]);

    const loadPatientDemographics = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getPatientDemographics(patientId);
            setPatient(data);
        } catch (error: any) {
            console.error('Error loading patient:', error);
            toast.error('Failed to load patient information');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            await apiClient.completePatientClinicalInfo(patientId, formData);

            toast.success('Clinical information saved successfully!');

            setTimeout(() => {
                router.push('/dashboard/patients');
            }, 1500);
        } catch (error: any) {
            console.error('Error saving clinical info:', error);
            const message = error.response?.data?.detail || 'Failed to save clinical information';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-800">Patient not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Pending Review
                </button>
                <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Complete Clinical Profile</h1>
                        <p className="text-gray-600 mt-1">Stage 2: Add clinical information for {patient.fullName}</p>
                    </div>
                </div>
            </div>

            {/* Demographics Summary (Read-only) */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Patient Demographics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Name</p>
                        <p className="text-blue-900 font-semibold">{patient.fullName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Age</p>
                        <p className="text-blue-900 font-semibold">{patient.age || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Gender</p>
                        <p className="text-blue-900 font-semibold capitalize">{patient.gender}</p>
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 font-medium">Phone</p>
                        <p className="text-blue-900 font-semibold">{patient.phonePrimary}</p>
                    </div>
                </div>
            </div>

            {/* Clinical Information Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Clinical Information</h2>

                    <div className="space-y-6">
                        {/* Blood Group */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Group
                            </label>
                            <select
                                name="bloodGroup"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select blood group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="unknown">Unknown</option>
                            </select>
                        </div>

                        {/* Allergies */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Allergies
                            </label>
                            <textarea
                                name="allergies"
                                value={formData.allergies}
                                onChange={handleChange}
                                placeholder="List any known allergies (comma-separated)"
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Example: Penicillin, Peanuts, Latex
                            </p>
                        </div>

                        {/* Medical History */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Medical History
                            </label>
                            <textarea
                                name="medicalHistory"
                                value={formData.medicalHistory}
                                onChange={handleChange}
                                placeholder="Past medical conditions, surgeries, chronic illnesses, etc."
                                rows={5}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Include relevant past diagnoses, surgeries, and chronic conditions
                            </p>
                        </div>

                        {/* Current Medications */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Medications
                            </label>
                            <textarea
                                name="currentMedications"
                                value={formData.currentMedications}
                                onChange={handleChange}
                                placeholder="List current medications with dosages (comma-separated)"
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Example: Metformin 500mg twice daily, Lisinopril 10mg once daily
                            </p>
                        </div>

                        {/* Clinical Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clinical Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Additional clinical observations or notes"
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags (Optional)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="e.g., high-risk, follow-up-needed"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Comma-separated tags for easy filtering
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Complete Clinical Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
