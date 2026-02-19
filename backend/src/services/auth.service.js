const UserRepository = require('../repositories/user.repository');
const { generateToken } = require('../utils/jwt');
const { comparePassword, hashPassword } = require('../utils/bcrypt');
const { createNotification } = require('../utils/notification');
const { sendWelcomeEmail } = require('../utils/email');

class AuthService {
    async login(email, password, ipAddress, userAgent) {
        // Find user by email
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            throw new Error('Email atau password salah');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Akun Anda tidak aktif. Hubungi admin.');
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            // Log failed attempt
            await this.logFailedAttempt(email, ipAddress);
            throw new Error('Email atau password salah');
        }

        // Update last login
        await UserRepository.updateLastLogin(user.id);

        // Log successful login
        await this.logSuccessfulLogin(user.id, ipAddress, userAgent);

        // Generate token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role?.name
        });

        delete user.password;

        return { user, token };
    }

    async logout(userId, sessionId) {
        // Log logout activity
        await this.logLogout(userId, sessionId);
        return true;
    }

    async refreshToken(refreshToken) {
        // Implement refresh token logic
        // This would require a refresh tokens table
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            throw new Error('Refresh token tidak valid');
        }

        const user = await UserRepository.findById(decoded.userId);
        if (!user) {
            throw new Error('User tidak ditemukan');
        }

        const newToken = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role?.name
        });

        return { token: newToken };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new Error('User tidak ditemukan');
        }

        const isValidPassword = await comparePassword(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Password saat ini salah');
        }

        const hashedPassword = await hashPassword(newPassword);
        await UserRepository.update(userId, { password: hashedPassword });

        // Send notification
        await createNotification({
            userId,
            title: 'Password Diubah',
            message: 'Password akun Anda telah berhasil diubah.',
            type: 'security'
        });

        return true;
    }

    async resetPassword(email) {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            // Return success even if email not found (security)
            return true;
        }

        // Generate reset token
        const resetToken = generateRandomString(32);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Save reset token to database
        await this.saveResetToken(user.id, resetToken, expiresAt);

        // Send reset email
        await sendPasswordResetEmail(user.email, resetToken);

        return true;
    }

    async verifyResetToken(token) {
        const resetRequest = await this.findResetToken(token);
        if (!resetRequest || resetRequest.expires_at < new Date()) {
            throw new Error('Token reset password tidak valid atau sudah kadaluarsa');
        }
        return resetRequest.user_id;
    }

    async completeResetPassword(token, newPassword) {
        const userId = await this.verifyResetToken(token);
        
        const hashedPassword = await hashPassword(newPassword);
        await UserRepository.update(userId, { password: hashedPassword });

        // Invalidate reset token
        await this.invalidateResetToken(token);

        return true;
    }

    async logFailedAttempt(email, ipAddress) {
        // Log to database or file
        console.warn(`Failed login attempt for ${email} from ${ipAddress}`);
    }

    async logSuccessfulLogin(userId, ipAddress, userAgent) {
        // Log to database
        // You might want to create a user_sessions table
        console.log(`User ${userId} logged in from ${ipAddress}`);
    }

    async logLogout(userId, sessionId) {
        // Log logout
        console.log(`User ${userId} logged out`);
    }

    async saveResetToken(userId, token, expiresAt) {
        // Save to password_resets table
        const { error } = await supabase
            .from('password_resets')
            .insert([{
                user_id: userId,
                token,
                expires_at: expiresAt
            }]);

        if (error) throw error;
    }

    async findResetToken(token) {
        const { data, error } = await supabase
            .from('password_resets')
            .select('*')
            .eq('token', token)
            .single();

        if (error) return null;
        return data;
    }

    async invalidateResetToken(token) {
        const { error } = await supabase
            .from('password_resets')
            .delete()
            .eq('token', token);

        if (error) throw error;
    }
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = new AuthService();