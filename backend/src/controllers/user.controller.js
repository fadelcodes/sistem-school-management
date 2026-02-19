const { supabase, supabaseAdmin } = require('../config/supabase');
const { hashPassword } = require('../utils/bcrypt');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');

const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, role } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('users')
            .select(`
                *,
                role:roles(name, description)
            `, { count: 'exact' });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (role) {
            query = query.eq('role.name', role);
        }

        const { data: users, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Remove passwords
        users.forEach(user => delete user.password);

        res.json({
            success: true,
            data: users,
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

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name, description)
            `)
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        delete user.password;

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, fullName, roleId, phone, address } = req.body;

        // Check if email already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah digunakan.' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const { data: user, error: createError } = await supabaseAdmin
            .from('users')
            .insert([{
                email,
                password: hashedPassword,
                full_name: fullName,
                role_id: roleId,
                phone,
                address,
                is_active: true,
                created_by: req.userId
            }])
            .select()
            .single();

        if (createError) {
            return res.status(500).json({ error: createError.message });
        }

        // Get role name for notification
        const { data: role } = await supabase
            .from('roles')
            .select('name')
            .eq('id', roleId)
            .single();

        // Create notification
        await createNotification({
            userId: user.id,
            title: 'Akun Baru Dibuat',
            message: `Akun Anda dengan role ${role.name} telah dibuat oleh admin.`,
            type: 'user_created',
            referenceId: user.id
        });

        delete user.password;

        res.status(201).json({
            success: true,
            message: 'User berhasil dibuat.',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fullName, phone, address, isActive } = req.body;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update({
                full_name: fullName,
                phone,
                address,
                is_active: isActive,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        delete user.password;

        res.json({
            success: true,
            message: 'User berhasil diupdate.',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const { data: user } = await supabase
            .from('users')
            .select('id, role:roles(name)')
            .eq('id', id)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User tidak ditemukan.' });
        }

        // Prevent deleting Super Admin
        if (user.role.name === 'Super Admin') {
            return res.status(403).json({ error: 'Tidak dapat menghapus Super Admin.' });
        }

        // Delete user
        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            success: true,
            message: 'User berhasil dihapus.'
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const hashedPassword = await hashPassword(newPassword);

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update({
                password: hashedPassword,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Create notification
        await createNotification({
            userId: id,
            title: 'Password Direset',
            message: 'Password akun Anda telah direset oleh admin.',
            type: 'password_reset',
            referenceId: id
        });

        res.json({
            success: true,
            message: 'Password berhasil direset.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    resetPassword
};