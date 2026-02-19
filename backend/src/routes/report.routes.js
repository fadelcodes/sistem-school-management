const express = require('express');
const router = express.Router();
const {
    getGradeReport,
    getAttendanceReport,
    getTeacherPerformanceReport,
    getClassPerformanceReport,
    exportReport
} = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/grades', authorize('Super Admin', 'Admin', 'Guru', 'Kepala Sekolah'), getGradeReport);
router.get('/attendance', authorize('Super Admin', 'Admin', 'Guru', 'Kepala Sekolah'), getAttendanceReport);
router.get('/teachers', authorize('Super Admin', 'Admin', 'Kepala Sekolah'), getTeacherPerformanceReport);
router.get('/classes', authorize('Super Admin', 'Admin', 'Kepala Sekolah'), getClassPerformanceReport);
router.get('/export', authorize('Super Admin', 'Admin', 'Kepala Sekolah'), exportReport);

module.exports = router;