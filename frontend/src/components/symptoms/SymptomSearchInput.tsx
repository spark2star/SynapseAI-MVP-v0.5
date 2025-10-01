'use client'

import React, { useEffect, useRef, useState } from 'react'
import { symptomAPI } from '@/services/symptoms'
import type { SymptomSearchResult } from '@/types/symptom'

interface Props {
    onSelect: (symptom: string, isCustom: boolean) => void
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])
    return debounced
}

const SymptomSearchInput: React.FC<Props> = ({ onSelect }) => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SymptomSearchResult[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const debounced = useDebounce(query, 300)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        const search = async () => {
            if (debounced.trim().length < 2) {
                setResults([])
                setOpen(false)
                return
            }
            setLoading(true)
            try {
                const data = await symptomAPI.search(debounced)
                setResults(data)
                setOpen(true)
            } catch (e) {
                setResults([])
            } finally {
                setLoading(false)
            }
        }
        search()
    }, [debounced])

    const exact = results.find(r => r.name.toLowerCase() === query.toLowerCase())
    const canAdd = query.length >= 2 && !exact && !loading

    const select = (name: string, custom: boolean) => {
        onSelect(name, custom)
        setQuery('')
        setResults([])
        setOpen(false)
    }

    return (
        <div ref={wrapRef} className="relative w-full">
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symptoms or add custom..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {open && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="px-4 py-2 text-gray-500">Searching...</div>
                    ) : (
                        <>
                            {results.map((r, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => select(r.name, r.type === 'custom')}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                                >
                                    <span>{r.name}</span>
                                    <span className="text-xs text-gray-500">{r.type === 'custom' ? '(Custom)' : r.category}</span>
                                </div>
                            ))}
                            {canAdd && (
                                <div onClick={() => select(query, true)} className="px-4 py-2 border-t text-green-700 hover:bg-green-50 cursor-pointer">
                                    + Add "{query}" as custom symptom
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default SymptomSearchInput


