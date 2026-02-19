const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getGrades,
    getGradeById,
    createGrade,
    createBulkGrades,
    updateGrade,
    deleteGrade,
    getStudentGradeReport,
    getClassGradeReport,
    getSubjectGradeReport
} = require('../controllers/grade.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getGrades);
router.get('/student/:studentId', getStudentGradeReport);
router.get('/class/:classId', getClassGradeReport);
router.get('/subject/:subjectId', getSubjectGradeReport);
router.get('/:id', getGradeById);

router.post('/',
    authorize('Guru', 'Admin'),
    [
        body('studentId').isUUID().withMessage('Siswa tidak valid'),
        body('subjectId').isUUID().withMessage('Mata pelajaran tidak valid'),
        body('gradeType').isIn(['Tugas', 'UTS', 'UAS', 'Praktikum']).withMessage('Tipe nilai tidak valid'),
        body('score').isFloat({ min: 0, max: 100 }).withMessage('Nilai harus antara 0-100')
    ],
    createGrade
);

router.post('/bulk',
    authorize('Guru', 'Admin'),
    createBulkGrades
);

router.put('/:id',
    authorize('Guru', 'Admin'),
    updateGrade
);

router.delete('/:id',
    authorize('Admin'),
    deleteGrade
);

module.exports = router;