'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { User, Mail, Phone, Briefcase, Building, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';

export default function DemoRequestPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        organization: '',
        jobTitle: '',
        preferredDate: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiService.submitDemoRequest({
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone || undefined,
                organization: formData.organization || undefined,
                job_title: formData.jobTitle || undefined,
                preferred_date: formData.preferredDate || undefined,
                message: formData.message || undefined,
            });

            if (response.status === 'success') {
                setSuccess(true);
            }
        } catch (err: any) {
            console.error('Demo request error:', err);
            setError(err.response?.data?.detail || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutralGray-100 px-4">
                <Card className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-successGreen/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-successGreen" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-synapseDarkBlue mb-4">
                        Thank You!
                    </h2>
                    <p className="text-body text-neutralGray-700 mb-6">
                        We've received your demo request and will contact you within 24 hours to schedule a personalized demonstration.
                    </p>
                    <Link href="/">
                        <Button variant="primary">Back to Home</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutralGray-100 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <Link href="/" className="inline-flex items-center gap-2 mb-6 text-neutralGray-700 hover:text-synapseSkyBlue transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <Image
                        src="/Logo-MVP-v0.5.png"
                        alt="SynapseAI"
                        width={48}
                        height={48}
                        className="h-12 w-auto"
                    />
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue">
                            Request a Demo
                        </h1>
                        <p className="text-body text-neutralGray-700">
                            See SynapseAI in action
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-warningRed/20 rounded-card">
                            <p className="text-body text-warningRed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Input
                                label="Full Name"
                                type="text"
                                placeholder="Dr. John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                leftIcon={<User className="w-5 h-5" />}
                                required
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="doctor@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                leftIcon={<Mail className="w-5 h-5" />}
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="+91 9876543210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                leftIcon={<Phone className="w-5 h-5" />}
                                helperText="Optional"
                            />

                            <Input
                                label="Organization"
                                type="text"
                                placeholder="Your clinic/hospital"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                leftIcon={<Building className="w-5 h-5" />}
                                helperText="Optional"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Input
                                label="Job Title"
                                type="text"
                                placeholder="Psychiatrist"
                                value={formData.jobTitle}
                                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                leftIcon={<Briefcase className="w-5 h-5" />}
                                helperText="Optional"
                            />

                            <Input
                                label="Preferred Date/Time"
                                type="text"
                                placeholder="e.g., Next Tuesday afternoon"
                                value={formData.preferredDate}
                                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                                leftIcon={<Calendar className="w-5 h-5" />}
                                helperText="Optional"
                            />
                        </div>

                        <div>
                            <label className="block text-body font-medium text-neutralGray-700 mb-2">
                                Message
                                <span className="text-neutralGray-500 font-normal ml-2">(Optional)</span>
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border border-neutralGray-300 rounded-input font-body text-body text-neutralBlack placeholder:text-neutralGray-400 bg-white focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20 transition-all"
                                placeholder="Tell us about your specific needs or questions..."
                            />
                        </div>

                        <div className="border-t border-neutralGray-300 my-6"></div>

                        <div className="flex gap-4 justify-end">
                            <Link href="/">
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button variant="primary" type="submit" isLoading={loading}>
                                Request Demo
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
