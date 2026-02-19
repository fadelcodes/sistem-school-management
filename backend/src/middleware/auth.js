const { verifyToken } = require('../utils/jwt');
const { supabase } = require('../config/supabase');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Token tidak valid.' });
        }

        // Get user data with role
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                role:roles(name)
            `)
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'User tidak ditemukan.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Akun Anda tidak aktif.' });
        }

        req.user = user;
        req.userId = user.id;
        req.userRole = user.role.name;
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Autentikasi gagal.' });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Harus login terlebih dahulu.' });
        }

        const userRole = req.userRole;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: 'Akses ditolak. Anda tidak memiliki izin yang cukup.' 
            });
        }

        next();
    };
};

module.exports = { authenticate, authorize };