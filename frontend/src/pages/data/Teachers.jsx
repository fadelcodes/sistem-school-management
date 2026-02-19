import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchTeachers();
  }, [pagination.page]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teachers', {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setTeachers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTeacher(null);
    reset({
      nip: '',
      fullName: '',
      email: '',
      password: '',
      specialization: '',
      qualification: '',
      phone: '',
      address: '',
      joinDate: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    reset({
      nip: teacher.nip,
      fullName: teacher.user?.full_name,
      email: teacher.user?.email,
      specialization: teacher.specialization || '',
      qualification: teacher.qualification || '',
      phone: teacher.user?.phone || '',
      address: teacher.user?.address || '',
      joinDate: teacher.join_date || ''
    });
    setModalOpen(true);
  };

  const handleDelete = (teacher) => {
    setSelectedTeacher(teacher);
    setDeleteModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (selectedTeacher) {
        // Update teacher
        await api.put(`/teachers/${selectedTeacher.id}`, data);
        toast.success('Data guru berhasil diupdate');
      } else {
        // Create teacher
        await api.post('/teachers', data);
        toast.success('Data guru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast.error(error.response?.data?.error || 'Gagal menyimpan data guru');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/teachers/${selectedTeacher.id}`);
      toast.success('Data guru berhasil dihapus');
      setDeleteModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.error || 'Gagal menghapus data guru');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Manajemen Guru</h2>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Tambah Guru
        </button>
      </div>

      {/* Teachers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spesialisasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kualifikasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Bergabung
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data guru
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {teacher.nip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 text-sm font-medium">
                            {teacher.user?.full_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {teacher.user?.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {teacher.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.specialization || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.qualification || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.join_date ? new Date(teacher.join_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 border rounded-md bg-primary-50 text-primary-600">
                  {pagination.page}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedTeacher ? 'Edit Guru' : 'Tambah Guru'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIP <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nip', { required: 'NIP harus diisi' })}
                type="text"
                className="input-field"
              />
              {errors.nip && (
                <p className="mt-1 text-sm text-red-600">{errors.nip.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
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

            {!selectedTeacher && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email', { 
                    required: 'Email harus diisi',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email tidak valid'
                    }
                  })}
                  type="email"
                  className="input-field"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            )}

            {!selectedTeacher && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('password', { 
                    required: 'Password harus diisi',
                    minLength: {
                      value: 8,
                      message: 'Password minimal 8 karakter'
                    }
                  })}
                  type="password"
                  className="input-field"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spesialisasi
              </label>
              <input
                {...register('specialization')}
                type="text"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kualifikasi
              </label>
              <input
                {...register('qualification')}
                type="text"
                className="input-field"
                placeholder="S1, S2, dll"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Telepon
              </label>
              <input
                {...register('phone')}
                type="text"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Bergabung
              </label>
              <input
                {...register('joinDate')}
                type="date"
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
              {selectedTeacher ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Guru"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus data guru <span className="font-semibold">{selectedTeacher?.user?.full_name}</span>?
            Tindakan ini akan menghapus semua data terkait (jadwal mengajar, dll).
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

export default Teachers;