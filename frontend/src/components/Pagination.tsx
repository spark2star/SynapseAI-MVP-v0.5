'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
    total: number        // Total number of items
    limit: number        // Items per page
    offset: number       // Current offset
    onPageChange: (newOffset: number) => void
}

export default function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
    const currentPage = Math.floor(offset / limit) + 1
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = offset + limit < total
    const hasPreviousPage = offset > 0

    const handlePrevious = () => {
        if (hasPreviousPage) {
            onPageChange(Math.max(0, offset - limit))
        }
    }

    const handleNext = () => {
        if (hasNextPage) {
            onPageChange(offset + limit)
        }
    }

    const handlePageClick = (page: number) => {
        const newOffset = (page - 1) * limit
        onPageChange(newOffset)
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxPagesToShow = 7

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)

            if (currentPage > 3) {
                pages.push('...')
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (currentPage < totalPages - 2) {
                pages.push('...')
            }

            // Always show last page
            pages.push(totalPages)
        }

        return pages
    }

    if (totalPages <= 1) {
        return null // Don't show pagination if there's only one page
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 sm:px-6">
            {/* Mobile View */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={handlePrevious}
                    disabled={!hasPreviousPage}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        hasPreviousPage
                            ? 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
                            : 'text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                    }`}
                >
                    Previous
                </button>
                <button
                    onClick={handleNext}
                    disabled={!hasNextPage}
                    className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        hasNextPage
                            ? 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
                            : 'text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                    }`}
                >
                    Next
                </button>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Showing <span className="font-medium">{offset + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(offset + limit, total)}</span> of{' '}
                        <span className="font-medium">{total}</span> results
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {/* Previous Button */}
                        <button
                            onClick={handlePrevious}
                            disabled={!hasPreviousPage}
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                                hasPreviousPage
                                    ? 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            } ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:z-20 focus:outline-offset-0`}
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Page Numbers */}
                        {getPageNumbers().map((page, index) => {
                            if (page === '...') {
                                return (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-600"
                                    >
                                        ...
                                    </span>
                                )
                            }

                            const pageNumber = page as number
                            const isCurrentPage = pageNumber === currentPage

                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageClick(pageNumber)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        isCurrentPage
                                            ? 'z-10 bg-sky-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600'
                                            : 'text-slate-900 dark:text-slate-300 ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:z-20 focus:outline-offset-0'
                                    }`}
                                >
                                    {pageNumber}
                                </button>
                            )
                        })}

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            disabled={!hasNextPage}
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                                hasNextPage
                                    ? 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            } ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:z-20 focus:outline-offset-0`}
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    )
}
