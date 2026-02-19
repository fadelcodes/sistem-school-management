const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');

const getAttendance = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, classId, date, studentId } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('attendance')
            .select(`
                *,
                student:student_id(
                    nis,
                    user:user_id(full_name)
                ),
                schedule:schedule_id(
                    subject:subject_id(name),
                    teacher:teacher_id(user:user_id(full_name))
                ),
                created_by:created_by(full_name)
            `, { count: 'exact' });

        if (classId) {
            query = query.eq('student.class_id', classId);
        }

        if (date) {
            query = query.eq('date', date);
        }

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        const { data: attendance, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: attendance,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getAttendanceById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: attendance, error } = await supabase
            .from('attendance')
            .select(`
                *,
                student:student_id(*),
                schedule:schedule_id(*)
            `)
            .eq('id', id)
            .single();

        if (error || !attendance) {
            return res.status(404).json({ error: 'Data absensi tidak ditemukan' });
        }

        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

const createAttendance = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { studentId, scheduleId, date, status, notes } = req.body;

        // Check if attendance already exists
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', studentId)
            .eq('schedule_id', scheduleId)
            .eq('date', date)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Absensi untuk siswa ini sudah ada' });
        }

        const { data: attendance, error } = await supabase
            .from('attendance')
            .insert([{
                student_id: studentId,
                schedule_id: scheduleId,
                date,
                status,
                notes,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        // Get student and parent info for notification
        const { data: student } = await supabase
            .from('students')
            .select('parent_id, user:user_id(full_name)')
            .eq('id', studentId)
            .single();

        // Notify parent
        if (student && student.parent_id) {
            await createNotification({
                userId: student.parent_id,
                title: 'Absensi Anak',
                message: `Absensi ${student.user.full_name} pada ${date}: ${status}`,
                type: 'attendance_input',
                referenceId: attendance.id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Absensi berhasil dicatat',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

const createBulkAttendance = async (req, res, next) => {
    try {
        const { attendance: attendanceList } = req.body;

        if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
            return res.status(400).json({ error: 'Data absensi tidak valid' });
        }

        const results = [];
        const errors = [];

        for (const item of attendanceList) {
            try {
                const { studentId, scheduleId, date, status, notes } = item;

                // Check if exists
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('id')
                    .eq('student_id', studentId)
                    .eq('schedule_id', scheduleId)
                    .eq('date', date)
                    .single();

                if (existing) {
                    // Update existing
                    const { data } = await supabase
                        .from('attendance')
                        .update({ status, notes, updated_by: req.userId })
                        .eq('id', existing.id)
                        .select()
                        .single();
                    results.push(data);
                } else {
                    // Create new
                    const { data } = await supabase
                        .from('attendance')
                        .insert([{
                            student_id: studentId,
                            schedule_id: scheduleId,
                            date,
                            status,
                            notes,
                            created_by: req.userId
                        }])
                        .select()
                        .single();
                    results.push(data);
                }
            } catch (error) {
                errors.push({ item, error: error.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `Berhasil memproses ${results.length} data absensi`,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        next(error);
    }
};

const updateAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const { data: attendance, error } = await supabase
            .from('attendance')
            .update({
                status,
                notes,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!attendance) {
            return res.status(404).json({ error: 'Data absensi tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Absensi berhasil diupdate',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

const deleteAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('attendance')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Data absensi berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

const getAttendanceReport = async (req, res, next) => {
    try {
        const { classId, startDate, endDate, studentId } = req.query;

        let query = supabase
            .from('attendance')
            .select(`
                student:student_id(
                    id,
                    nis,
                    user:user_id(full_name),
                    class:class_id(name)
                ),
                status,
                date,
                schedule:schedule_id(subject:subject_id(name))
            `);

        if (classId) {
            query = query.eq('student.class_id', classId);
        }

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: attendance, error } = await query.order('date');

        if (error) throw error;

        // Group by student
        const report = attendance.reduce((acc, curr) => {
            const studentId = curr.student.id;
            if (!acc[studentId]) {
                acc[studentId] = {
                    student: curr.student,
                    total: 0,
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alpha: 0,
                    terlambat: 0,
                    details: []
                };
            }

            acc[studentId].total++;
            acc[studentId][curr.status.toLowerCase()]++;
            acc[studentId].details.push({
                date: curr.date,
                status: curr.status,
                subject: curr.schedule?.subject?.name
            });

            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(report)
        });
    } catch (error) {
        next(error);
    }
};

const getStudentAttendance = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { startDate, endDate } = req.query;

        let query = supabase
            .from('attendance')
            .select(`
                *,
                schedule:schedule_id(
                    subject:subject_id(name),
                    start_time,
                    end_time
                )
            `)
            .eq('student_id', studentId);

        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: attendance, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        // Calculate statistics
        const stats = {
            total: attendance.length,
            hadir: attendance.filter(a => a.status === 'Hadir').length,
            sakit: attendance.filter(a => a.status === 'Sakit').length,
            izin: attendance.filter(a => a.status === 'Izin').length,
            alpha: attendance.filter(a => a.status === 'Alpha').length,
            terlambat: attendance.filter(a => a.status === 'Terlambat').length
        };

        stats.persentaseHadir = stats.total > 0 ? ((stats.hadir / stats.total) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                statistics: stats,
                records: attendance
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAttendance,
    getAttendanceById,
    createAttendance,
    createBulkAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceReport,
    getStudentAttendance
};