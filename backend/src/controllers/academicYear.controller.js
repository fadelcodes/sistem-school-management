const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');

const getAcademicYears = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('academic_years')
            .select('*', { count: 'exact' });

        if (isActive !== undefined) {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data: years, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('year', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: years,
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

const getAcademicYearById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: year, error } = await supabase
            .from('academic_years')
            .select(`
                *,
                classes:classes(id, name, grade_level),
                schedules:schedules(id, count)
            `)
            .eq('id', id)
            .single();

        if (error || !year) {
            return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan' });
        }

        res.json({
            success: true,
            data: year
        });
    } catch (error) {
        next(error);
    }
};

const createAcademicYear = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { year, semester, startDate, endDate, isActive } = req.body;

        // Check if year already exists
        const { data: existing } = await supabase
            .from('academic_years')
            .select('id')
            .eq('year', year)
            .eq('semester', semester)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Tahun ajaran sudah ada' });
        }

        // If this is set as active, deactivate others
        if (isActive) {
            await supabase
                .from('academic_years')
                .update({ is_active: false });
        }

        const { data: academicYear, error } = await supabase
            .from('academic_years')
            .insert([{
                year,
                semester,
                is_active: isActive || false,
                start_date: startDate,
                end_date: endDate,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Tahun ajaran berhasil dibuat',
            data: academicYear
        });
    } catch (error) {
        next(error);
    }
};

const updateAcademicYear = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { year, semester, isActive, startDate, endDate } = req.body;

        // If setting as active, deactivate others
        if (isActive) {
            await supabase
                .from('academic_years')
                .update({ is_active: false })
                .neq('id', id);
        }

        const { data: academicYear, error } = await supabase
            .from('academic_years')
            .update({
                year,
                semester,
                is_active: isActive,
                start_date: startDate,
                end_date: endDate,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!academicYear) {
            return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Tahun ajaran berhasil diupdate',
            data: academicYear
        });
    } catch (error) {
        next(error);
    }
};

const deleteAcademicYear = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if year is used in classes
        const { count: classCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year_id', id);

        if (classCount > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus tahun ajaran yang masih memiliki kelas' });
        }

        // Check if year is used in schedules
        const { count: scheduleCount } = await supabase
            .from('schedules')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year_id', id);

        if (scheduleCount > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus tahun ajaran yang masih memiliki jadwal' });
        }

        const { error } = await supabase
            .from('academic_years')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tahun ajaran berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

const setActiveYear = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Deactivate all years
        await supabase
            .from('academic_years')
            .update({ is_active: false });

        // Activate selected year
        const { data: year, error } = await supabase
            .from('academic_years')
            .update({ is_active: true, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tahun ajaran aktif berhasil diubah',
            data: year
        });
    } catch (error) {
        next(error);
    }
};

const getCurrentAcademicYear = async (req, res, next) => {
    try {
        const { data: year, error } = await supabase
            .from('academic_years')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Tidak ada tahun ajaran aktif' });
        }

        res.json({
            success: true,
            data: year
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setActiveYear,
    getCurrentAcademicYear
};