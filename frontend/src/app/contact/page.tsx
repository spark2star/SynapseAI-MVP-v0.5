'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiService } from '@/services/api';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { User, Mail, Phone, MessageSquare, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
    { value: '', label: 'Select a category' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'sales', label: 'Sales' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'other', label: 'Other' },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        category: '',
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
            const response = await apiService.submitContactMessage({
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone || undefined,
                subject: formData.subject,
                message: formData.message,
                category: formData.category || undefined,
            });

            if (response.status === 'success') {
                setSuccess(true);
            }
        } catch (err: any) {
            console.error('Contact error:', err);
            setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
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
                        Message Received!
                    </h2>
                    <p className="text-body text-neutralGray-700 mb-6">
                        Thank you for contacting us. We'll respond to your message within 24 hours.
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
                    <img
                        src="/Logo-MVP-v0.5.png"
                        alt="SynapseAI"
                        className="w-20 h-20 ..."
                    />
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-synapseDarkBlue">
                            Contact Us
                        </h1>
                        <p className="text-body text-neutralGray-700">
                            We'd love to hear from you
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
                                placeholder="Your name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                leftIcon={<User className="w-5 h-5" />}
                                required
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="your@email.com"
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

                            <Select
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                options={CATEGORIES}
                            />
                        </div>

                        <Input
                            label="Subject"
                            type="text"
                            placeholder="What's this about?"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            leftIcon={<MessageSquare className="w-5 h-5" />}
                            required
                        />

                        <div>
                            <label className="block text-body font-medium text-neutralGray-700 mb-2">
                                Message <span className="text-warningRed">*</span>
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 border border-neutralGray-300 rounded-input font-body text-body text-neutralBlack placeholder:text-neutralGray-400 bg-white focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20 transition-all"
                                placeholder="Tell us how we can help..."
                                required
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
                                Send Message
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Contact Info */}
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
                            Email Us
                        </h3>
                        <p className="text-body text-neutralGray-700 mb-2">
                            For general inquiries:
                        </p>
                        <a href="mailto:mohdanees1717@gmail.com" className="text-synapseSkyBlue hover:text-synapseDarkBlue transition-colors">
                            mohdanees1717@gmail.com
                        </a>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
                            Response Time
                        </h3>
                        <p className="text-body text-neutralGray-700">
                            We typically respond within 24 hours on business days.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
