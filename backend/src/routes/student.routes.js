const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getStudents,
    getStudentById,
    getStudentByNis,
    getStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent
} = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Semua route memerlukan autentikasi
router.use(authenticate);

// Route untuk mendapatkan semua siswa
router.get('/', getStudents);

// Route untuk mendapatkan siswa berdasarkan NIS
router.get('/nis/:nis', getStudentByNis);

// Route untuk mendapatkan siswa berdasarkan kelas
router.get('/class/:classId', getStudentsByClass);

// Route untuk mendapatkan siswa berdasarkan ID
router.get('/:id', getStudentById);

// Route untuk membuat siswa baru (hanya admin)
router.post('/',
    authorize('Super Admin', 'Admin', 'Admin TU'),
    [
        body('nis').notEmpty().withMessage('NIS harus diisi'),
        body('fullName').notEmpty().withMessage('Nama lengkap harus diisi'),
        body('email').isEmail().withMessage('Email tidak valid'),
        body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    ],
    createStudent
);

// Route untuk mengupdate siswa
router.put('/:id',
    authorize('Super Admin', 'Admin', 'Admin TU'),
    updateStudent
);

// Route untuk menghapus siswa (hanya admin)
router.delete('/:id',
    authorize('Super Admin', 'Admin'),
    deleteStudent
);

module.exports = router;