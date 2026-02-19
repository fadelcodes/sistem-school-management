const express = require('express');
const router = express.Router();
const {
    getAdminStats,
    getTeacherStats,
    getStudentStats,
    getParentStats,
    getRecentActivities
} = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/admin-stats', authorize('Super Admin', 'Admin'), getAdminStats);
router.get('/teacher-stats', authorize('Guru'), getTeacherStats);
router.get('/student-stats', authorize('Siswa'), getStudentStats);
router.get('/parent-stats', authorize('Orang Tua'), getParentStats);
router.get('/recent-activities', getRecentActivities);

module.exports = router;