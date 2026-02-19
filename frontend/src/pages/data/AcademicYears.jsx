import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PencilIcon, TrashIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const AcademicYears = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole } = useAuth();

    useEffect(() => {
        fetchAcademicYears();
    }, [pagination.page]);

    const fetchAcademicYears = async () => {
        try {
            setLoading(true);
            const response = await api.get('/academic-years', {
                params: {
                    page: pagination.page,
                    limit: pagination.limit
                }
            });
            setYears(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching academic years:', error);
            toast.error('Gagal memuat data tahun ajaran');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedYear(null);
        reset({
            year: '',
            semester: 'Ganjil',
            isActive: false,
            startDate: '',
            endDate: ''
        });
        setModalOpen(true);
    };

    const handleEdit = (year) => {
        setSelectedYear(year);
        reset({
            year: year.year,
            semester: year.semester,
            isActive: year.is_active,
            startDate: year.start_date || '',
            endDate: year.end_date || ''
        });
        setModalOpen(true);
    };

    const handleDelete = (year) => {
        setSelectedYear(year);
        setDeleteModalOpen(true);
    };

    const handleSetActive = async (id) => {
        try {
            await api.put(`/academic-years/${id}/set-active`);
            toast.success('Tahun ajaran aktif berhasil diubah');
            fetchAcademicYears();
        } catch (error) {
            console.error('Error setting active year:', error);
            toast.error(error.response?.data?.error || 'Gagal mengubah tahun ajaran aktif');
        }
    };

    const onSubmit = async (data) => {
        try {
            if (selectedYear) {
                await api.put(`/academic-years/${selectedYear.id}`, data);
                toast.success('Tahun ajaran berhasil diupdate');
            } else {
                await api.post('/academic-years', data);
                toast.success('Tahun ajaran berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchAcademicYears();
        } catch (error) {
            console.error('Error saving academic year:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan tahun ajaran');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/academic-years/${selectedYear.id}`);
            toast.success('Tahun ajaran berhasil dihapus');
            setDeleteModalOpen(false);
            fetchAcademicYears();
        } catch (error) {
            console.error('Error deleting academic year:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus tahun ajaran');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const columns = [
        {
            key: 'year',
            label: 'Tahun Ajaran'
        },
        {
            key: 'semester',
            label: 'Semester'
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => item.is_active ? (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center w-fit">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Aktif
                </span>
            ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center w-fit">
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Tidak Aktif
                </span>
            )
        },
        {
            key: 'startDate',
            label: 'Tanggal Mulai',
            render: (item) => item.start_date ? new Date(item.start_date).toLocaleDateString('id-ID') : '-'
        },
        {
            key: 'endDate',
            label: 'Tanggal Selesai',
            render: (item) => item.end_date ? new Date(item.end_date).toLocaleDateString('id-ID') : '-'
        }
    ];

    const actions = (item) => (
        <div className="flex justify-end space-x-2">
            {!item.is_active && (
                <button
                    onClick={() => handleSetActive(item.id)}
                    className="text-green-600 hover:text-green-800"
                    title="Set Aktif"
                >
                    <CheckCircleIcon className="h-5 w-5" />
                </button>
            )}
            <button
                onClick={() => handleEdit(item)}
                className="text-primary-600 hover:text-primary-800"
            >
                <PencilIcon className="h-5 w-5" />
            </button>
            {!item.is_active && (
                <button
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:text-red-800"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manajemen Tahun Ajaran</h2>
                <button
                    onClick={handleCreate}
                    className="btn-primary flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Tahun Ajaran
                </button>
            </div>

            {/* Academic Years Table */}
            <DataTable
                columns={columns}
                data={years}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                actions={actions}
            />

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tahun Ajaran
                            </label>
                            <input
                                {...register('year', { 
                                    required: 'Tahun ajaran harus diisi',
                                    pattern: {
                                        value: /^\d{4}\/\d{4}$/,
                                        message: 'Format tahun ajaran harus YYYY/YYYY (contoh: 2024/2025)'
                                    }
                                })}
                                type="text"
                                className="input-field"
                                placeholder="2024/2025"
                            />
                            {errors.year && (
                                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Semester
                            </label>
                            <select
                                {...register('semester', { required: 'Semester harus dipilih' })}
                                className="input-field"
                            >
                                <option value="Ganjil">Ganjil</option>
                                <option value="Genap">Genap</option>
                            </select>
                            {errors.semester && (
                                <p className="mt-1 text-sm text-red-600">{errors.semester.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                {...register('startDate')}
                                type="date"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Selesai
                            </label>
                            <input
                                {...register('endDate')}
                                type="date"
                                className="input-field"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center">
                                <input
                                    {...register('isActive')}
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary-600"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                    Jadikan sebagai tahun ajaran aktif
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            {selectedYear ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Tahun Ajaran"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Apakah Anda yakin ingin menghapus tahun ajaran <span className="font-semibold">{selectedYear?.year} - {selectedYear?.semester}</span>?
                        Semua data kelas dan jadwal terkait akan terpengaruh.
                    </p>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="btn-danger"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AcademicYears;