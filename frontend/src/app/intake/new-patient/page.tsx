'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
    address: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.createPatient({
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        contact_number: formData.contactNumber,
        email: formData.email || undefined,
        address: formData.address || undefined,
        medical_history: formData.medicalHistory || undefined,
        current_medications: formData.currentMedications || undefined,
        allergies: formData.allergies || undefined,
        emergency_contact_name: formData.emergencyContactName || undefined,
        emergency_contact_number: formData.emergencyContactNumber || undefined
      });

      if (response.status === 'success') {
        const newPatientId = response.data.patient_id;
        
        console.log('✅ Patient created successfully:', newPatientId);
        
        alert('Patient registered successfully!');
        
        // Redirect to the NEW patient's page with first session pre-selected
        router.push(`/dashboard/patients/${newPatientId}?newPatient=true&sessionType=first_session`);
      }
    } catch (err: any) {
      console.error('❌ Patient registration error:', err);
      setError(err.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutralGray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/patients')}
            className="p-2 hover:bg-neutralGray-200 rounded-button transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutralGray-700" />
          </button>
          <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue">
            Register New Patient
          </h1>
        </div>

        {/* Form */}
        <Card>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card">
              <p className="text-warningRed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
                Basic Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  options={[
                    { value: '', label: 'Select gender' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ]}
                  required
                />
                <Input
                  label="Contact Number"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Email (Optional)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  label="Address (Optional)"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h2 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
                Medical Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-body font-medium text-neutralGray-700 mb-2">
                    Medical History (Optional)
                  </label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-neutralGray-300 rounded-input focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20"
                    placeholder="Previous diagnoses, chronic conditions..."
                  />
                </div>

                <div>
                  <label className="block text-body font-medium text-neutralGray-700 mb-2">
                    Current Medications (Optional)
                  </label>
                  <textarea
                    value={formData.currentMedications}
                    onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-neutralGray-300 rounded-input focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20"
                    placeholder="List current medications..."
                  />
                </div>

                <div>
                  <label className="block text-body font-medium text-neutralGray-700 mb-2">
                    Allergies (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Any known allergies..."
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h2 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
                Emergency Contact
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Name"
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="Contact person name"
                />
                <Input
                  label="Emergency Contact Number"
                  type="tel"
                  value={formData.emergencyContactNumber}
                  onChange={(e) => setFormData({ ...formData, emergencyContactNumber: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-6 border-t border-neutralGray-200">
              <Button
                variant="secondary"
                onClick={() => router.push('/patients')}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={loading}
                leftIcon={<Save className="w-5 h-5" />}
              >
                Register Patient
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
