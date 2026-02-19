module.exports = {
    // User roles
    ROLES: {
        SUPER_ADMIN: 'Super Admin',
        ADMIN: 'Admin',
        ADMIN_TU: 'Admin TU',
        GURU: 'Guru',
        SISWA: 'Siswa',
        KEPALA_SEKOLAH: 'Kepala Sekolah',
        ORANG_TUA: 'Orang Tua'
    },

    // Attendance status
    ATTENDANCE_STATUS: {
        HADIR: 'Hadir',
        SAKIT: 'Sakit',
        IZIN: 'Izin',
        ALPHA: 'Alpha',
        TERLAMBAT: 'Terlambat'
    },

    // Grade types
    GRADE_TYPES: {
        TUGAS: 'Tugas',
        UTS: 'UTS',
        UAS: 'UAS',
        PRAKTIKUM: 'Praktikum'
    },

    // Days of week
    DAYS_OF_WEEK: [
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu',
        'Minggu'
    ],

    // Semesters
    SEMESTERS: {
        GANJIL: 'Ganjil',
        GENAP: 'Genap'
    },

    // Notification types
    NOTIFICATION_TYPES: {
        GRADE_INPUT: 'grade_input',
        ATTENDANCE_INPUT: 'attendance_input',
        ASSIGNMENT_CREATED: 'assignment_created',
        ASSIGNMENT_SUBMITTED: 'assignment_submitted',
        ASSIGNMENT_GRADED: 'assignment_graded',
        MATERIAL_UPLOADED: 'material_uploaded',
        USER_CREATED: 'user_created',
        PASSWORD_RESET: 'password_reset',
        SYSTEM: 'system'
    },

    // File upload types
    UPLOAD_TYPES: {
        PROFILE: 'profile',
        MATERIAL: 'material',
        ASSIGNMENT: 'assignment',
        SUBMISSION: 'submission'
    },

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    // HTTP status codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER: 500
    },

    // Error messages
    ERROR_MESSAGES: {
        UNAUTHORIZED: 'Anda harus login terlebih dahulu',
        FORBIDDEN: 'Anda tidak memiliki izin untuk mengakses resource ini',
        NOT_FOUND: 'Resource tidak ditemukan',
        INVALID_CREDENTIALS: 'Email atau password salah',
        ACCOUNT_INACTIVE: 'Akun Anda tidak aktif. Hubungi administrator',
        DUPLICATE_ENTRY: 'Data sudah ada',
        VALIDATION_ERROR: 'Validasi gagal',
        SERVER_ERROR: 'Terjadi kesalahan pada server'
    },

    // Success messages
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: 'Login berhasil',
        LOGOUT_SUCCESS: 'Logout berhasil',
        CREATE_SUCCESS: 'Data berhasil ditambahkan',
        UPDATE_SUCCESS: 'Data berhasil diupdate',
        DELETE_SUCCESS: 'Data berhasil dihapus'
    },

    // Date formats
    DATE_FORMATS: {
        DEFAULT: 'YYYY-MM-DD',
        DISPLAY: 'DD MMMM YYYY',
        DISPLAY_TIME: 'DD MMMM YYYY HH:mm',
        ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    },

    // File size limits (in bytes)
    FILE_SIZE_LIMITS: {
        PROFILE: 2 * 1024 * 1024, // 2MB
        MATERIAL: 10 * 1024 * 1024, // 10MB
        ASSIGNMENT: 10 * 1024 * 1024, // 10MB
        SUBMISSION: 10 * 1024 * 1024 // 10MB
    },

    // Cache keys
    CACHE_KEYS: {
        ROLES: 'roles',
        SETTINGS: 'settings',
        ACTIVE_YEAR: 'active_academic_year'
    },

    // Queue names (if using queue system)
    QUEUES: {
        EMAIL: 'email',
        NOTIFICATION: 'notification',
        BACKUP: 'backup',
        REPORT: 'report'
    },

    // Report types
    REPORT_TYPES: {
        GRADE: 'grades',
        ATTENDANCE: 'attendance',
        TEACHER_PERFORMANCE: 'teacher_performance',
        CLASS_PERFORMANCE: 'class_performance'
    },

    // Export formats
    EXPORT_FORMATS: {
        PDF: 'pdf',
        EXCEL: 'excel',
        CSV: 'csv',
        JSON: 'json'
    }
};