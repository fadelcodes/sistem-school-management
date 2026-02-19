const { supabase } = require('../config/supabase');

const createNotification = async ({ userId, title, message, type, referenceId = null }) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type,
                reference_id: referenceId,
                is_read: false
            }])
            .select();

        if (error) {
            console.error('Error creating notification:', error);
            return null;
        }

        return data[0];
    } catch (error) {
        console.error('Error in createNotification:', error);
        return null;
    }
};

module.exports = { createNotification };