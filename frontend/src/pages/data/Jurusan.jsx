import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PencilIcon, TrashIcon, PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const Jurusan = () => {
    const [jurusan, setJurusan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedJurusan, setSelectedJurusan] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole } = useAuth();

    useEffect(() => {
        fetchJurusan();
    }, [pagination.page]);

    const fetchJurusan = async () => {
        try {
            setLoading(true);
            const response = await api.get('/jurusan', {
                params: {
                    page: pagination.page,
                    limit: pagination.limit
                }
            });
            setJurusan(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching jurusan:', error);
            toast.error('Gagal memuat data jurusan');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedJurusan(null);
        reset({
            code: '',
            name: '',
            description: ''
        });
        setModalOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedJurusan(item);
        reset({
            code: item.code,
            name: item.name,
            description: item.description || ''
        });
        setModalOpen(true);
    };

    const handleDelete = (item) => {
        setSelectedJurusan(item);
        setDeleteModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (selectedJurusan) {
                await api.put(`/jurusan/${selectedJurusan.id}`, data);
                toast.success('Jurusan berhasil diupdate');
            } else {
                await api.post('/jurusan', data);
                toast.success('Jurusan berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchJurusan();
        } catch (error) {
            console.error('Error saving jurusan:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan jurusan');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/jurusan/${selectedJurusan.id}`);
            toast.success('Jurusan berhasil dihapus');
            setDeleteModalOpen(false);
            fetchJurusan();
        } catch (error) {
            console.error('Error deleting jurusan:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus jurusan');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const columns = [
        {
            key: 'code',
            label: 'Kode Jurusan'
        },
        {
            key: 'name',
            label: 'Nama Jurusan'
        },
        {
            key: 'description',
            label: 'Deskripsi',
            render: (item) => item.description || '-'
        },
        {
            key: 'totalClasses',
            label: 'Jumlah Kelas',
            render: (item) => item.classes?.[0]?.count || 0
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
            {item.classes?.[0]?.count === 0 && (
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
                <h2 className="text-2xl font-bold text-gray-900">Manajemen Jurusan</h2>
                <button
                    onClick={handleCreate}
                    className="btn-primary flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Jurusan
                </button>
            </div>

            {/* Jurusan Table */}
            <DataTable
                columns={columns}
                data={jurusan}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                actions={actions}
            />

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedJurusan ? 'Edit Jurusan' : 'Tambah Jurusan'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kode Jurusan
                            </label>
                            <input
                                {...register('code', { required: 'Kode jurusan harus diisi' })}
                                type="text"
                                className="input-field"
                                placeholder="IPA"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Jurusan
                            </label>
                            <input
                                {...register('name', { required: 'Nama jurusan harus diisi' })}
                                type="text"
                                className="input-field"
                                placeholder="Ilmu Pengetahuan Alam"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi
                            </label>
                            <textarea
                                {...register('description')}
                                rows="4"
                                className="input-field"
                                placeholder="Deskripsi jurusan..."
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
                            {selectedJurusan ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Jurusan"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Apakah Anda yakin ingin menghapus jurusan <span className="font-semibold">{selectedJurusan?.name}</span>?
                        Semua kelas dengan jurusan ini akan kehilangan referensi jurusan.
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

export default Jurusan;