const { supabase } = require('../config/supabase');

const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isRead } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', req.userId);

        if (isRead !== undefined) {
            query = query.eq('is_read', isRead === 'true');
        }

        const { data: notifications, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            success: true,
            data: notifications,
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

const getUnreadCount = async (req, res, next) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.userId)
            .eq('is_read', false);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: notification, error } = await supabase
            .from('notifications')
            .update({ is_read: true, updated_at: new Date() })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!notification) {
            return res.status(404).json({ error: 'Notifikasi tidak ditemukan.' });
        }

        res.json({
            success: true,
            message: 'Notifikasi ditandai sudah dibaca.',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, updated_at: new Date() })
            .eq('user_id', req.userId)
            .eq('is_read', false);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            success: true,
            message: 'Semua notifikasi ditandai sudah dibaca.'
        });
    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            success: true,
            message: 'Notifikasi berhasil dihapus.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};