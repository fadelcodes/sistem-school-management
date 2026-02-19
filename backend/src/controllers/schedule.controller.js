const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');

const getSchedules = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, classId, teacherId, dayOfWeek } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('schedules')
            .select(`
                *,
                class:class_id(name, grade_level),
                subject:subject_id(name, code),
                teacher:teacher_id(
                    nip,
                    user:user_id(full_name)
                ),
                academic_year:academic_year_id(year, semester, is_active)
            `, { count: 'exact' });

        if (classId) {
            query = query.eq('class_id', classId);
        }

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        if (dayOfWeek) {
            query = query.eq('day_of_week', dayOfWeek);
        }

        const { data: schedules, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;

        res.json({
            success: true,
            data: schedules,
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

const getScheduleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: schedule, error } = await supabase
            .from('schedules')
            .select(`
                *,
                class:class_id(*),
                subject:subject_id(*),
                teacher:teacher_id(
                    *,
                    user:user_id(*)
                ),
                academic_year:academic_year_id(*)
            `)
            .eq('id', id)
            .single();

        if (error || !schedule) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

const createSchedule = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classId, subjectId, teacherId, academicYearId, dayOfWeek, startTime, endTime, room } = req.body;

        // Check for schedule conflict
        const { data: conflict } = await supabase
            .from('schedules')
            .select('id, class:class_id(name), teacher:teacher_id(user:user_id(full_name))')
            .eq('day_of_week', dayOfWeek)
            .or(`class_id.eq.${classId},teacher_id.eq.${teacherId}`)
            .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        if (conflict && conflict.length > 0) {
            return res.status(400).json({ 
                error: 'Terjadi konflik jadwal',
                conflicts: conflict 
            });
        }

        const { data: schedule, error } = await supabase
            .from('schedules')
            .insert([{
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacherId,
                academic_year_id: academicYearId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                room,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        // Notify teacher
        const { data: teacher } = await supabase
            .from('teachers')
            .select('user_id')
            .eq('id', teacherId)
            .single();

        if (teacher) {
            await createNotification({
                userId: teacher.user_id,
                title: 'Jadwal Mengajar Baru',
                message: `Anda mendapatkan jadwal mengajar baru pada hari ${dayOfWeek}`,
                type: 'schedule_assigned',
                referenceId: schedule.id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Jadwal berhasil dibuat',
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

const updateSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;

        // Check for schedule conflict (excluding current)
        const { data: conflict } = await supabase
            .from('schedules')
            .select('id')
            .eq('day_of_week', dayOfWeek)
            .neq('id', id)
            .or(`class_id.eq.${classId},teacher_id.eq.${teacherId}`)
            .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

        if (conflict && conflict.length > 0) {
            return res.status(400).json({ error: 'Terjadi konflik jadwal' });
        }

        const { data: schedule, error } = await supabase
            .from('schedules')
            .update({
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacherId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                room,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!schedule) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Jadwal berhasil diupdate',
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

const deleteSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if schedule has attendance records
        const { count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('schedule_id', id);

        if (count > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus jadwal yang sudah memiliki data absensi' });
        }

        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Jadwal berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

const getTeacherSchedule = async (req, res, next) => {
    try {
        const teacherId = req.params.teacherId || req.user.teacher_id;

        const { data: schedules, error } = await supabase
            .from('schedules')
            .select(`
                *,
                class:class_id(name),
                subject:subject_id(name, code)
            `)
            .eq('teacher_id', teacherId)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;

        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

const getClassSchedule = async (req, res, next) => {
    try {
        const classId = req.params.classId;

        const { data: schedules, error } = await supabase
            .from('schedules')
            .select(`
                *,
                subject:subject_id(name, code),
                teacher:teacher_id(user:user_id(full_name))
            `)
            .eq('class_id', classId)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;

        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getTeacherSchedule,
    getClassSchedule
};