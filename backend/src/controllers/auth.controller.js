const { supabase } = require('../config/supabase');
const { generateToken } = require('../utils/jwt');
const { comparePassword } = require('../utils/bcrypt');
const { validationResult } = require('express-validator');

const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Get user with role
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name)
            `)
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Akun Anda tidak aktif. Hubungi admin.' });
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date() })
            .eq('id', user.id);

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role.name
        });

        // Remove password from response
        delete user.password;

        res.json({
            success: true,
            data: {
                token,
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        // Since we're using JWT, we don't need to do anything server-side
        // Client will remove the token
        res.json({ 
            success: true, 
            message: 'Logout berhasil.' 
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name, description)
            `)
            .eq('id', req.userId)
            .single();

        if (error) {
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

module.exports = { login, logout, getMe };