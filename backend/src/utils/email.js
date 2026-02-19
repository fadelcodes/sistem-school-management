const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: '"Sistem Sekolah" <noreply@sekolah.com>',
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendWelcomeEmail = async (user, password) => {
    const html = `
        <h2>Selamat Datang di Sistem Sekolah</h2>
        <p>Halo ${user.full_name},</p>
        <p>Akun Anda telah dibuat dengan detail berikut:</p>
        <ul>
            <li>Email: ${user.email}</li>
            <li>Password: ${password}</li>
        </ul>
        <p>Silakan login dan segera ganti password Anda.</p>
        <a href="${process.env.FRONTEND_URL}/login">Login Sekarang</a>
    `;

    return sendEmail({
        to: user.email,
        subject: 'Akun Baru di Sistem Sekolah',
        html
    });
};

module.exports = { sendEmail, sendWelcomeEmail };