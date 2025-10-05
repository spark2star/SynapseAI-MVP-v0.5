// 'use client'

// import { useEffect } from 'react'
// import { useRouter } from 'next/navigation'

// export default function HomePage() {
//     const router = useRouter()

//     useEffect(() => {
//         // Redirect to landing page as the main entry point
//         router.replace('/landing')
//     }, [router])

//     return null
// }

'use client';

import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">S</span>
                            </div>
                            <span className="ml-3 text-xl font-bold text-gray-900">SynapseAI</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/auth/login"
                                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/login"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        AI-Powered Mental Health
                        <span className="block text-blue-600 mt-2">Care Platform</span>
                    </h1>

                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Transform mental healthcare with intelligent patient management,
                        automated documentation, and AI-driven insights.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/auth/login"
                            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            Start Free Trial
                        </Link>
                        <a
                            href="#features"
                            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors border-2 border-blue-600"
                        >
                            Learn More
                        </a>
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Patient Management</h3>
                        <p className="text-gray-600">
                            Comprehensive patient profiles with AI-assisted documentation and smart scheduling.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Insights</h3>
                        <p className="text-gray-600">
                            Get intelligent treatment recommendations and risk assessments powered by AI.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Reports</h3>
                        <p className="text-gray-600">
                            Automated session notes and reports that save hours of documentation time.
                        </p>
                    </div>
                </div>

                {/* Demo Credentials Box */}
                <div className="mt-16 max-w-2xl mx-auto bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 text-center">
                        Try Demo Account
                    </h3>
                    <div className="space-y-2 text-center">
                        <p className="text-blue-800">
                            <span className="font-semibold">Email:</span> doc@demo.com
                        </p>
                        <p className="text-blue-800">
                            <span className="font-semibold">Password:</span> password123
                        </p>
                        <Link
                            href="/auth/login"
                            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                            Login Now →
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-600">
                        © 2025 SynapseAI. Trusted by psychiatrists across India.
                    </p>
                </div>
            </footer>
        </div>
    );
}
