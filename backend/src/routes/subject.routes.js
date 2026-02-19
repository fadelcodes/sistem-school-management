const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getSubjects,
    getSubjectById,
    getSubjectByCode,
    createSubject,
    updateSubject,
    deleteSubject
} = require('../controllers/subject.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Semua route memerlukan autentikasi
router.use(authenticate);

// Route untuk mendapatkan semua mata pelajaran
router.get('/', getSubjects);

// Route untuk mendapatkan mata pelajaran berdasarkan kode
router.get('/code/:code', getSubjectByCode);

// Route untuk mendapatkan mata pelajaran berdasarkan ID
router.get('/:id', getSubjectById);

// Route untuk membuat mata pelajaran baru (hanya admin)
router.post('/',
    authorize('Super Admin', 'Admin'),
    [
        body('code').notEmpty().withMessage('Kode mata pelajaran harus diisi'),
        body('name').notEmpty().withMessage('Nama mata pelajaran harus diisi')
    ],
    createSubject
);

// Route untuk mengupdate mata pelajaran (hanya admin)
router.put('/:id',
    authorize('Super Admin', 'Admin'),
    updateSubject
);

// Route untuk menghapus mata pelajaran (hanya admin)
router.delete('/:id',
    authorize('Super Admin', 'Admin'),
    deleteSubject
);

module.exports = router;