const { supabase } = require('../config/supabase');
const emailService = require('./email.service');

class NotificationService {
    async createNotification({ userId, title, message, type, referenceId = null }) {
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
                .select()
                .single();

            if (error) throw error;

            // Get user email for potential email notification
            const { data: user } = await supabase
                .from('users')
                .select('email, full_name, role:roles(name)')
                .eq('id', userId)
                .single();

            // Send email based on notification type and user preferences
            await this.sendEmailNotification(user, { title, message, type });

            return data;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }

    async createBulkNotifications(notifications) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert(notifications)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            return [];
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date() })
                .eq('id', notificationId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date() })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    async getUserNotifications(userId, options = {}) {
        const { page = 1, limit = 20, isRead } = options;
        const offset = (page - 1) * limit;

        try {
            let query = supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            if (isRead !== undefined) {
                query = query.eq('is_read', isRead);
            }

            const { data, error, count } = await query
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId, userId) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    async sendEmailNotification(user, notification) {
        // Check user preferences (would come from settings table)
        const { data: settings } = await supabase
            .from('user_settings')
            .select('email_notifications')
            .eq('user_id', user.id)
            .single();

        if (settings?.email_notifications === false) {
            return;
        }

        // Send email based on notification type
        let emailSubject = '';
        let emailHtml = '';

        switch (notification.type) {
            case 'grade_input':
                emailSubject = 'Nilai Baru Telah Diinput';
                emailHtml = this.getGradeEmailTemplate(user, notification);
                break;
            case 'attendance_input':
                emailSubject = 'Absensi Telah Dicatat';
                emailHtml = this.getAttendanceEmailTemplate(user, notification);
                break;
            case 'assignment_created':
                emailSubject = 'Tugas Baru Tersedia';
                emailHtml = this.getAssignmentEmailTemplate(user, notification);
                break;
            case 'assignment_submitted':
                emailSubject = 'Tugas Telah Dikumpulkan';
                emailHtml = this.getSubmissionEmailTemplate(user, notification);
                break;
            case 'password_reset':
                emailSubject = 'Password Akun Direset';
                emailHtml = this.getPasswordResetEmailTemplate(user, notification);
                break;
            default:
                emailSubject = notification.title;
                emailHtml = this.getDefaultEmailTemplate(user, notification);
        }

        await emailService.sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailHtml
        });
    }

    getGradeEmailTemplate(user, notification) {
        return `
            <h2>Nilai Baru</h2>
            <p>Halo ${user.full_name},</p>
            <p>${notification.message}</p>
            <p>Login untuk melihat detail nilai Anda.</p>
            <a href="${process.env.FRONTEND_URL}/academic/grades">Lihat Nilai</a>
        `;
    }

    getAttendanceEmailTemplate(user, notification) {
        return `
            <h2>Absensi Dicatat</h2>
            <p>Halo ${user.full_name},</p>
            <p>${notification.message}</p>
            <p>Login untuk melihat rekap absensi.</p>
            <a href="${process.env.FRONTEND_URL}/academic/attendance">Lihat Absensi</a>
        `;
    }

    getAssignmentEmailTemplate(user, notification) {
        return `
            <h2>Tugas Baru</h2>
            <p>Halo ${user.full_name},</p>
            <p>${notification.message}</p>
            <p>Login untuk mengerjakan tugas.</p>
            <a href="${process.env.FRONTEND_URL}/academic/assignments">Lihat Tugas</a>
        `;
    }

    getSubmissionEmailTemplate(user, notification) {
        return `
            <h2>Tugas Dikumpulkan</h2>
            <p>Halo ${user.full_name},</p>
            <p>${notification.message}</p>
            <p>Login untuk memeriksa tugas.</p>
            <a href="${process.env.FRONTEND_URL}/academic/assignments">Lihat Pengumpulan</a>
        `;
    }

    getPasswordResetEmailTemplate(user, notification) {
        return `
            <h2>Password Direset</h2>
            <p>Halo ${user.full_name},</p>
            <p>${notification.message}</p>
            <p>Jika Anda tidak merasa melakukan reset password, segera hubungi administrator.</p>
        `;
    }

    getDefaultEmailTemplate(user, notification) {
        return `
            <h2>${notification.title}</h2>
            <p>Halo ${user.full_name},</p>
            <p>${notification.message}</p>
            <p>Login untuk melihat detail notifikasi.</p>
            <a href="${process.env.FRONTEND_URL}/notifications">Lihat Notifikasi</a>
        `;
    }

    // Trigger functions for various events
    async onGradeInput(grade, student, subject, teacher) {
        // Notify student
        await this.createNotification({
            userId: student.user_id,
            title: 'Nilai Baru',
            message: `Nilai ${subject.name} Anda: ${grade.score}`,
            type: 'grade_input',
            referenceId: grade.id
        });

        // Notify parent if exists
        if (student.parent_id) {
            await this.createNotification({
                userId: student.parent_id,
                title: `Nilai ${student.user?.full_name}`,
                message: `Nilai ${subject.name}: ${grade.score}`,
                type: 'grade_input',
                referenceId: grade.id
            });
        }
    }

    async onAttendanceInput(attendance, student, schedule) {
        // Notify student
        await this.createNotification({
            userId: student.user_id,
            title: 'Absensi Dicatat',
            message: `Absensi ${schedule.subject?.name}: ${attendance.status}`,
            type: 'attendance_input',
            referenceId: attendance.id
        });

        // Notify parent if exists
        if (student.parent_id) {
            await this.createNotification({
                userId: student.parent_id,
                title: `Absensi ${student.user?.full_name}`,
                message: `Mata Pelajaran ${schedule.subject?.name}: ${attendance.status}`,
                type: 'attendance_input',
                referenceId: attendance.id
            });
        }
    }

    async onAssignmentCreated(assignment, classId, teacher) {
        // Get all students in the class
        const { data: students } = await supabase
            .from('students')
            .select('user_id, parent_id')
            .eq('class_id', classId);

        // Notify each student
        const notifications = [];
        for (const student of students) {
            notifications.push({
                user_id: student.user_id,
                title: 'Tugas Baru',
                message: `Tugas: ${assignment.title} - Deadline: ${new Date(assignment.deadline).toLocaleDateString('id-ID')}`,
                type: 'assignment_created',
                reference_id: assignment.id
            });

            // Notify parent
            if (student.parent_id) {
                notifications.push({
                    user_id: student.parent_id,
                    title: `Tugas Baru untuk ${student.user?.full_name}`,
                    message: `Tugas: ${assignment.title} - Deadline: ${new Date(assignment.deadline).toLocaleDateString('id-ID')}`,
                    type: 'assignment_created',
                    reference_id: assignment.id
                });
            }
        }

        await this.createBulkNotifications(notifications);
    }

    async onAssignmentSubmitted(submission, assignment, student) {
        // Notify teacher
        await this.createNotification({
            userId: assignment.teacher.user_id,
            title: 'Tugas Dikumpulkan',
            message: `${student.user?.full_name} mengumpulkan tugas: ${assignment.title}`,
            type: 'assignment_submitted',
            referenceId: submission.id
        });
    }

    async onUserCreated(user, createdBy) {
        await this.createNotification({
            userId: user.id,
            title: 'Akun Baru Dibuat',
            message: `Selamat datang di sistem sekolah. Akun Anda telah dibuat.`,
            type: 'user_created',
            referenceId: user.id
        });
    }

    async onPasswordReset(userId, resetBy) {
        await this.createNotification({
            userId,
            title: 'Password Direset',
            message: 'Password akun Anda telah direset oleh administrator.',
            type: 'password_reset',
            referenceId: userId
        });
    }
}

module.exports = new NotificationService();