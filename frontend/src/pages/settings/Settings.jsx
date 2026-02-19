import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
    BuildingOfficeIcon, 
    AcademicCapIcon, 
    BellIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [schoolSettings, setSchoolSettings] = useState(null);
    const [academicYears, setAcademicYears] = useState([]);
    const [backupModalOpen, setBackupModalOpen] = useState(false);
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole } = useAuth();

    useEffect(() => {
        if (hasRole(['Super Admin', 'Admin'])) {
            fetchSettings();
            fetchAcademicYears();
        }
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings/school');
            setSchoolSettings(response.data);
            reset(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await api.get('/academic-years?limit=100');
            setAcademicYears(response.data);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        }
    };

    const onGeneralSubmit = async (data) => {
        try {
            setLoading(true);
            await api.put('/settings/school', data);
            toast.success('Pengaturan umum berhasil disimpan');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const onAcademicSubmit = async (data) => {
        try {
            setLoading(true);
            await api.put('/settings/academic', data);
            toast.success('Pengaturan akademik berhasil disimpan');
        } catch (error) {
            console.error('Error saving academic settings:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const onNotificationSubmit = async (data) => {
        try {
            setLoading(true);
            await api.put('/settings/notifications', data);
            toast.success('Pengaturan notifikasi berhasil disimpan');
        } catch (error) {
            console.error('Error saving notification settings:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const onSecuritySubmit = async (data) => {
        try {
            setLoading(true);
            await api.put('/settings/security', data);
            toast.success('Pengaturan keamanan berhasil disimpan');
        } catch (error) {
            console.error('Error saving security settings:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setLoading(true);
            const response = await api.post('/settings/backup', {}, {
                responseType: 'blob'
            });
            
            // Download backup file
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Backup database berhasil');
            setBackupModalOpen(false);
        } catch (error) {
            console.error('Error creating backup:', error);
            toast.error('Gagal membuat backup');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm('Apakah Anda yakin ingin merestore database? Data saat ini akan ditimpa.')) {
            return;
        }

        const formData = new FormData();
        formData.append('backup', file);

        try {
            setLoading(true);
            await api.post('/settings/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Database berhasil direstore');
            setRestoreModalOpen(false);
        } catch (error) {
            console.error('Error restoring backup:', error);
            toast.error('Gagal merestore database');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSystem = async () => {
        if (!window.confirm('PERINGATAN: Tindakan ini akan mereset semua data sistem kecuali data master. Lanjutkan?')) {
            return;
        }

        try {
            setLoading(true);
            await api.post('/settings/reset');
            toast.success('Sistem berhasil direset');
        } catch (error) {
            console.error('Error resetting system:', error);
            toast.error('Gagal mereset sistem');
        } finally {
            setLoading(false);
        }
    };

    if (!hasRole(['Super Admin', 'Admin'])) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Akses Ditolak</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                </p>
            </div>
        );
    }

    const tabs = [
        { id: 'general', name: 'Umum', icon: BuildingOfficeIcon },
        { id: 'academic', name: 'Akademik', icon: AcademicCapIcon },
        { id: 'notifications', name: 'Notifikasi', icon: BellIcon },
        { id: 'security', name: 'Keamanan', icon: ShieldCheckIcon },
        { id: 'backup', name: 'Backup & Restore', icon: CurrencyDollarIcon }
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan Sistem</h2>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:w-64">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon className={`h-5 w-5 mr-3 ${
                                    activeTab === tab.id ? 'text-primary-700' : 'text-gray-400'
                                }`} />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="card">
                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Pengaturan Umum</h3>
                                <form onSubmit={handleSubmit(onGeneralSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nama Sekolah
                                            </label>
                                            <input
                                                {...register('schoolName', { required: 'Nama sekolah harus diisi' })}
                                                type="text"
                                                className="input-field"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                NPSN
                                            </label>
                                            <input
                                                {...register('npsn')}
                                                type="text"
                                                className="input-field"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Alamat
                                            </label>
                                            <textarea
                                                {...register('address')}
                                                rows="3"
                                                className="input-field"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Telepon
                                            </label>
                                            <input
                                                {...register('phone')}
                                                type="tel"
                                                className="input-field"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                {...register('email')}
                                                type="email"
                                                className="input-field"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Website
                                            </label>
                                            <input
                                                {...register('website')}
                                                type="url"
                                                className="input-field"
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Logo Sekolah
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="input-field"
                                                onChange={(e) => {
                                                    // Handle logo upload
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Academic Settings */}
                        {activeTab === 'academic' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Pengaturan Akademik</h3>
                                <form onSubmit={handleSubmit(onAcademicSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tahun Ajaran Aktif
                                            </label>
                                            <select
                                                {...register('activeAcademicYearId')}
                                                className="input-field"
                                            >
                                                <option value="">Pilih Tahun Ajaran</option>
                                                {academicYears.map(year => (
                                                    <option key={year.id} value={year.id}>
                                                        {year.year} - {year.semester} {year.is_active ? '(Aktif)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sistem Penilaian
                                            </label>
                                            <select
                                                {...register('gradingSystem')}
                                                className="input-field"
                                            >
                                                <option value="100">Skala 0-100</option>
                                                <option value="4">Skala 0-4 (IPK)</option>
                                                <option value="letter">Huruf (A,B,C,D,E)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nilai Minimum KKM
                                            </label>
                                            <input
                                                {...register('minimumGrade')}
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="input-field"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Format Rapor
                                            </label>
                                            <select
                                                {...register('reportFormat')}
                                                className="input-field"
                                            >
                                                <option value="standard">Standar</option>
                                                <option value="detailed">Detail</option>
                                                <option value="simplified">Sederhana</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input
                                                {...register('allowParentAccess')}
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Izinkan orang tua melihat nilai anak
                                            </span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                {...register('autoGenerateReport')}
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Generate rapor otomatis di akhir semester
                                            </span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                {...register('showAttendanceInReport')}
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Tampilkan rekap absensi di rapor
                                            </span>
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Notification Settings */}
                        {activeTab === 'notifications' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Pengaturan Notifikasi</h3>
                                <form onSubmit={handleSubmit(onNotificationSubmit)} className="space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Notifikasi Email</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        {...register('emailOnGrade')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Kirim email saat nilai diinput
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('emailOnAttendance')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Kirim email saat absensi dicatat
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('emailOnAssignment')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Kirim email saat tugas baru dibuat
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('emailOnSubmission')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Kirim email saat tugas dikumpulkan
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Notifikasi Push</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        {...register('pushOnGrade')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Notifikasi push saat nilai diinput
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('pushOnAttendance')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Notifikasi push saat absensi dicatat
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Pengaturan Email Server</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        SMTP Host
                                                    </label>
                                                    <input
                                                        {...register('smtpHost')}
                                                        type="text"
                                                        className="input-field"
                                                        placeholder="smtp.gmail.com"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        SMTP Port
                                                    </label>
                                                    <input
                                                        {...register('smtpPort')}
                                                        type="number"
                                                        className="input-field"
                                                        placeholder="587"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        SMTP Username
                                                    </label>
                                                    <input
                                                        {...register('smtpUsername')}
                                                        type="text"
                                                        className="input-field"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        SMTP Password
                                                    </label>
                                                    <input
                                                        {...register('smtpPassword')}
                                                        type="password"
                                                        className="input-field"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Sender Email
                                                    </label>
                                                    <input
                                                        {...register('senderEmail')}
                                                        type="email"
                                                        className="input-field"
                                                        placeholder="noreply@sekolah.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Pengaturan Keamanan</h3>
                                <form onSubmit={handleSubmit(onSecuritySubmit)} className="space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Kebijakan Password</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Minimal Panjang Password
                                                    </label>
                                                    <input
                                                        {...register('minPasswordLength')}
                                                        type="number"
                                                        min="6"
                                                        max="20"
                                                        className="input-field"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Masa Berlaku Password (hari)
                                                    </label>
                                                    <input
                                                        {...register('passwordExpiry')}
                                                        type="number"
                                                        min="0"
                                                        className="input-field"
                                                    />
                                                    <p className="text-xs text-gray-500">0 = tidak pernah kadaluarsa</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-2">
                                                <label className="flex items-center">
                                                    <input
                                                        {...register('requireUppercase')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Harus mengandung huruf besar
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('requireNumbers')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Harus mengandung angka
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('requireSpecialChars')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Harus mengandung karakter khusus
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Sesi & Autentikasi</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Masa Berlaku Sesi (menit)
                                                    </label>
                                                    <input
                                                        {...register('sessionTimeout')}
                                                        type="number"
                                                        min="5"
                                                        className="input-field"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Maksimal Percobaan Login
                                                    </label>
                                                    <input
                                                        {...register('maxLoginAttempts')}
                                                        type="number"
                                                        min="3"
                                                        className="input-field"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 mt-2">
                                                <label className="flex items-center">
                                                    <input
                                                        {...register('twoFactorAuth')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Aktifkan Two-Factor Authentication (2FA)
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('ipWhitelist')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Aktifkan IP Whitelist untuk Admin
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Audit & Logging</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input
                                                        {...register('logUserActivity')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Log semua aktivitas user
                                                    </span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        {...register('logLoginAttempts')}
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-primary-600"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        Log percobaan login
                                                    </span>
                                                </label>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Retensi Log (hari)
                                                    </label>
                                                    <input
                                                        {...register('logRetention')}
                                                        type="number"
                                                        min="30"
                                                        className="input-field"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Backup & Restore */}
                        {activeTab === 'backup' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Backup & Restore Database</h3>
                                
                                <div className="space-y-6">
                                    {/* Backup Section */}
                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <h4 className="font-medium text-blue-800 mb-2">Backup Database</h4>
                                        <p className="text-sm text-blue-600 mb-4">
                                            Buat backup database untuk keamanan data. File backup akan didownload dalam format SQL.
                                        </p>
                                        <button
                                            onClick={() => setBackupModalOpen(true)}
                                            className="btn-primary flex items-center"
                                            disabled={loading}
                                        >
                                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                            Backup Sekarang
                                        </button>
                                    </div>

                                    {/* Restore Section */}
                                    <div className="bg-yellow-50 p-6 rounded-lg">
                                        <h4 className="font-medium text-yellow-800 mb-2">Restore Database</h4>
                                        <p className="text-sm text-yellow-600 mb-4">
                                            Restore database dari file backup. PERHATIAN: Data saat ini akan ditimpa!
                                        </p>
                                        <button
                                            onClick={() => setRestoreModalOpen(true)}
                                            className="btn-warning flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                                            disabled={loading}
                                        >
                                            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                                            Restore Database
                                        </button>
                                    </div>

                                    {/* Reset System */}
                                    <div className="bg-red-50 p-6 rounded-lg">
                                        <h4 className="font-medium text-red-800 mb-2">Reset Sistem</h4>
                                        <p className="text-sm text-red-600 mb-4">
                                            Reset semua data akademik (nilai, absensi, tugas) tetapi mempertahankan data master (siswa, guru, kelas).
                                        </p>
                                        <button
                                            onClick={handleResetSystem}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                            disabled={loading}
                                        >
                                            Reset Sistem
                                        </button>
                                    </div>

                                    {/* Automatic Backup Settings */}
                                    <div className="border-t pt-6">
                                        <h4 className="font-medium mb-4">Pengaturan Backup Otomatis</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Frekuensi Backup
                                                </label>
                                                <select
                                                    {...register('backupFrequency')}
                                                    className="input-field"
                                                >
                                                    <option value="daily">Harian</option>
                                                    <option value="weekly">Mingguan</option>
                                                    <option value="monthly">Bulanan</option>
                                                    <option value="never">Jangan Backup Otomatis</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Waktu Backup
                                                </label>
                                                <input
                                                    {...register('backupTime')}
                                                    type="time"
                                                    className="input-field"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Backup ke Email
                                                </label>
                                                <input
                                                    {...register('backupEmail')}
                                                    type="email"
                                                    className="input-field"
                                                    placeholder="admin@sekolah.com"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Maksimal Backup Tersimpan
                                                </label>
                                                <input
                                                    {...register('maxBackups')}
                                                    type="number"
                                                    min="1"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Backup Confirmation Modal */}
            <Modal
                isOpen={backupModalOpen}
                onClose={() => setBackupModalOpen(false)}
                title="Konfirmasi Backup"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Apakah Anda yakin ingin membuat backup database sekarang? Proses backup akan memakan waktu beberapa saat.
                    </p>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setBackupModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleBackup}
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Memproses...' : 'Ya, Backup Sekarang'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Restore Modal */}
            <Modal
                isOpen={restoreModalOpen}
                onClose={() => setRestoreModalOpen(false)}
                title="Restore Database"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-800">
                            <strong>PERINGATAN:</strong> Merestore database akan menimpa semua data yang ada saat ini. 
                            Pastikan Anda memiliki backup data terbaru.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih File Backup
                        </label>
                        <input
                            type="file"
                            accept=".sql,.backup"
                            onChange={handleRestore}
                            className="input-field"
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Format file: .sql atau .backup
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setRestoreModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;