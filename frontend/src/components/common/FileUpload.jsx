import React, { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FileUpload = ({ onFileSelect, accept = "*", maxSize = 5 * 1024 * 1024, label = "Upload File" }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (selectedFile) => {
        setError(null);

        if (!selectedFile) return;

        // Check file size
        if (selectedFile.size > maxSize) {
            setError(`Ukuran file maksimal ${maxSize / (1024 * 1024)}MB`);
            return;
        }

        setFile(selectedFile);
        onFileSelect(selectedFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        
        const droppedFile = e.dataTransfer.files[0];
        handleFileChange(droppedFile);
    };

    const handleRemove = () => {
        setFile(null);
        setError(null);
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-2">
            {/* File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
            />

            {/* Drop Zone */}
            {!file ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-colors duration-200
                        ${dragging 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                        }
                    `}
                >
                    <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600">
                        <span className="text-primary-600 font-medium">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {accept === "*" ? "Semua format file" : accept.split(',').join(', ')} (Maks. {maxSize / (1024 * 1024)}MB)
                    </p>
                </div>
            ) : (
                /* File Preview */
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                                <DocumentIcon className="h-8 w-8 text-primary-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="p-1 hover:bg-gray-200 rounded-full"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default FileUpload;