const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');

const getClasses = async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;
        
        console.log('Fetching classes with limit:', limit);

        const { data: classes, error } = await supabase
            .from('classes')
            .select(`
                *,
                jurusan:jurusan_id (
                    id,
                    name,
                    code
                ),
                academic_year:academic_year_id (
                    id,
                    year,
                    semester,
                    is_active
                ),
                homeroom_teacher:homeroom_teacher_id (
                    id,
                    user:user_id (
                        id,
                        full_name
                    )
                )
            `)
            .limit(limit)
            .order('name');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ 
                error: 'Gagal mengambil data kelas',
                details: error.message 
            });
        }

        console.log('Classes fetched:', classes?.length || 0);

        res.json({
            success: true,
            data: classes || []
        });
    } catch (error) {
        console.error('Server error:', error);
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
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(404).json({ error: 'Kelas tidak ditemukan' });
        }

        res.json({
            success: true,
            data: classData
        });
    } catch (error) {
        console.error('Server error:', error);
        next(error);
    }
};

const createClass = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, gradeLevel, jurusanId, academicYearId, homeroomTeacherId, capacity, roomNumber } = req.body;

        // Check if class already exists
        const { data: existing } = await supabase
            .from('classes')
            .select('id')
            .eq('name', name)
            .eq('academic_year_id', academicYearId)
            .maybeSingle();

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

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({
            success: true,
            message: 'Kelas berhasil dibuat',
            data: classData
        });
    } catch (error) {
        console.error('Server error:', error);
        next(error);
    }
};

const updateClass = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data: classData, error } = await supabase
            .from('classes')
            .update({
                ...updates,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!classData) {
            return res.status(404).json({ error: 'Kelas tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Kelas berhasil diupdate',
            data: classData
        });
    } catch (error) {
        console.error('Server error:', error);
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

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({
            success: true,
            message: 'Kelas berhasil dihapus'
        });
    } catch (error) {
        console.error('Server error:', error);
        next(error);
    }
};

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};