import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
    DocumentTextIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    PencilIcon,
    TrashIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import FileUpload from '../../components/common/FileUpload';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [gradeModalOpen, setGradeModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [file, setFile] = useState(null);
    const [filter, setFilter] = useState({
        classId: '',
        subjectId: ''
    });

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
    const { hasRole, user } = useAuth();

    useEffect(() => {
        fetchAssignments();
        fetchSubjects();
        fetchClasses();
    }, [filter]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.classId) params.classId = filter.classId;
            if (filter.subjectId) params.subjectId = filter.subjectId;
            
            // If user is student, get their assignments
            if (hasRole('Siswa')) {
                const response = await api.get('/assignments/student');
                setAssignments(response.data);
            } else {
                const response = await api.get('/assignments', { params });
                setAssignments(response.data);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Gagal memuat tugas');
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

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes?limit=100');
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSubmissions = async (assignmentId) => {
        try {
            const response = await api.get(`/assignments/${assignmentId}`);
            setSubmissions(response.data.submissions || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    const handleCreate = () => {
        setSelectedAssignment(null);
        reset({
            subjectId: '',
            classId: '',
            title: '',
            description: '',
            deadline: '',
            maxScore: 100
        });
        setFile(null);
        setModalOpen(true);
    };

    const handleEdit = (assignment) => {
        setSelectedAssignment(assignment);
        reset({
            subjectId: assignment.subject_id,
            classId: assignment.class_id,
            title: assignment.title,
            description: assignment.description || '',
            deadline: assignment.deadline.split('T')[0],
            maxScore: assignment.max_score
        });
        setFile(null);
        setModalOpen(true);
    };

    const handleViewSubmissions = (assignment) => {
        setSelectedAssignment(assignment);
        fetchSubmissions(assignment.id);
        setSubmissionModalOpen(true);
    };

    const handleGradeSubmission = (submission) => {
        setSelectedSubmission(submission);
        setValue('score', submission.score || '');
        setValue('feedback', submission.feedback || '');
        setGradeModalOpen(true);
    };

    const handleSubmitAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setFile(null);
        setSubmissionModalOpen(true); // Reuse modal for student submission
    };

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('subjectId', data.subjectId);
            formData.append('classId', data.classId);
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('deadline', data.deadline);
            formData.append('maxScore', data.maxScore);
            
            if (file) {
                formData.append('file', file);
            }

            if (selectedAssignment) {
                await api.put(`/assignments/${selectedAssignment.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Tugas berhasil diupdate');
            } else {
                await api.post('/assignments', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Tugas berhasil dibuat');
            }
            setModalOpen(false);
            fetchAssignments();
        } catch (error) {
            console.error('Error saving assignment:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan tugas');
        }
    };

    const onSubmitSubmission = async () => {
        try {
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            }
            formData.append('submissionText', document.getElementById('submissionText')?.value || '');

            await api.post(`/assignments/${selectedAssignment.id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Tugas berhasil dikumpulkan');
            setSubmissionModalOpen(false);
            fetchAssignments();
        } catch (error) {
            console.error('Error submitting assignment:', error);
            toast.error(error.response?.data?.error || 'Gagal mengumpulkan tugas');
        }
    };

    const onSubmitGrade = async (data) => {
        try {
            await api.post(`/assignments/submissions/${selectedSubmission.id}/grade`, {
                score: data.score,
                feedback: data.feedback
            });
            toast.success('Nilai berhasil disimpan');
            setGradeModalOpen(false);
            fetchSubmissions(selectedAssignment.id);
        } catch (error) {
            console.error('Error grading submission:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan nilai');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return;
        
        try {
            await api.delete(`/assignments/${id}`);
            toast.success('Tugas berhasil dihapus');
            fetchAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus tugas');
        }
    };

    const getStatusBadge = (assignment) => {
        const now = new Date();
        const deadline = new Date(assignment.deadline);
        
        if (assignment.submission) {
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Sudah Dikumpulkan
                </span>
            );
        } else if (now > deadline) {
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    Terlambat
                </span>
            );
        } else {
            return (
                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Belum Dikumpulkan
                </span>
            );
        }
    };

    const teacherColumns = [
        {
            key: 'title',
            label: 'Judul Tugas',
            render: (item) => (
                <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.subject?.name}</div>
                </div>
            )
        },
        {
            key: 'class',
            label: 'Kelas',
            render: (item) => item.class?.name
        },
        {
            key: 'deadline',
            label: 'Deadline',
            render: (item) => (
                <div>
                    <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(item.deadline).toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-xs text-gray-500">
                        {new Date(item.deadline).toLocaleTimeString('id-ID')}
                    </div>
                </div>
            )
        },
        {
            key: 'submissions',
            label: 'Pengumpulan',
            render: (item) => {
                const submitted = item.submissions?.length || 0;
                const total = item.class?.students?.length || 0;
                return (
                    <div>
                        <span className="font-medium">{submitted}/{total}</span>
                        <div className="text-xs text-gray-500">
                            {total > 0 ? Math.round((submitted/total)*100) : 0}%
                        </div>
                    </div>
                );
            }
        }
    ];

    const studentColumns = [
        {
            key: 'title',
            label: 'Judul Tugas',
            render: (item) => (
                <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.subject?.name}</div>
                </div>
            )
        },
        {
            key: 'teacher',
            label: 'Guru',
            render: (item) => item.teacher?.user?.full_name
        },
        {
            key: 'deadline',
            label: 'Deadline',
            render: (item) => (
                <div>
                    <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(item.deadline).toLocaleDateString('id-ID')}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => getStatusBadge(item)
        },
        {
            key: 'score',
            label: 'Nilai',
            render: (item) => item.submission?.score || '-'
        }
    ];

    const teacherActions = (item) => (
        <div className="flex justify-end space-x-2">
            <button
                onClick={() => handleViewSubmissions(item)}
                className="text-blue-600 hover:text-blue-800"
                title="Lihat Pengumpulan"
            >
                <DocumentTextIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => handleEdit(item)}
                className="text-primary-600 hover:text-primary-800"
                title="Edit"
            >
                <PencilIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-800"
                title="Hapus"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    );

    const studentActions = (item) => (
        <div className="flex justify-end">
            {!item.submission && new Date() <= new Date(item.deadline) && (
                <button
                    onClick={() => handleSubmitAssignment(item)}
                    className="text-primary-600 hover:text-primary-800"
                    title="Kumpulkan Tugas"
                >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Tugas</h2>
                {hasRole(['Guru', 'Admin']) && (
                    <button
                        onClick={handleCreate}
                        className="btn-primary"
                    >
                        Buat Tugas
                    </button>
                )}
            </div>

            {/* Filters for teachers */}
            {hasRole(['Guru', 'Admin']) && (
                <div className="card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter Kelas
                            </label>
                            <select
                                value={filter.classId}
                                onChange={(e) => setFilter({ ...filter, classId: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Semua Kelas</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
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
            )}

            {/* Assignments Table */}
            <DataTable
                columns={hasRole('Siswa') ? studentColumns : teacherColumns}
                data={assignments}
                loading={loading}
                actions={hasRole('Siswa') ? studentActions : teacherActions}
            />

            {/* Create/Edit Assignment Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedAssignment ? 'Edit Tugas' : 'Buat Tugas Baru'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                Kelas
                            </label>
                            <select
                                {...register('classId', { required: 'Kelas harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Kelas</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                            {errors.classId && (
                                <p className="mt-1 text-sm text-red-600">{errors.classId.message}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Judul Tugas
                            </label>
                            <input
                                {...register('title', { required: 'Judul harus diisi' })}
                                type="text"
                                className="input-field"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deskripsi Tugas
                            </label>
                            <textarea
                                {...register('description')}
                                rows="4"
                                className="input-field"
                                placeholder="Jelaskan detail tugas..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deadline
                            </label>
                            <input
                                {...register('deadline', { required: 'Deadline harus diisi' })}
                                type="date"
                                className="input-field"
                            />
                            {errors.deadline && (
                                <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nilai Maksimal
                            </label>
                            <input
                                {...register('maxScore')}
                                type="number"
                                min="0"
                                max="100"
                                className="input-field"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File Tugas (Opsional)
                            </label>
                            <FileUpload
                                onFileSelect={setFile}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                                maxSize={10 * 1024 * 1024}
                            />
                            {selectedAssignment?.file_url && !file && (
                                <p className="mt-2 text-sm text-gray-500">
                                    File saat ini: {selectedAssignment.file_url.split('/').pop()}
                                </p>
                            )}
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
                            {selectedAssignment ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Submissions Modal (for teachers) */}
            <Modal
                isOpen={submissionModalOpen && hasRole(['Guru', 'Admin'])}
                onClose={() => setSubmissionModalOpen(false)}
                title={`Pengumpulan Tugas: ${selectedAssignment?.title}`}
                size="xl"
            >
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NIS</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tanggal Kumpul</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">File</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nilai</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                            Belum ada pengumpulan tugas
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.map(sub => (
                                        <tr key={sub.id}>
                                            <td className="px-4 py-2 text-sm">{sub.student?.nis}</td>
                                            <td className="px-4 py-2 text-sm">{sub.student?.user?.full_name}</td>
                                            <td className="px-4 py-2 text-sm">
                                                {new Date(sub.submitted_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-2">
                                                {sub.file_url && (
                                                    <a
                                                        href={sub.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:text-primary-800"
                                                    >
                                                        Download
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-sm font-bold">
                                                {sub.score || '-'}
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => handleGradeSubmission(sub)}
                                                    className="text-primary-600 hover:text-primary-800"
                                                >
                                                    Nilai
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* Student Submission Modal */}
            <Modal
                isOpen={submissionModalOpen && hasRole('Siswa')}
                onClose={() => setSubmissionModalOpen(false)}
                title={`Kumpulkan Tugas: ${selectedAssignment?.title}`}
            >
                <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Deadline:</strong> {new Date(selectedAssignment?.deadline).toLocaleString('id-ID')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            File Tugas
                        </label>
                        <FileUpload
                            onFileSelect={setFile}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                            maxSize={10 * 1024 * 1024}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan (Opsional)
                        </label>
                        <textarea
                            id="submissionText"
                            rows="3"
                            className="input-field"
                            placeholder="Tambahkan catatan untuk guru..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setSubmissionModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onSubmitSubmission}
                            className="btn-primary"
                            disabled={!file}
                        >
                            Kumpulkan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Grade Modal */}
            <Modal
                isOpen={gradeModalOpen}
                onClose={() => setGradeModalOpen(false)}
                title="Beri Nilai Tugas"
            >
                <form onSubmit={handleSubmit(onSubmitGrade)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Siswa
                        </label>
                        <input
                            type="text"
                            value={selectedSubmission?.student?.user?.full_name}
                            disabled
                            className="input-field bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nilai
                        </label>
                        <input
                            {...register('score', { 
                                required: 'Nilai harus diisi',
                                min: 0,
                                max: selectedAssignment?.max_score || 100
                            })}
                            type="number"
                            step="0.01"
                            className="input-field"
                        />
                        {errors.score && (
                            <p className="mt-1 text-sm text-red-600">{errors.score.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback
                        </label>
                        <textarea
                            {...register('feedback')}
                            rows="3"
                            className="input-field"
                            placeholder="Berikan komentar untuk siswa..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setGradeModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Simpan Nilai
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Assignments;