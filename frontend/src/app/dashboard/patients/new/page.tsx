'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { apiService } from '@/services/api'
import Stage1Form, { Stage1Data } from '@/components/intake/Stage1Form'
import Stage2Form, { PatientSymptom } from '@/components/intake/Stage2Form'
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

type IntakeStage = 'stage1' | 'stage2' | 'complete'

interface CreatedPatient {
    patient_id: string
    name: string
}

export default function NewPatientPage() {
    const router = useRouter()
    const [currentStage, setCurrentStage] = useState<IntakeStage>('stage1')
    const [stage1Data, setStage1Data] = useState<Stage1Data | null>(null)
    const [createdPatient, setCreatedPatient] = useState<CreatedPatient | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleStage1Complete = async (data: Stage1Data) => {
        setIsLoading(true)
        try {
            // Call the intake API to create patient
            const response = await apiService.post('/intake/patients', {
                name: data.name,
                age: data.age,
                sex: data.sex,
                address: data.address,
                informants: data.informants,
                illness_duration: data.illness_duration,
                referred_by: data.referred_by,
                precipitating_factor: data.precipitating_factor
            })

            if (response.status === 'success' && response.data) {
                setStage1Data(data)
                setCreatedPatient({
                    patient_id: response.data.patient_id,
                    name: response.data.name
                })
                setCurrentStage('stage2')
                toast.success('Patient demographics saved successfully!')
            } else {
                throw new Error(response.error?.message || 'Failed to create patient')
            }
        } catch (error) {
            console.error('Stage 1 error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save patient information')
        } finally {
            setIsLoading(false)
        }
    }

    const handleStage2Complete = async (symptoms: PatientSymptom[]) => {
        if (!createdPatient) {
            toast.error('Patient information not found')
            return
        }

        setIsLoading(true)
        try {
            // Call the API to add symptoms to patient
            const response = await apiService.post(`/intake/patients/${createdPatient.patient_id}/symptoms`, symptoms)

            if (response.status === 'success') {
                toast.success(`Patient registration completed! Added ${symptoms.length} symptoms.`)
                // Redirect directly to patient detail page with first session modal auto-open
                router.replace(`/dashboard/patients/${createdPatient.patient_id}?newPatient=true&sessionType=first_session`)
            } else {
                throw new Error(response.error?.message || 'Failed to save symptoms')
            }
        } catch (error) {
            console.error('Stage 2 error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save symptoms')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => {
        if (currentStage === 'stage2') {
            setCurrentStage('stage1')
        } else if (currentStage === 'stage1') {
            router.back()
        }
    }

    if (currentStage === 'complete') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50 p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <CheckCircleIcon className="h-10 w-10 text-white" />
                        </div>

                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                            Patient Registration Complete! 🎉
                        </h1>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-6">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                                Successfully Registered:
                            </h3>
                            <p className="text-emerald-700 dark:text-emerald-300 text-lg font-medium">
                                {createdPatient?.name}
                            </p>
                            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                                Patient ID: {createdPatient?.patient_id}
                            </p>
                        </div>

                        <div className="text-slate-600 dark:text-slate-400 mb-8">
                            <p className="mb-2">✅ Demographics and basic information saved</p>
                            <p className="mb-4">✅ Symptoms and clinical details recorded</p>

                            <div className="text-sm bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
                                <p className="text-sky-800 dark:text-sky-200">
                                    Redirecting you to the patient list in a moment...
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard/patients')}
                                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                            >
                                View Patient List
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
            <div className="p-6 lg:p-8">
                {/* Header with Navigation */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-xl transition-colors duration-200"
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                New Patient Registration
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Complete the two-stage intake process for mental health consultation
                            </p>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-100/50 dark:border-slate-700/50 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Stage 1 */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${currentStage === 'stage1'
                                        ? 'bg-sky-500 text-white shadow-lg'
                                        : currentStage === 'stage2'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {currentStage === 'stage1' ? '1' : currentStage === 'stage2' ? '✓' : '1'}
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm ${currentStage === 'stage1'
                                            ? 'text-sky-600 dark:text-sky-400'
                                            : currentStage === 'stage2'
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-slate-600 dark:text-slate-400'
                                            }`}>
                                            Demographics
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                            Basic patient information
                                        </p>
                                    </div>
                                </div>

                                {/* Connector */}
                                <div className={`w-16 h-1 rounded-full ${currentStage === 'stage2'
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-200 dark:bg-slate-600'
                                    }`} />

                                {/* Stage 2 */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${currentStage === 'stage2'
                                        ? 'bg-emerald-500 text-white shadow-lg'
                                        : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        2
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm ${currentStage === 'stage2'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}>
                                            Symptoms
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                            Clinical symptom assessment
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    Step {currentStage === 'stage1' ? '1' : '2'} of 2
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    {currentStage === 'stage1' ? 'Patient Information' : 'Symptom Assessment'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stage Content */}
                {currentStage === 'stage1' && (
                    <Stage1Form
                        onNext={handleStage1Complete}
                        initialData={stage1Data || undefined}
                        isLoading={isLoading}
                    />
                )}

                {currentStage === 'stage2' && createdPatient && (
                    <Stage2Form
                        patientId={createdPatient.patient_id}
                        patientName={createdPatient.name}
                        onComplete={handleStage2Complete}
                        onBack={handleBack}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    )
}