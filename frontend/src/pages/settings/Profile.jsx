import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CameraIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import FileUpload from '../../components/common/FileUpload';
import toast from 'react-hot-toast';

const Profile = () => {
    const [loading, setLoading] = useState(false);
    const [changePasswordModal, setChangePasswordModal] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const { user, updateUser } = useAuth();

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (user) {
            reset({
                fullName: user.full_name,
                email: user.email,
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            
            const formData = new FormData();
            formData.append('fullName', data.fullName);
            formData.append('phone', data.phone);
            formData.append('address', data.address);
            
            if (profilePicture) {
                formData.append('profilePicture', profilePicture);
            }

            const response = await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            updateUser(response.data);
            toast.success('Profil berhasil diperbarui');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.error || 'Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    const onChangePassword = async (data) => {
        try {
            setLoading(true);
            
            await api.post('/users/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            toast.success('Password berhasil diubah');
            setChangePasswordModal(false);
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.error || 'Gagal mengubah password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profil Saya</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Informasi Pribadi</h3>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    {...register('fullName', { required: 'Nama lengkap harus diisi' })}
                                    type="text"
                                    className="input-field"
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="input-field bg-gray-50"
                                    disabled
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Email tidak dapat diubah
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Telepon
                                </label>
                                <input
                                    {...register('phone')}
                                    type="tel"
                                    className="input-field"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alamat
                                </label>
                                <textarea
                                    {...register('address')}
                                    rows="3"
                                    className="input-field"
                                    placeholder="Alamat lengkap"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => setChangePasswordModal(true)}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    Ubah Password
                                </button>
                                
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Additional Information based on role */}
                    {user?.role?.name === 'Siswa' && (
                        <div className="card mt-6">
                            <h3 className="text-lg font-semibold mb-4">Informasi Akademik</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">NIS</p>
                                    <p className="font-medium">{user.student?.nis || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">NISN</p>
                                    <p className="font-medium">{user.student?.nisn || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Kelas</p>
                                    <p className="font-medium">{user.student?.class?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Jurusan</p>
                                    <p className="font-medium">{user.student?.class?.jurusan?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tahun Masuk</p>
                                    <p className="font-medium">
                                        {user.student?.enrollment_date ? 
                                            new Date(user.student.enrollment_date).getFullYear() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.role?.name === 'Guru' && (
                        <div className="card mt-6">
                            <h3 className="text-lg font-semibold mb-4">Informasi Profesional</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">NIP</p>
                                    <p className="font-medium">{user.teacher?.nip || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Spesialisasi</p>
                                    <p className="font-medium">{user.teacher?.specialization || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Kualifikasi</p>
                                    <p className="font-medium">{user.teacher?.qualification || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tanggal Bergabung</p>
                                    <p className="font-medium">
                                        {user.teacher?.join_date ? 
                                            new Date(user.teacher.join_date).toLocaleDateString('id-ID') : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Picture */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Foto Profil</h3>
                        
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center mb-4 overflow-hidden">
                                {user?.profile_picture ? (
                                    <img 
                                        src={user.profile_picture} 
                                        alt={user.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-primary-600">
                                        {user?.full_name?.charAt(0)}
                                    </span>
                                )}
                            </div>

                            <FileUpload
                                onFileSelect={setProfilePicture}
                                accept="image/*"
                                maxSize={2 * 1024 * 1024} // 2MB
                                label="Upload Foto"
                            />

                            <p className="text-xs text-gray-500 mt-2">
                                Format: JPG, PNG. Maks: 2MB
                            </p>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="card mt-6">
                        <h3 className="text-lg font-semibold mb-4">Informasi Akun</h3>
                        
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Role</p>
                                <p className="font-medium">
                                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                                        {user?.role?.name}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status Akun</p>
                                <p className="font-medium">
                                    {user?.is_active ? (
                                        <span className="text-green-600">Aktif</span>
                                    ) : (
                                        <span className="text-red-600">Nonaktif</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Terdaftar Sejak</p>
                                <p className="font-medium">
                                    {user?.created_at ? 
                                        new Date(user.created_at).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Terakhir Login</p>
                                <p className="font-medium">
                                    {user?.last_login ? 
                                        new Date(user.last_login).toLocaleString('id-ID') : 'Belum pernah'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={changePasswordModal}
                onClose={() => setChangePasswordModal(false)}
                title="Ubah Password"
            >
                <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password Saat Ini
                        </label>
                        <input
                            {...register('currentPassword', { 
                                required: 'Password saat ini harus diisi' 
                            })}
                            type="password"
                            className="input-field"
                        />
                        {errors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password Baru
                        </label>
                        <input
                            {...register('newPassword', { 
                                required: 'Password baru harus diisi',
                                minLength: {
                                    value: 8,
                                    message: 'Password minimal 8 karakter'
                                }
                            })}
                            type="password"
                            className="input-field"
                        />
                        {errors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Konfirmasi Password Baru
                        </label>
                        <input
                            {...register('confirmPassword', { 
                                required: 'Konfirmasi password harus diisi',
                                validate: (value, formValues) => 
                                    value === formValues.newPassword || 'Password tidak cocok'
                            })}
                            type="password"
                            className="input-field"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setChangePasswordModal(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Menyimpan...' : 'Ubah Password'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Profile;