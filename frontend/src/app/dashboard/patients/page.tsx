'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    UserGroupIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    PhoneIcon,
    EnvelopeIcon,
    ChartBarIcon,
    CalendarIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Pagination from '@/components/Pagination'
import { useAuthStore } from '@/store/authStore'
import apiService from '@/services/api'

interface Patient {
    id: string
    patient_id: string
    full_name: string
    age: number
    gender: string
    phone_primary: string
    last_visit: string | null
    created_at: string
    patient_type?: 'new' | 'follow-up'
    status?: 'improving' | 'stable' | 'needs-attention' | 'declining'
}

interface TimeSeriesData {
    period: string
    value: number
}

type TimePeriod = 'week' | 'month' | 'year'

export default function PatientsPage() {
    const { user } = useAuthStore()
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 20,
        offset: 0,
        has_more: false,
        current_page: 1,
        total_pages: 0
    })
    const [totalPatientsData, setTotalPatientsData] = useState<TimeSeriesData[]>([])
    const [improvedData, setImprovedData] = useState<TimeSeriesData[]>([])
    const [needsAttentionData, setNeedsAttentionData] = useState<TimeSeriesData[]>([])
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

    useEffect(() => {
        fetchPatients(0, searchTerm)
        generateMockTimeSeriesData()
    }, [timePeriod])

    const fetchPatients = async (newOffset: number, search?: string) => {
        try {
            setLoading(true)
            console.log(`📋 Fetching patients (offset: ${newOffset}, search: ${search || 'none'})...`)

            // Use the new paginated endpoint
            const params: any = {
                limit: pagination.limit,
                offset: newOffset
            }
            if (search) {
                params.search = search
            }

            const response = await apiService.get('/patients/list/', params)

            if (response.status === 'success' && response.data) {
                const items = response.data.items || []
                console.log(`✅ Loaded ${items.length} patients (Total: ${response.data.pagination?.total || 0})`)

                // Map patient data to Patient interface
                const mappedPatients: Patient[] = items.map((patient: any, index: number) => ({
                    id: patient.id,
                    patient_id: `PAT-${patient.id.slice(-4).toUpperCase()}`,
                    full_name: patient.name || 'Unknown',
                    age: patient.age || 0,
                    gender: patient.sex || 'unknown',
                    phone_primary: patient.phone || 'N/A',
                    last_visit: patient.last_visit || null,
                    created_at: patient.created_at || new Date().toISOString(),
                    patient_type: index % 3 === 0 ? 'new' : 'follow-up',
                    status: ['improving', 'stable', 'needs-attention', 'declining'][index % 4] as Patient['status']
                }))

                setPatients(mappedPatients)

                // Update pagination metadata
                if (response.data.pagination) {
                    setPagination(response.data.pagination)
                }
            } else {
                console.warn('No patients found or invalid response')
                setPatients([])
            }
        } catch (error) {
            console.error('❌ Error fetching patients:', error)
            toast.error('Failed to load patients')
            setPatients([])
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (newOffset: number) => {
        fetchPatients(newOffset, searchTerm)
    }

    const handleSearch = (query: string) => {
        setSearchTerm(query)
        fetchPatients(0, query)
    }

    const generateMockTimeSeriesData = () => {
        const periods = timePeriod === 'week'
            ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']
            : timePeriod === 'month'
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                : ['2022', '2023', '2024', '2024 Q2', '2024 Q3', '2024 Q4']

        setTotalPatientsData(periods.map((period, i) => ({
            period,
            value: 15 + (i * 8) + Math.floor(Math.random() * 10)
        })))

        setImprovedData(periods.map((period, i) => ({
            period,
            value: 8 + (i * 3) + Math.floor(Math.random() * 5)
        })))

        setNeedsAttentionData(periods.map((period, i) => ({
            period,
            value: 2 + Math.floor(Math.random() * 4)
        })))
    }

    const filteredPatients = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone_primary.includes(searchTerm)
    )

    const getInitials = (fullName: string) => {
        return fullName.split(' ').map(name => name[0]).join('').toUpperCase()
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'No visits yet'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatTime = (dateString: string | null) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status: Patient['status']) => {
        switch (status) {
            case 'improving':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
            case 'stable':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            case 'needs-attention':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            case 'declining':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            default:
                return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'
        }
    }

    const getStatusLabel = (status: Patient['status']) => {
        switch (status) {
            case 'improving': return 'Improving'
            case 'stable': return 'Stable'
            case 'needs-attention': return 'Needs Attention'
            case 'declining': return 'Declining'
            default: return 'Unknown'
        }
    }

    // Line Chart Component
    const LineChart: React.FC<{
        data: TimeSeriesData[]
        color: string
        title: string
        icon: any
    }> = ({ data, color, title, icon: Icon }) => {
        const maxValue = Math.max(...data.map(d => d.value))
        const currentValue = data[data.length - 1]?.value || 0
        const previousValue = data[data.length - 2]?.value || 0
        const change = currentValue - previousValue
        const changePercent = previousValue > 0 ? Math.round((change / previousValue) * 100) : 0

        // Create safe gradient ID without spaces
        const gradientId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`

        // Determine chart color more reliably
        const chartColor = title.includes('Total') || color.includes('sky') ? '#0ea5e9'
            : title.includes('Improved') || color.includes('emerald') ? '#10b981'
                : '#f59e0b'

        return (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 ${color} rounded-xl`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{currentValue}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {change >= 0 ? (
                                <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                                <ArrowDownIcon className="h-4 w-4" />
                            )}
                            <span className="text-sm font-semibold">{Math.abs(changePercent)}%</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">vs last period</p>
                    </div>
                </div>

                {/* Simple Line Chart */}
                <div className="relative h-24">
                    <svg className="w-full h-full bg-transparent" viewBox="0 0 300 80">
                        <defs>
                            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor={chartColor} stopOpacity="0.15" />
                                <stop offset="100%" stopColor={chartColor} stopOpacity="0.01" />
                            </linearGradient>
                        </defs>

                        {/* Clean area fill - no black artifacts */}
                        {data.length > 1 && (
                            <path
                                d={`M ${data.map((point, index) => {
                                    const x = (index / (data.length - 1)) * 300
                                    const y = 80 - ((point.value / maxValue) * 60)
                                    return `${x},${y}`
                                }).join(' L ')} L 300,80 L 0,80 Z`}
                                fill={`url(#${gradientId})`}
                                stroke="none"
                            />
                        )}

                        {/* Clean line */}
                        {data.length > 1 && (
                            <path
                                d={`M ${data.map((point, index) => {
                                    const x = (index / (data.length - 1)) * 300
                                    const y = 80 - ((point.value / maxValue) * 60)
                                    return `${x},${y}`
                                }).join(' L ')}`}
                                fill="none"
                                stroke={chartColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-sm"
                            />
                        )}

                        {/* Data points - only show on hover for cleaner look */}
                        {data.map((point, index) => {
                            const x = (index / (data.length - 1)) * 300
                            const y = 80 - ((point.value / maxValue) * 60)
                            return (
                                <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill="white"
                                    stroke={chartColor}
                                    strokeWidth="2"
                                    className="drop-shadow-sm opacity-0 hover:opacity-100 transition-opacity duration-200"
                                />
                            )
                        })}
                    </svg>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2">
                    {data.map((point, index) => (
                        <span key={index} className="text-xs text-slate-500 dark:text-slate-400">
                            {point.period}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
                <div className="p-6 lg:p-8 space-y-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-white/60 dark:bg-slate-800/60 rounded mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-48 bg-white/60 dark:bg-slate-800/60 rounded-3xl"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-white/60 dark:bg-slate-800/60 rounded-3xl"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
            <div className="p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-sky-100/50 dark:border-slate-700/50 p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <UserGroupIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                                        Patient Management
                                    </h1>
                                    <p className="text-sky-600 dark:text-sky-300 text-sm lg:text-base">
                                        Monitor patient progress and manage care efficiently
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Time Period Selector */}
                                <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-700/60 rounded-2xl p-1">
                                    {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setTimePeriod(period)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${timePeriod === period
                                                ? 'bg-sky-500 text-white shadow-lg'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-600/60'
                                                }`}
                                        >
                                            {period.charAt(0).toUpperCase() + period.slice(1)}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => window.location.href = '/dashboard/patients/new'}
                                    className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    New Patient
                                </Button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mt-6">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Search patients by name, ID, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-12 bg-white/60 dark:bg-slate-700/60 border-sky-200/50 dark:border-slate-600/50 rounded-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
                    <LineChart
                        data={totalPatientsData}
                        color="bg-gradient-to-br from-sky-500 to-blue-600"
                        title="Total Patients"
                        icon={UserGroupIcon}
                    />
                    <LineChart
                        data={improvedData}
                        color="bg-gradient-to-br from-emerald-500 to-green-600"
                        title="Improved"
                        icon={ArrowUpIcon}
                    />
                    <LineChart
                        data={needsAttentionData}
                        color="bg-gradient-to-br from-amber-500 to-orange-600"
                        title="Need Attention"
                        icon={ArrowDownIcon}
                    />
                </div>

                {/* Patient Records Table */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl shadow-xl border border-sky-100/50 dark:border-slate-700/50 overflow-hidden">
                    <div className="px-6 lg:px-8 py-6 border-b border-sky-100/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-800/30 rounded-xl">
                                    <ChartBarIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                                </div>
                                Patient Records
                            </h2>
                            <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                {filteredPatients.length} patients
                            </span>
                        </div>
                    </div>

                    {filteredPatients.length === 0 ? (
                        <div className="px-6 lg:px-8 py-12 text-center">
                            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No patients found</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by registering a new patient.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50/50 dark:bg-slate-700/30">
                                    <tr>
                                        <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Date & Time of Appointment
                                        </th>
                                        <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Patient Name
                                        </th>
                                        <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/30">
                                    {filteredPatients.map((patient) => (
                                        <tr key={patient.id} className="hover:bg-sky-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg group-hover:bg-sky-200 dark:group-hover:bg-sky-800/40 transition-colors">
                                                        <CalendarIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                            {formatDate(patient.last_visit)}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            {formatTime(patient.last_visit)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                                                <Link href={`/dashboard/patients/${patient.id}`} className="block">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center">
                                                            <span className="text-sky-700 dark:text-sky-400 font-semibold text-sm">
                                                                {getInitials(patient.full_name)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                                {patient.full_name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                {patient.age} years • {patient.gender}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${patient.patient_type === 'new'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                    {patient.patient_type === 'new' ? 'New' : 'Follow-up'}
                                                </span>
                                            </td>
                                            <td className="px-6 lg:px-8 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                                                    {getStatusLabel(patient.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Component */}
                            {!loading && patients.length > 0 && (
                                <div className="mt-6 px-4 sm:px-6 lg:px-8">
                                    <Pagination
                                        total={pagination.total}
                                        limit={pagination.limit}
                                        offset={pagination.offset}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}