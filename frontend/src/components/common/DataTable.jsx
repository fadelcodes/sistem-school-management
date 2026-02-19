import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DataTable = ({
    columns,
    data,
    loading,
    pagination,
    onPageChange,
    onSort,
    onSearch,
    actions,
    selectable = false,
    selectedRows = [],
    onSelectRow,
    onSelectAll
}) => {
    return (
        <div className="card overflow-hidden">
            {/* Search Bar */}
            {onSearch && (
                <div className="p-4 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Cari data..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="input-field max-w-md"
                    />
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {selectable && (
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === data.length && data.length > 0}
                                        onChange={onSelectAll}
                                        className="rounded border-gray-300 text-primary-600"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => onSort && column.sortable && onSort(column.key)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.label}</span>
                                        {column.sortable && (
                                            <span className="text-gray-400">↕</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={item.id || index} className="hover:bg-gray-50">
                                    {selectable && (
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(item.id)}
                                                onChange={() => onSelectRow(item.id)}
                                                className="rounded border-gray-300 text-primary-600"
                                            />
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {column.render ? column.render(item) : item[column.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {actions(item)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                Previous
                            </button>
                            <span className="px-3 py-1 border rounded-md bg-primary-50 text-primary-600">
                                {pagination.page}
                            </span>
                            <button
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                Next
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;