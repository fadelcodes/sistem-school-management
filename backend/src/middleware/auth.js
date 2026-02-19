const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                error: 'Akses ditolak. Token tidak ditemukan.' 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    success: false,
                    error: 'Token tidak valid.' 
                });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    error: 'Token sudah kadaluarsa.' 
                });
            }
            throw err;
        }

        // Get user data with role
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name, description)
            `)
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ 
                success: false,
                error: 'User tidak ditemukan.' 
            });
        }

        if (!user.is_active) {
            return res.status(403).json({ 
                success: false,
                error: 'Akun Anda tidak aktif.' 
            });
        }

        // Attach user info to request
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role?.name;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Terjadi kesalahan pada server.' 
        });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Harus login terlebih dahulu.' 
            });
        }

        const userRole = req.userRole;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false,
                error: 'Akses ditolak. Anda tidak memiliki izin yang cukup.' 
            });
        }

        next();
    };
};

module.exports = { authenticate, authorize };