const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setActiveYear,
    getCurrentAcademicYear
} = require('../controllers/academicYear.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAcademicYears);
router.get('/current', getCurrentAcademicYear);
router.get('/:id', getAcademicYearById);

router.post('/',
    authorize('Super Admin', 'Admin'),
    [
        body('year').notEmpty().withMessage('Tahun ajaran harus diisi'),
        body('semester').isIn(['Ganjil', 'Genap']).withMessage('Semester tidak valid')
    ],
    createAcademicYear
);

router.put('/:id',
    authorize('Super Admin', 'Admin'),
    updateAcademicYear
);

router.put('/:id/set-active',
    authorize('Super Admin', 'Admin'),
    setActiveYear
);

router.delete('/:id',
    authorize('Super Admin', 'Admin'),
    deleteAcademicYear
);

module.exports = router;