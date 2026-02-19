const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    getStudentAssignments
} = require('../controllers/assignment.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAssignments);
router.get('/student', getStudentAssignments);
router.get('/:id', getAssignmentById);

router.post('/',
    authorize('Guru', 'Admin'),
    [
        body('subjectId').isUUID().withMessage('Mata pelajaran tidak valid'),
        body('classId').isUUID().withMessage('Kelas tidak valid'),
        body('title').notEmpty().withMessage('Judul tugas harus diisi'),
        body('deadline').isISO8601().withMessage('Deadline tidak valid')
    ],
    createAssignment
);

router.post('/:id/submit',
    authorize('Siswa'),
    submitAssignment
);

router.post('/submissions/:id/grade',
    authorize('Guru'),
    [
        body('score').isFloat({ min: 0, max: 100 }).withMessage('Nilai harus antara 0-100')
    ],
    gradeSubmission
);

router.put('/:id',
    authorize('Guru', 'Admin'),
    updateAssignment
);

router.delete('/:id',
    authorize('Guru', 'Admin'),
    deleteAssignment
);

module.exports = router;