const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');

const getRoles = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { data: roles, error, count } = await supabase
            .from('roles')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: roles,
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

const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: role, error } = await supabase
            .from('roles')
            .select(`
                *,
                users:users(id, full_name, email)
            `)
            .eq('id', id)
            .single();

        if (error || !role) {
            return res.status(404).json({ error: 'Role tidak ditemukan' });
        }

        res.json({
            success: true,
            data: role
        });
    } catch (error) {
        next(error);
    }
};

const createRole = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description } = req.body;

        // Check if role already exists
        const { data: existing } = await supabase
            .from('roles')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Role sudah ada' });
        }

        const { data: role, error } = await supabase
            .from('roles')
            .insert([{ name, description }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Role berhasil dibuat',
            data: role
        });
    } catch (error) {
        next(error);
    }
};

const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const { data: role, error } = await supabase
            .from('roles')
            .update({ name, description, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!role) {
            return res.status(404).json({ error: 'Role tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Role berhasil diupdate',
            data: role
        });
    } catch (error) {
        next(error);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if role is used by users
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', id);

        if (count > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus role yang masih memiliki user' });
        }

        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Role berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
};