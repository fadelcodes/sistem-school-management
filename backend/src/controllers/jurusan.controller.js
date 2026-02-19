const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');

const getJurusan = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('jurusan')
            .select(`
                *,
                created_by:created_by(full_name),
                classes:classes(count)
            `, { count: 'exact' });

        if (search) {
            query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: jurusan, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('code');

        if (error) throw error;

        res.json({
            success: true,
            data: jurusan,
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

const getJurusanById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: jurusan, error } = await supabase
            .from('jurusan')
            .select(`
                *,
                created_by:created_by(full_name),
                classes:classes(
                    id,
                    name,
                    grade_level,
                    students:students(count)
                )
            `)
            .eq('id', id)
            .single();

        if (error || !jurusan) {
            return res.status(404).json({ error: 'Jurusan tidak ditemukan' });
        }

        res.json({
            success: true,
            data: jurusan
        });
    } catch (error) {
        next(error);
    }
};

const getJurusanByCode = async (req, res, next) => {
    try {
        const { code } = req.params;

        const { data: jurusan, error } = await supabase
            .from('jurusan')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !jurusan) {
            return res.status(404).json({ error: 'Jurusan tidak ditemukan' });
        }

        res.json({
            success: true,
            data: jurusan
        });
    } catch (error) {
        next(error);
    }
};

const createJurusan = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { code, name, description } = req.body;

        // Check if code already exists
        const { data: existing } = await supabase
            .from('jurusan')
            .select('id')
            .eq('code', code)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Kode jurusan sudah digunakan' });
        }

        const { data: jurusan, error } = await supabase
            .from('jurusan')
            .insert([{
                code,
                name,
                description,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Jurusan berhasil dibuat',
            data: jurusan
        });
    } catch (error) {
        next(error);
    }
};

const updateJurusan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, name, description } = req.body;

        // Check if code already exists (excluding current)
        if (code) {
            const { data: existing } = await supabase
                .from('jurusan')
                .select('id')
                .eq('code', code)
                .neq('id', id)
                .single();

            if (existing) {
                return res.status(400).json({ error: 'Kode jurusan sudah digunakan' });
            }
        }

        const { data: jurusan, error } = await supabase
            .from('jurusan')
            .update({
                code,
                name,
                description,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!jurusan) {
            return res.status(404).json({ error: 'Jurusan tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Jurusan berhasil diupdate',
            data: jurusan
        });
    } catch (error) {
        next(error);
    }
};

const deleteJurusan = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if jurusan is used in classes
        const { count } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('jurusan_id', id);

        if (count > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus jurusan yang masih memiliki kelas' });
        }

        const { error } = await supabase
            .from('jurusan')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Jurusan berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getJurusan,
    getJurusanById,
    getJurusanByCode,
    createJurusan,
    updateJurusan,
    deleteJurusan
};