import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChartBarIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const Grades = () => {
    const [grades, setGrades] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [filter, setFilter] = useState({
        classId: '',
        subjectId: '',
        studentId: ''
    });
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [bulkGrades, setBulkGrades] = useState([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole, user } = useAuth();

    useEffect(() => {
        fetchGrades();
        fetchClasses();
        fetchSubjects();
        fetchAcademicYears();
    }, [filter]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
        }
    }, [selectedClass]);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.classId) params.classId = filter.classId;
            if (filter.subjectId) params.subjectId = filter.subjectId;
            if (filter.studentId) params.studentId = filter.studentId;
            
            const response = await api.get('/grades', { params });
            setGrades(response.data);
        } catch (error) {
            console.error('Error fetching grades:', error);
            toast.error('Gagal memuat data nilai');
        } finally {
            setLoading(false);
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

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/subjects?limit=100');
            setSubjects(response.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await api.get('/academic-years?limit=100&isActive=true');
            setAcademicYears(response.data);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        }
    };

    const fetchStudentsByClass = async (classId) => {
        try {
            const response = await api.get('/students', {
                params: { classId, limit: 100 }
            });
            setStudents(response.data);
            
            // Initialize bulk grades
            const initialGrades = response.data.map(student => ({
                studentId: student.id,
                studentName: student.user?.full_name,
                nis: student.nis,
                score: '',
                description: ''
            }));
            setBulkGrades(initialGrades);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleCreate = () => {
        setSelectedGrade(null);
        reset({
            studentId: '',
            subjectId: '',
            teacherId: user.teacher_id || '',
            academicYearId: academicYears.find(y => y.is_active)?.id || '',
            gradeType: '',
            score: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setModalOpen(true);
    };

    const handleEdit = (grade) => {
        setSelectedGrade(grade);
        reset({
            studentId: grade.student_id,
            subjectId: grade.subject_id,
            teacherId: grade.teacher_id,
            academicYearId: grade.academic_year_id,
            gradeType: grade.grade_type,
            score: grade.score,
            description: grade.description || '',
            date: grade.date
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (selectedGrade) {
                await api.put(`/grades/${selectedGrade.id}`, data);
                toast.success('Nilai berhasil diupdate');
            } else {
                await api.post('/grades', data);
                toast.success('Nilai berhasil dicatat');
            }
            setModalOpen(false);
            fetchGrades();
        } catch (error) {
            console.error('Error saving grade:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan nilai');
        }
    };

    const handleBulkSubmit = async () => {
        try {
            const gradesToSubmit = bulkGrades
                .filter(g => g.score && g.score.trim() !== '')
                .map(g => ({
                    studentId: g.studentId,
                    subjectId: selectedSubject,
                    teacherId: user.teacher_id,
                    academicYearId: academicYears.find(y => y.is_active)?.id,
                    gradeType: 'Tugas',
                    score: parseFloat(g.score),
                    description: g.description
                }));

            if (gradesToSubmit.length === 0) {
                toast.error('Tidak ada nilai yang diinput');
                return;
            }

            await api.post('/grades/bulk', { grades: gradesToSubmit });
            toast.success(`${gradesToSubmit.length} nilai berhasil disimpan`);
            setBulkModalOpen(false);
            fetchGrades();
        } catch (error) {
            console.error('Error saving bulk grades:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan nilai');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus nilai ini?')) return;
        
        try {
            await api.delete(`/grades/${id}`);
            toast.success('Nilai berhasil dihapus');
            fetchGrades();
        } catch (error) {
            console.error('Error deleting grade:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus nilai');
        }
    };

    const handleBulkGradeChange = (index, field, value) => {
        const updated = [...bulkGrades];
        updated[index][field] = value;
        setBulkGrades(updated);
    };

    const calculateAverage = () => {
        if (grades.length === 0) return 0;
        const sum = grades.reduce((acc, g) => acc + g.score, 0);
        return (sum / grades.length).toFixed(2);
    };

    const columns = [
        {
            key: 'student',
            label: 'Siswa',
            render: (item) => (
                <div>
                    <div className="font-medium">{item.student?.user?.full_name}</div>
                    <div className="text-xs text-gray-500">NIS: {item.student?.nis}</div>
                </div>
            )
        },
        {
            key: 'subject',
            label: 'Mata Pelajaran',
            render: (item) => item.subject?.name
        },
        {
            key: 'gradeType',
            label: 'Tipe',
            render: (item) => (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {item.grade_type}
                </span>
            )
        },
        {
            key: 'score',
            label: 'Nilai',
            render: (item) => (
                <span className={`font-bold ${
                    item.score >= 80 ? 'text-green-600' :
                    item.score >= 70 ? 'text-blue-600' :
                    item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                    {item.score}
                </span>
            )
        },
        {
            key: 'date',
            label: 'Tanggal',
            render: (item) => new Date(item.date).toLocaleDateString('id-ID')
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
            {hasRole(['Super Admin', 'Admin']) && (
                <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );

    if (!hasRole(['Super Admin', 'Admin', 'Guru', 'Kepala Sekolah'])) {
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
                <h2 className="text-2xl font-bold text-gray-900">Manajemen Nilai</h2>
                <div className="flex space-x-3">
                    {hasRole(['Guru']) && (
                        <button
                            onClick={() => setBulkModalOpen(true)}
                            className="btn-secondary"
                        >
                            Input Nilai Massal
                        </button>
                    )}
                    {hasRole(['Super Admin', 'Admin', 'Guru']) && (
                        <button
                            onClick={handleCreate}
                            className="btn-primary"
                        >
                            Input Nilai
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Total Nilai</p>
                            <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <ChartBarIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-600">Rata-rata</p>
                            <p className="text-2xl font-bold text-gray-900">{calculateAverage()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter Siswa
                        </label>
                        <select
                            value={filter.studentId}
                            onChange={(e) => setFilter({ ...filter, studentId: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Semua Siswa</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.user?.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <DataTable
                columns={columns}
                data={grades}
                loading={loading}
                actions={actions}
            />

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedGrade ? 'Edit Nilai' : 'Input Nilai'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Siswa
                            </label>
                            <select
                                {...register('studentId', { required: 'Siswa harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Siswa</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.user?.full_name} ({student.nis})
                                    </option>
                                ))}
                            </select>
                            {errors.studentId && (
                                <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
                            )}
                        </div>

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
                                Tipe Nilai
                            </label>
                            <select
                                {...register('gradeType', { required: 'Tipe nilai harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Tipe</option>
                                <option value="Tugas">Tugas</option>
                                <option value="UTS">UTS</option>
                                <option value="UAS">UAS</option>
                                <option value="Praktikum">Praktikum</option>
                            </select>
                            {errors.gradeType && (
                                <p className="mt-1 text-sm text-red-600">{errors.gradeType.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nilai
                            </label>
                            <input
                                {...register('score', { 
                                    required: 'Nilai harus diisi',
                                    min: 0,
                                    max: 100
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
                                Tanggal
                            </label>
                            <input
                                {...register('date', { required: 'Tanggal harus diisi' })}
                                type="date"
                                className="input-field"
                            />
                            {errors.date && (
                                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan
                            </label>
                            <textarea
                                {...register('description')}
                                rows="3"
                                className="input-field"
                                placeholder="Catatan tambahan..."
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
                            {selectedGrade ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Bulk Input Modal */}
            <Modal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                title="Input Nilai Massal"
                size="xl"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kelas
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Pilih Kelas</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mata Pelajaran
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Pilih Mata Pelajaran</option>
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedClass && selectedSubject && (
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Daftar Siswa</h4>
                            <div className="max-h-96 overflow-y-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NIS</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nilai</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {bulkGrades.map((grade, index) => (
                                            <tr key={grade.studentId}>
                                                <td className="px-4 py-2 text-sm">{grade.nis}</td>
                                                <td className="px-4 py-2 text-sm">{grade.studentName}</td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        value={grade.score}
                                                        onChange={(e) => handleBulkGradeChange(index, 'score', e.target.value)}
                                                        className="input-field w-20"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={grade.description}
                                                        onChange={(e) => handleBulkGradeChange(index, 'description', e.target.value)}
                                                        className="input-field"
                                                        placeholder="Catatan"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setBulkModalOpen(false)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkSubmit}
                            className="btn-primary"
                            disabled={!selectedClass || !selectedSubject}
                        >
                            Simpan Semua
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Grades;