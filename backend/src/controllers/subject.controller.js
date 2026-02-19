const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');

const getSubjects = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('subjects')
            .select(`
                *,
                created_by:created_by(full_name, email)
            `, { count: 'exact' });

        if (search) {
            query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: subjects, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: subjects,
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

const getSubjectById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: subject, error } = await supabase
            .from('subjects')
            .select(`
                *,
                created_by:created_by(full_name),
                schedules:schedules(
                    id,
                    class:class_id(name),
                    teacher:teacher_id(user:user_id(full_name)),
                    day_of_week,
                    start_time,
                    end_time
                )
            `)
            .eq('id', id)
            .single();

        if (error || !subject) {
            return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
        }

        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

const getSubjectByCode = async (req, res, next) => {
    try {
        const { code } = req.params;

        const { data: subject, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !subject) {
            return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
        }

        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

const createSubject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { code, name, description, creditHours } = req.body;

        // Check if code already exists
        const { data: existing } = await supabase
            .from('subjects')
            .select('id')
            .eq('code', code)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Kode mata pelajaran sudah digunakan' });
        }

        const { data: subject, error } = await supabase
            .from('subjects')
            .insert([{
                code,
                name,
                description,
                credit_hours: creditHours,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Mata pelajaran berhasil dibuat',
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

const updateSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, name, description, creditHours } = req.body;

        // Check if code already exists (excluding current)
        if (code) {
            const { data: existing } = await supabase
                .from('subjects')
                .select('id')
                .eq('code', code)
                .neq('id', id)
                .single();

            if (existing) {
                return res.status(400).json({ error: 'Kode mata pelajaran sudah digunakan' });
            }
        }

        const { data: subject, error } = await supabase
            .from('subjects')
            .update({
                code,
                name,
                description,
                credit_hours: creditHours,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!subject) {
            return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Mata pelajaran berhasil diupdate',
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

const deleteSubject = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if subject is used in schedules
        const { count: scheduleCount } = await supabase
            .from('schedules')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', id);

        if (scheduleCount > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus mata pelajaran yang masih memiliki jadwal' });
        }

        // Check if subject is used in grades
        const { count: gradeCount } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', id);

        if (gradeCount > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus mata pelajaran yang masih memiliki nilai' });
        }

        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Mata pelajaran berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSubjects,
    getSubjectById,
    getSubjectByCode,
    createSubject,
    updateSubject,
    deleteSubject
};