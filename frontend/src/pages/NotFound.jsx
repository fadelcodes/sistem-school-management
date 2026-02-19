import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-extrabold text-primary-600">404</h1>
                    <h2 className="text-3xl font-bold text-gray-900 mt-4">Halaman Tidak Ditemukan</h2>
                    <p className="text-gray-600 mt-2">
                        Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
                    </p>
                </div>

                <div className="space-y-4">
                    <Link
                        to="/dashboard"
                        className="btn-primary inline-flex items-center"
                    >
                        <HomeIcon className="h-5 w-5 mr-2" />
                        Kembali ke Dashboard
                    </Link>

                    <div className="text-sm text-gray-500">
                        Atau hubungi administrator jika Anda yakin ini adalah kesalahan.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;