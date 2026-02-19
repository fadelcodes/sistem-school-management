import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="flex justify-center">
                            <div className="p-3 bg-red-100 rounded-full">
                                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
                            </div>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">
                            Terjadi Kesalahan
                        </h2>
                        <p className="mt-2 text-gray-600">
                            Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 btn-primary"
                        >
                            Muat Ulang Halaman
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-800">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;