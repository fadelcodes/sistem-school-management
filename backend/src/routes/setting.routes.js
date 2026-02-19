const express = require('express');
const router = express.Router();
const {
    getSchoolSettings,
    updateSchoolSettings,
    getAcademicSettings,
    updateAcademicSettings,
    getNotificationSettings,
    updateNotificationSettings,
    getSecuritySettings,
    updateSecuritySettings,
    createBackup,
    restoreBackup,
    resetSystem
} = require('../controllers/setting.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);
router.use(authorize('Super Admin', 'Admin'));

router.get('/school', getSchoolSettings);
router.put('/school', updateSchoolSettings);
router.get('/academic', getAcademicSettings);
router.put('/academic', updateAcademicSettings);
router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);
router.get('/security', getSecuritySettings);
router.put('/security', updateSecuritySettings);
router.post('/backup', createBackup);
router.post('/restore', upload.single('backup'), restoreBackup);
router.post('/reset', resetSystem);

module.exports = router;