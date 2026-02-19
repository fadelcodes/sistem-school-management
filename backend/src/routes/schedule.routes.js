const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getTeacherSchedule,
    getClassSchedule
} = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSchedules);
router.get('/teacher/:teacherId', getTeacherSchedule);
router.get('/class/:classId', getClassSchedule);
router.get('/:id', getScheduleById);

router.post('/',
    authorize('Super Admin', 'Admin', 'Admin TU'),
    [
        body('classId').isUUID().withMessage('Kelas tidak valid'),
        body('subjectId').isUUID().withMessage('Mata pelajaran tidak valid'),
        body('teacherId').isUUID().withMessage('Guru tidak valid'),
        body('academicYearId').isUUID().withMessage('Tahun ajaran tidak valid'),
        body('dayOfWeek').isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']).withMessage('Hari tidak valid'),
        body('startTime').notEmpty().withMessage('Jam mulai harus diisi'),
        body('endTime').notEmpty().withMessage('Jam selesai harus diisi')
    ],
    createSchedule
);

router.put('/:id',
    authorize('Super Admin', 'Admin', 'Admin TU'),
    updateSchedule
);

router.delete('/:id',
    authorize('Super Admin', 'Admin', 'Admin TU'),
    deleteSchedule
);

module.exports = router;