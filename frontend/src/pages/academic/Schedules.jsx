import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarIcon, ClockIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const Schedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [filter, setFilter] = useState({
        classId: '',
        dayOfWeek: ''
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { hasRole, user } = useAuth();

    useEffect(() => {
        fetchSchedules();
        fetchClasses();
        fetchSubjects();
        fetchTeachers();
        fetchAcademicYears();
    }, [filter]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.classId) params.classId = filter.classId;
            if (filter.dayOfWeek) params.dayOfWeek = filter.dayOfWeek;
            
            const response = await api.get('/schedules', { params });
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            toast.error('Gagal memuat jadwal');
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

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/teachers?limit=100');
            setTeachers(response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
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

    const handleCreate = () => {
        setSelectedSchedule(null);
        reset({
            classId: '',
            subjectId: '',
            teacherId: '',
            academicYearId: academicYears.find(y => y.is_active)?.id || '',
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            room: ''
        });
        setModalOpen(true);
    };

    const handleEdit = (schedule) => {
        setSelectedSchedule(schedule);
        reset({
            classId: schedule.class_id,
            subjectId: schedule.subject_id,
            teacherId: schedule.teacher_id,
            academicYearId: schedule.academic_year_id,
            dayOfWeek: schedule.day_of_week,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            room: schedule.room
        });
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            if (selectedSchedule) {
                await api.put(`/schedules/${selectedSchedule.id}`, data);
                toast.success('Jadwal berhasil diupdate');
            } else {
                await api.post('/schedules', data);
                toast.success('Jadwal berhasil dibuat');
            }
            setModalOpen(false);
            fetchSchedules();
        } catch (error) {
            console.error('Error saving schedule:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan jadwal');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
        
        try {
            await api.delete(`/schedules/${id}`);
            toast.success('Jadwal berhasil dihapus');
            fetchSchedules();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            toast.error(error.response?.data?.error || 'Gagal menghapus jadwal');
        }
    };

    // Group schedules by day
    const groupedSchedules = days.reduce((acc, day) => {
        acc[day] = schedules.filter(s => s.day_of_week === day);
        return acc;
    }, {});

    if (!hasRole(['Super Admin', 'Admin', 'Admin TU', 'Guru'])) {
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
                <h2 className="text-2xl font-bold text-gray-900">Jadwal Pelajaran</h2>
                {hasRole(['Super Admin', 'Admin', 'Admin TU']) && (
                    <button
                        onClick={handleCreate}
                        className="btn-primary"
                    >
                        Tambah Jadwal
                    </button>
                )}
            </div>

            {/* Filters */}
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
                            Filter Hari
                        </label>
                        <select
                            value={filter.dayOfWeek}
                            onChange={(e) => setFilter({ ...filter, dayOfWeek: e.target.value })}
                            className="input-field"
                        >
                            <option value="">Semua Hari</option>
                            {days.map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Schedule Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {days.map(day => (
                        <div key={day} className="card">
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">
                                {day}
                            </h3>
                            <div className="space-y-3">
                                {groupedSchedules[day].length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Tidak ada jadwal
                                    </p>
                                ) : (
                                    groupedSchedules[day].map(schedule => (
                                        <div
                                            key={schedule.id}
                                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {schedule.subject?.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Kelas {schedule.class?.name}
                                                    </p>
                                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                                        <ClockIcon className="h-3 w-3 mr-1" />
                                                        {schedule.start_time} - {schedule.end_time}
                                                    </div>
                                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                                        <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                                        {schedule.room || 'Ruangan'}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Guru: {schedule.teacher?.user?.full_name}
                                                    </p>
                                                </div>
                                                {hasRole(['Super Admin', 'Admin', 'Admin TU']) && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(schedule)}
                                                            className="text-primary-600 hover:text-primary-800"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(schedule.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedSchedule ? 'Edit Jadwal' : 'Tambah Jadwal'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                Guru
                            </label>
                            <select
                                {...register('teacherId', { required: 'Guru harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Guru</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.user?.full_name}
                                    </option>
                                ))}
                            </select>
                            {errors.teacherId && (
                                <p className="mt-1 text-sm text-red-600">{errors.teacherId.message}</p>
                            )}
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
                                        {year.year} - {year.semester} {year.is_active ? '(Aktif)' : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.academicYearId && (
                                <p className="mt-1 text-sm text-red-600">{errors.academicYearId.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hari
                            </label>
                            <select
                                {...register('dayOfWeek', { required: 'Hari harus dipilih' })}
                                className="input-field"
                            >
                                <option value="">Pilih Hari</option>
                                {days.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                            {errors.dayOfWeek && (
                                <p className="mt-1 text-sm text-red-600">{errors.dayOfWeek.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jam Mulai
                            </label>
                            <input
                                {...register('startTime', { required: 'Jam mulai harus diisi' })}
                                type="time"
                                className="input-field"
                            />
                            {errors.startTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jam Selesai
                            </label>
                            <input
                                {...register('endTime', { required: 'Jam selesai harus diisi' })}
                                type="time"
                                className="input-field"
                            />
                            {errors.endTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ruangan
                            </label>
                            <input
                                {...register('room')}
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
                            {selectedSchedule ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Schedules;