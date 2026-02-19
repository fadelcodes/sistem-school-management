const { body, param, query } = require('express-validator');
const Validator = require('../utils/validator');

const customValidators = {
    // Email validators
    email: body('email')
        .isEmail()
        .withMessage('Email tidak valid')
        .normalizeEmail(),

    // Password validators
    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password minimal 8 karakter')
        .custom(Validator.isStrongPassword)
        .withMessage('Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus'),

    // ID validators
    uuid: param('id')
        .isUUID()
        .withMessage('ID tidak valid'),

    // Date validators
    date: body('date')
        .isISO8601()
        .withMessage('Format tanggal tidak valid')
        .custom(Validator.isDate)
        .withMessage('Tanggal tidak valid'),

    futureDate: body('date')
        .isISO8601()
        .custom(Validator.isFutureDate)
        .withMessage('Tanggal harus di masa depan'),

    pastDate: body('date')
        .isISO8601()
        .custom(Validator.isPastDate)
        .withMessage('Tanggal harus di masa lalu'),

    // Numeric validators
    positiveNumber: body('value')
        .isNumeric()
        .withMessage('Harus berupa angka')
        .custom(value => value > 0)
        .withMessage('Nilai harus positif'),

    grade: body('score')
        .isNumeric()
        .withMessage('Nilai harus berupa angka')
        .custom(Validator.isValidGrade)
        .withMessage('Nilai harus antara 0-100'),

    // String validators
    notEmpty: body('field')
        .notEmpty()
        .withMessage('Field tidak boleh kosong')
        .trim(),

    minLength: (field, min) => body(field)
        .isLength({ min })
        .withMessage(`Minimal ${min} karakter`),

    maxLength: (field, max) => body(field)
        .isLength({ max })
        .withMessage(`Maksimal ${max} karakter`),

    // Enum validators
    attendanceStatus: body('status')
        .isIn(['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat'])
        .withMessage('Status absensi tidak valid'),

    dayOfWeek: body('dayOfWeek')
        .isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'])
        .withMessage('Hari tidak valid'),

    gradeType: body('gradeType')
        .isIn(['Tugas', 'UTS', 'UAS', 'Praktikum'])
        .withMessage('Tipe nilai tidak valid'),

    semester: body('semester')
        .isIn(['Ganjil', 'Genap'])
        .withMessage('Semester tidak valid'),

    // Custom validators
    academicYear: body('year')
        .custom(Validator.isValidAcademicYear)
        .withMessage('Format tahun ajaran harus YYYY/YYYY'),

    nis: body('nis')
        .custom(Validator.isNIS)
        .withMessage('NIS tidak valid'),

    nip: body('nip')
        .custom(Validator.isNIP)
        .withMessage('NIP tidak valid'),

    nisn: body('nisn')
        .optional()
        .custom(Validator.isNISN)
        .withMessage('NISN tidak valid'),

    phone: body('phone')
        .optional()
        .custom(Validator.isPhoneNumber)
        .withMessage('Nomor telepon tidak valid'),

    // Time validators
    time: body('time')
        .custom(Validator.isValidTime)
        .withMessage('Format waktu tidak valid (HH:MM)'),

    // Comparison validators
    startBeforeEnd: (startField, endField) => body()
        .custom((value, { req }) => {
            const start = req.body[startField];
            const end = req.body[endField];
            return new Date(start) < new Date(end);
        })
        .withMessage('Tanggal mulai harus sebelum tanggal selesai'),

    timeStartBeforeEnd: (startField, endField) => body()
        .custom((value, { req }) => {
            const start = req.body[startField];
            const end = req.body[endField];
            return start < end;
        })
        .withMessage('Jam mulai harus sebelum jam selesai'),

    // Existence validators
    existsInDB: (table, field, message) => body(field)
        .custom(async (value) => {
            const { data } = await supabase
                .from(table)
                .select('id')
                .eq(field, value)
                .single();
            
            if (!data) {
                throw new Error(message || `Data tidak ditemukan`);
            }
            return true;
        }),

    uniqueInDB: (table, field, message, excludeId = null) => body(field)
        .custom(async (value, { req }) => {
            let query = supabase
                .from(table)
                .select('id')
                .eq(field, value);
            
            if (excludeId && req.params?.id) {
                query = query.neq('id', req.params.id);
            }
            
            const { data } = await query.single();
            
            if (data) {
                throw new Error(message || `Data sudah digunakan`);
            }
            return true;
        }),

    // Pagination validators
    page: query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Halaman harus angka positif')
        .toInt(),

    limit: query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit harus antara 1-100')
        .toInt(),

    // Search validators
    search: query('search')
        .optional()
        .isString()
        .trim()
        .escape(),
};

// Composite validators
const compositeValidators = {
    createUser: [
        customValidators.email,
        customValidators.password,
        customValidators.notEmpty,
        customValidators.uuid,
        customValidators.phone.optional(),
    ],

    createStudent: [
        customValidators.nis,
        customValidators.nisn.optional(),
        customValidators.email,
        customValidators.password,
        customValidators.notEmpty,
        customValidators.uuid,
        customValidators.date.optional(),
        customValidators.phone.optional(),
    ],

    createTeacher: [
        customValidators.nip,
        customValidators.email,
        customValidators.password,
        customValidators.notEmpty,
        customValidators.uuid,
        customValidators.phone.optional(),
    ],

    createClass: [
        customValidators.notEmpty,
        customValidators.positiveNumber,
        customValidators.uuid,
        customValidators.academicYear,
    ],

    createSchedule: [
        customValidators.uuid,
        customValidators.uuid,
        customValidators.uuid,
        customValidators.uuid,
        customValidators.dayOfWeek,
        customValidators.time,
        customValidators.time,
        customValidators.timeStartBeforeEnd('startTime', 'endTime'),
    ],

    createAttendance: [
        customValidators.uuid,
        customValidators.uuid,
        customValidators.date,
        customValidators.attendanceStatus,
    ],

    createGrade: [
        customValidators.uuid,
        customValidators.uuid,
        customValidators.uuid,
        customValidators.uuid,
        customValidators.gradeType,
        customValidators.grade,
        customValidators.date,
    ],

    createAssignment: [
        customValidators.uuid,
        customValidators.uuid,
        customValidators.notEmpty,
        customValidators.futureDate,
        customValidators.grade.optional(),
    ],

    createAcademicYear: [
        customValidators.academicYear,
        customValidators.semester,
        customValidators.date.optional(),
        customValidators.date.optional(),
        customValidators.startBeforeEnd('startDate', 'endDate'),
    ],

    createJurusan: [
        customValidators.notEmpty,
        customValidators.notEmpty,
    ],

    pagination: [
        customValidators.page,
        customValidators.limit,
    ],
};

module.exports = {
    ...customValidators,
    ...compositeValidators
};