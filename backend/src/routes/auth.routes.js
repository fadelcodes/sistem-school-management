const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes are working',
        timestamp: new Date().toISOString()
    });
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('📥 Login attempt for email:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email dan password harus diisi'
            });
        }

        // Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name, description)
            `)
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                error: 'Email atau password salah'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', email);
            return res.status(401).json({
                success: false,
                error: 'Email atau password salah'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role?.name
            },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        // Update last login
        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id);

        // Remove password from response
        delete user.password;

        console.log('✅ Login successful for:', email);

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server'
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error('❌ Get me error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server'
        });
    }
});

// Logout
router.post('/logout', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Logout berhasil'
    });
});

module.exports = router;