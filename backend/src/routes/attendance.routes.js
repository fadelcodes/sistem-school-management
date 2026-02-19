const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAttendance,
    getAttendanceById,
    createAttendance,
    createBulkAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceReport,
    getStudentAttendance
} = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAttendance);
router.get('/report', getAttendanceReport);
router.get('/student/:studentId', getStudentAttendance);
router.get('/:id', getAttendanceById);

router.post('/',
    authorize('Guru', 'Admin', 'Admin TU'),
    [
        body('studentId').isUUID().withMessage('Siswa tidak valid'),
        body('scheduleId').isUUID().withMessage('Jadwal tidak valid'),
        body('date').isISO8601().withMessage('Tanggal tidak valid'),
        body('status').isIn(['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat']).withMessage('Status tidak valid')
    ],
    createAttendance
);

router.post('/bulk',
    authorize('Guru', 'Admin', 'Admin TU'),
    createBulkAttendance
);

router.put('/:id',
    authorize('Guru', 'Admin', 'Admin TU'),
    updateAttendance
);

router.delete('/:id',
    authorize('Admin', 'Admin TU'),
    deleteAttendance
);

module.exports = router;