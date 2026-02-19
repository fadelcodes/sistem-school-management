import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole } = useAuth();

    useEffect(() => {
        fetchSubjects();
    }, [pagination.page]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/subjects', {
                params: {
                    page: pagination.page,
                    limit: pagination.limit
                }
            });
            setSubjects(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast.error('Gagal memuat data mata pelajaran');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedSubject(null);
        reset({
            code: '',
            name: '',
            description: '',
            creditHours: ''
        });
        setModalOpen(true);
    };

    const handleEdit = (subject) => {
        setSelectedSubject(subject);
        reset({
            code: subject.code,
            name: subject.name,
            description: subject.description || '',
            creditHours: subject.credit_hours || ''
        });
        setModalOpen(true);
    };

    const handleDelete = (subject) => {
        setSelectedSubject(subject);
        setDeleteModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (selectedSubject) {
                await api.put(`/subjects/${selectedSubject.id}`, data);
                toast.success('Mata pelajaran berhasil diupdate');
            } else {
                await api.post('/subjects', data);
                toast.success('Mata pelajaran berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchSubjects();
        } catch (error) {
            console.error('Error saving subject:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan mata pelajaran');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/subjects/${selectedSubject.id}`);
            toast.success('Mata pelajaran berhasil dihapus');
            setDeleteModalOpen(false);
            fetchSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus mata pelajaran');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode'
        },
        {
            key: 'name',
            label: 'Nama Mata Pelajaran'
        },
        {
            key: 'creditHours',
            label: 'Jumlah Jam',
            render: (item) => item.credit_hours || '-'
        },
        {
            key: 'description',
            label: 'Deskripsi',
            render: (item) => item.description || '-'
        },
        {
            key: 'createdAt',
            label: 'Dibuat',
            render: (item) => new Date(item.created_at).toLocaleDateString('id-ID')
        }
    ];

    const actions = (item) => (
        <div className="flex justify-end space-x-2">
            <button
                onClick={() => handleEdit(item)}
                className="text-primary-600 hover:text-primary-800"
            >
                <PencilIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => handleDelete(item)}
                className="text-red-600 hover:text-red-800"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    );

    if (!hasRole(['Super Admin', 'Admin', 'Admin TU'])) {
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
                <h2 className="text-2xl font-bold text-gray-900">Manajemen Mata Pelajaran</h2>
                <button
                    onClick={handleCreate}
                    className="btn-primary flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Mata Pelajaran
                </button>
            </div>

            {/* Subjects Table */}
            <DataTable
                columns={columns}
                data={subjects}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                actions={actions}
            />

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kode Mata Pelajaran
                            </label>
                            <input
                                {...register('code', { required: 'Kode mata pelajaran harus diisi' })}
                                type="text"
                                className="input-field"
                                placeholder="MTK-01"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Mata Pelajaran
                            </label>
                            <input
                                {...register('name', { required: 'Nama mata pelajaran harus diisi' })}
                                type="text"
                                className="input-field"
                                placeholder="Matematika"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Jam per Minggu
                            </label>
                            <input
                                {...register('creditHours')}
                                type="number"
                                min="1"
                                className="input-field"
                                placeholder="4"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi
                            </label>
                            <textarea
                                {...register('description')}
                                rows="4"
                                className="input-field"
                                placeholder="Deskripsi mata pelajaran..."
                            />
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
                            {selectedSubject ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Mata Pelajaran"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Apakah Anda yakin ingin menghapus mata pelajaran <span className="font-semibold">{selectedSubject?.name}</span>?
                        Semua data jadwal dan nilai terkait akan terpengaruh.
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

export default Subjects;