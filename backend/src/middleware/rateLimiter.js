const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
        error: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        error: 'Terlalu banyak permintaan. Coba lagi nanti.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const createAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 account creations per hour
    message: {
        error: 'Terlalu banyak pembuatan akun. Coba lagi setelah 1 jam.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    apiLimiter,
    createAccountLimiter
};