import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

const EmptyState = ({ title = 'Belum ada data', description = 'Data akan muncul setelah Anda menambahkannya', icon: Icon = DocumentIcon, action }) => {
    return (
        <div className="text-center py-12">
            <div className="flex justify-center">
                <div className="p-3 bg-gray-100 rounded-full">
                    <Icon className="h-12 w-12 text-gray-400" />
                </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;