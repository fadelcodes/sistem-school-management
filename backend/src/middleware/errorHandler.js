const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Default error
    let error = { ...err };
    error.message = err.message;

    // Database error
    if (err.code === '23505') {
        const message = 'Data sudah ada di database.';
        error = { message, statusCode: 400 };
    }

    if (err.code === '23503') {
        const message = 'Data terkait tidak ditemukan.';
        error = { message, statusCode: 400 };
    }

    if (err.code === '42P01') {
        const message = 'Tabel tidak ditemukan. Pastikan database sudah diinisialisasi.';
        error = { message, statusCode: 500 };
    }

    if (err.code === '42703') {
        const message = 'Kolom tidak ditemukan di database.';
        error = { message, statusCode: 500 };
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token tidak valid.';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token sudah kadaluarsa.';
        error = { message, statusCode: 401 };
    }

    // Send response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Terjadi kesalahan pada server'
    });
};

module.exports = { errorHandler };