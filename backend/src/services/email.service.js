const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail({ to, subject, html, attachments = [] }) {
        try {
            const mailOptions = {
                from: `"${process.env.SCHOOL_NAME}" <${process.env.SMTP_FROM}>`,
                to,
                subject,
                html,
                attachments
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    async sendWelcomeEmail(user, password) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .credentials { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .button { display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Selamat Datang di ${process.env.SCHOOL_NAME}</h1>
                    </div>
                    <div class="content">
                        <h2>Halo ${user.full_name},</h2>
                        <p>Akun Anda telah berhasil dibuat di sistem informasi sekolah.</p>
                        
                        <div class="credentials">
                            <h3>Detail Login:</h3>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Password:</strong> ${password}</p>
                            <p><strong>Role:</strong> ${user.role}</p>
                        </div>
                        
                        <p>Untuk keamanan, silakan login dan segera ganti password Anda.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/login" class="button">Login Sekarang</a>
                        </div>
                        
                        <p><strong>Catatan:</strong> Email ini dibuat secara otomatis, mohon tidak membalas email ini.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} ${process.env.SCHOOL_NAME}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: user.email,
            subject: `Selamat Datang di ${process.env.SCHOOL_NAME}`,
            html
        });
    }

    async sendPasswordResetEmail(email, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .button { display: inline-block; padding: 10px 20px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; }
                    .warning { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; color: #991b1b; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Reset Password</h1>
                    </div>
                    <div class="content">
                        <h2>Halo,</h2>
                        <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" class="button">Reset Password</a>
                        </div>
                        
                        <p>Atau copy link berikut ke browser Anda:</p>
                        <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
                            ${resetLink}
                        </p>
                        
                        <div class="warning">
                            <p><strong>⚠️ Link ini akan kadaluarsa dalam 1 jam.</strong></p>
                            <p>Jika Anda tidak meminta reset password, abaikan email ini dan pastikan akun Anda aman.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} ${process.env.SCHOOL_NAME}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail({
            to: email,
            subject: 'Reset Password - Sistem Informasi Sekolah',
            html
        });
    }

    async sendGradeNotification(student, subject, grade, teacher) {
        const html = `
            <h2>Nilai Baru</h2>
            <p>Halo ${student.user.full_name},</p>
            <p>Nilai ${subject.name} Anda telah diinput:</p>
            <ul>
                <li>Tipe: ${grade.grade_type}</li>
                <li>Nilai: ${grade.score}</li>
                <li>Keterangan: ${grade.description || '-'}</li>
                <li>Guru: ${teacher.user.full_name}</li>
            </ul>
            <p>Login untuk melihat detail nilai Anda.</p>
        `;

        return this.sendEmail({
            to: student.user.email,
            subject: `Nilai Baru - ${subject.name}`,
            html
        });
    }

    async sendAttendanceNotification(student, attendance, schedule) {
        const html = `
            <h2>Absensi Dicatat</h2>
            <p>Halo ${student.user.full_name},</p>
            <p>Absensi Anda telah dicatat:</p>
            <ul>
                <li>Tanggal: ${attendance.date}</li>
                <li>Mata Pelajaran: ${schedule.subject.name}</li>
                <li>Status: ${attendance.status}</li>
                <li>Keterangan: ${attendance.notes || '-'}</li>
            </ul>
        `;

        return this.sendEmail({
            to: student.user.email,
            subject: 'Absensi Dicatat',
            html
        });
    }

    async sendAssignmentNotification(student, assignment) {
        const html = `
            <h2>Tugas Baru</h2>
            <p>Halo ${student.user.full_name},</p>
            <p>Tugas baru telah dibuat:</p>
            <ul>
                <li>Judul: ${assignment.title}</li>
                <li>Mata Pelajaran: ${assignment.subject.name}</li>
                <li>Deadline: ${new Date(assignment.deadline).toLocaleString('id-ID')}</li>
            </ul>
            <p>Login untuk melihat detail tugas.</p>
        `;

        return this.sendEmail({
            to: student.user.email,
            subject: `Tugas Baru - ${assignment.title}`,
            html
        });
    }

    async sendBulkEmail(recipients, subject, message) {
        const results = [];
        for (const recipient of recipients) {
            const result = await this.sendEmail({
                to: recipient.email,
                subject,
                html: message
            });
            results.push({ ...recipient, ...result });
        }
        return results;
    }
}

module.exports = new EmailService();