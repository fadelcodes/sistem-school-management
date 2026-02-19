const { supabaseAdmin } = require('../config/supabase');
const { hashPassword } = require('../utils/bcrypt');
const { validationResult } = require('express-validator');

const createAdmin = async (req, res, next) => {
    try {
        // Check if any users exist
        const { data: existingUsers, error: checkError } = await supabaseAdmin
            .from('users')
            .select('id')
            .limit(1);

        if (checkError) {
            return res.status(500).json({ error: 'Gagal memeriksa database.' });
        }

        if (existingUsers && existingUsers.length > 0) {
            return res.status(403).json({ 
                error: 'Bootstrap tidak diizinkan. Database sudah memiliki user.' 
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, fullName } = req.body;

        // Get Super Admin role
        const { data: role, error: roleError } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('name', 'Super Admin')
            .single();

        if (roleError || !role) {
            return res.status(500).json({ error: 'Role Super Admin tidak ditemukan.' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create admin user
        const { data: user, error: createError } = await supabaseAdmin
            .from('users')
            .insert([{
                email,
                password: hashedPassword,
                full_name: fullName,
                role_id: role.id,
                is_active: true
            }])
            .select()
            .single();

        if (createError) {
            return res.status(500).json({ error: 'Gagal membuat admin: ' + createError.message });
        }

        // Create notification
        await supabaseAdmin
            .from('notifications')
            .insert([{
                user_id: user.id,
                title: 'Selamat Datang Super Admin',
                message: 'Akun Super Admin berhasil dibuat. Silakan lengkapi data profil Anda.',
                type: 'system',
                reference_id: user.id
            }]);

        delete user.password;

        res.status(201).json({
            success: true,
            message: 'Admin pertama berhasil dibuat.',
            data: user
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { createAdmin };