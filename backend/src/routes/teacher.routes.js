const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getTeachers,
    getTeacherById,
    getTeacherByNip,
    getHomeroomTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher
} = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Semua route memerlukan autentikasi
router.use(authenticate);

// Route untuk mendapatkan semua guru
router.get('/', getTeachers);

// Route untuk mendapatkan guru wali kelas
router.get('/homeroom', getHomeroomTeachers);

// Route untuk mendapatkan guru berdasarkan NIP
router.get('/nip/:nip', getTeacherByNip);

// Route untuk mendapatkan guru berdasarkan ID
router.get('/:id', getTeacherById);

// Route untuk membuat guru baru (hanya admin)
router.post('/',
    authorize('Super Admin', 'Admin'),
    [
        body('nip').notEmpty().withMessage('NIP harus diisi'),
        body('fullName').notEmpty().withMessage('Nama lengkap harus diisi'),
        body('email').isEmail().withMessage('Email tidak valid'),
        body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    ],
    createTeacher
);

// Route untuk mengupdate guru
router.put('/:id',
    authorize('Super Admin', 'Admin'),
    updateTeacher
);

// Route untuk menghapus guru (hanya admin)
router.delete('/:id',
    authorize('Super Admin', 'Admin'),
    deleteTeacher
);

module.exports = router;