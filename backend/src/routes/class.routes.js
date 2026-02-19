const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getClasses,
    getClassById,
    getClassesByAcademicYear,
    getAvailableClasses,
    createClass,
    updateClass,
    deleteClass
} = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Semua route memerlukan autentikasi
router.use(authenticate);

// Route untuk mendapatkan semua kelas
router.get('/', getClasses);

// Route untuk mendapatkan kelas yang tersedia
router.get('/available', getAvailableClasses);

// Route untuk mendapatkan kelas berdasarkan tahun ajaran
router.get('/academic-year/:academicYearId', getClassesByAcademicYear);

// Route untuk mendapatkan kelas berdasarkan ID
router.get('/:id', getClassById);

// Route untuk membuat kelas baru (hanya admin)
router.post('/',
    authorize('Super Admin', 'Admin'),
    [
        body('name').notEmpty().withMessage('Nama kelas harus diisi'),
        body('gradeLevel').isInt({ min: 1, max: 12 }).withMessage('Tingkat kelas harus antara 1-12'),
        body('academicYearId').isUUID().withMessage('Tahun ajaran tidak valid')
    ],
    createClass
);

// Route untuk mengupdate kelas
router.put('/:id',
    authorize('Super Admin', 'Admin'),
    updateClass
);

// Route untuk menghapus kelas (hanya admin)
router.delete('/:id',
    authorize('Super Admin', 'Admin'),
    deleteClass
);

module.exports = router;