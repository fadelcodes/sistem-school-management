import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PencilIcon, TrashIcon, PlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [jurusan, setJurusan] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [filter, setFilter] = useState({
        academicYearId: ''
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole } = useAuth();

    useEffect(() => {
        fetchClasses();
        fetchJurusan();
        fetchAcademicYears();
        fetchTeachers();
    }, [pagination.page, filter]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filter.academicYearId) params.academicYearId = filter.academicYearId;
            
            const response = await api.get('/classes', { params });
            setClasses(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Gagal memuat data kelas');
        } finally {
            setLoading(false);
        }
    };

    const fetchJurusan = async () => {
        try {
            const response = await api.get('/jurusan?limit=100');
            setJurusan(response.data);
        } catch (error) {
            console.error('Error fetching jurusan:', error);
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

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/teachers?limit=100');
            setTeachers(response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const handleCreate = () => {
        setSelectedClass(null);
        reset({
            name: '',
            gradeLevel: '',
            jurusanId: '',
            academicYearId: '',
            homeroomTeacherId: '',
            capacity: '',
            roomNumber: ''
        });
        setModalOpen(true);
    };

    const handleEdit = (cls) => {
        setSelectedClass(cls);
        reset({
            name: cls.name,
            gradeLevel: cls.grade_level,
            jurusanId: cls.jurusan_id || '',
            academicYearId: cls.academic_year_id,
            homeroomTeacherId: cls.homeroom_teacher_id || '',
            capacity: cls.capacity || '',
            roomNumber: cls.room_number || ''
        });
        setModalOpen(true);
    };

    const handleDelete = (cls) => {
        setSelectedClass(cls);
        setDeleteModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (selectedClass) {
                await api.put(`/classes/${selectedClass.id}`, data);
                toast.success('Kelas berhasil diupdate');
            } else {
                await api.post('/classes', data);
                toast.success('Kelas berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchClasses();
        } catch (error) {
            console.error('Error saving class:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan kelas');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/classes/${selectedClass.id}`);
            toast.success('Kelas berhasil dihapus');
            setDeleteModalOpen(false);
            fetchClasses();
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus kelas');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const columns = [
        {
            key: 'name',
            label: 'Nama Kelas',
            render: (item) => (
                <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">Tingkat {item.grade_level}</div>
                </div>
            )
        },
        {
            key: 'jurusan',
            label: 'Jurusan',
            render: (item) => item.jurusan?.name || '-'
        },
        {
            key: 'academicYear',
            label: 'Tahun Ajaran',
            render: (item) => (
                <div>
                    <div>{item.academic_year?.year}</div>
                    <div className="text-xs text-gray-500">{item.academic_year?.semester}</div>
                </div>
            )
        },
        {
            key: 'homeroomTeacher',
            label: 'Wali Kelas',
            render: (item) => item.homeroom_teacher?.user?.full_name || '-'
        },
        {
            key: 'capacity',
            label: 'Kapasitas',
            render: (item) => (
                <div>
                    <div>{item.capacity || '-'} siswa</div>
                    <div className="text-xs text-gray-500">
                        Terisi: {item.students?.[0]?.count || 0}
                    </div>
                </div>
            )
        },
        {
            key: 'roomNumber',
            label: 'Ruangan',
            render: (item) => item.room_number || '-'
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
                <h2 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h2>
                <button
                    onClick={handleCreate}
                    className="btn-primary flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Tambah Kelas
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter Tahun Ajaran
                        </label>
                        <select
                            value={filter.academicYearId}
                            onChange={(e) => setFilter({ ...filter, academicYearId: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Semua Tahun Ajaran</option>
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>
                                    {year.year} - {year.semester} {year.is_active ? '(Aktif)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Classes Table */}
            <DataTable
                columns={columns}
                data={classes}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                actions={actions}
            />

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedClass ? 'Edit Kelas' : 'Tambah Kelas'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Kelas
                            </label>
                            <input
                                {...register('name', { required: 'Nama kelas harus diisi' })}
                                type="text"
                                className="input-field"
                                placeholder="Contoh: X IPA 1"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tingkat Kelas
                            </label>
                            <select
                                {...register('gradeLevel', { required: 'Tingkat kelas harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Tingkat</option>
                                <option value="10">X (10)</option>
                                <option value="11">XI (11)</option>
                                <option value="12">XII (12)</option>
                            </select>
                            {errors.gradeLevel && (
                                <p className="mt-1 text-sm text-red-600">{errors.gradeLevel.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jurusan
                            </label>
                            <select
                                {...register('jurusanId')}
                                className="input-field"
                            >
                                <option value="">Pilih Jurusan</option>
                                {jurusan.map(j => (
                                    <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tahun Ajaran
                            </label>
                            <select
                                {...register('academicYearId', { required: 'Tahun ajaran harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Tahun Ajaran</option>
                                {academicYears.map(year => (
                                    <option key={year.id} value={year.id}>
                                        {year.year} - {year.semester}
                                    </option>
                                ))}
                            </select>
                            {errors.academicYearId && (
                                <p className="mt-1 text-sm text-red-600">{errors.academicYearId.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wali Kelas
                            </label>
                            <select
                                {...register('homeroomTeacherId')}
                                className="input-field"
                            >
                                <option value="">Pilih Wali Kelas</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.user?.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kapasitas
                            </label>
                            <input
                                {...register('capacity')}
                                type="number"
                                min="1"
                                className="input-field"
                                placeholder="40"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Ruangan
                            </label>
                            <input
                                {...register('roomNumber')}
                                type="text"
                                className="input-field"
                                placeholder="R.101"
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
                            {selectedClass ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Hapus Kelas"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Apakah Anda yakin ingin menghapus kelas <span className="font-semibold">{selectedClass?.name}</span>?
                        Semua data siswa di kelas ini akan kehilangan referensi kelas.
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

export default Classes;