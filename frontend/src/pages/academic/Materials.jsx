import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DocumentIcon, DocumentArrowDownIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import FileUpload from '../../components/common/FileUpload';
import toast from 'react-hot-toast';

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [filter, setFilter] = useState({
        subjectId: ''
    });
    const [file, setFile] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole, user } = useAuth();

    useEffect(() => {
        fetchMaterials();
        fetchSubjects();
    }, [filter]);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.subjectId) params.subjectId = filter.subjectId;
            
            const response = await api.get('/materials', { params });
            setMaterials(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast.error('Gagal memuat materi');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/subjects?limit=100');
            setSubjects(response.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleCreate = () => {
        setSelectedMaterial(null);
        reset({
            subjectId: '',
            title: '',
            description: ''
        });
        setFile(null);
        setModalOpen(true);
    };

    const handleEdit = (material) => {
        setSelectedMaterial(material);
        reset({
            subjectId: material.subject_id,
            title: material.title,
            description: material.description || ''
        });
        setFile(null);
        setModalOpen(true);
    };

    const handleFileUpload = (uploadedFile) => {
        setFile(uploadedFile);
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('subjectId', data.subjectId);
            formData.append('title', data.title);
            formData.append('description', data.description);
            
            if (file) {
                formData.append('file', file);
            }

            if (selectedMaterial) {
                await api.put(`/materials/${selectedMaterial.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Materi berhasil diupdate');
            } else {
                await api.post('/materials', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Materi berhasil diupload');
            }
            setModalOpen(false);
            fetchMaterials();
        } catch (error) {
            console.error('Error saving material:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan materi');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
        
        try {
            await api.delete(`/materials/${id}`);
            toast.success('Materi berhasil dihapus');
            fetchMaterials();
        } catch (error) {
            console.error('Error deleting material:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus materi');
        }
    };

    const handleDownload = (fileUrl, fileName) => {
        window.open(fileUrl, '_blank');
    };

    const columns = [
        {
            key: 'title',
            label: 'Judul',
            render: (item) => (
                <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.subject?.name}</div>
                </div>
            )
        },
        {
            key: 'description',
            label: 'Deskripsi',
            render: (item) => item.description || '-'
        },
        {
            key: 'teacher',
            label: 'Upload oleh',
            render: (item) => item.teacher?.user?.full_name
        },
        {
            key: 'file',
            label: 'File',
            render: (item) => item.file_url ? (
                <button
                    onClick={() => handleDownload(item.file_url, item.title)}
                    className="text-primary-600 hover:text-primary-800 flex items-center"
                >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                    Download
                </button>
            ) : '-'
        },
        {
            key: 'created_at',
            label: 'Tanggal Upload',
            render: (item) => new Date(item.created_at).toLocaleDateString('id-ID')
        }
    ];

    const actions = (item) => {
        if (!hasRole(['Guru', 'Admin'])) return null;
        
        return (
            <div className="flex justify-end space-x-2">
                <button
                    onClick={() => handleEdit(item)}
                    className="text-primary-600 hover:text-primary-800"
                >
                    <PencilIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Materi Pembelajaran</h2>
                {hasRole(['Guru', 'Admin']) && (
                    <button
                        onClick={handleCreate}
                        className="btn-primary"
                    >
                        Upload Materi
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter Mata Pelajaran
                        </label>
                        <select
                            value={filter.subjectId}
                            onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Semua Mata Pelajaran</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Materials Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : materials.length === 0 ? (
                <div className="card text-center py-12">
                    <DocumentIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Belum ada materi
                    </h3>
                    <p className="text-gray-500">
                        {hasRole(['Guru', 'Admin']) 
                            ? 'Upload materi pembelajaran untuk siswa'
                            : 'Belum ada materi yang diupload'}
                    </p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={materials}
                    loading={loading}
                    actions={actions}
                />
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedMaterial ? 'Edit Materi' : 'Upload Materi'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mata Pelajaran
                        </label>
                        <select
                            {...register('subjectId', { required: 'Mata pelajaran harus dipilih' })}
                            className="input-field"
                        >
                            <option value="">Pilih Mata Pelajaran</option>
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                        </select>
                        {errors.subjectId && (
                            <p className="mt-1 text-sm text-red-600">{errors.subjectId.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Judul Materi
                        </label>
                        <input
                            {...register('title', { required: 'Judul harus diisi' })}
                            type="text"
                            className="input-field"
                            placeholder="Contoh: Bab 1 - Pengenalan"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            {...register('description')}
                            rows="4"
                            className="input-field"
                            placeholder="Jelaskan tentang materi ini..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            File Materi
                        </label>
                        <FileUpload
                            onFileSelect={handleFileUpload}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                            maxSize={10 * 1024 * 1024} // 10MB
                        />
                        {selectedMaterial?.file_url && !file && (
                            <p className="mt-2 text-sm text-gray-500">
                                File saat ini: {selectedMaterial.file_url.split('/').pop()}
                            </p>
                        )}
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
                            {selectedMaterial ? 'Update' : 'Upload'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Materials;