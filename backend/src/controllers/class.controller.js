const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');

const getClasses = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, academicYearId } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('classes')
            .select(`
                *,
                jurusan:jurusan_id(name, code),
                academic_year:academic_year_id(year, semester),
                homeroom_teacher:homeroom_teacher_id(
                    user:user_id(full_name)
                ),
                students:students(count)
            `, { count: 'exact' });

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        const { data: classes, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('grade_level')
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: classes,
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

const getClassById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: classData, error } = await supabase
            .from('classes')
            .select(`
                *,
                jurusan:jurusan_id(*),
                academic_year:academic_year_id(*),
                homeroom_teacher:homeroom_teacher_id(
                    *,
                    user:user_id(*)
                ),
                students:students(
                    *,
                    user:user_id(full_name, email)
                ),
                schedules:schedules(
                    *,
                    subject:subject_id(name),
                    teacher:teacher_id(user:user_id(full_name))
                )
            `)
            .eq('id', id)
            .single();

        if (error || !classData) {
            return res.status(404).json({ error: 'Kelas tidak ditemukan' });
        }

        res.json({
            success: true,
            data: classData
        });
    } catch (error) {
        next(error);
    }
};

const getClassesByAcademicYear = async (req, res, next) => {
    try {
        const { academicYearId } = req.params;

        const { data: classes, error } = await supabase
            .from('classes')
            .select('*')
            .eq('academic_year_id', academicYearId)
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        next(error);
    }
};

const getAvailableClasses = async (req, res, next) => {
    try {
        const { academicYearId } = req.query;

        const { data: classes, error } = await supabase
            .from('classes')
            .select(`
                id,
                name,
                grade_level,
                capacity,
                students:students(count)
            `)
            .eq('academic_year_id', academicYearId);

        if (error) throw error;

        const availableClasses = classes.filter(c => 
            !c.capacity || (c.students?.[0]?.count || 0) < c.capacity
        );

        res.json({
            success: true,
            data: availableClasses
        });
    } catch (error) {
        next(error);
    }
};

const createClass = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            name, 
            gradeLevel, 
            jurusanId, 
            academicYearId, 
            homeroomTeacherId, 
            capacity, 
            roomNumber 
        } = req.body;

        // Check if class already exists for this academic year
        const { data: existing } = await supabase
            .from('classes')
            .select('id')
            .eq('name', name)
            .eq('academic_year_id', academicYearId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Kelas dengan nama ini sudah ada di tahun ajaran yang sama' });
        }

        const { data: classData, error } = await supabase
            .from('classes')
            .insert([{
                name,
                grade_level: gradeLevel,
                jurusan_id: jurusanId,
                academic_year_id: academicYearId,
                homeroom_teacher_id: homeroomTeacherId,
                capacity,
                room_number: roomNumber,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        // Notify homeroom teacher
        if (homeroomTeacherId) {
            const { data: teacher } = await supabase
                .from('teachers')
                .select('user_id')
                .eq('id', homeroomTeacherId)
                .single();

            if (teacher) {
                await createNotification({
                    userId: teacher.user_id,
                    title: 'Penunjukan Wali Kelas',
                    message: `Anda ditunjuk sebagai wali kelas ${name}`,
                    type: 'class_assignment',
                    referenceId: classData.id
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Kelas berhasil dibuat',
            data: classData
        });
    } catch (error) {
        next(error);
    }
};

const updateClass = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            gradeLevel, 
            jurusanId, 
            homeroomTeacherId, 
            capacity, 
            roomNumber,
            isActive 
        } = req.body;

        const { data: classData, error } = await supabase
            .from('classes')
            .update({
                name,
                grade_level: gradeLevel,
                jurusan_id: jurusanId,
                homeroom_teacher_id: homeroomTeacherId,
                capacity,
                room_number: roomNumber,
                is_active: isActive,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!classData) {
            return res.status(404).json({ error: 'Kelas tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Kelas berhasil diupdate',
            data: classData
        });
    } catch (error) {
        next(error);
    }
};

const deleteClass = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if class has students
        const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', id);

        if (count > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus kelas yang masih memiliki siswa' });
        }

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Kelas berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getClasses,
    getClassById,
    getClassesByAcademicYear,
    getAvailableClasses,
    createClass,
    updateClass,
    deleteClass
};