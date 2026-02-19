const { body } = require('express-validator');

const userValidation = {
    create: [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('fullName').notEmpty().trim(),
        body('roleId').isUUID()
    ],
    update: [
        body('fullName').optional().trim(),
        body('phone').optional(),
        body('address').optional(),
        body('isActive').optional().isBoolean()
    ]
};

const studentValidation = {
    create: [
        body('nis').notEmpty(),
        body('fullName').notEmpty(),
        body('email').isEmail(),
        body('password').isLength({ min: 8 })
    ]
};

const teacherValidation = {
    create: [
        body('nip').notEmpty(),
        body('fullName').notEmpty(),
        body('email').isEmail(),
        body('password').isLength({ min: 8 })
    ]
};

const classValidation = {
    create: [
        body('name').notEmpty(),
        body('gradeLevel').isInt({ min: 1, max: 12 }),
        body('academicYearId').isUUID()
    ]
};

const gradeValidation = {
    create: [
        body('studentId').isUUID(),
        body('subjectId').isUUID(),
        body('score').isFloat({ min: 0, max: 100 }),
        body('gradeType').isIn(['Tugas', 'UTS', 'UAS', 'Praktikum'])
    ]
};

const attendanceValidation = {
    create: [
        body('studentId').isUUID(),
        body('scheduleId').isUUID(),
        body('date').isISO8601(),
        body('status').isIn(['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat'])
    ]
};

module.exports = {
    userValidation,
    studentValidation,
    teacherValidation,
    classValidation,
    gradeValidation,
    attendanceValidation
};