const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

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
        const message = 'Tabel tidak ditemukan.';
        error = { message, statusCode: 500 };
    }

    // Validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
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

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};

module.exports = { errorHandler };