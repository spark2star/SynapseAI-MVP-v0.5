'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Plus, Search, Users, Calendar, Phone, Mail } from 'lucide-react';



// ✅ MATCH BACKEND RESPONSE:
interface Patient {
    id: string;
    name: string;
    age: number;
    sex: string;
    phone: string;
    email?: string;
    address?: string;
    referred_by?: string;
    illness_duration?: string;
    last_visit?: string;
    created_at: string;
    updated_at: string;
}

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPatients, setTotalPatients] = useState(0);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    useEffect(() => {
        // Only fetch on initial mount
        fetchPatients();
    }, [offset]); // Only depends on offset, not searchTerm

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchPatients();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]); // Separate effect for search



    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            console.log('📋 Fetching patients (offset:', offset, ', search:', searchTerm || 'none', ')...');

            const response = await apiService.getPatients({
                limit,
                offset,
                search: searchTerm || undefined
            });

            console.log('🔍 COMPLETE RESPONSE:', JSON.stringify(response, null, 2));

            // Backend structure: { status: "success", data: { items: [], total: 10 } }
            // apiService.getPatients() returns that exact structure
            if (response?.status === 'success' && response?.data) {
                const items = response.data.items || [];
                const total = response.data.total || 0;

                setPatients(items);
                setTotalPatients(total);

                console.log(`✅ SUCCESS: Loaded ${items.length} patients (Total: ${total})`);
            } else {
                console.warn('⚠️ Unexpected response:', response);
                setPatients([]);
                setTotalPatients(0);
            }
        } catch (err: any) {
            console.error('❌ Error:', err);
            setError(err.message || 'Failed to load patients');
            setPatients([]);
            setTotalPatients(0);
        } finally {
            setLoading(false);
        }
    }, [limit, offset, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(fetchPatients, searchTerm ? 300 : 0);
        return () => clearTimeout(timer);
    }, [fetchPatients]);



    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (offset !== 0) {
            setOffset(0); // Reset pagination when searching
        }
    };


    if (loading && patients.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutralGray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-synapseSkyBlue mx-auto mb-4"></div>
                    <p className="text-neutralGray-700">Loading patients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutralGray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            Patients
                        </h1>
                        <p className="text-neutralGray-700 mt-1">
                            {totalPatients} total patients
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => router.push('/intake/new-patient')}
                        leftIcon={<Plus className="w-5 h-5" />}
                    >
                        Add New Patient
                    </Button>
                </div>

                {/* Search Bar */}
                <Card className="mb-6">
                    <Input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        leftIcon={<Search className="w-5 h-5" />}
                    />
                </Card>

                {/* Error State */}
                {error && (
                    <Card className="mb-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-warningRed" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-warningRed">Error</h3>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={fetchPatients} className="mt-4">
                            Retry
                        </Button>
                    </Card>
                )}

                {/* Empty State */}
                {!loading && patients.length === 0 && !error && (
                    <Card className="text-center py-16">
                        <Users className="w-16 h-16 text-neutralGray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-neutralBlack mb-2">
                            No Patients Found
                        </h3>
                        <p className="text-neutralGray-700 mb-6">
                            {searchTerm
                                ? `No patients match "${searchTerm}"`
                                : 'Start by adding your first patient'}
                        </p>
                        {!searchTerm && (
                            <Button variant="primary" onClick={() => router.push('/intake/new-patient')}>
                                Add First Patient
                            </Button>
                        )}
                    </Card>
                )}

                {/* Patients Grid */}
                {patients.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.map((patient) => (
                            <Card
                                key={patient.id}
                                className="hover:shadow-xl transition-shadow cursor-pointer"
                                onClick={() => router.push(`/patients/${patient.id}`)}
                            >
                                {/* Patient Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-synapseSkyBlue/10 rounded-full flex items-center justify-center">
                                            <span className="text-xl font-semibold text-synapseSkyBlue">
                                                {patient.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-semibold text-neutralBlack">
                                                {patient.name}
                                            </h3>
                                            <p className="text-sm text-neutralGray-700">
                                                {patient.sex} • {patient.age} years
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-neutralGray-700">
                                        <Phone className="w-4 h-4" />
                                        <span>{patient.phone || 'N/A'}</span>
                                    </div>
                                    {patient.email && (
                                        <div className="flex items-center gap-2 text-neutralGray-700">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{patient.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-neutralGray-700">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Added {new Date(patient.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="mt-4 pt-4 border-t border-neutralGray-200">
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/patients/${patient.id}`);
                                        }}
                                        className="w-full"
                                    >
                                        View Details →
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPatients > limit && (
                    <div className="flex items-center justify-between mt-8">
                        <Button
                            variant="secondary"
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                        >
                            ← Previous
                        </Button>
                        <span className="text-neutralGray-700">
                            Showing {offset + 1}-{Math.min(offset + limit, totalPatients)} of {totalPatients}
                        </span>
                        <Button
                            variant="secondary"
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= totalPatients}
                        >
                            Next →
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
