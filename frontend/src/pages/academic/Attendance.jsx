import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [classes, setClasses] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [attendanceData, setAttendanceData] = useState([]);

    const { register, handleSubmit, reset } = useForm();
    const { hasRole, user } = useAuth();

    useEffect(() => {
        fetchClasses();
        fetchAttendance();
    }, [selectedDate, selectedClass]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchSchedulesByClass(selectedClass);
        }
    }, [selectedClass, selectedDate]);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes?limit=100');
            setClasses(response.data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const params = { date: selectedDate };
            if (selectedClass) params.classId = selectedClass;
            
            const response = await api.get('/attendance', { params });
            setAttendance(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Gagal memuat data absensi');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsByClass = async (classId) => {
        try {
            const response = await api.get('/students', {
                params: { classId, limit: 100 }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchSchedulesByClass = async (classId) => {
        try {
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const dayName = days[new Date(selectedDate).getDay()];
            
            const response = await api.get('/schedules', {
                params: { classId, dayOfWeek: dayName }
            });
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const handleTakeAttendance = () => {
        if (!selectedClass || !selectedSchedule) {
            toast.error('Pilih kelas dan jadwal terlebih dahulu');
            return;
        }

        // Initialize attendance data for all students
        const initialData = students.map(student => {
            const existing = attendance.find(
                a => a.student_id === student.id && a.schedule_id === selectedSchedule
            );
            return {
                studentId: student.id,
                studentName: student.user?.full_name,
                nis: student.nis,
                status: existing?.status || 'Hadir',
                notes: existing?.notes || '',
                attendanceId: existing?.id
            };
        });
        setAttendanceData(initialData);
        setModalOpen(true);
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev =>
            prev.map(item =>
                item.studentId === studentId ? { ...item, status } : item
            )
        );
    };

    const handleNotesChange = (studentId, notes) => {
        setAttendanceData(prev =>
            prev.map(item =>
                item.studentId === studentId ? { ...item, notes } : item
            )
        );
    };

    const handleSubmitAttendance = async () => {
        try {
            const payload = {
                attendance: attendanceData.map(item => ({
                    studentId: item.studentId,
                    scheduleId: selectedSchedule,
                    date: selectedDate,
                    status: item.status,
                    notes: item.notes
                }))
            };

            await api.post('/attendance/bulk', payload);
            toast.success('Absensi berhasil disimpan');
            setModalOpen(false);
            fetchAttendance();
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error(error.response?.data?.error || 'Gagal menyimpan absensi');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            Hadir: 'bg-green-100 text-green-800',
            Sakit: 'bg-yellow-100 text-yellow-800',
            Izin: 'bg-blue-100 text-blue-800',
            Alpha: 'bg-red-100 text-red-800',
            Terlambat: 'bg-orange-100 text-orange-800'
        };
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    // Group attendance by schedule
    const groupedAttendance = attendance.reduce((acc, item) => {
        const scheduleId = item.schedule_id;
        if (!acc[scheduleId]) {
            acc[scheduleId] = {
                schedule: item.schedule,
                records: []
            };
        }
        acc[scheduleId].records.push(item);
        return acc;
    }, {});

    if (!hasRole(['Super Admin', 'Admin', 'Guru', 'Admin TU'])) {
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
                <h2 className="text-2xl font-bold text-gray-900">Absensi Siswa</h2>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-field"
                        />
                    </div>
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
                            Jadwal
                        </label>
                        <select
                            value={selectedSchedule}
                            onChange={(e) => setSelectedSchedule(e.target.value)}
                            className="input-field"
                        >
                            <option value="">Pilih Jadwal</option>
                            {schedules.map(schedule => (
                                <option key={schedule.id} value={schedule.id}>
                                    {schedule.subject?.name} ({schedule.start_time} - {schedule.end_time})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleTakeAttendance}
                        className="btn-primary"
                        disabled={!selectedClass || !selectedSchedule}
                    >
                        Ambil Absensi
                    </button>
                </div>
            </div>

            {/* Attendance Summary */}
            {Object.keys(groupedAttendance).length > 0 && (
                <div className="space-y-6">
                    {Object.entries(groupedAttendance).map(([scheduleId, group]) => (
                        <div key={scheduleId} className="card">
                            <h3 className="text-lg font-semibold mb-4">
                                {group.schedule?.subject?.name} - {group.schedule?.start_time} s/d {group.schedule?.end_time}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NIS</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {group.records.map(record => (
                                            <tr key={record.id}>
                                                <td className="px-4 py-2 text-sm">{record.student?.nis}</td>
                                                <td className="px-4 py-2 text-sm">{record.student?.user?.full_name}</td>
                                                <td className="px-4 py-2">
                                                    {getStatusBadge(record.status)}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    {record.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 grid grid-cols-5 gap-2 text-sm">
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-green-600">
                                        {group.records.filter(r => r.status === 'Hadir').length}
                                    </span>
                                    <span className="text-gray-500">Hadir</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-yellow-600">
                                        {group.records.filter(r => r.status === 'Sakit').length}
                                    </span>
                                    <span className="text-gray-500">Sakit</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-blue-600">
                                        {group.records.filter(r => r.status === 'Izin').length}
                                    </span>
                                    <span className="text-gray-500">Izin</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-red-600">
                                        {group.records.filter(r => r.status === 'Alpha').length}
                                    </span>
                                    <span className="text-gray-500">Alpha</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-orange-600">
                                        {group.records.filter(r => r.status === 'Terlambat').length}
                                    </span>
                                    <span className="text-gray-500">Terlambat</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Attendance Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Input Absensi"
                size="xl"
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Tanggal:</strong> {new Date(selectedDate).toLocaleDateString('id-ID')}
                        </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NIS</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {attendanceData.map((item) => (
                                    <tr key={item.studentId}>
                                        <td className="px-4 py-2 text-sm">{item.nis}</td>
                                        <td className="px-4 py-2 text-sm">{item.studentName}</td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.studentId, e.target.value)}
                                                className="input-field text-sm py-1"
                                            >
                                                <option value="Hadir">Hadir</option>
                                                <option value="Sakit">Sakit</option>
                                                <option value="Izin">Izin</option>
                                                <option value="Alpha">Alpha</option>
                                                <option value="Terlambat">Terlambat</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={item.notes}
                                                onChange={(e) => handleNotesChange(item.studentId, e.target.value)}
                                                className="input-field text-sm py-1"
                                                placeholder="Catatan"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                            type="button"
                            onClick={handleSubmitAttendance}
                            className="btn-primary"
                        >
                            Simpan Absensi
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Attendance;